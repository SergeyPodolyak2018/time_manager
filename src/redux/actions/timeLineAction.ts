import { clone, isNil, omit, pathOr } from 'ramda';

import { AnyAction, createAction, createAsyncThunk, Dispatch, PayloadActionCreator } from '@reduxjs/toolkit';

import restApi from '../../api/rest';
import { ICalcSchedule, IFindAgentDayFromSnapshot } from '../../api/ts/interfaces/config.payload';
import { FindAgentDay } from '../../api/ts/interfaces/findAgentDay.payload';
import { IInputfilterAgentDay } from '../../api/ts/interfaces/schedulePayload';
import { lazyLoadingConf, SCH_STATE_TYPE } from '../../common/constants';
import { DayType, SchStateType } from '../../common/constants/schedule';
import { IAgentSchedule, ISchWorkState } from '../../common/interfaces/schedule/IAgentSchedule';
import { ISchDayDatesAgentIds } from '../../common/interfaces/schedule/ISchDay';
import { IControlChartState, ITimeLineStateSave } from '../../common/interfaces/storage';
import { ReviewWarningsType } from '../../components/ScheduleComponents/Popups/ReviewWarningsPopup/ReviewWarningsPopup';
import DateUtils from '../../helper/dateUtils';
import DateUtilsTimeZone from '../../helper/DateUtilsTimeZone';
import logger from '../../helper/logger';
import SchAgent, { IRemoveAgentDay } from '../../helper/schedule/SchAgent';
import SchDay from '../../helper/schedule/SchDay';
import SchSelectedActivity from '../../helper/schedule/SchSelectedActivity';
import SchUtils, { ISelected } from '../../helper/schedule/SchUtils';
import Utils from '../../helper/utils';
import {
  getActiveDateSelector,
  getSelectedTzSelector,
  getTimezonesHashSelector,
} from '../selectors/controlPanelSelector';
import { getCheckedItems, getFilterData } from '../selectors/filterSelector';
import { getLastId, getLastParams } from '../selectors/snapShotsSelector';
import {
  getBuffer,
  getColumns,
  getConfirmPopUp,
  getDataSelector,
  getModifiedAgentDays,
  getSelectedActivitySelector,
  getSelectedAgentsMulti,
  getSortBy,
  getSortingProcess,
  isTimeLineDisabled,
  scheduleCalculatedSelector,
} from '../selectors/timeLineSelector';
import { AppDispatch, GetRootState } from '../store';
import {
  BufferElementsType,
  IBuildScheduleParam,
  ICalculatedSchedule,
  ICopyToMenuParam,
  IEditCommentMenu,
  IErrorPopUpParam,
  IInsertMenuParam,
  IMemoInfoType,
  IPossibleColumns,
  IRebuildScheduleParam,
  ISelectedActivity,
  ISnapShotRequest,
  ISortBy,
  ISubMenuType,
  ITargetInfo,
  IWarningPopUpParam,
  SetActivitiesFor,
  SORT_ORDER,
  SORT_TYPE,
} from '../ts/intrefaces/timeLine';
import { buildAgentDayInSnapshotData } from '../ts/intrefaces/timeLine/actionTypes';
import { IAgentsDaySnapshotPageParameters } from '../ts/intrefaces/timeLine/IAgentsDaySnapshotPageParameters';
import { IAgentTimeline } from '../ts/intrefaces/timeLine/IAgentTimeline';
import { addChartDataAction, changeChartStoreByHistory, toggleChartLoader } from './ChartActions';
import { setConfirmPopupData } from './confirmPopupActions';
import { addSnapShotAction, removeSnapShotAction } from './snapShotsActions';
import { TimeLineTypes as ActionTypes } from './types/timeLine';

export const setMultipleTimezonesWarning = (data: boolean) => ({
  type: ActionTypes.SET_MULTIPLE_TIMEZONES_WARNING,
  payload: data,
});

export const getAgentsSchedule = (isMerge = false, isSaveToHistory = false, updateChartToggle = true) => {
  return async (dispatch: any) => {
    await dispatch(toggleLoader(true));
    await dispatch(setDataToStore({ agents: [] }));
    const performance = Utils.getFuncPerformance('getAgentSchedule');
    dispatch(scrollToIndex(-1));
    await dispatch(clearCalculatedSchedule());
    await dispatch(closeLastAgentDaySnapshot());
    await dispatch(openAgentDaySnapshot());
    await dispatch(addChartDataAction(updateChartToggle, undefined, true, true, false));
    await dispatch(getAgentsDaySnapshotPage(isMerge, isSaveToHistory, false, false, true, false, {}, false));
    dispatch(checkMultipleTimezonesWarning());
    performance();
    dispatch(toggleLoader(false));
  };
};

export const checkMultipleTimezonesWarning = () => {
  return async (dispatch: any, getState: GetRootState) => {
    const agents = getDataSelector(getState());

    const tz = getSelectedTzSelector(getState());
    if (tz.name === 'Site') {
      const notAllTimezonesEqual = agents.some(
        (agent: IAgentTimeline) => agent.shortTimeZone !== agents[0].shortTimeZone,
      );
      dispatch(setMultipleTimezonesWarning(notAllTimezonesEqual));
    } else {
      dispatch(setMultipleTimezonesWarning(false));
    }
  };
};

/**
 *
 * @param isMerge merged agents from response findAgents
 * @param isSaveToHistory save data to timeline history
 * @param isSaveModified do not update modified agents in timeline
 * @param updateChartToggle
 */
export const refreshAgentsSchedule = (
  isMerge = false,
  isSaveToHistory = false,
  isSaveModified = false,
  updateChartToggle = true,
) => {
  return async (dispatch: any, getState: any) => {
    // [customer-597]: "Shift" element duplicated after drag and publish to previous day while timezone "GMT+"
    // open new snapshot because current snapshot return duplicated shifts
    const isSorting = getSortingProcess(getState());
    const timeLineDisabled = isTimeLineDisabled(getState());

    const performance = Utils.getFuncPerformance('refreshAgentsSchedule');
    dispatch(toggleLoader(true));
    // todo: need check
    // const loadedAgents = [...getDataSelector(getState())];
    const snapshotParams = getLastParams(getState());
    const modifiedAgents = getModifiedAgentDays(getState());

    await dispatch(openAgentDaySnapshot());
    await dispatch(getAgentsDaySnapshotPage(isMerge, isSaveToHistory, true, false, true, isSaveModified /*, param*/));
    if (updateChartToggle) {
      await dispatch(addChartDataAction(true, SchAgent.prepareAgentForPerformance(modifiedAgents), true));
    }
    await dispatch(closeSnapshotById(snapshotParams.id, false));
    dispatch(toggleLoader(false));
    performance();
    if(timeLineDisabled) dispatch(setIsTimeLineDisabled(false));
    if(isSorting) dispatch(setSortingProcess(false));
  };
};

export const openAgentDaySnapshot = () => {
  return async (dispatch: any, getstate: GetRootState) => {
    const performance = Utils.getFuncPerformance('openAgentDaySnapshot');
    const filterData = getFilterData(getstate());
    const checked = getCheckedItems(getstate());
    const timezone = getSelectedTzSelector(getstate());
    const date = getActiveDateSelector(getstate());
    const selectedAgents = await SchUtils.getSelectedElements(checked, filterData);

    const payload = SchUtils.prepareFilterAgentDay(selectedAgents);
    if (Utils.isAllArraysInObjEmpty(payload)) return;
    await dispatch(toggleLoader(true));
    payload.timezoneId = timezone.timezoneId;
    payload.date = date;
    const snapShotPayload = SchUtils.createSnapshotTemplate(payload as ISnapShotRequest);
    const sortBy = getSortBy(getstate());
    const sortPayload = SchUtils.createSortPayload(sortBy);
    // snapShotPayload.siteId = snapShotPayload.agentId?.length !== 0 ? [] : snapShotPayload.siteId;
    const { data } = await restApi.openAgentDaySnapshot({ ...snapShotPayload, ...sortPayload });
    if (!data) return;
    await dispatch(
      addSnapShotAction({
        id: data.snapshotId,
        ...omit(['snapshotId'], data),
        ...snapShotPayload,
        ...sortPayload,
      }),
    );
    performance();
  };
};

export const closeLastAgentDaySnapshot = (isResetStore = true) => {
  return async (dispatch: any, getstate: GetRootState) => {
    const previousSnapShotId = getLastId(getstate());
    if (previousSnapShotId !== '') {
      const { status } = await restApi.closeAgentDaySnapshot({ snapshotId: String(previousSnapShotId) });
      if (status.code === 0) {
        dispatch(removeSnapShotAction({ snapshotId: String(previousSnapShotId), isLast: true }));
        if (isResetStore) dispatch(setDataToStore({ agents: [], clearHistory: true }));
      }
    }
  };
};

