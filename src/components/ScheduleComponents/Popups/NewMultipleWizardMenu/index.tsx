import { clone, isEmpty } from 'ramda';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import useStateRef from 'react-usestateref';

import restApi from '../../../../api/rest';
import {
    IResponseFindAgentsFromSnapshotData
} from '../../../../api/ts/interfaces/findAgentsFromSnapshot';
import { IResponseInsertStateErrorsValidations } from '../../../../api/ts/interfaces/insertState';
import {
    OpenAgentDaySnapshotResponse
} from '../../../../api/ts/interfaces/openAgentDaySnapshot.response';
import { IResponse } from '../../../../api/ts/interfaces/response';
import { IInputfilterAgentDay } from '../../../../api/ts/interfaces/schedulePayload';
import { ISessionRequestStatus } from '../../../../api/ts/interfaces/sessionAsyncRequest';
import { SchStateType } from '../../../../common/constants/schedule';
import { catalog3, ICatalog3 } from '../../../../common/constants/schedule/timelineColors';
import { IBusinessUnits } from '../../../../common/interfaces/config';
import { ITimezone } from '../../../../common/interfaces/config/ITimezone';
import { IAgentSchedule } from '../../../../common/interfaces/schedule/IAgentSchedule';
import DateUtils from '../../../../helper/dateUtils';
import SchAgent from '../../../../helper/schedule/SchAgent';
import SchMultipleItems from '../../../../helper/schedule/SchMultipleItems';
import SchUtils from '../../../../helper/schedule/SchUtils';
import { usePopUpHotkeys } from '../../../../hooks';
import { addGlobalError } from '../../../../redux/actions/globalErrorActions';
import {
    changeMeetingCalendarVisible, findAgentSnapshot, getAgentsDaysList, getAgentsSchedule,
    openAgentDayForSnapshot, saveAgentDay, setOpenMultipleWizardAction
} from '../../../../redux/actions/timeLineAction';
import { useAppDispatch } from '../../../../redux/hooks';
import {
    getActiveDateSelector, getSelectedTzSelector, getTimezonesHashSelector
} from '../../../../redux/selectors/controlPanelSelector';
import { getCheckedItems, getFilterData } from '../../../../redux/selectors/filterSelector';
import { getLastId } from '../../../../redux/selectors/snapShotsSelector';
import { getMultipleWizardType } from '../../../../redux/selectors/timeLineSelector';
import { IAgentTimeline } from '../../../../redux/ts/intrefaces/timeLine/IAgentTimeline';
import { Cross } from '../../../../static/svg';
import Button from '../../../ReusableComponents/button';
import ProgressBarAsync, {
    IProgressBarAsyncState, IProgressBarAsyncStateDiff, ProgressBarAsyncStatus, ProgressBarAsyncType
} from '../../../ReusableComponents/ProgressBarAsync';
import Spiner from '../../../ReusableComponents/spiner';
import { dataByType, IDataByType } from './dataByType';
import ErrorsMultipleWizard from './ErrorsMultipleWizard';
import styles from './menu.module.scss';
import EditMultipleWizard from './multipleStates/EditMultiple/EditMultipleWizard';
import MultipleBreackMeal from './multipleStates/multipleBreacMealMenu';
import MultipleException from './multipleStates/multipleExceptionMenu';
import MultipleMarkedTime from './multipleStates/multipleMarkedTime';
import MultipleTimeOff from './multipleStates/multipleTimeOffMenu';
import MultipleWorkSet from './multipleStates/multipleWorkSet';
import MultipleShift from './multipleStates/newShifts';
import ReviewWarnings from './multipleStates/ReviewWarningsPopup';
import SelectActivities from './SelectActivities';
import SelectAgents from './SelectAgents';
import SelectDate from './SelectDate';

const TIMEOUT = 2000;

export interface IMainState {
  viewState: number;
  dateRange: string[];
  useCurrentSelectedAgents: boolean;
  passedView: number[];
  insertOnlyErrorsOrWarning: boolean;
  showWarnings: boolean;
  indicators: ICatalog3[];
  localCheckedActivities: IBusinessUnits;
  localCheckedItems: IBusinessUnits;
  etalonActivityChecked: IBusinessUnits;
  etalonChecked: IBusinessUnits;
  loading: boolean;
  agents: IAgentTimeline[];
  agentsErrors: any[];
  agentsData: any[];
  cachedRepeat: boolean;
  rangeOrSingle: boolean;
  deleteState: number;
  itemsStartTime: string;
  itemsEndTime: string;
  itemsTimeValid: boolean;
  itemsNextEndDay: boolean;
  snapshotId: string;
  agentsResponseErrors: IResponseInsertStateErrorsValidations[];
  acceptableAgentsFromSnapshot: IResponseFindAgentsFromSnapshotData[];
  isAllAgentsErrored: boolean;
  localTz: ITimezone;
  agentSearch: string;
  activitySearch: string;
}

export interface IMultipleWizardMenuAsyncReq {
  isOpen?: boolean;
  requestId?: string;
  payload?: any;
  response?: any;
  type?: string;
  repeat?: boolean;
  needClose?: boolean;
}

