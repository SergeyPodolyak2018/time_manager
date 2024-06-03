import './react-datepicker.css';

import { clone, isEmpty, omit, uniq } from 'ramda';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import useStateRef from 'react-usestateref';

import restApi from '../../../../api/rest';
import { IInsertAgentDayPayload } from '../../../../api/ts/interfaces/config.payload';
import { catalog3, ICatalog3 } from '../../../../common/constants/schedule/timelineColors';
import { IBusinessUnits } from '../../../../common/interfaces/config';
import { IAgentSchedule } from '../../../../common/interfaces/schedule/IAgentSchedule';
import SchUtils, { ISelected } from '../../../../helper/schedule/SchUtils';
import { usePopUpHotkeys } from '../../../../hooks';
import {
  cleanSelectActivities,
  cleanSelectAgentsAction,
  clearBuffer,
  copyActivities,
  getAgentsDaysList,
  insertAgentDayAction,
  openSuccessPopUp,
  setCopyToPopup,
  setIsModified,
  shiftCopyToActivity,
  toggleLoader,
} from '../../../../redux/actions/timeLineAction';
import { useAppDispatch } from '../../../../redux/hooks';
import { getSelectedTzSelector } from '../../../../redux/selectors/controlPanelSelector';
import { getCheckedItems, getFilterData } from '../../../../redux/selectors/filterSelector';
import { isCopyToOpenSelector, isLoadingSelector } from '../../../../redux/selectors/timeLineSelector';
import { IAgentTimeline } from '../../../../redux/ts/intrefaces/timeLine/IAgentTimeline';
import { Cross } from '../../../../static/svg';
import Button from '../../../ReusableComponents/button';
import ProgressBar, { ProgressBarStatus, ProgressBarType } from '../../../ReusableComponents/ProgressBar';
import Spiner from '../../../ReusableComponents/spiner';
import ReviewWarnings, { IAgentsData } from '../NewMultipleWizardMenu/multipleStates/ReviewWarningsPopup';
import styles from './menu.module.scss';
import SelectAgents from './SelectAgents';
import SelectDate from './SelectDate';

export interface IMainState {
  viewState: number;
  dateRange: string[];
  isRange: boolean;
  useCurrentSelectedAgents: boolean;
  copyAllIncluded: boolean;
  indicators: ICatalog3[];
  localCheckedItems: IBusinessUnits;
  disabledButtons: boolean;
  loading: boolean;
  agentFilterFromSelected: ISelected;
  agents: IAgentTimeline[];
  agentsErrors: any[];
  agentsData: IAgentsData[];
  agentsToSave: IAgentSchedule[];
  showProgress: boolean;
  progressBar: {
    errorMessage: string;
    status: ProgressBarStatus;
    message: string;
  };
}