export const closeSnapshotById = (id: string, isLast: boolean) => {
  return async (dispatch: any) => {
    const { status } = await restApi.closeAgentDaySnapshot({ snapshotId: String(id) });
    if (status.code === 0) {
      dispatch(removeSnapShotAction({ snapshotId: String(id), isLast }));
    }
  };
};

export const getAgentsDayFromSnapshotThreads = (payload: IFindAgentDayFromSnapshot) => {
  return async (dispatch: any, getstate: GetRootState): Promise<IAgentSchedule[] | null> => {
    const lastParams = getLastParams(getstate());
    const lastIndex = payload.lastIndex ?? (lastParams.agentCount ? lastParams.agentCount - 1 : 0);
    let firstIndex = payload.firstIndex ?? 0;
    let indexedAgentTimeline: { [key: string]: IAgentSchedule } = {};

    const worker = async () => {
      while (firstIndex <= lastIndex) {
        const _firstIndex = firstIndex;
        const _lastIndex = Math.min(firstIndex + lazyLoadingConf.pageSize - 1, lastIndex);
        firstIndex = _lastIndex + 1;

        const notParsedData = await restApi.findAgentDayFromSnapshot({
          ...payload,
          firstIndex: _firstIndex,
          lastIndex: _lastIndex,
        });
        if (notParsedData && Array.isArray(notParsedData.data)) {
          indexedAgentTimeline = notParsedData.data.reduce(
            (acc: { [key: string]: IAgentSchedule }, timeLine: IAgentSchedule, idx: number) => ({
              ...acc,
              [String(_firstIndex + idx)]: timeLine,
            }),
            indexedAgentTimeline,
          );
        }
      }
    };

    const promises = [];
    for (let i = 0; i < lazyLoadingConf.maxConcurrentRequests; i++) {
      promises.push(worker());
    }
    await Promise.all(promises);

    return Object.keys(indexedAgentTimeline)
      .sort((s0, s1) => parseInt(s0) - parseInt(s1))
      .reduce((acc: IAgentSchedule[], key: string) => [...acc, indexedAgentTimeline[key]], []);
  };
};

export const getAgentsDaySnapshotPage = (
  isMerge = false,
  isSaveToHistory = false,
  reset = false,
  updateAgents = false,
  clearHistory = true,
  isSaveModified = false,
  param: IAgentsDaySnapshotPageParameters = {},
  isTriggerToggler = true,
) => {
  return async (dispatch: any, getstate: GetRootState): Promise<IAgentTimeline[] | null> => {
    const snapshotId = getLastId(getstate());
    if (!snapshotId) return null;
    const lastParams = getLastParams(getstate());
    if (!lastParams.agentCount) {
      return isTriggerToggler ? dispatch(toggleLoader(false)) : null;
    }

    const firstIndex = !reset ? param.firstIndex ?? 0 : 0;
    const lastIndex = param.lastIndex ?? lastParams.agentCount - 1;

    const filterData = getFilterData(getstate());
    const timezone = getSelectedTzSelector(getstate());
    const allTimezone = getTimezonesHashSelector(getstate());
    const date = getActiveDateSelector(getstate());

    const payload: IFindAgentDayFromSnapshot = {
      snapshotId,
      firstIndex,
      lastIndex,
      date,
    };
    payload.timezoneId = timezone.timezoneId;
    payload.startDate = timezone.timezoneId === 0 ? DateUtils.getPreviousDayWithMoment(date) : date;
    payload.endDate = date;

    const notParsedData = await dispatch(getAgentsDayFromSnapshotThreads(payload));
    const notParsedDataWithTz = SchUtils.addTimeZone(notParsedData, filterData, allTimezone, timezone, date);
    let preparedData = await SchUtils.linearizeData(notParsedDataWithTz, date);
    preparedData = await SchUtils.getFieldsForTable(preparedData, date);
    if (param.ignoreSetDataToStore) return preparedData as IAgentTimeline[];
    dispatch(
      setDataToStore({
        agents: preparedData,
        isMerge,
        isSaveToHistory,
        updateAgents,
        clearHistory,
        currentDate: date,
        isSaveModified,
      }),
    );

    return preparedData as IAgentTimeline[];
  };
};

export const openAgentDayForSnapshot = createAsyncThunk(
  ActionTypes.OPEN_AGENT_DAY_FOR_SNAPSHOT,
  async ({
    agentFilter,
    date,
    stateTypes,
    startDate,
    endDate,
    timezoneId,
    ascending,
  }: {
    agentFilter: ISelected;
    date: string;
    stateTypes?: SchStateType[];
    startDate?: string;
    endDate?: string;
    timezoneId: number;
    ascending?: boolean;
  }) => {
    const { buId, siteId, teamId, agentId, activities } = agentFilter;

    const snapShotPayload = SchUtils.createSnapshotTemplate({
      buId,
      siteId,
      teamId,
      stateTypes,
      startDate,
      endDate,
      agentId,
      activities,
      date,
      timezoneId,
      ascending,
    });
    return await restApi.openAgentDaySnapshot(snapShotPayload);
  },
);

export const findAgentSnapshot = createAsyncThunk(
  ActionTypes.FIND_AGENT_SNAPSHOT,
  async (payload: IFindAgentDayFromSnapshot) => {
    if (!payload.startDate) payload.startDate = DateUtils.getPreviousDay(payload.date);
    if (!payload.endDate) payload.endDate = DateUtils.getNextDay(payload.date);

    return await restApi.findAgentDayFromSnapshot(payload);
  },
);

export const findAgentDay = createAsyncThunk(ActionTypes.FIND_AGENT_DAY, async (payload: FindAgentDay) => {
  if (!payload.startDate) payload.startDate = DateUtils.getPreviousDay(payload.date);
  if (!payload.endDate) payload.endDate = DateUtils.getNextDay(payload.date);

  return await restApi.getAgentsDay(payload);
});

export const getAgentsDaysForExport = (cb: (agentsData: any) => void) => {
  return async (dispatch: any, getstate: GetRootState) => {
    const snapshotId = getLastId(getstate());
    if (!snapshotId) return;
    const { agentCount } = getLastParams(getstate());
    if (!agentCount) return;

    const filterData = getFilterData(getstate());
    const timezone = getSelectedTzSelector(getstate());
    const allTimezone = getTimezonesHashSelector(getstate());
    const date = getActiveDateSelector(getstate());

    const payload: IFindAgentDayFromSnapshot = {
      snapshotId,
      date,
    };
    payload.timezoneId = timezone.timezoneId;
    payload.startDate = DateUtils.getPreviousDay(date);
    payload.endDate = DateUtils.getNextDay(date);
    payload.firstIndex = 0;
    payload.lastIndex = 1000;

    const notParsedData = await restApi.findAgentDayFromSnapshot(payload);
    const notParsedDataWithTz = SchUtils.addTimeZone(notParsedData.data, filterData, allTimezone, timezone, date);
    let preparedData = await SchUtils.linearizeData(notParsedDataWithTz, date);
    preparedData = await SchUtils.getFieldsForTable(preparedData, date);

    cb(preparedData);
  };
};

export const getAgentsDaysList = (
  filter: IInputfilterAgentDay,
  timezoneId: number,
  startDate: string,
  endDate: string,
) => {
  return async (dispatch: any, getstate: GetRootState) => {
    const filterData = getFilterData(getstate());
    const timezone = getSelectedTzSelector(getstate());
    const allTimezone = getTimezonesHashSelector(getstate());
    const date = getActiveDateSelector(getstate());
    await dispatch(toggleLoader(true));

    const payload: any = omit(['date'], SchUtils.prepareFilterAgentDay(filter));
    if (Utils.isAllArraysInObjEmpty(payload)) return;
    payload.timezoneId = timezoneId;
    payload.startDate = startDate;
    payload.endDate = endDate;
    try {
      const notParsedData = await restApi.getAgentsDay(payload);
      const notParsedDataWithTz = SchUtils.addTimeZone(notParsedData.data, filterData, allTimezone, timezone, date);
      const data = await SchUtils.linearizeData(notParsedDataWithTz, date);
      dispatch(toggleLoader(false));
      return data;
    } catch (e: any) {
      const exceptionParams: IErrorPopUpParam = {
        isOpen: true,
        data: e.response.data.status.details.join('\n'),
      };
      dispatch(openErrorPopUp(exceptionParams));
      dispatch(toggleLoader(false));
    }
  };
};