const MultipleWizardMenu = () => {
  const initChecked = useSelector(getCheckedItems);
  const fetchedData: IBusinessUnits = useSelector(getFilterData);
  const selectedTZ = useSelector(getSelectedTzSelector);
  const activeDate = useSelector(getActiveDateSelector);
  const type = useSelector(getMultipleWizardType);
  const timezones = useSelector(getTimezonesHashSelector);
  const snapshotId = useSelector(getLastId);
  const dispatch = useAppDispatch();

  const selectedDataByType: IDataByType = dataByType[type];

  const [, setDeletePayloads, deletePayloadsRef] = useStateRef<any[]>([]);

  const [mainState, setMainState, mainStateRef] = useStateRef<IMainState>({
    viewState: 1,
    dateRange: [],
    useCurrentSelectedAgents: true,
    passedView: [],
    insertOnlyErrorsOrWarning: false,
    showWarnings: true,
    indicators: clone(catalog3),
    localCheckedActivities: initChecked,
    localCheckedItems: initChecked,
    etalonActivityChecked: {},
    etalonChecked: {},
    loading: false,
    agents: [],
    agentsErrors: [],
    agentsResponseErrors: [],
    agentsData: [],
    cachedRepeat: false,
    rangeOrSingle: selectedDataByType.type !== 'edit',
    deleteState: 0,
    itemsTimeValid: true,
    itemsStartTime: '00:00',
    itemsEndTime: '00:00',
    itemsNextEndDay: true,
    snapshotId: '',
    acceptableAgentsFromSnapshot: [],
    isAllAgentsErrored: false,
    localTz: selectedTZ,
    agentSearch: '',
    activitySearch: '',
  });

  const [, setAsyncReq, asyncReqRef] = useStateRef<IMultipleWizardMenuAsyncReq>({});

  useEffect(() => {
    if (mainStateRef.current.viewState === 3) {
      const isMultisite = SchMultipleItems.isMultisite(mainStateRef.current.localCheckedItems);
      if (isMultisite) {
        const newIndicators = mainStateRef.current.indicators.map(el => {
          if (type === 'insert' || type === 'delete') {
            if (el.disableIfMultisite && el.checked) {
              el.checked = false;
            }
          }
          return el;
        });
        setMainState(prevState => ({
          ...prevState,
          indicators: newIndicators,
        }));
      }
    }
  }, [mainState.viewState]);

  useEffect(() => {
    if (mainStateRef.current.etalonChecked) {
      const tempcheckedFetched = SchMultipleItems.updateCheckedItems(
        JSON.parse(JSON.stringify(initChecked)),
        mainStateRef.current.acceptableAgentsFromSnapshot,
        fetchedData,
      );
      setMainState(prevState => ({
        ...prevState,
        etalonChecked: tempcheckedFetched,
      }));
    }
  }, [fetchedData]);

  const createSnapshotAndChangeState = async (state: number) => {
    const stateAct1 = JSON.stringify(mainStateRef.current.localCheckedActivities);
    const stateAct2 = JSON.stringify(mainStateRef.current.etalonActivityChecked);

    if (mainStateRef.current.passedView.indexOf(state) === -1 || stateAct1 !== stateAct2) {
      const checkedItems = SchUtils.getSelectedElementsSyncForMultipleFilter(
        mainStateRef.current.localCheckedActivities,
        fetchedData,
      );
      const activities = SchUtils.getActivities(mainStateRef.current.localCheckedActivities, fetchedData);
      const payload = SchMultipleItems.prepareDataForOpenScheduleAgentSnapshot(
        checkedItems,
        activities,
        activeDate,
        mainStateRef.current.dateRange,
      );

      const agentScheduleSnapshot = await restApi.openScheduleAgentSnapshot(payload);
      if (agentScheduleSnapshot?.data?.snapshotId) {
        const agentsFromSnapshot = await restApi.findAgentsFromSnapshot({
          snapshotId: agentScheduleSnapshot?.data?.snapshotId,
          firstIndex: 0,
          lastIndex: agentScheduleSnapshot.data.totalCount - 1,
        });
        singleChange('snapshotId', agentScheduleSnapshot?.data?.snapshotId);
        const acceptableAgentsFromSnapshot: IResponseFindAgentsFromSnapshotData[] = agentsFromSnapshot.data || [];
        const tempcheckedFetched = SchMultipleItems.updateCheckedItems(
          JSON.parse(JSON.stringify(initChecked)),
          acceptableAgentsFromSnapshot,
          fetchedData,
        );
        const tempPasswdView: number[] = [];
        if (mainStateRef.current.passedView.indexOf(mainStateRef.current.viewState) > -1) {
          tempPasswdView.push(...mainStateRef.current.passedView);
        } else {
          tempPasswdView.push(...mainStateRef.current.passedView, mainStateRef.current.viewState);
        }
        const tempchecked = SchMultipleItems.checkedCorrector(tempcheckedFetched, acceptableAgentsFromSnapshot);
        setMainState(prevState => ({
          ...prevState,
          snapshotId: agentScheduleSnapshot?.data?.snapshotId || '',
          viewState: state,
          passedView: tempPasswdView,
          acceptableAgentsFromSnapshot: acceptableAgentsFromSnapshot,
          localCheckedItems: tempchecked,
          etalonChecked: tempcheckedFetched,
          etalonActivityChecked: JSON.parse(JSON.stringify(mainStateRef.current.localCheckedActivities)),
        }));
      }
    } else {
      changeState(state);
    }
  };

  const singleChange = (name: string, value: any) => {
    setMainState(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const changeAgentSearch = (val: string) => {
    setMainState(prevState => ({
      ...prevState,
      agentSearch: val,
    }));
  };
  const changeActivitySearch = (val: string) => {
    setMainState(prevState => ({
      ...prevState,
      activitySearch: val,
    }));
  };

  const isSomeChecked = (localCheckedItems: IBusinessUnits) => {
    const selected = SchUtils.getSelectedElements(localCheckedItems, fetchedData);
    if (selected.buId.length < 2) {
      if (
        selected.siteId.length > 0 ||
        selected.teamId.length > 0 ||
        selected.agentId.length > 0 ||
        selected.buId.length > 0
      ) {
        return true;
      }
    }
    return false;
  };

  const isTypeSelected = (indicators: ICatalog3[]) => {
    const someChecked = indicators.findIndex(el => el.checked);
    return someChecked > -1;
  };

  const changeState = (index: number) => {
    if (mainStateRef.current.passedView.indexOf(mainStateRef.current.viewState) < 0) {
      const tempPassed: number[] = [...mainStateRef.current.passedView];
      tempPassed.push(mainStateRef.current.viewState);
      singleChange('passedView', tempPassed);
    }
    singleChange('viewState', index);
  };

  const onClose = () => {
    if (mainStateRef.current.snapshotId) {
      restApi.closeAgentDaySnapshot({ snapshotId: mainStateRef.current.snapshotId });
    }
    dispatch(setOpenMultipleWizardAction(false));
  };

  const getSelectedType = (indicators: ICatalog3[]) => {
    const someChecked = indicators.find(el => el.checked);
    return someChecked?.id || 'notSelected';
  };

  const getCurrentDeleteType = () => {
    return mainState.indicators.filter(el => el.checked)[mainStateRef.current.deleteState].id;
  };

  const prevDeleteState = () => {
    if (mainStateRef.current.deleteState === 0) {
      changeState(3);
      return;
    }
    setMainState(prevState => ({
      ...prevState,
      deleteState: prevState.deleteState - 1,
    }));
  };

  const nextDeleteState = (state: string, payload: any, repeat: boolean) => {
    const updatedDeletePayloads = deletePayloadsRef.current;
    updatedDeletePayloads[mainStateRef.current.deleteState] = payload;
    setDeletePayloads(updatedDeletePayloads);

    if (mainStateRef.current.deleteState === mainState.indicators.filter(el => el.checked).length - 1) {
      // merge payload`s states
      const mergedPayload = {
        ...deletePayloadsRef.current[0],
        states: deletePayloadsRef.current.map(el => el.states).flat(1),
      };
      return onApply(state, mergedPayload, repeat); // todo
    } else {
      setMainState(prevState => ({
        ...prevState,
        deleteState: prevState.deleteState + 1,
      }));
    }
  };

  const insertDayOff = () => {
    const datesRange: string[] =
      mainStateRef.current.dateRange.length === 2 &&
      mainStateRef.current.dateRange[0] === mainStateRef.current.dateRange[1]
        ? [mainStateRef.current.dateRange[0]]
        : mainStateRef.current.dateRange;
    const repeatRequestForData = datesRange.indexOf(activeDate) > -1;
    const states = SchMultipleItems.prepareDataForNewMultipleDayOff(datesRange);
    const agentDays = SchMultipleItems.prepareTeamPlateInsertState(
      SchUtils.getSelectedElementsSyncForMultipleFilter(mainStateRef.current.localCheckedItems, fetchedData),
      !mainStateRef.current.showWarnings,
      mainStateRef.current.insertOnlyErrorsOrWarning,
      true,
      states,
      0,
      snapshotId,
    );

    onApply('state', agentDays, repeatRequestForData);
  };

  const onApply = async (type: string, payload: any, repeat: boolean) => {
    setMainState(prevState => ({
      ...prevState,
      loading: true,
    }));
    let result;
    try {
      if (selectedDataByType.type === 'delete') {
        result = await restApi.deleteStateAsync(payload);
      } else {
        if (type === 'day') {
          result = await restApi.insertAgentDayAsync(payload);
        }
        if (type === 'state') {
          result = await restApi.insertStateAsync(payload);
        }
        if (type === 'workSet') {
          result = await restApi.insertWorkStateAsync(payload);
        }
      }
      const requestId = result?.data ?? null;
      if (requestId) {
        setAsyncReq({ isOpen: true, payload, requestId, type, repeat });
      }
    } catch (e: any) {
      if (e.response && e.response.data && e.response.data.status && e.response.data.status.details) {
        dispatch(
          addGlobalError({
            message: e.response.data.status.details.join('\n'),
          }),
        );
      } else {
        dispatch(
          addGlobalError({
            message: 'Internal error',
          }),
        );
      }
      setMainState(prevState => ({
        ...prevState,
        loading: false,
      }));
    }
  };
  const insertOverlappedState = async (newPayload: any) => {
    const agentFilter = SchUtils.getSelectedElements(mainStateRef.current.localCheckedItems, fetchedData);
    const stateTypes = mainState.indicators.filter(state => state.checked).map(state => state.type) as SchStateType[];
    const date = mainStateRef.current.dateRange[0];

    const res = await dispatch(
      openAgentDayForSnapshot({
        agentFilter,
        date,
        stateTypes,
        startDate: DateUtils.getPreviousDay(date),
        endDate: DateUtils.getNextDay(date),
        timezoneId: mainStateRef.current.localTz.timezoneId,
      }),
    );
    const response = res.payload as IResponse<OpenAgentDaySnapshotResponse>;
    const { snapshotId, agentCount } = response.data;
    const agentsResponse = await dispatch(
      findAgentSnapshot({
        date,
        timezoneId: mainStateRef.current.localTz.timezoneId,
        snapshotId,
        firstIndex: 0,
        stateTypes,
        startDate: DateUtils.getPreviousDay(date),
        endDate: DateUtils.getNextDay(date),
        lastIndex: agentCount - 1,
      }),
    );
    const agents = agentsResponse.payload as IResponse<IAgentSchedule[]>;
    const { data } = agents;
    const agentsWithTimezone = SchUtils.addTimeZone(data, fetchedData, timezones, mainStateRef.current.localTz, date);
    const preparedStates = newPayload.states.map((state: any) => ({
      ...state,
      endDateTime: DateUtils.convertStringToTimestamp(state.endDateTime),
      startDateTime: DateUtils.convertStringToTimestamp(state.startDateTime),
    }));
    const newAgents = SchAgent.insertStates(agentsWithTimezone, preparedStates);

    await dispatch(
      saveAgentDay({
        agents: newAgents as IAgentTimeline[],
        ignoreWarnings: true,
        checkTimestamp: true,
        refreshSchedule: true,
        reviewWarningsType: 'short',
        allOrNothing: mainState.insertOnlyErrorsOrWarning,
      }),
    ).finally(() => {
      restApi.closeAgentDaySnapshot({ snapshotId: snapshotId });
    });
  };

  const onApplyAfterWarnings = async () => {
    const newPayload = { ...asyncReqRef.current.payload };
    const repeat = asyncReqRef.current.repeat;
    newPayload.ignoreWarnings = true;
    let result;
    try {
      if (selectedDataByType.type === 'delete') {
        result = await restApi.deleteStateAsync(newPayload);
      } else {
        if (asyncReqRef.current.type === 'day') {
          result = await restApi.insertAgentDayAsync(newPayload);
        }
        if (asyncReqRef.current.type === 'workSet') {
          result = await restApi.insertWorkStateAsync(newPayload);
        }
        if (asyncReqRef.current.type === 'state') {
          const agentsWithOverlapping = mainStateRef.current.agentsResponseErrors.find(agent =>
            /.*Newly inserted state Exception .* is replacing an existing state Exception.*/.test(
              Array.isArray(agent.messages) ? agent.messages.join('') : agent.messages,
            ),
          );
          if (getSelectedType(mainStateRef.current.indicators) === 'newException' && agentsWithOverlapping) {
            await insertOverlappedState(newPayload);
          } else {
            result = await restApi.insertStateAsync(newPayload);
          }
        }
      }
      const requestId = result?.data ?? null;
      if (requestId) {
        setAsyncReq({ isOpen: true, payload: newPayload, requestId, type, repeat });
      }
      if (asyncReqRef.current.repeat) {
        dispatch(getAgentsSchedule());
      }
      onClose();
    } catch (e: any) {
      let message = 'Internal error';
      if (e.response && e.response.data && e.response.data.status && e.response.data.status.details) {
        message = e.response.data.status.details.join('\n');
      }
      dispatch(
        addGlobalError({
          message: message,
        }),
      );
    }
  };

  const handleClickEditMultiple = async () => {
    singleChange('loading', true);
    try {
      const agentFilter = SchUtils.getSelectedElementsSyncForMultipleFilter(
        mainStateRef.current.localCheckedItems,
        fetchedData,
      );
      agentFilter.buId = [];
      //const date = SchMultipleItems.getDate(mainState.dateRange[0]);
      const date = mainStateRef.current.dateRange[0];

      if (!date) return;
      const stateTypes = mainStateRef.current.indicators
        .filter(state => state.checked)
        .map(state => state.type) as SchStateType[];
      const res = await dispatch(
        openAgentDayForSnapshot({
          agentFilter,
          date,
          stateTypes,
          startDate: DateUtils.getPreviousDay(date),
          endDate: DateUtils.getNextDay(date),
          timezoneId: mainStateRef.current.localTz.timezoneId,
        }),
      );
      const response = res.payload as IResponse<OpenAgentDaySnapshotResponse>;
      const { snapshotId, agentCount } = response.data;
      const res2 = await dispatch(
        findAgentSnapshot({
          date,
          timezoneId: mainStateRef.current.localTz.timezoneId,
          snapshotId,
          firstIndex: 0,
          stateTypes,
          startDate: DateUtils.getPreviousDay(date),
          endDate: DateUtils.getNextDay(date),
          lastIndex: agentCount - 1,
        }),
      );
      const response2 = res2.payload as IResponse<IAgentSchedule[]>;
      const { data } = response2;
      const agentsWithTimezone = SchUtils.addTimeZone(data, fetchedData, timezones, mainStateRef.current.localTz, date);
      singleChange('agents', agentsWithTimezone);
      changeState(4);

      await restApi.closeAgentDaySnapshot({ snapshotId });
    } finally {
      singleChange('loading', false);
    }
  };

  usePopUpHotkeys({
    onCancel: [onClose],
  });

  const onProgressChange = async (pbState: IProgressBarAsyncState): Promise<IProgressBarAsyncStateDiff> => {
    if (pbState.status !== ProgressBarAsyncStatus.DONE) return {};
    const payload = {
      requestId: asyncReqRef.current.requestId ?? '',
    };
    if (!payload.requestId) return {};
    try {
      const result = await restApi.getRequestValidation(payload);
      const isWarnings = asyncReqRef.current.payload.isWarnings ?? true;

      if (isWarnings) {
        //@ts-ignore
        const errors = (result.errors?.validations ?? []).find((agent: any) => !isEmpty(agent.errors));
        if (result && (!result.data.success || errors)) {
          //@ts-ignore
          const data: any[] = result.errors?.validations ?? [];
          const errorAgentsId: any[] = data.map((el: any) => el.agentId);

          const onlyErroredAgentsIds = data.filter((el: any) => !isEmpty(el.errors)).map((el: any) => el.agentId);

          const filterAgents = {
            buId: asyncReqRef.current.payload.buId ?? [],
            siteId: asyncReqRef.current.payload.siteId ?? [],
            teamId: asyncReqRef.current.payload.teamId ?? [],
            agentId: errorAgentsId ?? [],
          };
          const agents = await dispatch(
            getAgentsDaysList(
              filterAgents as IInputfilterAgentDay,
              mainStateRef.current.localTz.timezoneId,
              mainStateRef.current.dateRange[0],
              mainStateRef.current.dateRange.slice(-1)[0],
            ),
          );

          const isAllAgentsErrored =
            agents?.filter(({ agentId }) => {
              return !onlyErroredAgentsIds.includes(agentId);
            }).length === 0;

          const errorAgentsData = await restApi.findAgents({
            ...filterAgents,
            startDate: mainStateRef.current.dateRange[0],
            endDate: mainStateRef.current.dateRange.slice(-1)[0],
          });

          setMainState(prevState => ({
            ...prevState,
            loading: false,
            viewState: 10,
            agentsResponseErrors: data,
            agentsData: errorAgentsData.data,
            cachedRepeat: true,
            isAllAgentsErrored,
          }));

          return {};
        } else {
          if (asyncReqRef.current.repeat) {
            await dispatch(getAgentsSchedule());
          }
        }
        setAsyncReq({ ...asyncReqRef.current, response: result });
        onClose();
      }
    } catch (e) {
      if (payload.requestId) {
        await restApi.sessionCancelRequest(payload);
      }

      return { ...pbState, isOpen: false } as IProgressBarAsyncStateDiff;
    } finally {
      if (payload.requestId) {
        await restApi.sessionCloseRequest(payload);
      }
      setAsyncReq({ ...asyncReqRef.current, isOpen: false });
    }

    return {};
  };

  const statusRequestFn = async (currentState: IProgressBarAsyncState): Promise<IProgressBarAsyncStateDiff> => {
    if (!asyncReqRef.current.requestId) {
      setAsyncReq({});
      return {};
    }
    const payload = {
      requestId: asyncReqRef.current.requestId,
    };
    if (asyncReqRef.current.needClose) {
      try {
        await restApi.sessionCloseRequest(payload);
      } finally {
        setAsyncReq({});
        singleChange('loading', false);
      }

      return  {}
    }
    const result = await restApi.sessionRequestStatus(payload);
    //@ts-ignore
    const progress = (result.data.status as ISessionRequestStatus).progress ?? 0;
    //@ts-ignore
    const request_status = (result.data.status as ISessionRequestStatus).status ?? '';
    let status = ProgressBarAsyncStatus.NONE;
    if (!request_status) {
      status = progress < 100 ? ProgressBarAsyncStatus.IN_PROGRESS : ProgressBarAsyncStatus.DONE;
    }

    return { ...currentState, progress, status };
  };

  const onCloseProgressBar = async () => {
    if (!asyncReqRef.current.requestId || asyncReqRef.current.needClose) {
      return;
    }
    const payload = {
      requestId: asyncReqRef.current.requestId,
    };
    await restApi.sessionCancelRequest(payload);
    setAsyncReq({ ...asyncReqRef.current, needClose: true });
  }

  return (
    <div className={styles.container} onClick={() => dispatch(changeMeetingCalendarVisible(false))}>
      {asyncReqRef.current.isOpen ? (
        <ProgressBarAsync
          isOpen={asyncReqRef.current.isOpen}
          timeout={TIMEOUT}
          onChange={onProgressChange}
          statusRequestFn={statusRequestFn}
          type={ProgressBarAsyncType.FIXED}
          onCancel={onCloseProgressBar}
        />
      ) : null}
      {mainState.loading && !asyncReqRef.current.isOpen ? (
        <div className={styles.spinnerWrapper}>
          <Spiner />
        </div>
      ) : null}
      <MultipleShift
        visible={
          selectedDataByType.type === 'insert' &&
          mainState.viewState === 4 &&
          getSelectedType(mainState.indicators) === 'newShift'
        }
        loading={mainStateRef.current.loading}
        close={onClose}
        return={() => {
          changeState(3);
        }}
        apply={onApply}
        activeDate={mainStateRef.current.dateRange}
        checkedItems={mainStateRef.current.localCheckedItems}
        insertOnlyErrorsOrWarning={mainState.insertOnlyErrorsOrWarning}
        showWarnings={mainState.showWarnings}
        snapshotId={mainStateRef.current.snapshotId}
        selectedTz={mainStateRef.current.localTz}
      />

      <MultipleTimeOff
        visible={
          selectedDataByType.type === 'insert' &&
          mainState.viewState === 4 &&
          getSelectedType(mainStateRef.current.indicators) === 'newTimeOff'
        }
        loading={mainStateRef.current.loading}
        onclose={onClose}
        onReturn={() => {
          changeState(3);
        }}
        apply={onApply}
        dateRange={mainStateRef.current.dateRange}
        checkedItems={SchUtils.getSelectedElementsSyncForMultipleFilter(
          mainStateRef.current.localCheckedItems,
          fetchedData,
        )}
        insertOnlyErrorsOrWarning={mainStateRef.current.insertOnlyErrorsOrWarning}
        showWarnings={mainStateRef.current.showWarnings}
        siteId={SchUtils.getSiteId(mainStateRef.current.localCheckedItems)}
        buId={SchUtils.getBuId(mainStateRef.current.localCheckedItems)}
        siteTzId={SchUtils.getSiteTz(mainStateRef.current.localCheckedItems, fetchedData)}
        snapshotId={mainStateRef.current.snapshotId}
        selectedTz={mainStateRef.current.localTz}
        hasNoShowAll={true}
      />

      <MultipleTimeOff
        visible={
          selectedDataByType.type === 'delete' && mainState.viewState === 4 && getCurrentDeleteType() === 'newTimeOff'
        }
        loading={mainStateRef.current.loading}
        onclose={onClose}
        onReturn={prevDeleteState}
        apply={nextDeleteState}
        dateRange={mainStateRef.current.dateRange}
        checkedItems={SchUtils.getSelectedElementsSyncForMultipleFilter(
          mainStateRef.current.localCheckedItems,
          fetchedData,
        )}
        insertOnlyErrorsOrWarning={mainStateRef.current.insertOnlyErrorsOrWarning}
        showWarnings={mainStateRef.current.showWarnings}
        siteId={SchUtils.getSiteId(mainStateRef.current.localCheckedItems)}
        buId={SchUtils.getBuId(mainStateRef.current.localCheckedItems)}
        siteTzId={SchUtils.getSiteTz(mainStateRef.current.localCheckedItems, fetchedData)}
        itemsStartTime={mainStateRef.current.itemsStartTime}
        itemsEndTime={mainStateRef.current.itemsEndTime}
        itemsNextEndDay={mainStateRef.current.itemsNextEndDay}
        isDelete={true}
        showNextBtn={mainStateRef.current.deleteState < mainState.indicators.filter(el => el.checked).length - 1}
        snapshotId={mainStateRef.current.snapshotId}
        hasNoShowAll={false}
        selectedTz={mainStateRef.current.localTz}
      />

      <MultipleException
        visible={
          selectedDataByType.type === 'insert' &&
          mainState.viewState === 4 &&
          getSelectedType(mainStateRef.current.indicators) === 'newException'
        }
        loading={mainStateRef.current.loading}
        onClose={onClose}
        onReturn={() => {
          changeState(3);
        }}
        apply={onApply}
        dateRange={mainStateRef.current.dateRange}
        checkedItems={SchUtils.getSelectedElementsSyncForMultipleFilter(
          mainStateRef.current.localCheckedItems,
          fetchedData,
        )}
        insertOnlyErrorsOrWarning={mainStateRef.current.insertOnlyErrorsOrWarning}
        showWarnings={mainStateRef.current.showWarnings}
        siteId={SchUtils.getSiteId(mainStateRef.current.localCheckedItems)}
        siteTzId={SchUtils.getSiteTz(mainStateRef.current.localCheckedItems, fetchedData)}
        snapshotId={mainStateRef.current.snapshotId}
        selectedTz={mainStateRef.current.localTz}
      />
      <MultipleMarkedTime
        visible={
          selectedDataByType.type === 'insert' &&
          mainState.viewState === 4 &&
          getSelectedType(mainStateRef.current.indicators) === 'newMarkedTime'
        }
        loading={mainStateRef.current.loading}
        onClose={onClose}
        onReturn={() => {
          changeState(3);
        }}
        apply={onApply}
        dateRange={mainStateRef.current.dateRange}
        checkedItems={SchUtils.getSelectedElementsSyncForMultipleFilter(
          mainStateRef.current.localCheckedItems,
          fetchedData,
        )}
        insertOnlyErrorsOrWarning={mainStateRef.current.insertOnlyErrorsOrWarning}
        showWarnings={mainStateRef.current.showWarnings}
        siteId={SchUtils.getSiteId(mainStateRef.current.localCheckedItems)}
        buId={SchUtils.getBuId(mainStateRef.current.localCheckedItems)}
        siteTzId={SchUtils.getSiteTz(mainStateRef.current.localCheckedItems, fetchedData)}
        snapshotId={mainStateRef.current.snapshotId}
        selectedTz={mainStateRef.current.localTz}
      />

      <MultipleMarkedTime
        visible={
          selectedDataByType.type === 'delete' &&
          mainState.viewState === 4 &&
          getCurrentDeleteType() === 'newMarkedTime'
        }
        loading={mainStateRef.current.loading}
        onClose={onClose}
        onReturn={prevDeleteState}
        apply={nextDeleteState}
        dateRange={mainStateRef.current.dateRange}
        checkedItems={SchUtils.getSelectedElementsSyncForMultipleFilter(
          mainStateRef.current.localCheckedItems,
          fetchedData,
        )}
        insertOnlyErrorsOrWarning={mainStateRef.current.insertOnlyErrorsOrWarning}
        showWarnings={mainStateRef.current.showWarnings}
        siteId={SchUtils.getSiteId(mainStateRef.current.localCheckedItems)}
        buId={SchUtils.getBuId(mainStateRef.current.localCheckedItems)}
        siteTzId={SchUtils.getSiteTz(mainStateRef.current.localCheckedItems, fetchedData)}
        itemsStartTime={mainStateRef.current.itemsStartTime}
        itemsEndTime={mainStateRef.current.itemsEndTime}
        itemsNextEndDay={mainStateRef.current.itemsNextEndDay}
        isDelete={true}
        showNextBtn={mainStateRef.current.deleteState < mainState.indicators.filter(el => el.checked).length - 1}
        snapshotId={mainStateRef.current.snapshotId}
        selectedTz={mainStateRef.current.localTz}
      />

      <MultipleWorkSet
        visible={
          selectedDataByType.type === 'insert' &&
          mainState.viewState === 4 &&
          getSelectedType(mainStateRef.current.indicators) === 'newWorkSet'
        }
        loading={mainStateRef.current.loading}
        onClose={onClose}
        onReturn={() => {
          changeState(3);
        }}
        apply={onApply}
        dateRange={mainStateRef.current.dateRange}
        checkedItems={SchUtils.getSelectedElementsSyncForMultipleFilter(
          mainStateRef.current.localCheckedItems,
          fetchedData,
        )}
        insertOnlyErrorsOrWarning={mainStateRef.current.insertOnlyErrorsOrWarning}
        showWarnings={mainStateRef.current.showWarnings}
        siteId={SchUtils.getSiteId(mainStateRef.current.localCheckedItems)}
        buId={SchUtils.getBuId(mainStateRef.current.localCheckedItems)}
        siteTzId={SchUtils.getSiteTz(mainStateRef.current.localCheckedItems, fetchedData)}
        snapshotId={mainStateRef.current.snapshotId}
        selectedTz={mainStateRef.current.localTz}
      />

      <MultipleException
        visible={
          selectedDataByType.type === 'delete' && mainState.viewState === 4 && getCurrentDeleteType() === 'newException'
        }
        loading={mainStateRef.current.loading}
        onClose={onClose}
        onReturn={prevDeleteState}
        apply={nextDeleteState}
        dateRange={mainStateRef.current.dateRange}
        checkedItems={SchUtils.getSelectedElementsSyncForMultipleFilter(
          mainStateRef.current.localCheckedItems,
          fetchedData,
        )}
        insertOnlyErrorsOrWarning={mainStateRef.current.insertOnlyErrorsOrWarning}
        showWarnings={mainStateRef.current.showWarnings}
        siteId={SchUtils.getSiteId(mainStateRef.current.localCheckedItems)}
        siteTzId={SchUtils.getSiteTz(mainStateRef.current.localCheckedItems, fetchedData)}
        isDelete={true}
        itemsStartTime={mainStateRef.current.itemsStartTime}
        itemsEndTime={mainStateRef.current.itemsEndTime}
        itemsNextEndDay={mainStateRef.current.itemsNextEndDay}
        showNextBtn={mainStateRef.current.deleteState < mainState.indicators.filter(el => el.checked).length - 1}
        snapshotId={mainStateRef.current.snapshotId}
        selectedTz={mainStateRef.current.localTz}
      />

      {selectedDataByType.type === 'edit' && mainState.viewState === 4 && !mainStateRef.current.loading && (
        <EditMultipleWizard
          mainState={mainStateRef.current}
          setMainState={setMainState}
          dataByType={selectedDataByType}
          agents={mainStateRef.current.agents}
          onReturn={() => {
            if (mainStateRef.current.loading) return;
            changeState(3);
          }}
          onClose={onClose}
        />
      )}
      {selectedDataByType.type === 'edit' && mainState.viewState === 5 && (
        <ErrorsMultipleWizard
          mainState={mainStateRef.current}
          setMainState={setMainState}
          dataByType={selectedDataByType}
          agents={mainState.agentsErrors}
          onReturn={() => {
            changeState(4);
          }}
          onClose={onClose}
        />
      )}
      <MultipleBreackMeal
        visible={
          selectedDataByType.type === 'insert' &&
          mainState.viewState === 4 &&
          (getSelectedType(mainStateRef.current.indicators) === 'newMeal' ||
            getSelectedType(mainStateRef.current.indicators) === 'newBreak')
        }
        loading={mainStateRef.current.loading}
        type={getSelectedType(mainStateRef.current.indicators) === 'newMeal' ? 'INSERT_MEAL' : 'INSERT_BREAK'}
        onClose={onClose}
        onReturn={() => {
          changeState(3);
        }}
        apply={onApply}
        dateRange={mainStateRef.current.dateRange}
        checkedItems={SchUtils.getSelectedElementsSyncForMultipleFilter(
          mainStateRef.current.localCheckedItems,
          fetchedData,
        )}
        insertOnlyErrorsOrWarning={mainStateRef.current.insertOnlyErrorsOrWarning}
        showWarnings={mainStateRef.current.showWarnings}
        siteId={SchUtils.getSiteId(mainStateRef.current.localCheckedItems)}
        buId={SchUtils.getBuId(mainStateRef.current.localCheckedItems)}
        siteTzId={SchUtils.getSiteTz(mainStateRef.current.localCheckedItems, fetchedData)}
        snapshotId={mainStateRef.current.snapshotId}
        selectedTz={mainStateRef.current.localTz}
      />

      <MultipleBreackMeal
        visible={
          selectedDataByType.type === 'delete' && mainState.viewState === 4 && getCurrentDeleteType() === 'newMeal'
        }
        loading={mainStateRef.current.loading}
        type={'INSERT_MEAL'}
        onClose={onClose}
        onReturn={prevDeleteState}
        apply={nextDeleteState}
        dateRange={mainStateRef.current.dateRange}
        checkedItems={SchUtils.getSelectedElementsSyncForMultipleFilter(
          mainStateRef.current.localCheckedItems,
          fetchedData,
        )}
        insertOnlyErrorsOrWarning={mainStateRef.current.insertOnlyErrorsOrWarning}
        showWarnings={mainStateRef.current.showWarnings}
        siteId={SchUtils.getSiteId(mainStateRef.current.localCheckedItems)}
        buId={SchUtils.getBuId(mainStateRef.current.localCheckedItems)}
        siteTzId={SchUtils.getSiteTz(mainStateRef.current.localCheckedItems, fetchedData)}
        isDelete={true}
        itemsStartTime={mainStateRef.current.itemsStartTime}
        itemsEndTime={mainStateRef.current.itemsEndTime}
        itemsNextEndDay={mainStateRef.current.itemsNextEndDay}
        showNextBtn={mainStateRef.current.deleteState < mainState.indicators.filter(el => el.checked).length - 1}
        snapshotId={mainStateRef.current.snapshotId}
        hasNoShowAll={false}
        selectedTz={mainStateRef.current.localTz}
      />

      <MultipleBreackMeal
        visible={
          selectedDataByType.type === 'delete' && mainState.viewState === 4 && getCurrentDeleteType() === 'newBreak'
        }
        loading={mainStateRef.current.loading}
        type={'INSERT_BREAK'}
        onClose={onClose}
        onReturn={prevDeleteState}
        apply={nextDeleteState}
        dateRange={mainStateRef.current.dateRange}
        checkedItems={SchUtils.getSelectedElementsSyncForMultipleFilter(
          mainStateRef.current.localCheckedItems,
          fetchedData,
        )}
        insertOnlyErrorsOrWarning={mainStateRef.current.insertOnlyErrorsOrWarning}
        showWarnings={mainStateRef.current.showWarnings}
        siteId={SchUtils.getSiteId(mainStateRef.current.localCheckedItems)}
        buId={SchUtils.getBuId(mainStateRef.current.localCheckedItems)}
        siteTzId={SchUtils.getSiteTz(mainStateRef.current.localCheckedItems, fetchedData)}
        isDelete={true}
        itemsStartTime={mainStateRef.current.itemsStartTime}
        itemsEndTime={mainStateRef.current.itemsEndTime}
        itemsNextEndDay={mainStateRef.current.itemsNextEndDay}
        showNextBtn={mainStateRef.current.deleteState < mainState.indicators.filter(el => el.checked).length - 1}
        snapshotId={mainStateRef.current.snapshotId}
        hasNoShowAll={false}
        selectedTz={mainStateRef.current.localTz}
      />
      {mainState.viewState === 10 ? (
        <ReviewWarnings
          onClose={onClose}
          onReturn={() => {
            setMainState({ ...mainState, isAllAgentsErrored: false, viewState: 3 });
          }}
          apply={onApplyAfterWarnings}
          agentsErrors={mainStateRef.current.agentsResponseErrors}
          agentsData={mainStateRef.current.agentsData}
          publishDisabled={mainState.isAllAgentsErrored}
          loading={mainStateRef.current.loading}
        />
      ) : (
        ''
      )}
      {mainState.viewState < 4 ? (
        <div className={styles.formWrapper} style={{ width: selectedDataByType.width }}>
          <div className={styles.header}>
            <span>{selectedDataByType.title}</span>
            <Cross onClick={onClose} />
          </div>
          <div className={styles.body}>
            {mainState.viewState === 1 ? (
              <SelectDate
                dataByType={selectedDataByType}
                singleChange={singleChange}
                mainState={mainState}
                mainStateRef={mainStateRef}
                setMainState={setMainState}
                initChecked={initChecked}
                isDelete={selectedDataByType.type === 'delete'}
                currentDate={activeDate}
              />
            ) : (
              ''
            )}
            {mainState.viewState === 2 ? (
              <SelectActivities
                initChecked={mainStateRef.current.localCheckedItems}
                mainState={mainStateRef.current}
                setMainState={setMainState}
                singleChange={singleChange}
                fetchedData={fetchedData}
                dataByType={selectedDataByType}
                isDelete={selectedDataByType.type === 'delete'}
                externalSearch={mainStateRef.current.activitySearch}
                externalSearchChange={changeActivitySearch}
              />
            ) : (
              ''
            )}
            {mainState.viewState === 3 ? (
              <SelectAgents
                initChecked={initChecked}
                mainState={mainStateRef.current}
                setMainState={setMainState}
                singleChange={singleChange}
                fetchedData={mainStateRef.current.etalonChecked}
                dataByType={selectedDataByType}
                isDelete={selectedDataByType.type === 'delete'}
                snapshotId={mainStateRef.current.snapshotId}
                externalSearch={mainStateRef.current.agentSearch}
                externalSearchChange={changeAgentSearch}
              />
            ) : (
              ''
            )}
          </div>

          <div className={styles.footer}>
            <div className={styles.buttonWrap1} data-test={'modal-cancel-button'}>
              <Button
                innerText={'Cancel'}
                click={() => {
                  onClose();
                }}
                disable={mainStateRef.current.loading}
                style={{ background: '#FFFFFF', color: '#0183F5', border: '0.5px solid #0183F5', borderRadius: '5px' }}
              />
            </div>
            {mainState.viewState > 1 ? (
              <div className={styles.buttonWrap5} data-test={'modal-previous-button'}>
                <Button
                  innerText={'< Previous'}
                  click={() => {
                    changeState(mainStateRef.current.viewState - 1);
                  }}
                  disable={mainStateRef.current.loading}
                  type={'primary'}
                />
              </div>
            ) : (
              ''
            )}
            {mainState.viewState < 3 ? (
              <div className={styles.buttonWrap2} data-test={'modal-next-button'}>
                <Button
                  innerText={'Next >'}
                  click={async () => {
                    singleChange('loading', true);
                    if (
                      (mainStateRef.current.rangeOrSingle && mainStateRef.current.dateRange[1]) ||
                      (!mainStateRef.current.rangeOrSingle && mainStateRef.current.dateRange[0])
                    ) {
                      if (mainStateRef.current.viewState === 1) {
                        changeState(2);
                      } else {
                        await createSnapshotAndChangeState(3);
                      }
                    }
                    singleChange('loading', false);
                  }}
                  disable={
                    mainStateRef.current.loading ||
                    (mainState.viewState > 1 &&
                      Object.keys(mainStateRef.current.localCheckedActivities).length === 0) ||
                    !mainStateRef.current.itemsTimeValid ||
                    !(
                      (mainStateRef.current.rangeOrSingle && mainStateRef.current.dateRange[1]) ||
                      (!mainStateRef.current.rangeOrSingle && mainStateRef.current.dateRange[0]) ||
                      (selectedDataByType.type === 'edit' && mainStateRef.current.dateRange[0])
                    )
                  }
                  type={'primary'}
                />
              </div>
            ) : (
              ''
            )}
            {mainState.viewState === 3 ? (
              <div className={styles.buttonWrap2} data-test={'modal-save-changes-button'}>
                <Button
                  innerText={
                    mainState.viewState === 3 && getSelectedType(mainState.indicators) === 'newDayOff'
                      ? 'Publish'
                      : 'Next >'
                  }
                  click={async () => {
                    //click on edit wizard
                    if (selectedDataByType.type === 'edit' && mainState.viewState === 3)
                      return await handleClickEditMultiple();
                    mainState.viewState === 3 && getSelectedType(mainState.indicators) === 'newDayOff'
                      ? insertDayOff()
                      : changeState(4);
                  }}
                  disable={
                    mainStateRef.current.loading ||
                    !isSomeChecked(mainStateRef.current.localCheckedItems) ||
                    !isTypeSelected(mainState.indicators)
                  }
                  type={'primary'}
                  isSaveButton={mainState.viewState === 3 && getSelectedType(mainState.indicators) === 'newDayOff'}
                />
              </div>
            ) : (
              ''
            )}
          </div>
        </div>
      ) : (
        ''
      )}
    </div>
  );
};

export default MultipleWizardMenu;
