import '../NewShiftMenu/TimePicker.css';

import {clone, omit} from 'ramda';
import React, {FC, useEffect} from 'react';
import {useSelector} from 'react-redux';
import useStateRef from 'react-usestateref';

import restApi from '../../../../api/rest';
import {
  IGetScenarioParamsPayload,
  ReOptimizationType
} from '../../../../api/ts/interfaces/config.payload';
import {ISchScenarioParams, StaffingType} from '../../../../api/ts/interfaces/SchScenarioParams';
import {usePopUpHotkeys} from '../../../../hooks';
import {setOpenRebuildSchedule} from '../../../../redux/actions/timeLineAction';
import {useAppDispatch} from '../../../../redux/hooks';
import {getCheckedItems} from '../../../../redux/selectors/chartSelector';
import {getSelectedTzSelector, getTimezonesSelector} from '../../../../redux/selectors/controlPanelSelector';
import {getFilterData} from '../../../../redux/selectors/filterSelector';
import {getDataSelector} from '../../../../redux/selectors/timeLineSelector';
import Button from '../../../ReusableComponents/button';
import Spiner from '../../../ReusableComponents/spiner';
import { allPages, defaultIntraDayRebuildState, pageConfig, siteLocalTz } from './constants';
import styles from './index.module.scss';
import {
  IIntraDayRebuildState,
  IIntraDayRebuildStateData,
  IntraDayRebuildPage, IReviewMessage,
  ISelectOptionsData,
  ISelectSitesItem,
  SynchronizeByOptions,
  TeamConstraints,
} from './interfaces';
import RebuildProgress from './RebuildProgress';
import SelectActivitiesPage from './SelectActivitiesPage';
import SelectAgentsPage from './SelectAgentsPage';
import SelectOptionsPage from './SelectOptionsPage';
import SelectSitesPage from './SelectSitesPage';
import SharedTransportPage from './SharedTransportPage';
import TeamSynchronicityPage from './TeamSynchronicityPage';
import DateUtils from '../../../../helper/dateUtils';
import Utils from '../../../../helper/utils';
import { Cross } from '../../../../static/svg';
import { ITimezone } from '../../../../common/interfaces/config/ITimezone';
import ReviewMessagesDialog from './ReviewMessagesDialog';
import {
  IGetScenarioWarningsPayload,
  ISaveScenarioWarningsPayload,
  ISchScenarioWarning
} from '../../../../api/ts/interfaces/scenarioWarnings';
import FilterByContractsPage from './FilterByContractPage';