export const selectActivity = (activity: ISelectedActivity) => {
  return async (dispatch: any, getstate: GetRootState) => {
    const tempData: ISelectedActivity[] = [];
    const agents = getDataSelector(getstate());
    const previouslySelected = getSelectedActivitySelector(getstate());
    if (previouslySelected.length === 0) {
      tempData.unshift(activity);
    } else {
      if (isTypeExist(previouslySelected, activity)) {
        if (!isDuplicateExist(previouslySelected, activity)) {
          if (SchSelectedActivity.isWork(activity)) {
            const activities = SchSelectedActivity.selectShiftsBySelectedActivities(
              [activity, ...previouslySelected],
              agents,
            );
            tempData.unshift(...activities);
          } else {
            tempData.unshift(activity, ...previouslySelected);
          }
        } else {
          tempData.unshift(
            ...previouslySelected.filter(
              (element: ISelectedActivity) => element.agentId !== activity.agentId && element.id !== activity.id,
            ),
          );
        }
      } else {
        tempData.unshift(activity);
      }
    }
    dispatch(setSelectedActivity(tempData));
    dispatch(selectAgentAction(tempData[0]?.agentId));
  };
};
export const selectActivitySingle = (activity: ISelectedActivity) => {
  return async (dispatch: any) => {
    dispatch(setSelectedActivity([activity]));
    dispatch(selectAgentAction(activity.agentId));
  };
};

export const setSelectedActivities = (activities: ISelectedActivity[]) => {
  return async (dispatch: any) => {
    dispatch(setSelectedActivity(activities));
    dispatch(selectAgentAction(activities[0].agentId));
  };
};

export const initOpenSubMenu = (activity: ISubMenuType | any) => {
  return async (dispatch: any) => {
    await dispatch(addSubMenuInfo(activity));
    await dispatch(openSubMenu());
  };
};

export const initOpenEditCommentMenu = (activity: IEditCommentMenu) => {
  return async (dispatch: any) => {
    await dispatch(addEditCommentMenuInfo(activity));
    await dispatch(openEditCommentMenu());
  };
};

export const initCloseSubMenu = () => {
  return async (dispatch: any) => {
    dispatch(closeSubMenu());
  };
};

export const initOpenMemoInfo = (memo: IMemoInfoType | any) => {
  return async (dispatch: any) => {
    await dispatch(addMemoInfo(memo));
    await dispatch(openMemoInfo());
  };
};

export const initCloseMemoInfo = () => {
  return async (dispatch: any) => {
    dispatch(closeMemoInfo());
  };
};

export const changeColumn = (id: string) => {
  return async (dispatch: any, getstate: GetRootState) => {
    const currentColumn = getColumns(getstate());
    const newColumns = currentColumn.map(element => {
      const newElement = { ...element };
      if (element.id === id) {
        newElement.visible = !newElement.visible;
      }
      return newElement;
    });
    dispatch(changeColumnVisibilyty(newColumns));
  };
};

export const changeColumnValue = (changedColumn: IPossibleColumns) => {
  return async (dispatch: any, getstate: GetRootState) => {
    const currentColumn = getColumns(getstate());
    const newColumns = currentColumn.map(element =>
      element.id !== changedColumn.id ? { ...element } : { ...changedColumn },
    );
    dispatch(changeColumnVisibilyty(newColumns));
  };
};

export const actionChangeColumnMenuState = (view: boolean) => {
  return async (dispatch: any) => {
    await dispatch(changeColumnMenuVisibility(view));
  };
};
export const actionChangeViewMenuState = (view: boolean) => {
  return async (dispatch: any) => {
    await dispatch(changeViewMenuVisibility(view));
  };
};
export const actionchangeViewSortType = (view: string) => {
  return async (dispatch: any) => {
    await dispatch(changeViewSortType(view));
  };
};

export const actionChangeTimeFormat = (view: string) => {
  return async (dispatch: any) => {
    await dispatch(changeTimeFormat(view));
  };
};

export const runConfirmCalback = () => {
  return async (dispatch: any, getstate: any) => {
    const confirmObject = getConfirmPopUp(getstate());
    confirmObject.onConfirm();
  };
};

export const validateAndSaveAgentDay = createAsyncThunk(
  ActionTypes.SAVE_AGENT_DAY,
  async (
    {
      agents,
      checkTimestamp = true,
      reviewWarningsType = 'short',
      refreshSchedule = true,
      allOrNothing = false,
    }: {
      agents: IAgentTimeline[];
      ignoreWarnings?: boolean;
      checkTimestamp?: boolean;
      refreshSchedule?: boolean;
      allOrNothing?: boolean;
      reviewWarningsType: ReviewWarningsType;
    },
    { rejectWithValue, dispatch },
  ) => {
    const agentDays = SchAgent.prepareAgentsForSave(agents, false);
    let validationResponse = [];
    let validationSuccess = false;
    if (agentDays.length) {
      validationResponse = await restApi
        .validateAgentDayUseChunk({ agentDays })
        .then(res => {
          //@ts-ignore
          if (res.data.data.success) {
            validationSuccess = true;
          }
          //@ts-ignore
          const saveAgents = SchAgent.collectAgentWarnings(agents, res.data.errors.validations);
          validationSuccess = saveAgents.filter(a => a.warnings).length === 0;
          if (validationSuccess) {
            return [];
          }
          return saveAgents;
        })
        .catch(err => {
          const error: { data: any[]; name: string; message: string } = {
            name: 'Validate Agent Day error',
            message: err.response?.statusText,
            data: err.response?.data?.status?.details,
          };
          return <any>rejectWithValue(error);
        });
    }
    dispatch(setWarningsType(reviewWarningsType));
    // data in response even if we have errored agents.
    // but in case partial success we dont have all agents
    // even so, we send all agents to saveAgentDay
    // but action saveAgentDay will save only agents that we have in response
    //@ts-ignore
    if (validationSuccess) {
      await dispatch(
        saveAgentDay({
          agents,
          ignoreWarnings: true,
          checkTimestamp,
          reviewWarningsType,
          refreshSchedule,
          allOrNothing,
        }),
      );
    }

    return {
      validationResponse,
      agents,
    };
  },
);

export const saveAgentDay = createAsyncThunk(
  ActionTypes.SAVE_AGENT_DAY,
  async (
    {
      agents,
      ignoreWarnings = false,
      checkTimestamp = true,
      reviewWarningsType = 'short',
      refreshSchedule = true,
      allOrNothing = false,
    }: {
      agents: IAgentTimeline[];
      ignoreWarnings?: boolean;
      checkTimestamp?: boolean;
      refreshSchedule?: boolean;
      allOrNothing?: boolean;
      reviewWarningsType: ReviewWarningsType;
    },
    { rejectWithValue, dispatch },
  ) => {
    const deleteNullDates = async (datesAgentsIdForDelete: ISchDayDatesAgentIds) =>
      Promise.all(
        Object.keys(datesAgentsIdForDelete).map(date =>
          restApi.deleteAgentDay({
            startDateTime: date,
            endDateTime: date,
            agentFilter: {
              agentId: datesAgentsIdForDelete[date],
            },
          }),
        ),
      );

    if (agents.length === 0) {
      logger.debug(`${ActionTypes.SAVE_AGENT_DAY}, payload is empty, payload: ${JSON.stringify(agents)}`);
      refreshSchedule && (await dispatch(refreshAgentsSchedule(true, false, false, false)));
      return null;
    }
    const agentDays = SchAgent.prepareAgentsForSave(agents, true);
    const datesAgentsIdForDelete = SchDay.collectPreparedDatesAgentIdNull(SchAgent.prepareAgentsForSave(agents, false));

    let saveResponse: any = { data: { success: true } };
    await deleteNullDates(datesAgentsIdForDelete);
    if (agentDays.length) {
      saveResponse = await restApi
        .saveAgentDayUseChunk({ agentDays, ignoreWarnings, checkTimestamp, allOrNothing, refreshSchedule })
        .then(res => res?.data)
        .catch(err => {
          const error: { data: any[]; name: string; message: string } = {
            name: 'Save Agent Day error',
            message: err.response.statusText,
            data: err.response.data.status.details, // serializable
          };
          return <any>rejectWithValue(error);
        });
    }

    // clear undo/redo history
    // dispatch(changeStoreByHistory('redo'));

    dispatch(setWarningsType(reviewWarningsType));
    if (refreshSchedule && saveResponse?.data?.success) {
      await dispatch(refreshAgentsSchedule(true, false, false, false));
      await dispatch(runConfirmCalback());
    }
    if (saveResponse?.data?.success) {
      await dispatch(changeChartStoreByHistory('reset'));
    }

    return {
      validationResponse: saveResponse,
      agents,
    };
  },
);

export const changeStoreByHistory: PayloadActionCreator<'undo' | 'redo', ActionTypes.CHANGE_STORE_BY_HISTORY> =
  createAction(ActionTypes.CHANGE_STORE_BY_HISTORY);