const CopyToPopup = () => {
  const initChecked = useSelector(getCheckedItems);
  const dispatch = useAppDispatch();
  const copyToSelector = useSelector(isCopyToOpenSelector);
  const fetchedData: IBusinessUnits = useSelector(getFilterData);
  const selectedTZ = useSelector(getSelectedTzSelector);
  const isLoading = useSelector(isLoadingSelector);

  const [mainState, setMainState, mainStateRef] = useStateRef<IMainState>({
    viewState: 1,
    dateRange: [],
    isRange: true,
    useCurrentSelectedAgents: true,
    copyAllIncluded: true,
    indicators: clone(catalog3),
    localCheckedItems: initChecked,
    disabledButtons: false,
    loading: false,
    agentFilterFromSelected: {
      agentId: [],
      buId: Object.keys(initChecked).map(k => Number(k)),
      siteId: [],
      teamId: [],
      activities: [],
    },
    agents: [],
    agentsErrors: [],
    agentsData: [],
    agentsToSave: [],
    progressBar: {
      errorMessage: '',
      status: ProgressBarStatus.NONE,
      message: '',
    },
    showProgress: false,
  });

  const getAgentFilterFromSelected = () => {
    if (!copyToSelector.selectedActivity) return mainStateRef.current.agentFilterFromSelected;

    return {
      agentId: copyToSelector.selectedActivity.map(a => Number(a.agentId)),
      buId: Object.keys(initChecked).map(k => Number(k)),
      siteId: [],
      teamId: [],
    };
  };

  useEffect(() => {
    if (copyToSelector.selectedActivity) {
      singleChange('agentFilterFromSelected', getAgentFilterFromSelected());
      dispatch(copyActivities(copyToSelector.selectedActivity));
      dispatch(cleanSelectAgentsAction());
      dispatch(cleanSelectActivities());
    } else {
      onClose();
    }
  }, []);

  const singleChange = (name: string, value: any) => {
    setMainState(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const changeState = (index: number) => {
    singleChange('viewState', index);
  };

  const onClose = () => {
    dispatch(clearBuffer());
    dispatch(setCopyToPopup({ isOpen: false, selectedActivity: null, isMultiple: false }));
  };

  const getDataList = (dateRange: string[]): number[] =>
    dateRange.filter((date, idx) => !dateRange.slice(0, idx).includes(date)).map(date => new Date(date).getTime());

  const onApply = async () => {
    singleChange('loading', true);
    singleChange('disabledButtons', true);
    try {
      const copyAllIncluded = !copyToSelector.isMultiple ? mainStateRef.current.copyAllIncluded : true;
      const dateRange = mainStateRef.current.dateRange;

      if (!dateRange || !dateRange.length) return;
      const agentFilter = !copyToSelector.isMultiple
        ? SchUtils.getSelectedElements(mainStateRef.current.localCheckedItems, fetchedData)
        : mainStateRef.current.agentFilterFromSelected;

      const agents = await dispatch(
        getAgentsDaysList(agentFilter, selectedTZ.timezoneId, dateRange[0], dateRange.slice(-1)[0]),
      );
      const agentDays = await dispatch(
        shiftCopyToActivity(agentFilter, agents, getDataList(dateRange), copyAllIncluded),
      );
      if (agentDays) await filterAgents(agentDays);
    } finally {
      singleChange('loading', false);
      singleChange('disabledButtons', false);
    }
  };

  const filterAgents = async (agentDays: IAgentSchedule[]) => {
    singleChange('loading', true);
    singleChange('disabledButtons', true);
    try {
      const validateAgentDayRes = await restApi.validateAgentDayUseChunk({ agentDays });
      if (!validateAgentDayRes) return;
      const validatedAgents = validateAgentDayRes.data;
      //@ts-ignore
      const validations = validatedAgents?.errors?.validations;
      const errors = validations?.find((agent: any) => !isEmpty(agent.errors));
      //@ts-ignore
      if (validatedAgents && (!validatedAgents.data.success || errors)) {
        const data: any[] = validations;
        const errorAgentsId = data.map((el: any) => el.agentId);
        const errorAgentsData = await restApi.findAgents({
          buId: mainStateRef.current.agentFilterFromSelected.buId,
          siteId: mainStateRef.current.agentFilterFromSelected.siteId,
          teamId: mainStateRef.current.agentFilterFromSelected.teamId,
          agentId: errorAgentsId,
        });
        setMainState(prevState => ({
          ...prevState,
          viewState: 3,
          agentsErrors: data,
          agentsData: errorAgentsData.data,
          agentsToSave: agentDays,
        }));
        return;
      }
    } finally {
      singleChange('loading', false);
      singleChange('disabledButtons', false);
    }
    setMainState(prevState => ({
      ...prevState,
      agentsToSave: agentDays,
    }));
    dispatch(toggleLoader(true));
    dispatch(setIsModified(true));
    await dispatch(onApplyAfterWarnings);
  };

  const onApplyAfterWarnings = async () => {
    setMainState(prevState => ({
      ...prevState,
      showProgress: true,
      progressBar: {
        errorMessage: '',
        status: ProgressBarStatus.IN_PROGRESS,
        message: 'Copying shifts',
      },
    }));
    const agentFilter = !copyToSelector.isMultiple
      ? SchUtils.getSelectedElements(mainStateRef.current.localCheckedItems, fetchedData)
      : mainStateRef.current.agentFilterFromSelected;
    const payload: IInsertAgentDayPayload = {
      ...omit(['activities'], agentFilter),
      contractId: [],
      agentDays: mainStateRef.current.agentsToSave,
      buildAgentDay: false,
      ignoreWarnings: true,
      allOrNothing: false,
      autoCommit: true,
    };
    try {
      const resp = await dispatch(insertAgentDayAction(payload, true));
      if (resp && resp?.data && resp.data?.success) {
        const agentCount = mainStateRef.current.agentsToSave.length;
        const datesCount = uniq(mainStateRef.current.dateRange).length;
        const message = `Successfully copied ${agentCount} shift${agentCount === 1 ? '' : 's'} for ${datesCount} day${
          datesCount === 1 ? '' : 's'
        }`;

        return dispatch(openSuccessPopUp({ isOpen: true, data: message }));
      }
    } finally {
      dispatch(toggleLoader(false));
      dispatch(setIsModified(false));
      onClose();
    }
  };

  const isDisabledNext = () =>
    (!mainStateRef.current.dateRange[1] && mainStateRef.current.isRange) ||
    (!mainStateRef.current.dateRange[0] && !mainStateRef.current.isRange) ||
    isLoading ||
    mainState.disabledButtons;

  const isDisabledPrevious = () => isLoading || mainState.disabledButtons;

  const isDisabledClose = () => isLoading || mainState.disabledButtons;

  const isDisabledApply = () =>
    (mainState.viewState === 1 && !copyToSelector.isMultiple) ||
    (copyToSelector.isMultiple && isDisabledNext()) ||
    isLoading ||
    mainState.disabledButtons;

  usePopUpHotkeys({ onSubmit: [onApply], onCancel: [onClose] });

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <div className={styles.header}>
          <span>{copyToSelector.isMultiple ? 'Multiple Copy to' : 'Copy to'}</span>
          <Cross onClick={onClose} />
        </div>
        {mainState.showProgress && (
          <ProgressBar onClose={onClose} state={mainStateRef.current.progressBar} type={ProgressBarType.FIXED} />
        )}
        {mainState.loading && !mainState.showProgress ? (
          <Spiner />
        ) : (
          <div className={styles.body}>
            {mainState.viewState === 1 ? (
              <SelectDate singleChange={singleChange} mainState={mainState} mainStateRef={mainStateRef} />
            ) : (
              ''
            )}
            {mainState.viewState === 2 ? (
              <SelectAgents
                initChecked={initChecked}
                mainState={mainState}
                setMainState={setMainState}
                singleChange={singleChange}
                fetchedData={fetchedData}
              />
            ) : (
              ''
            )}
            {mainState.viewState === 3 ? (
              <ReviewWarnings
                onClose={onClose}
                onReturn={() => {
                  changeState(3);
                }}
                apply={onApplyAfterWarnings}
                agentsErrors={mainStateRef.current.agentsErrors}
                agentsData={mainStateRef.current.agentsData}
                disableReturn={true}
                loading={mainStateRef.current.loading}
              />
            ) : (
              ''
            )}
          </div>
        )}
        <div className={styles.footer}>
          <div className={styles.buttonWrapper_left} data-test={'modal-cancel-button'}>
            <Button
              innerText={'Cancel'}
              click={() => {
                onClose();
              }}
              disable={isDisabledClose()}
              style={{ background: '#FFFFFF', color: '#0183F5', border: '0.5px solid #0183F5', borderRadius: '5px' }}
            />
          </div>
          {!copyToSelector.isMultiple ? (
            mainState.viewState === 1 ? (
              <div className={styles.buttonWrapper} data-test={'modal-next-button'}>
                <Button
                  innerText={'Next >'}
                  click={() => {
                    if (!isDisabledNext()) {
                      changeState(2);
                    }
                  }}
                  disable={isDisabledNext()}
                  type={'primary'}
                />
              </div>
            ) : (
              <div className={styles.buttonWrapper_prev} data-test={'modal-previous-button'}>
                <Button
                  innerText={'< Previous'}
                  click={() => {
                    changeState(1);
                  }}
                  disable={isDisabledPrevious()}
                  type={'primary'}
                />
              </div>
            )
          ) : null}
          <div className={styles.buttonWrapper} data-test={'modal-apply-button'}>
            <Button
              innerText={'Publish'}
              click={onApply}
              disable={isDisabledApply()}
              type={'primary'}
              // isSaveButton={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CopyToPopup;