const IntraDayScheduleRebuildWizardPopup: FC = () => {
  const dispatch = useAppDispatch();
  const title = 'Intra-day Schedule Rebuild Wizard';
  const filterData = useSelector(getFilterData);
  const agents = useSelector(getDataSelector);
  const allTimezones = useSelector(getTimezonesSelector);
  const initSelectedTZ = useSelector(getSelectedTzSelector);
  const checkedItem = useSelector(getCheckedItems);
  const initChecked = useSelector(getCheckedItems);
  const [, setCurrentState, currentStateRef] = useStateRef<IIntraDayRebuildState>(defaultIntraDayRebuildState);
  const [, setIsShowReviewMessages, isShowReviewMessagesRef] = useStateRef<boolean>(false);

  const getLocalTz = (): ITimezone => {
    return siteLocalTz ?? initSelectedTZ
  }

  useEffect(() => {
    setCurrentState(defaultIntraDayRebuildState);
    const siteIds = getSiteIds();
    const payload: IGetScenarioParamsPayload = {
      scheduleId: 0,
      siteIds,
    };
    restApi.getScenarioParams(payload).then(response => {
      const data = response.data;
      if (!Array.isArray(data)) return;

      const _currentState = prepareState(data);
      _currentState.initScenarioParams = data;
      setCurrentState(_currentState);
    });
  }, []);

  const getDefaultTZ = (currentState?: IIntraDayRebuildState): ITimezone => {
    const currentStateData = currentState?.data ?? currentStateRef.current.data;

    return currentStateData.selectSitesPage.filter(site => site.isChecked).length > 1
      ? allTimezones.find(tz => tz.timezoneId === filterData[agents[0].buId].timezoneId) ?? getLocalTz()
      : getLocalTz();
  };

  const prepareState = (data: ISchScenarioParams[]): IIntraDayRebuildState => {
    const siteIds = getSiteIds();
    const currentState = clone(currentStateRef.current);
    currentState.data.selectSitesPage = data
      // todo: remove filter after api getScenarioParams fix
      .filter(site => siteIds.includes(Number(site.siteId)))
      .map(
        site =>
          ({
            isChecked: isSiteChecked(site.siteId),
            siteId: Number(site.siteId),
            siteName: getSiteName(site.siteId),
            isForceSkill: !site.isMultiSkill,
            isUseRequired: site.staffingType === StaffingType.REQUIRED,
            isDisableMonthlyConstrains: site.isIgnoreConstraint,
            isShuffleAgents: site.isShuffleAgents,
            isUseTeamConstraints: [TeamConstraints.USE, TeamConstraints.USE_WITHIN_CONTRACT].includes(
              Number(site.teamConstraints),
            ),
            isUseSharedTransportConstraints: site.teamConstraints === TeamConstraints.CARPOOL,
            isExcludeGrantedAgents: site.isExcludeGranted,
            isUseSecondaryActivities: site.isUseSecondaryActivities,

            isSynchroniseDaysOffInit: site.isSynchDaysOff,
            isSynchroniseStartTimeInit: site.isSynchStartTime,
            isSynchroniseDurationInit: site.isSynchDuration,
            isSynchroniseMealsInit: site.isSynchMeals,
            isSynchroniseBreaksInit: site.isSynchBreaks,

            teamConstraints: site.teamConstraints,
            teamWorkWindow: site.teamWorkWindow,
          } satisfies ISelectSitesItem),
      )
      .sort((s0, s1) => {
        if (s0.siteName === s1.siteName) return 0;

        return s0.siteName > s1.siteName ? 1 : -1;
      });

    currentState.pages = refreshPageList();
    currentState.pageIndex = 0;
    currentState.data.selectOptionsPage.selectedTz = getDefaultTZ();
    currentState.data.selectOptionsPage.startTime = DateUtils.convertMinutesToTime(
      Math.ceil(DateUtils.convertTimeToMinutes(new Date().toLocaleTimeString()) / 15) * 15,
    );
    currentState.data.selectAgentsPage.checkedAgents = initChecked;
    currentState.data.selectActivitiesPage.checkedActivities = initChecked;
    currentState.isLoading = false;
    currentState.isDisabledButtons = false;

    return currentState;
  };

  const isLoading = (): boolean => currentStateRef.current.isLoading;

  const getBuIds = (): number[] => {
    return Object.keys(checkedItem ?? {}).map(id => Number(id));
  };

  const isSiteChecked = (siteId: number): boolean => {
    const buId = getBuIds()[0];
    const siteList = Object.keys(checkedItem[buId].sites);
    return siteList.includes(siteId.toString());
  };

  const getSiteIds = (): number[] => {
    const buIds = getBuIds();

    return buIds.reduce(
      (acc: number[], buId: number) =>
        (filterData ?? {})[buId]
          ? [...acc, ...Object.keys((filterData ?? {})[buId].sites).map(siteId => Number(siteId))]
          : [...acc],
      [],
    );
  };

  const getSiteName = (siteId: number): string => {
    const buIds = getBuIds();
    let siteName = `Unknow name <${siteId}>`;
    buIds.forEach((buId: number) => {
      if (!filterData[buId].sites || !filterData[buId].sites[siteId]) return;
      siteName = (filterData[buId].sites[siteId] ?? {}).name ?? siteName;
    });
    return siteName;
  };

  const setStateByKey = (key: string, value: any) => {
    if (Object.keys(currentStateRef.current).every(k => k !== key)) return;

    setCurrentState({ ...currentStateRef.current, [key]: value });
  };

  const getSubTitle = () => pageConfig[currentStateRef.current.pages[currentStateRef.current.pageIndex]].subTitle;

  const isTargetPage = (page: IntraDayRebuildPage) =>
    currentStateRef.current.pages[currentStateRef.current.pageIndex] === page;

  const onPreviousClick = () => {
    normalizeDateRange();
    if (currentStateRef.current.pageIndex <= 0) return;
    setStateByKey('pageIndex', --currentStateRef.current.pageIndex);
  };

  const onNextClick = () => {
    normalizeDateRange();
    if (currentStateRef.current.pageIndex >= currentStateRef.current.pages.length - 2) return;
    setStateByKey('pageIndex', ++currentStateRef.current.pageIndex);
  };

  const normalizeDateRange = () => {
    if (currentStateRef.current.pageIndex !== 1 || !currentStateRef.current.data.selectOptionsPage.isRangeMode) return;

    const selectOptionsPage = currentStateRef.current.data.selectOptionsPage;
    if (selectOptionsPage.rangeDate.length > 2) {
      selectOptionsPage.rangeDate = [selectOptionsPage.rangeDate[0], selectOptionsPage.rangeDate.slice(-1)[0]];
    }

    onChangeState('selectOptionsPage', selectOptionsPage);
  };

  const onChangeState = (fieldName: keyof IIntraDayRebuildStateData | keyof IIntraDayRebuildState, pageDataOrMainValue: any, isMainField?: boolean) => {
    const currentState = clone(currentStateRef.current);
    if (isMainField) {
      return setCurrentState({ ...currentState, [fieldName as keyof IIntraDayRebuildState]: pageDataOrMainValue });
    }
    const fieldsThatChangePageList = ['selectSitesPage', 'selectOptionsPage'];
    currentState.data[fieldName as keyof IIntraDayRebuildStateData] = clone(pageDataOrMainValue);
    currentState.pages = fieldsThatChangePageList.includes(fieldName)
      ? refreshPageList(currentState.data)
      : currentState.pages;

    if (fieldName === 'selectSitesPage') {
      currentState.data.sharedTransportPage = initSharedTransportPage(currentState);
      currentState.data.teamSynchronicityPage = initTeamSynchronicityPage(currentState);
      currentState.data.selectOptionsPage.selectedTz = getDefaultTZ(currentState);
    }

    currentState.errorMessage = validatePage(currentState, fieldName as keyof IIntraDayRebuildStateData);
    currentState.isValidate = !currentState.errorMessage;
    setCurrentState(currentState);
  };

  const validatePage = (currentState: IIntraDayRebuildState, fieldName: keyof IIntraDayRebuildStateData) => {
    const targetPage = currentState.data[fieldName];
    const daysCount = (d0: string, d1: string) =>
      Math.round((new Date(DateUtils.getNextDay(d1)).getTime() - new Date(d0).getTime()) / (24 * 60 * 60000));
    const rangeDate = (targetPage as ISelectOptionsData).rangeDate ?? [];
    const days = rangeDate.length > 1 ? daysCount(rangeDate[0], rangeDate.slice(-1)[0]) : rangeDate.length;
    const isRangeMode = (targetPage as ISelectOptionsData).isRangeMode;

    switch (fieldName) {
      case 'selectSitesPage':
        return (targetPage as ISelectSitesItem[]).every(s => !s.isChecked) ? 'Sites not selected' : '';
      case 'selectOptionsPage':
        if (days < 1) {
          return 'No selected days';
        } else if (days > 14) {
          return 'Selected period over 14 days';
        }
        if (isRangeMode && rangeDate.length < 2) {
          return 'Range not selected';
        }
        break;
    }

    return '';
  };

  const initSharedTransportPage = (currentState: IIntraDayRebuildState) => {
    const selectSitesPage = currentState.data.selectSitesPage;
    return selectSitesPage
      .filter(site => site.isChecked && site.isUseSharedTransportConstraints)
      .map(site => ({
        siteName: site.siteName,
        maximumDeviation: Utils.getBooleanFromBitmask(site.teamConstraints, 3)
          ? DateUtils.convertMinutesToTime(site.teamWorkWindow)
          : '0:00',
      }));
  };

  const initTeamSynchronicityPage = (currentState: IIntraDayRebuildState) => {
    const selectSitesPage = currentState.data.selectSitesPage;
    return selectSitesPage
      .filter(site => site.isChecked && site.isUseTeamConstraints)
      .map(site => ({
        siteName: site.siteName,
        isSynchronizeDaysOff: site.isSynchroniseDaysOffInit,
        synchronizeBy: getSynchronizeBy(site),
        maximumStartTimeDifference:
          Utils.getBooleanFromBitmask(site.teamConstraints, 0) || Utils.getBooleanFromBitmask(site.teamConstraints, 1)
            ? DateUtils.convertMinutesToTime(site.teamWorkWindow)
            : '0:00',
        isOnlySameContracts: Utils.getBooleanFromBitmask(site.teamConstraints, 1),
      }));
  };

  const getSynchronizeBy = (site: ISelectSitesItem): SynchronizeByOptions => {
    const isStart = site.isSynchroniseStartTimeInit ? 1 : 0;
    const isDuration = site.isSynchroniseDurationInit ? 1 : 0;
    const isMeals = site.isSynchroniseMealsInit ? 1 : 0;
    const isBreaks = site.isSynchroniseBreaksInit ? 1 : 0;
    return isStart + 2 * isDuration + 4 * isMeals + 8 * isBreaks;
  };

  const refreshPageList = (data?: IIntraDayRebuildStateData): IntraDayRebuildPage[] => {
    const selectSitesPage = (data ?? currentStateRef.current.data).selectSitesPage;
    const selectOptionsPage = (data ?? currentStateRef.current.data).selectOptionsPage;
    const isEnabledTeamSynchronicity =
      selectSitesPage.findIndex(site => site.isChecked && site.isUseTeamConstraints) !== -1;
    const isEnabledSharedTransport =
      selectSitesPage.findIndex(site => site.isChecked && site.isUseSharedTransportConstraints) !== -1;
    const isEnabledFilteredByContract = selectOptionsPage.isAdditionallyFilterAgents;
    const isEnabledSelectActivities =
      selectOptionsPage.option === ReOptimizationType.ACTIVITIES ||
      selectOptionsPage.option === ReOptimizationType.BREAKS_MEALS_ACTIVITIES ||
      selectOptionsPage.option === ReOptimizationType.SHIFTS;

    return allPages.reduce((acc: number[], page) => {
      switch (page) {
        case IntraDayRebuildPage.TEAM_SYNCHRONICITY:
          return isEnabledTeamSynchronicity ? [...acc, page] : [...acc];
        case IntraDayRebuildPage.SHARED_TRANSPORT_CONSTRAINTS:
          return isEnabledSharedTransport ? [...acc, page] : [...acc];
        case IntraDayRebuildPage.FILTER_BY_CONTRACT:
          return isEnabledFilteredByContract ? [...acc, page] : [...acc];
        case IntraDayRebuildPage.SELECT_ACTIVITIES:
          return isEnabledSelectActivities ? [...acc, page] : [...acc];
        default:
          return [...acc, page];
      }
    }, []);
  };

  const isPreviousDisabled = () => isLoading() || currentStateRef.current.pageIndex <= 0;

  const isNextDisabled = () =>
    isLoading() ||
    currentStateRef.current.pageIndex >= currentStateRef.current.pages.length - 2 ||
    !currentStateRef.current.isValidate;

  const isApplyDisabled = () =>
    isLoading() ||
    currentStateRef.current.pageIndex !== currentStateRef.current.pages.length - 2 ||
    !Utils.isSomeCheckedInFilterData(currentStateRef.current.data.selectAgentsPage.checkedAgents);

  const onClose = () => {
    setCurrentState(defaultIntraDayRebuildState);
    onChangeState('isDisabledButtons', true,  true);
    dispatch(setOpenRebuildSchedule({ isOpen: false }));
  };

  const onApply = () => {
    if (currentStateRef.current.pageIndex !== currentStateRef.current.pages.length - 2) return;
    setStateByKey('pageIndex', ++currentStateRef.current.pageIndex);
  };

  const onCancel = () => {
    if (currentStateRef.current.data.rebuildProgressPage.isDone) return;
    const payload = currentStateRef.current.data.rebuildProgressPage.requestParameters;
    if (payload === null) return;

    onChangeState('isDisabledButtons', true, true);
    restApi.postCancelRequest(payload).then(response => {
      onChangeState('isDisabledButtons', false, true);
      return response;
    });
  };

  const onSaveAndClose = () => {
    if (currentStateRef.current.data.rebuildProgressPage.isDone) return;
    const payload = currentStateRef.current.data.rebuildProgressPage.requestParameters;
    if (payload === null) return;

    onChangeState('isDisabledButtons', true, true);
    restApi.postCancelAndSaveRequest(payload).then(response => {
      onChangeState('isDisabledButtons', false, true);
      return response;
    });
  };

  const onShowReviewMessages = () => {
    onChangeState('isDisabledButtons', true, true);
    const selectSitesPage = currentStateRef.current.data.selectSitesPage;
    const payload: IGetScenarioWarningsPayload = {
      scheduleId: 0,
      siteId: selectSitesPage.reduce((acc: number[], siteItem: ISelectSitesItem) =>
          siteItem.isChecked ? [...acc, siteItem.siteId] : [...acc], []),
    };
    restApi.getScenarioWarnings(payload).then(({data}) => {
      const messages: ISchScenarioWarning[] = data?.data ?? [];
      const reviewMessages: IReviewMessage[] = messages
        .reduce((acc: IReviewMessage[], m) => [
          ...acc,
          {...m, siteName: getSiteName(m.siteId)}], []);
      const rebuildProgressPage = clone(currentStateRef.current.data.rebuildProgressPage)
      onChangeState('isDisabledButtons', false, true);
      onChangeState('rebuildProgressPage', { ...rebuildProgressPage, reviewMessages })
      setIsShowReviewMessages(true);
    }).catch(e => console.error(e));
  }

  const isDisabledClose = () => !currentStateRef.current.data.rebuildProgressPage.isDone;

  const isDisabledReviewMessages = () => {
    return !(currentStateRef.current.data.rebuildProgressPage.isDone &&
        currentStateRef.current.data.rebuildProgressPage.isWarnings);
  }

  const isActiveProgressPage = () => currentStateRef.current.pageIndex === currentStateRef.current.pages.length - 1 && !isShowReviewMessagesRef.current

  const onSaveReviewed = () => {
    const selectSitesPage = currentStateRef.current.data.rebuildProgressPage;
    const reviewMessages = selectSitesPage?.reviewMessages ?? [];

    const payload: ISaveScenarioWarningsPayload = {
      scheduleId: 0,
      warnings: reviewMessages.map(msg => omit(['siteName'], msg) as ISchScenarioWarning),
    }
    onChangeState('isDisabledButtons', true, true);
    restApi.saveScenarioWarnings(payload).catch(e => console.error(e));
  }

  const onCloseReviewMessages = () => {
    setIsShowReviewMessages(false);
  }


  const getView = () => (
    <>
      <div className={styles.subHeader}>
        <span>{getSubTitle()}</span>
      </div>
      <div className={styles.bodyWrapper}>
        {isTargetPage(IntraDayRebuildPage.SELECT_SITES) && (
          <SelectSitesPage initState={currentStateRef.current} onChangeState={onChangeState} />
        )}
        {isTargetPage(IntraDayRebuildPage.SELECT_OPTIONS) && (
          <SelectOptionsPage initState={currentStateRef.current} onChangeState={onChangeState} />
        )}
        {isTargetPage(IntraDayRebuildPage.TEAM_SYNCHRONICITY) && (
          <TeamSynchronicityPage initState={currentStateRef.current} onChangeState={onChangeState} />
        )}
        {isTargetPage(IntraDayRebuildPage.SHARED_TRANSPORT_CONSTRAINTS) && (
          <SharedTransportPage initState={currentStateRef.current} onChangeState={onChangeState} />
        )}
        {isTargetPage(IntraDayRebuildPage.FILTER_BY_CONTRACT) && (
          <FilterByContractsPage initState={currentStateRef.current} onChangeState={onChangeState} />
        )}
        {isTargetPage(IntraDayRebuildPage.SELECT_AGENTS) && (
          <SelectAgentsPage initState={currentStateRef.current} onChangeState={onChangeState} />
        )}
        {isTargetPage(IntraDayRebuildPage.SELECT_ACTIVITIES) && (
          <SelectActivitiesPage initState={currentStateRef.current} onChangeState={onChangeState} />
        )}
        {isTargetPage(IntraDayRebuildPage.REBUILD_PROGRESS) && (
          <RebuildProgress initState={currentStateRef.current} onChangeState={onChangeState} />
        )}
      </div>
    </>
  );

  const hotkeysHandlers = isDisabledClose()
    ? {
        ok: onSaveAndClose,
        cancel: onCancel,
      }
    : {
        ok: onClose,
        cancel: onClose,
      };

  const isDisabledButtons = () => currentStateRef.current.isDisabledButtons;

  usePopUpHotkeys({
    onSubmit: [
      hotkeysHandlers.ok,
      {},
      onSaveAndClose,
      onCancel,
      onClose,
      currentStateRef.current.data.rebuildProgressPage.isDone,
    ],
    onCancel: [
      hotkeysHandlers.cancel,
      {},
      onSaveAndClose,
      onCancel,
      onClose,
      currentStateRef.current.data.rebuildProgressPage.isDone,
    ],
  });

  return (
    <>
      <div className={styles.container}>
        <div
          className={
            !isActiveProgressPage()
              ? styles.formWrapper
              : styles.formWrapper_progressPage
          }
        >
          <div className={styles.header}>
            <span>{title}</span>
            <Cross onClick={onClose} />
          </div>
          <div className={styles.body}>
            {isLoading() ?
              <div className={styles.spinnerWrapper}>
                <Spiner/>
              </div>
              : !isShowReviewMessagesRef.current ? (
                getView()
              ) : (
                <ReviewMessagesDialog initState={currentStateRef.current} onChangeState={onChangeState}/>
              )
            }
          </div>
          <div className={styles.footer}>
            {currentStateRef.current.pageIndex !== currentStateRef.current.pages.length - 1 ? (
              <>
                <div className={styles.buttonWrap_leftAlign}>
                  <Button
                    innerText={'Cancel'}
                    click={onClose}
                    type={'secondary'}
                    disable={isLoading() || isDisabledButtons()}
                  />
                </div>
                <div className={styles.buttonWrap}>
                  <Button
                    innerText={'< Previous'}
                    click={onPreviousClick}
                    disable={isPreviousDisabled() || isDisabledButtons()}
                    type={'primary'}
                  />
                </div>
                <div className={styles.buttonWrap}>
                  <Button
                      innerText={'Next >'}
                      click={onNextClick}
                      disable={isNextDisabled() || isDisabledButtons()}
                      type={'primary'}
                  />
                </div>
                <div className={styles.buttonWrap}>
                  <Button
                    innerText={'Apply'}
                    click={onApply}
                    disable={isApplyDisabled() || isDisabledButtons()}
                    type={'primary'}
                  />
                </div>
              </>
            ) : (
              <div className={styles.wrapCenterAlign}>
                { isShowReviewMessagesRef.current ? (
                  <>
                    <div className={styles.buttonWrap}>
                      <Button
                        innerText={'Save'}
                        click={onSaveReviewed}
                        disable={isLoading() || isDisabledButtons()}
                        type={'secondary'}
                      />
                    </div>
                    <div className={styles.buttonWrap} key={'reviewClose'}>
                      <Button
                        innerText={'Close'}
                        click={onCloseReviewMessages}
                        disable={isLoading() || isDisabledButtons()}
                        type={'primary'}
                      />
                    </div>
                  </>
                  ) : isDisabledClose() ? (
                    <>
                      <div className={styles.buttonWrap}>
                        <Button
                          innerText={'Cancel'}
                          click={onCancel}
                          type={'secondary'}
                          disable={isLoading() || isDisabledButtons() || currentStateRef.current.data.rebuildProgressPage.requestParameters === null}
                        />
                      </div>
                      <div className={styles.buttonWrap} style={{ width: '146px' }}>
                        <Button
                          innerText={'Stop & Save'}
                          click={onSaveAndClose}
                          disable={isLoading() || isDisabledButtons() || currentStateRef.current.data.rebuildProgressPage.requestParameters === null}
                          type={'primary'}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      { !isDisabledReviewMessages() ? (
                        <div className={styles.buttonWrap} style={{ width: '192px' }}>
                          <Button
                            innerText={'Review messages'}
                            click={onShowReviewMessages}
                            disable={isDisabledReviewMessages() || isDisabledButtons()}
                            type={'secondary'}
                          />
                        </div>
                      ) : null }
                      <div className={styles.buttonWrap} key={'mainClose'}>
                        <Button
                          innerText={'Close'}
                          click={onClose}
                          disable={isLoading() || isDisabledButtons()}
                          type={'primary'}
                        />
                      </div>
                    </>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default IntraDayScheduleRebuildWizardPopup;