export const setSaveWarnings: PayloadActionCreator<IAgentSchedule[], ActionTypes.SET_SAVE_WARNINGS> = createAction(
  ActionTypes.SET_SAVE_WARNINGS,
);

export const copyActivities: PayloadActionCreator<ISelectedActivity[], ActionTypes.COPY_ACTIVITIES> = createAction(
  ActionTypes.COPY_ACTIVITIES,
);

export const toggleInsertWorkSetPopup = createAction(ActionTypes.TOGGLE_INSERT_WORK_SET);

export const toggleInsertMarkedTimePopup = createAction(ActionTypes.TOGGLE_INSERT_MARKED_TIME);

export const toggleInsertActivitySetPopup = createAction(ActionTypes.TOGGLE_INSERT_ACTIVITY_SET);

export const toggleSetActivitiesForPopup: PayloadActionCreator<
  SetActivitiesFor,
  ActionTypes.TOGGLE_SET_ACTIVITIES_FOR
> = createAction(ActionTypes.TOGGLE_SET_ACTIVITIES_FOR);

export const setWarningsType: PayloadActionCreator<ReviewWarningsType, ActionTypes.SET_REVIEW_WARNINGS_TYPE> =
  createAction(ActionTypes.SET_REVIEW_WARNINGS_TYPE);

export const pasteStateActivity = (pasteStartTime: number | null, isOffsetState = true) => {
  return async (dispatch: Dispatch, getState: GetRootState) => {
    dispatch(toggleLoader(true));
    try {
      const { elements, elementsType, stateType } = getBuffer(getState());
      let warnings: string[] = [];

      if (elements === null) return;

      const element = elements[0].activity;
      const timeLine = elements[0].timeLine;
      if (elementsType !== BufferElementsType.STATE || typeof element.stateIndex !== 'number') return;
      const state = timeLine.days[element.dayIndex].states[element.stateIndex];
      if (state === null) {
        await dispatch(clearBuffer);
        return dispatch(clearTargetInfo);
      }
      const agentTimeLines = getDataSelector(getState());
      const selectedActivities = getSelectedActivitySelector(getState());

      const agents = SchSelectedActivity.collectAgentDaysByActivities(agentTimeLines, selectedActivities);
      const payload: buildAgentDayInSnapshotData = {
        agentDays: undefined,
        modifiedAgentDays: undefined,
        states: undefined,
      };

      //send request to insert work set or activity set
      if (SchSelectedActivity.isWorkSet(element) || SchSelectedActivity.isActivitySet(element)) {
        const agent = agents[0];
        const { newState } = SchAgent.pasteStateInAgents(
          agents,
          state,
          element.shiftStart,
          pasteStartTime,
          isOffsetState,
        );
        const startDateTime = DateUtils.convertToIsoWithoutTz(newState.startDateTime);
        const startShift = DateUtils.convertToIsoWithoutTz(agent.days[0].startDateTime);
        const date = DateUtils.getMidnight(startShift);
        payload.agentDays = SchAgent.makeDaysModified(agents);
        const _state: ISchWorkState = {
          agentId: agents[0].agentId,
          activities: element.activities.map(a => a.id),
          date,
          startDateTime,
          endDateTime: DateUtils.convertToIsoWithoutTz(newState.endDateTime),
          siteId: agents[0].siteId,
        };
        payload.states = [_state];
      } else {
        const pastedState = SchAgent.pasteStateInAgents(
          agents,
          state,
          element.shiftStart,
          pasteStartTime,
          isOffsetState,
        );
        warnings = pastedState.warnings;
        payload.modifiedAgentDays = pastedState.updatedAgents;
      }
      const { errors } = await SchAgent.checkCopiedAgentDays(
        payload.agentDays || payload.modifiedAgentDays || [],
        stateType,
        element,
        false,
      );
      if (errors.length) {
        return dispatch(
          openErrorPopUp({
            isOpen: true,
            data: errors.join('\n'),
          }),
        );
      }
      dispatch(clearTargetInfo);
      if (warnings.length) {
        return dispatch(
          openWarningPopUp({
            isOpen: true,
            data: warnings.map(m => `${m}`).join('\n'),
            agents: payload.modifiedAgentDays,
          }),
        );
      }
      // @ts-ignore
      return dispatch(buildAgentDayInSnapshot(payload));
    } finally {
      dispatch(toggleLoader(false));
    }
  };
};

export const pasteShiftActivity = (pasteStartTime: number | null, isOffsetDay = true) => {
  return async (dispatch: Dispatch, getState: GetRootState) => {
    dispatch(toggleLoader(true));
    try {
      const { elements, elementsType, stateType } = getBuffer(getState());
      if (elements === null) return;
      if (elementsType !== BufferElementsType.SHIFT_OR_WORK_SET) return;
      if (elements.some(e => isNil(e.activity.dayIndex))) return;

      const timeLines = getDataSelector(getState());
      const selectAgent = getSelectedAgentsMulti(getState());
      if (!selectAgent[0]) return;
      const selectAgentIndex = timeLines.findIndex(timeLine => timeLine.agentId === selectAgent[0].agentId);
      if (selectAgentIndex === -1) return;

      const sortedElements = [...elements].sort((e0, e1) => e0.index - e1.index);
      const indexOffset = selectAgentIndex - sortedElements[0].index;

      let agentDays: IAgentTimeline[] = elements.reduce((acc: IAgentTimeline[], element) => {
        const agentDayTimeline = element.timeLine.days[element.activity.dayIndex] ?? null;
        if (!agentDayTimeline || element.index + indexOffset > timeLines.length - 1) return acc;
        let _pasteStartTime;

        const initAgentTimeLine = timeLines[element.index + indexOffset];
        const durationMore24H = +element.activity.end - element.activity.start >= 24 * 60 * 60000;
        if (
          pasteStartTime &&
          (element.activity.type === SCH_STATE_TYPE[SchStateType.TIME_OFF] ||
            element.activity.type === SCH_STATE_TYPE[SchStateType.EXCEPTION] ||
            element.activity.type === SCH_STATE_TYPE[SchStateType.DAY_OFF]) &&
          durationMore24H
        ) {
          const offset = DateUtils.getTZOffsetMs(
            initAgentTimeLine._TZ_INTERNAL_USAGE.tzSelected,
            initAgentTimeLine._TZ_INTERNAL_USAGE.tzSite,
          );
          const sitePasteTime = pasteStartTime - offset;
          const midNightLocal = DateUtilsTimeZone.getUTCTime(DateUtils.getMidnight(sitePasteTime));

          _pasteStartTime = midNightLocal + offset;
        } else {
          _pasteStartTime = pasteStartTime
            ? pasteStartTime + (element.activity.shiftStart - sortedElements[0].activity.shiftStart)
            : null;
        }

        const { _TZ_INTERNAL_USAGE } = initAgentTimeLine;
        const payload = SchAgent.pasteShiftInAgents([initAgentTimeLine], agentDayTimeline, _pasteStartTime, {
          isOffsetDay,
          isBuild: true,
          needMerge: true,
        })[0];

        return [...acc, { ...payload, _TZ_INTERNAL_USAGE }];
      }, []);

      const item = elements[0].activity;
      const { agentDays: result, errors } = await SchAgent.checkCopiedAgentDays(agentDays, stateType, item, true);
      if (errors.length) {
        return dispatch(
          openErrorPopUp({
            isOpen: true,
            data: errors.join('\n'),
          }),
        );
      }
      agentDays = result;
      if (agentDays.length) {
        //@ts-ignore
        return dispatch(buildAgentDayInSnapshot({ agentDays }, false, false, true));
      } else {
        return [];
      }
    } finally {
      dispatch(toggleLoader(false));
    }
  };
};

export const shiftCopyToActivity = (
  agentFilter: ISelected,
  selectedAgents: IAgentTimeline[] = [],
  dates: number[] = [],
  isIncludedStates = true,
) => {
  return async (dispatch: Dispatch, getState: GetRootState) => {
    dispatch(toggleLoader(true));
    try {
      if (!selectedAgents.length || !dates.length) return;
      const { elements, elementsType } = getBuffer(getState());
      const selectedDate = getActiveDateSelector(getState());
      if (elements === null) return;
      if (elementsType !== BufferElementsType.SHIFT_OR_WORK_SET) return;

      const isMultiply = elements.length !== 1;
      const agentDays: IAgentSchedule[] = [];
      elements.forEach(e => {
        const agentTimeLine = e.timeLine;
        const element = e.activity;
        const agentDayTimeline = clone(agentTimeLine.days[element.dayIndex]) ?? null;

        const shiftStartDateTime = Utils.getParsedNum(
          agentDayTimeline.dayState?.startDateTime ?? agentDayTimeline.startDateTime,
        );
        const shiftEndDateTime = Utils.getParsedNum(
          agentDayTimeline.dayState?.endDateTime ?? agentDayTimeline.endDateTime,
        );

        if (!isIncludedStates) {
          agentDayTimeline.states = agentDayTimeline.states.filter(
            s => s.startDateTime === shiftStartDateTime && s.endDateTime === shiftEndDateTime,
          );
        }
        const convertedStartDateTime = DateUtils.convertAccordingToTz(
          shiftStartDateTime,
          agentTimeLine._TZ_INTERNAL_USAGE.tzSite,
          agentTimeLine._TZ_INTERNAL_USAGE.tzSelected,
        );

        const date = new Date(`${selectedDate}T00:00Z`).getTime();
        const dayOffset = new Date(`${convertedStartDateTime}`).getTime() - date;

        const agentsDays = dates.reduce((acc: IAgentTimeline[], date) => {
          const _selectedAgents = isMultiply
            ? selectedAgents.filter(a => a.agentId === element.agentId)
            : selectedAgents;
          return SchAgent.pasteShiftInAgents(_selectedAgents, agentDayTimeline, date + dayOffset, {
            needMerge: false,
            isBuild: true,
          }).map((agent: IAgentTimeline, idx) =>
            acc[idx] ? { ...acc[idx], ...agent, days: acc[idx].days.concat(agent.days) } : { ...agent },
          );
        }, []);
        const preparedAgent = SchAgent.prepareAgentsForCopy(agentsDays);
        agentDays.push(...preparedAgent);
      });

      return agentDays;
    } finally {
      dispatch(toggleLoader(false));
    }
  };
};

export const clearBuffer: PayloadActionCreator<undefined, ActionTypes.CLEAR_BUFFER> = createAction(
  ActionTypes.CLEAR_BUFFER,
);

export const clearTargetInfo: PayloadActionCreator<undefined, ActionTypes.CLEAR_TARGET_INFO> = createAction(
  ActionTypes.CLEAR_TARGET_INFO,
);

export const selectShiftBySelectedActivity: PayloadActionCreator<
  undefined,
  ActionTypes.SELECT_SHIFT_BY_SELECTED_ACTIVITY
> = createAction(ActionTypes.SELECT_SHIFT_BY_SELECTED_ACTIVITY);

// build agent day
export const buildAgentDay = (
  data: IAgentTimeline[],
  scheduleShiftItems = false,
  isSaveSelected = false,
  refreshTimeline = true,
  dataInit?: IAgentTimeline[],
) => {
  return async (dispatch: Dispatch, getState: GetRootState) => {
    const performance = Utils.getFuncPerformance('buildAgentDay');
    dispatch(toggleLoader(true));
    const existingAgents = [...getDataSelector(getState())];
    const date = getActiveDateSelector(getState());
    const filterData = getFilterData(getState());
    const allTimezones = getTimezonesHashSelector(getState());
    const selectedTimezone = getSelectedTzSelector(getState());
    const newSelectedActivity = await SchUtils.linearizePotentialActivities(data, date);
    const agentDays = SchAgent.prepareAgentsForBuild(data);

    try {
      const buildAgentDayResponse = await restApi.buildAgentDay({
        agentDays,
        scheduleShiftItems: scheduleShiftItems,
      });
      if (!refreshTimeline)
        return SchAgent.mergeAgentDays(dataInit ?? [], (buildAgentDayResponse.data ?? []) as IAgentTimeline[]);

      if (!buildAgentDayResponse || !buildAgentDayResponse.data) {
        performance();
        return;
      }

      let newData = SchAgent.mergeAgentDays(
        existingAgents,
        // buildAgentDayResponse.data,
        SchAgent.prepareIfFullDayTimeOff(existingAgents, buildAgentDayResponse.data),
      );
      newData = await SchUtils.prepareDataForTimeline(clone(newData), date, filterData, allTimezones, selectedTimezone);
      const agentsForChart = SchAgent.prepareAgentForPerformance(newData);
      // @ts-ignore
      dispatch(addChartDataAction(true, agentsForChart));
      // dispatch(setIsModified(true));
      dispatch(
        setDataToStore({ agents: newData, isSaveToHistory: true, isModified: true, isSaveSelected, currentDate: date }),
      );
      dispatch(setSelectedActivity(newSelectedActivity));
      performance();

      return newData as IAgentTimeline[];
    } catch (err: any) {
      throw {
        name: 'Build Agent Day error',
        message: err.response.statusText,
        data: err.response.data.status.details,
      };
    } finally {
      dispatch(toggleLoader(false));
    }
  };
};

/**
 *  build agent day in snapshot
 * @param {Object} data
 *  agentDays: build with request,
 *  modifiedAgentDays: build without request,
 *  states: insert new states
 *  @param {boolean} ignoreWarnings  ignore ui warnings
 * @param {boolean} scheduleShiftItems  scheduleShiftItems
 * @param {boolean} isSaveSelected  isSaveSelected
 * @param {boolean} refreshTimeline  refreshTimeline
 * @param {Object} dataInit
 * @param {boolean} clearIsModify
 * @returns {Array} - mergedAgents
 */
export const buildAgentDayInSnapshot = (
  data: buildAgentDayInSnapshotData,
  scheduleShiftItems = false,
  isSaveSelected = false,
  refreshTimeline = true,
  ignoreWarnings = true,
  dataInit?: IAgentTimeline[],
  clearIsModify?: boolean,
) => {
  return async (dispatch: any, getState: GetRootState) => {
    dispatch(toggleLoader(true));
    dispatch(toggleChartLoader(true));
    let newSelectedActivity: any[];
    const existingAgents = [...getDataSelector(getState())];
    const modifiedAgentDays = getModifiedAgentDays(getState());
    const filterData = getFilterData(getState());
    const allTimezones = getTimezonesHashSelector(getState());
    const selectedTimezone = getSelectedTzSelector(getState());
    const date = getActiveDateSelector(getState());

    let agents: IAgentSchedule[] = [];

    if (data.modifiedAgentDays) {
      agents = SchAgent.getAgentDaysForBuild(data.modifiedAgentDays); // modified agents
      newSelectedActivity = await SchUtils.linearizePotentialActivities(data.modifiedAgentDays, date);
    } else if (data.agentDays) {
      newSelectedActivity = await SchUtils.linearizePotentialActivities(data.agentDays, date);
      const agentDays = SchAgent.prepareAgentsForBuild(data.agentDays);
      //const snapshotId = getLastId(getState());

      const buildAgentDayResponse = await restApi.buildAgentDayUseChunk({
        //snapshotId,
        agentDays,
        states: data.states,
        modifiedAgentDays: SchAgent.prepareAgentsForBuild(modifiedAgentDays ?? []),
        scheduleShiftItems: scheduleShiftItems,
        timezoneId: !isNil(data.timezoneId) ? data.timezoneId : selectedTimezone.timezoneId,
      });
      if (!buildAgentDayResponse || !buildAgentDayResponse?.data) return;
      // todo: hotfix
      let buildAgentDayResponseData = SchAgent.dayOffDataTimesInSelectTz(
        buildAgentDayResponse.data,
        existingAgents,
        DayType.DAY_OFF,
      );
      buildAgentDayResponseData = SchAgent.dayOffDataTimesInSelectTz(
        buildAgentDayResponseData,
        existingAgents,
        DayType.EXCEPTION,
      );
      buildAgentDayResponseData = SchAgent.fixTimeOffResponseInZeroTime(data.agentDays, buildAgentDayResponseData);
      agents = SchAgent.filterBuildInSnapshotByRequestedDate(data.agentDays, buildAgentDayResponseData);
    }

    if (!refreshTimeline) {
      dispatch(toggleLoader(false));
      return SchAgent.mergeAgentDays(dataInit ?? [], (agents ?? []) as IAgentTimeline[], true);
    }
    const clearAgents = SchAgent.clearAgentsFromTempFields(agents);
    let mergedAgents;

    // show warnings if exist
    const onConfirm = async (isIgnoreWarnings: boolean) => {
      mergedAgents = SchAgent.mergeAgentDays(existingAgents, clearAgents as IAgentTimeline[], isIgnoreWarnings);
      if (clearIsModify) {
        mergedAgents = SchAgent.clearIsModified(mergedAgents, clearAgents);
      }
      mergedAgents = await SchUtils.prepareDataForTimeline(
        mergedAgents,
        date,
        filterData,
        allTimezones,
        selectedTimezone,
      );

      dispatch(
        setDataToStore({
          agents: mergedAgents,
          isSaveToHistory: true,
          isModified: mergedAgents.some(a => a.isModified),
          isSaveSelected,
          currentDate: date,
        }),
      );
      if (!data.disablePerformanceData) {
        const agentsForChart = SchAgent.prepareAgentForPerformance(mergedAgents as IAgentTimeline[]);
        // @ts-ignore
        dispatch(addChartDataAction(false, agentsForChart));
      }
      if (data.modifiedAgentDays) {
        newSelectedActivity = SchUtils.updateActivitiesToDate(newSelectedActivity, mergedAgents);
      }
      dispatch(setSelectedActivity(newSelectedActivity ?? []));
      return mergedAgents as IAgentTimeline[];
    };

    try {
      await onConfirm(ignoreWarnings);
      return mergedAgents;
    } catch (e: any) {
      const message = e.message;
      if (!Object.values(SchDay.warnings).includes(message)) throw new Error(message);
      dispatch(
        setConfirmPopupData({
          isOpen: true,
          onConfirm: async () => {
            await onConfirm(true);
          },
          onDiscard: () => {
            dispatch(toggleLoader(false));
            dispatch(toggleChartLoader(false));
            dispatch(
              setDataToStore({ agents: existingAgents, isMerge: false, isSaveToHistory: false, isSaveSelected: true }),
            );
          },
          onClose: () => {
            dispatch(toggleLoader(false));
            dispatch(toggleChartLoader(false));
            dispatch(
              setDataToStore({ agents: existingAgents, isMerge: false, isSaveToHistory: false, isSaveSelected: true }),
            );
          },
          title: 'Warning',
          text: message,
        }),
      );
      return mergedAgents;
    }
  };
};

export const insertAgentDayAction = (data: any, repeatRequest: boolean) => {
  return async (dispatch: any) => {
    dispatch(toggleLoader(true));
    try {
      const insertAgentDayResponse = await restApi.insertAgentDayUseChunk(data).then(res => res?.data);
      if (repeatRequest) {
        await dispatch(getAgentsSchedule());
      } else {
        dispatch(toggleLoader(false));
      }
      return insertAgentDayResponse;
    } catch (e: any) {
      const exceptionParams: IErrorPopUpParam = {
        isOpen: true,
        data: pathOr(e.message, ['response', 'data', 'status', 'details'], e).join('\n'),
      };
      dispatch(openErrorPopUp(exceptionParams));
      dispatch(toggleLoader(false));
    }
  };
};

export const insertStateAction = (data: any, repeatRequest: boolean) => {
  return async (dispatch: any) => {
    dispatch(toggleLoader(true));

    try {
      await restApi.insertState(data);
      if (repeatRequest) {
        await dispatch(getAgentsSchedule());
      } else {
        dispatch(toggleLoader(false));
      }
    } catch (e: any) {
      const exceptionParams: IErrorPopUpParam = {
        isOpen: true,
        data: e.response.data.status.details.join('\n'),
      };
      dispatch(openErrorPopUp(exceptionParams));
      dispatch(toggleLoader(false));
    }
  };
};

export const toggleLoader = (data: boolean) => ({
  type: ActionTypes.LOADING,
  payload: data,
});

export const setSelectedActivity = (data: any) => ({
  type: ActionTypes.SET_SELECTED_ACTIVITY,
  payload: data,
});

export const setIsModified = (data: any) => ({
  type: ActionTypes.SET_IS_MODIFIED,
  payload: data,
});

//TODO 1. modify to one action toggleMenu(payload: boolean)
export const openMenu = () => ({
  type: ActionTypes.OPEN_MENU,
});
export const openEditFullDayItem = () => ({
  type: ActionTypes.OPEN_EDIT_FULL_DAY_ITEM,
});
export const closeEditFullDayItem = () => ({
  type: ActionTypes.CLOSE_EDIT_FULL_DAY_ITEM,
});
export const openEditCommentMenu = () => ({
  type: ActionTypes.OPEN_EDIT_COMMENT_MENU,
});
export const closeEditCommentMenu = () => ({
  type: ActionTypes.CLOSE_EDIT_COMMENT_MENU,
});
//TODO 2.
export const closeMenu = () => ({
  type: ActionTypes.CLOSE_MENU,
});

export const changeCalendarVisibility = (data: boolean) => ({
  type: ActionTypes.CHANGE_CALENDAR_VISIBILITY,
  payload: data,
});
export const changeMeetingListVisible = (data: boolean) => ({
  type: ActionTypes.SET_SCHEDULER_LIST_OPEN,
  payload: data,
});
export const changeMeetingCalendarVisible = (data: boolean) => ({
  type: ActionTypes.SET_SCHEDULER_CALENDAR_OPEN,
  payload: data,
});

export const changeSwitchToClassicVisibility = (data: boolean) => ({
  type: ActionTypes.CHANGE_ACCOUNT_VISIBILITY,
  payload: data,
});
export const openSaveConfirm = (payload: {
  onConfirm?: () => void;
  onDiscard?: () => void;
  onClose?: () => void;
  onResult?: (result: 'save' | 'discard' | 'close') => void;
}) => {
  return {
    type: ActionTypes.OPEN_CONFIRMATION,
    payload,
  };
};
export const setDefaultConfirmState = () => ({
  type: ActionTypes.SET_DEFAULT_CONFIRMATION,
});
export const closeSaveConfirm = () => ({
  type: ActionTypes.CLOSE_CONFIRMATION,
});

export const closeModifiedWarning = () => ({
  type: ActionTypes.CLOSE_MODIFIED_POPUP,
});

export const closeAllMenu = () => ({
  type: ActionTypes.CLOSE_ALL_MENU,
});
export const changeDisplaySettingsVisibility = (data: boolean) => ({
  type: ActionTypes.CHANGE_DISPLAY_SETTINGS_VISIBILITY,
  payload: data,
});

export const changeSearchSettingsVisibility = (data: boolean) => ({
  type: ActionTypes.CHANGE_SEARCH_SETTINGS_VISIBILITY,
  payload: data,
});

export const closeAllPopups = () => ({
  type: ActionTypes.CLOSE_ALL_POPUPS,
});

export const openSubMenu = () => ({
  type: ActionTypes.OPEN_SUB_MENU,
});

export const closeSubMenu = () => ({
  type: ActionTypes.CLOSE_SUB_MENU,
});

export const addSubMenuInfo = (data: ISubMenuType) => ({
  type: ActionTypes.ADD_SUB_MENU_DATA,
  payload: data,
});

export const addMemoInfo = (data: IMemoInfoType) => ({
  type: ActionTypes.ADD_MEMO_INFO_DATA,
  payload: data,
});

export const openMemoInfo = () => ({
  type: ActionTypes.OPEN_MEMO_INFO,
});

export const closeMemoInfo = () => ({
  type: ActionTypes.CLOSE_MEMO_INFO,
});

export const addEditCommentMenuInfo = (data: IEditCommentMenu) => ({
  type: ActionTypes.ADD_EDIT_COMMENT_MENU_DATA,
  payload: data,
});

export const changeColumnVisibilyty = (data: IPossibleColumns[]) => ({
  type: ActionTypes.CHANGE_COLUMNS,
  payload: data,
});

export const setDataToStore: (data: {
  agents: IAgentTimeline[];
  isModified?: boolean;
  isMerge?: boolean;
  isSaveToHistory?: boolean;
  isSaveSelected?: boolean;
  updateAgents?: boolean;
  clearHistory?: boolean;
  currentDate?: string;
  isSaveModified?: boolean;
}) => AnyAction = createAction(ActionTypes.SET_DATA);

export const changeColumnMenuVisibility = (data: boolean) => ({
  type: ActionTypes.SHOW_COLUMNS_MENU,
  payload: data,
});

export const changeViewMenuVisibility = (data: boolean) => ({
  type: ActionTypes.SHOW_VIEW_MENU,
  payload: data,
});

export const changeViewSortType = (data: string) => ({
  type: ActionTypes.SET_VIEW_SORT_TYPE,
  payload: data,
});

export const changeTimeFormat = (data: string) => ({
  type: ActionTypes.SET_TIME_FORMAT,
  payload: data,
});

export const changeTargetMenuVisibility = (data: boolean) => ({
  type: ActionTypes.TARGET_MENU_OPEN,
  payload: data,
});

export const findBreaks = createAsyncThunk(ActionTypes.FIND_BREAKS, async (payload: any) => {
  return await restApi.findBreaks(payload);
});

export const findMeals = createAsyncThunk(ActionTypes.FIND_MEALS, async (payload: any) => {
  return await restApi.findMeals(payload);
});

export const findShifts = createAsyncThunk(ActionTypes.FIND_SHIFTS, async (payload: any) => {
  return await restApi.getAgentShifts(payload);
});

export const setShifts = (data: any) => ({
  type: ActionTypes.SET_SHIFTS,
  payload: data,
});

export const setBreaks = (data: any) => ({
  type: ActionTypes.SET_BREAKS,
  payload: data,
});

export const setMeals = (data: any) => ({
  type: ActionTypes.SET_MEALS,
  payload: data,
});

export const findExceptions = createAsyncThunk(ActionTypes.FIND_EXCEPTIONS, async (payload: any) => {
  return await restApi.findExceptions(payload);
});

export const findTimeOffs = createAsyncThunk(ActionTypes.FIND_TIME_OFFS, async (payload: any) => {
  return await restApi.findTimeOffs(payload);
});

export const findAuditLog = createAsyncThunk(ActionTypes.FIND_AUDIT_LOG, async (payload: any) => {
  return await restApi.getAuditLog(payload);
});

export const rollbackSchedule = createAsyncThunk(ActionTypes.ROLLBACK_SCHEDULE, async (payload: any, { dispatch }) => {
  const result = await restApi.rollbackSchedule(payload);
  dispatch(refreshAgentsSchedule(true, false, true));
  return result;
});

export const setExceptions = (data: any) => ({
  type: ActionTypes.SET_EXCEPTIONS,
  payload: data,
});

export const setTimeOffs = (data: any) => ({
  type: ActionTypes.SET_TIME_OFFS,
  payload: data,
});

export const setAuditLog = (data: any) => ({
  type: ActionTypes.SET_AUDIT_LOG,
  payload: data,
});

export const changeTzMenuVisibility = (data: boolean) => ({
  type: ActionTypes.SHOW_TZ_MENU,
  payload: data,
});

export const changeTextCoefficient = (data: number) => ({
  type: ActionTypes.SET_TEXT_COEFFICIENT,
  payload: data,
});

export const openNewShiftbMenu = () => ({
  type: ActionTypes.OPEN_NEW_SHIFT_MENU,
});

export const closeNewShiftbMenu = () => ({
  type: ActionTypes.CLOSE_NEW_SHIFT_MENU,
});

export const openInsertBreakMenu = () => ({
  type: ActionTypes.OPEN_INSERT_BREAK_MENU,
});

export const closeInsertBreakMenu = () => ({
  type: ActionTypes.CLOSE_INSERT_BREAK_MENU,
});

export const openDeleteMenu = () => ({
  type: ActionTypes.OPEN_DELETE_MENU,
});

export const closeDeleteMenu = () => ({
  type: ActionTypes.CLOSE_DELETE_MENU,
});

export const openCleanupMenu = () => ({
  type: ActionTypes.OPEN_CLEANUP_MENU,
});

export const closeCleanupMenu = () => ({
  type: ActionTypes.CLOSE_CLEANUP_MENU,
});

export const openInsertMealMenu = () => ({
  type: ActionTypes.OPEN_INSERT_MEAL_MENU,
});

export const closeInsertMealMenu = () => ({
  type: ActionTypes.CLOSE_INSERT_MEAL_MENU,
});

export const toggleTimelineOption = (key: string) => ({
  type: ActionTypes.TOGGLE_TIME_LINE_OPTION,
  payload: key,
});

export const getCalculatedScheduleShifts = (scheduleCalculatedConf: ICalculatedSchedule | null = null) => {
  return async (dispatch: any, getState: GetRootState) => {
    const agentTimeLines: IAgentTimeline[] = getDataSelector(getState());
    const currentDate = getActiveDateSelector(getState());
    const existingScheduleCalc = scheduleCalculatedSelector(getState());
    const scheduleForecast = existingScheduleCalc.forecast;
    const overtimeConf = existingScheduleCalc.control;
    const scheduleCalculatedPrev = scheduleCalculatedSelector(getState());

    const shifts =
      scheduleCalculatedConf?.shifts ?? (scheduleCalculatedPrev.shifts ? [...scheduleCalculatedPrev.shifts] : []);
    const meals =
      scheduleCalculatedConf?.meals ?? (scheduleCalculatedPrev.meals ? [...scheduleCalculatedPrev.meals] : []);
    const breaks =
      scheduleCalculatedConf?.breaks ?? (scheduleCalculatedPrev.breaks ? [...scheduleCalculatedPrev.breaks] : []);

    await dispatch(
      setCalculatedSchedule({
        ...scheduleCalculatedPrev,
        shifts,
        meals,
        breaks,
        forecast: scheduleForecast,
        isCalculated: false,
        isRecalculation: true,
        data: {
          coverage: existingScheduleCalc.data.coverage,
          shifts: [],
        },
        control: overtimeConf,
      }),
    );
    const payload: ICalcSchedule = {
      currentDate: new Date(currentDate).getTime(),
      dayDate: currentDate,
      forecast: scheduleForecast,
      granularity: 15,
      shifts,
      meals,
      breaks,
      agents: agentTimeLines,
      overtimeAgents: overtimeConf?.agents ?? [],
      agentIdsSmaller: overtimeConf?.agentIdsSmaller ?? [],
      agentIdsLarger: overtimeConf?.agentIdsLarger ?? [],
      agentIdsEarlier: overtimeConf?.agentIdsEarlier ?? [],
      agentIdsLater: overtimeConf?.agentIdsLater ?? [],
      isOvertimeEnabled: overtimeConf?.overtimeEnabled ?? false,
      overtimeDaily: (overtimeConf?.overtimeDaily ?? 0) * 60,
      smooth: overtimeConf.coverageSmoothing ?? 0,
      multiply: overtimeConf.coverageMultiply ?? 100,
      midMeal: overtimeConf.mealsPositioning ?? 50,
      midBreak: overtimeConf.breaksPositioning ?? 50,
      agentCountLevel: overtimeConf.agentsCount ?? 100,
    };

    const { data } = await restApi.calcSchedule(payload);
    if (!data.shifts.length) return;

    await dispatch(
      setCalculatedSchedule({
        ...scheduleCalculatedPrev,
        shifts,
        meals,
        breaks,
        agentsTimeline: data.agents,
        forecast: scheduleForecast,
        isCalculated: false,
        isRecalculation: false,
        data,
        control: overtimeConf,
      }),
    );
  };
};

export const setCalculatedSchedule = (param: ICalculatedSchedule) => ({
  type: ActionTypes.SET_CALCULATED_SCHEDULE,
  payload: param,
});

export const setScheduleForecast = (param: number[]) => ({
  type: ActionTypes.SET_SCHEDULE_FORECAST,
  payload: param,
});

export const clearCalculatedSchedule = () => ({
  type: ActionTypes.CLEAR_REBUILD_SCHEDULE,
  payload: {
    forecast: [],
    isCalculated: false,
    isRecalculation: false,
    data: { coverage: [], shifts: [] },
    control: {
      agents: [],
      agentIdsSmaller: [],
      agentIdsLarger: [],
      agentIdsEarlier: [],
      agentIdsLater: [],
      overtimeEnabled: false,
      overtimeDaily: 4,
      coverageSmoothing: 0,
      coverageMultiply: 100,
      mealsPositioning: 50,
      breaksPositioning: 50,
      agentsCount: 100,
    },
  },
});

export const setOpenRebuildSchedule = (param: IRebuildScheduleParam) => ({
  type: ActionTypes.SET_OPEN_REBUILD_SCHEDULE,
  payload: param,
});

export const setOpenBuildSchedule = (param: IBuildScheduleParam) => ({
  type: ActionTypes.SET_OPEN_BUILD_SCHEDULE,
  payload: param,
});

export const setOpenTimeOffMenu = (param: IInsertMenuParam) => ({
  type: ActionTypes.SET_OPEN_INSERT_TIME_OFF_MENU,
  payload: param,
});

export const setOpenEditMultiple = (param: IInsertMenuParam) => ({
  type: ActionTypes.SET_OPEN_EDIT_MULTIPLE,
  payload: param,
});

export const setOpenWorkSetMenu = (isOpen: boolean) => ({
  type: ActionTypes.SET_OPEN_INSERT_WORK_SET_MENU,
  payload: isOpen,
});

export const setOpenInsertExceptionMenu = (param: IInsertMenuParam) => ({
  type: ActionTypes.SET_OPEN_INSERT_EXCEPTION_MENU,
  payload: param,
});

export const setOpenMeetingSchedulerAction = (param: any) => ({
  type: ActionTypes.SET_OPEN_MEETING_SCHEDULER_MENU,
  payload: param,
});

export const setOpenMultipleWizardAction = (param: any) => ({
  type: ActionTypes.SET_OPEN_MULTIPLE_WIZARD,
  payload: param,
});

export const setOpenMultipleWizardMenuAction = (param: boolean) => ({
  type: ActionTypes.SET_OPEN_MULTIPLE_WIZARD_DROPDOWN,
  payload: param,
});

export const setCopyToPopup = (param: ICopyToMenuParam) => ({
  type: ActionTypes.SET_COPY_TO,
  payload: param,
});

export const setOpenMultipleCleanupPopUp = (param: boolean) => ({
  type: ActionTypes.SET_OPEN_MULTIPLE_CLEANUP,
  payload: param,
});

//todo: payload { agent: IAgentTimeline; isSaveToHistory?: boolean }
export const setAgentData: PayloadActionCreator<any, ActionTypes.SET_AGENT_DATA> = createAction(
  ActionTypes.SET_AGENT_DATA,
);

//todo: payload
export const setSaveError: PayloadActionCreator<any, ActionTypes.SET_SAVE_ERROR> = createAction(
  ActionTypes.SET_SAVE_ERROR,
);

export const openErrorPopUp = (param: IErrorPopUpParam) => ({
  type: ActionTypes.OPEN_ERROR_POPUP,
  payload: param,
});

export const openWarningPopUp = (param: IWarningPopUpParam) => ({
  type: ActionTypes.OPEN_WARNING_POPUP,
  payload: param,
});

export const openSuccessPopUp = (param: IErrorPopUpParam) => ({
  type: ActionTypes.OPEN_SUCCESS_POPUP,
  payload: param,
});

export const setOpenScheduleRestore = (isOpen: boolean) => ({
  type: ActionTypes.SET_OPEN_SCHEDULE_RESTORE,
  payload: isOpen,
});

export const selectAgentAction = (data: number | number[]) => ({
  type: ActionTypes.SELECT_AGENT,
  payload: data,
});

export const cleanSelectAgentsAction = () => ({
  type: ActionTypes.CLEAR_SELECT_AGENT,
});

export const addSelectAgentAction = (data: number) => ({
  type: ActionTypes.ADD_SELECT_AGENT,
  payload: data,
});

export const cleanSelectActivities = () => ({
  type: ActionTypes.CLEAR_SELECT_ACTIVITIES,
});

export const setTargetInfo = (data: ITargetInfo | null) => ({
  type: ActionTypes.SET_TARGET_INFO,
  payload: data,
});

export const togleFullDayViewAction = () => ({
  type: ActionTypes.TOGGLE_FULL_DAY_VIEW,
});

export const changeTimeDiscretness = (data: number) => ({
  type: ActionTypes.SET_TIME_DISCRETENESS,
  payload: data,
});

export const togleDelimiterAction = () => ({
  type: ActionTypes.TOGGLE_DELIMITER,
});

export const togleUseCustomColors = () => ({
  type: ActionTypes.TOGGLE_CUSTOM_COLORS,
});

export const multiSelectedCleanupAgentDay = (selectedActivities: ISelectedActivity[]) => {
  return async (dispatch: AppDispatch, getState: GetRootState) => {
    const agentTimeLines = getDataSelector(getState());
    const agentsForCleanup: { [date: string | number]: Set<number> } = {};
    SchSelectedActivity.collectAgentDaysByActivities(agentTimeLines, selectedActivities).map(a => {
      a.days.map(day => {
        if (agentsForCleanup[day.date]) {
          agentsForCleanup[day.date].add(a.agentId);
        } else {
          agentsForCleanup[day.date] = new Set([a.agentId]);
        }
      });
    });
    // Конвертация в объект типа IRemoveAgentDay
    const removeAgentDay: IRemoveAgentDay = {};
    Object.keys(agentsForCleanup).forEach(date => {
      const agentsSet = agentsForCleanup[date];
      removeAgentDay[+date] = Array.from(agentsSet);
    });
    dispatch(cleanupAgentDay(removeAgentDay));
  };
};

/**
 *
 * @param dates [{ date: ['agentId', agentId] }]
 *
 */
export const cleanupAgentDay = (dates: IRemoveAgentDay) => {
  const datesObj: IRemoveAgentDay = {};
  for (const date in dates) {
    const agentIds = dates[date];
    let dateConvertedToTimestamp: any = date;
    let dayMothYear: string;
    if (!isNaN(+date) && typeof +date === 'number') {
      dayMothYear = DateUtils.convertToIsoWithoutTime(+date);
    } else {
      [dayMothYear] = date.split('T');
    }
    dateConvertedToTimestamp = new Date(dayMothYear).getTime();
    datesObj[dateConvertedToTimestamp] = agentIds;
  }

  return async (dispatch: any, getState: GetRootState) => {
    const date = getActiveDateSelector(getState());
    const filterData = getFilterData(getState());
    const allTimezones = getTimezonesHashSelector(getState());
    const selectedTimezone = getSelectedTzSelector(getState());
    const agents = getDataSelector(getState());
    const { updatedAgents } = SchAgent.removeAgentDayByDate(agents, datesObj);
    const timelineAgents = await SchUtils.prepareDataForTimeline(
      updatedAgents,
      date,
      filterData,
      allTimezones,
      selectedTimezone,
    );
    dispatch(
      setDataToStore({
        agents: timelineAgents,
        isMerge: false,
        isSaveToHistory: true,
        isModified: true,
      }),
    );
    const chartAgents = SchAgent.prepareAgentForPerformance(updatedAgents);
    await dispatch(addChartDataAction(true, chartAgents, false));
  };
};

//TODO move to utils, this not action
const isTypeExist = (previouslySelected: ISelectedActivity[], activity: ISelectedActivity) => {
  const typeindex = previouslySelected.findIndex((element: ISelectedActivity) => element.type === activity.type);

  return typeindex !== -1;
};

//TODO move to utils, this not action
const isDuplicateExist = (previouslySelected: ISelectedActivity[], activity: ISelectedActivity) => {
  const typeindex = previouslySelected.findIndex(
    (element: ISelectedActivity) => element.agentId === activity.agentId && element.id === activity.id,
  );

  return typeindex !== -1;
};

export const setSortBy: PayloadActionCreator<ISortBy, ActionTypes.SET_SORT_BY> = createAction(ActionTypes.SET_SORT_BY);

export const setColumnSortBy = (column: IPossibleColumns) => {
  return async (dispatch: any, getstate: GetRootState) => {
    const snapshotId = getLastId(getstate());
    const isSorting = getSortingProcess(getstate());
    if (!snapshotId) return;
    if (isSorting) return;
    const sortBy = getSortBy(getstate());
    let _sortBy: ISortBy = clone(sortBy);

    if (SchUtils.isSortColumnIncludes(sortBy, column)) {
      if (sortBy.order === SORT_ORDER.SORT_ORDER_ASC) {
        _sortBy.order = SORT_ORDER.SORT_ORDER_DESC;
      } else {
        _sortBy = SchUtils.sortColumnRemove(sortBy, column);
        _sortBy.order = SORT_ORDER.SORT_ORDER_ASC;
      }
    } else {
      if (column.sortType === SORT_TYPE.REGULAR) {
        _sortBy.column = column;
        _sortBy.order = SORT_ORDER.SORT_ORDER_ASC;
      } else {
        _sortBy.agentSort = [...(_sortBy.agentSort ?? []), column];
        _sortBy.order = SORT_ORDER.SORT_ORDER_ASC;
      }
    }
    await dispatch(setSortingProcess(true));
    await dispatch(setIsTimeLineDisabled(true))
    await dispatch(setSortBy(_sortBy));
    dispatch(refreshViewSortBy());
  };
};

export const refreshViewSortBy = () => {
  return async (dispatch: any) => {
    await dispatch(refreshAgentsSchedule());
  };
};

// const setSortAgentDaysSnapshot = () => {
//   return async (dispatch: any, getstate: GetRootState) => {
//     const snapshotId = getLastId(getstate());
//     if (!snapshotId) return;
//
//     const date = getActiveDateSelector(getstate());
//     const sortBy = getSortBy(getstate());
//     const payload = SchUtils.createSortPayload(sortBy, snapshotId, date);
//
//     return await restApi.sortAgentDaySnapshot(payload);
//   };
// };

export const restoreTimeLineData = (data: ITimeLineStateSave) => ({
  type: ActionTypes.RESTORE_TIMELINE_SETTINGS,
  payload: data,
});

export const resetTimeLineData = () => ({
  type: ActionTypes.RESET_TIMELINE_DATA,
});
export const setSortingProcess = (data: boolean) => ({
  type: ActionTypes.SET_SORTING_PROCESS,
  payload: data,
});

export const setChartControlData = (data: IControlChartState) => ({
  type: ActionTypes.SET_CHART_CONTROL,
  payload: data,
});

export const scrollToIndex = (data: number) => ({
  type: ActionTypes.SCROLL_TO_INDEX,
  payload: data,
});

export const setIsTimeLineDisabled = (isDisabled: boolean) => ({
  type: ActionTypes.SET_IS_TIMELINE_DISABLED,
  payload: isDisabled,
});
