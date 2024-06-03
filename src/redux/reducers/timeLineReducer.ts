import { omit } from 'ramda';

import { createReducer } from '@reduxjs/toolkit';

import { columnsForTable, initSortBy } from '../../common/constants';
import { SchStateType, WarningTypes } from '../../common/constants/schedule';
import { IControlChartState, ITimeLineStateSave } from '../../common/interfaces/storage';
import DateUtils from '../../helper/dateUtils';
import SchSelectedActivity from '../../helper/schedule/SchSelectedActivity';
import { addGlobalError } from '../actions/globalErrorActions';
import {
  findAuditLog,
  findBreaks,
  findExceptions,
  findMeals,
  findShifts,
  findTimeOffs,
  rollbackSchedule,
  saveAgentDay,
} from '../actions/timeLineAction';
import { ELoginActionTypes } from '../actions/types/loginActionTypes';
import { TimeLineTypes } from '../actions/types/timeLine';
import {
  BufferElementsType,
  IBufferElement,
  ICalculatedSchedule,
  ICopyToMenuParam,
  ISelectedActivity,
  ISortBy,
  ITargetInfo,
  ITimeLine,
  SetActivitiesFor,
} from '../ts/intrefaces/timeLine';
import { IAgentTimeline } from '../ts/intrefaces/timeLine/IAgentTimeline';
import { IHistoryData } from '../ts/intrefaces/timeLine/IHistory';
import { WizardType } from '../ts/intrefaces/timeLine/WizardType';

const initialState: ITimeLine = {
  loading: false,
  selectedAgents: [],
  selectedActivity: [],
  sortType: 'bySite',
  popUpOpen: false,
  editFullDayItemOpen: false,
  confirmPopUp: {
    isOpen: false,
    onConfirm: () => {},
    onClose: () => {},
    onDiscard: () => {},
    onResult: () => {},
  },
  scheduleModifiedPopUp: { isOpen: false },
  history: {
    past: [],
    current: {
      data: [],
      isModified: false,
    },
    future: [],
  },
  sortBy: initSortBy,
  sortingProcess:false,
  breaks: null,
  meals: null,
  shifts: null,
  exceptions: null,
  timeOffs: null,
  auditLog: null,
  targetInfo: null,
  submenuInfo: null,
  submenuOpen: false,
  columns: columnsForTable,
  options: {
    pinColumn: false,
  },
  view: 'table',
  timeFormat: '24hours',
  columnsMenu: false,
  viewMenu: false,
  tzMenu: false,
  textCoefficient: 100,
  newShiftMenuOpen: false,
  insertBreakMenuOpen: false,
  insertMealMenuOpen: false,
  insertExceptionOpen: { isOpen: false, isFullDay: false },
  insertTimeOffOpen: { isOpen: false, isFullDay: false },
  insertWorkSetOpen: false,
  restoreScheduleOpen: false,
  setActivitiesFor: SetActivitiesFor.NONE,
  copyToOpen: { isOpen: false, isVisible: true, selectedActivity: null, isMultiple: false },
  editMultipleOpen: { isOpen: false, isFullDay: false },
  rebuildScheduleOpen: { isOpen: false },
  buildScheduleOpen: { isOpen: false },
  agentsWithSaveWarnings: [],
  reviewWarningsType: 'short',
  saveErrors: [],
  error: null,
  timeDiscreteness: 60,
  fullDayView: true,
  deleteShiftMenuOpen: false,
  cleanupMenuOpen: false,
  editCommentMenuOpen: false,
  editCommentMenuInfo: null,
  showDelimiter: true,
  useCustomColors:true,
  errorPopUpIsOpen: { isOpen: false, data: '' },
  multipleWizardOpen: false,
  meetingSchedulerOpen: false,
  multipleWizardType: 'insert',
  multipleDropdownOpen: false,
  buffer: { elements: null, elementsType: BufferElementsType.NONE, stateType: SchStateType.NONE },
  memoOpen: false,
  memoInfo: null,
  calendarOpen: false,
  displaySettingsIsOpen: false,
  searchSettingsIsOpen: false,
  isTargetMenuOpen: false,
  multipleCleanupOpen: false,
  saveAgentDayParams: {},
  insertMarkedTime: false,
  insertActivitySet: false,
  warningPopUpIsOpen: { isOpen: false, data: '', agents: [], discard: false },
  successPopUpIsOpen: { isOpen: false, data: '' },
  calculatedSchedule: {
    shifts: [],
    meals: [],
    breaks: [],
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
  // todo: temp
  agentWorkDays: 0,
  switchToClassicOpen: false,
  scrollToIndex: -1,
  sitesMultipleTimezonesWarning: false,
  meetingSchedulerListIsOpen: false,
  meetingSchedulerCalendarIsOpen: false,
  isTimeLineDisabled: false,
};

const timeLineReducer = createReducer(initialState, {
  [TimeLineTypes.SET_MULTIPLE_TIMEZONES_WARNING]: (state, action: { payload: boolean }) => {
    state.sitesMultipleTimezonesWarning = action.payload;
  },
  [saveAgentDay.pending.type]: (state: typeof initialState, action) => {
    // state.agentsToSave = action.meta.arg.agents;
    state.loading = true;
    state.saveAgentDayParams = omit(['agents'], action.meta.arg);
  },
  [saveAgentDay.fulfilled.type]: (
    state: typeof initialState,
    action: {
      meta: { arg: { agents: IAgentTimeline[] } };
      payload: { agents: IAgentTimeline[]; validationResponse: any };
    },
  ) => {
    state.loading = false;
    state.selectedAgents = [];
    // in case of warnings we have here warnings.
    // now we need to merge them with agents
    // so we need here original agents.
    // merge them with warnings and set to agentsWithSaveWarnings
    const validationResponse = action.payload?.validationResponse as IAgentTimeline[];

    // const initialAgents = (action.payload?.agents as IAgentTimeline[]) || [];
    if (validationResponse?.length > 0) {
      state.agentsWithSaveWarnings = validationResponse;
    } else {
      state.agentsWithSaveWarnings = [];
      state.history.current.data.forEach(agent => {
        agent.isModified = agent.isFixLater;
      });
      state.history.current.isModified = !!state.history.current.data.find(agent => agent.isFixLater);
      state.multipleWizardOpen = false;
    }
  },
  [saveAgentDay.rejected.type]: (state: typeof initialState, action: any) => {
    state.loading = false;
    if (action.payload?.data?.includes(WarningTypes.SCHEDULE_MODIFIED)) {
      state.scheduleModifiedPopUp.isOpen = true;
      return;
    }
    addGlobalError({
      message: action.payload?.data?.join('\n'),
      code: action.payload?.status,
    });
  },

  [findBreaks.pending.type]: (state: typeof initialState) => {
    state.error = null;
  },

  [findBreaks.fulfilled.type]: (state: typeof initialState, action: { payload: any }) => {
    state.breaks = action.payload.data;
  },
  [findBreaks.rejected.type]: (state: { loading: any; error: any }, action: { error: any }) => {
    state.error = action.error;
  },
  [findMeals.pending.type]: (state: typeof initialState) => {
    state.error = null;
  },
  [findMeals.fulfilled.type]: (state: typeof initialState, action: { payload: any }) => {
    state.meals = action.payload.data;
  },
  [findMeals.rejected.type]: (state: { loading: any; error: any }, action: { error: any }) => {
    state.error = action.error;
  },
  [findShifts.pending.type]: (state: typeof initialState) => {
    state.error = null;
  },
  [findShifts.fulfilled.type]: (state: typeof initialState, action: { payload: any }) => {
    state.shifts = action.payload.data;
  },
  [findShifts.rejected.type]: (state: { loading: any; error: any }, action: { error: any }) => {
    state.error = action.error;
  },
  [findExceptions.pending.type]: (state: typeof initialState) => {
    state.error = null;
  },
  [findExceptions.fulfilled.type]: (state: typeof initialState, action: { payload: any }) => {
    state.exceptions = action.payload.data;
    state.loading = false;
  },
  [findExceptions.rejected.type]: (state: { loading: any; error: any }, action: { error: any }) => {
    state.error = action.error;
  },
  [findTimeOffs.pending.type]: (state: typeof initialState) => {
    state.error = null;
  },
  [findTimeOffs.fulfilled.type]: (state: typeof initialState, action: { payload: any }) => {
    state.timeOffs = action.payload.data;
  },
  [findTimeOffs.rejected.type]: (state: { loading: any; error: any }, action: { error: any }) => {
    state.error = action.error;
  },
  [String(findAuditLog.pending)]: (state: typeof initialState) => {
    state.error = null;
  },
  [String(findAuditLog.fulfilled)]: (state: typeof initialState, action: { payload: any }) => {
    state.auditLog = action.payload.data;
  },
  [String(findAuditLog.rejected)]: (state: { loading: any; error: any }, action: { error: any }) => {
    state.error = action.error;
  },
  [rollbackSchedule.pending.type]: (state: typeof initialState) => {
    state.error = null;
  },
  // [rollbackSchedule.fulfilled.type]: (state: typeof initialState, action: { payload: any }) => {
  //   state.exceptions = action.payload.data;
  // },
  [rollbackSchedule.rejected.type]: (state: { loading: any; error: any }, action: { error: any }) => {
    state.error = action.error;
  },
  [ELoginActionTypes.NOT_AUTHORIZED]: (state: typeof initialState) => {
    state.loading = false;
  },
  [TimeLineTypes.SET_BREAKS]: (state: typeof initialState, action: { payload: any }) => {
    state.breaks = action.payload;
  },
  [TimeLineTypes.SET_SAVE_ERROR]: (state: typeof initialState, action: { payload: any }) => {
    state.saveErrors = action.payload;
  },
  [TimeLineTypes.TOGGLE_TIME_LINE_OPTION]: (
    state: typeof initialState,
    action: { payload: keyof typeof state.options },
  ) => {
    const val = state.options[action.payload];
    state.options[action.payload] = !val;
  },
  [TimeLineTypes.SET_REVIEW_WARNINGS_TYPE]: (state: typeof initialState, action) => {
    state.reviewWarningsType = action.payload;
  },
  [TimeLineTypes.SET_AGENT_DATA]: (state: typeof initialState, action) => {
    const { agent, isSaveToHistory = true } = action.payload;
    if (isSaveToHistory) {
      state.history.current.data = state.history.current.data.map(_agent => {
        if (_agent.agentId === agent.agentId) {
          return agent;
        }
        return _agent;
      });
    }

    state.agentsWithSaveWarnings = state.agentsWithSaveWarnings.map(_agent => {
      if (_agent.agentId === agent.agentId) {
        return agent;
      }
      return _agent;
    });
  },
  [TimeLineTypes.SET_MEALS]: (state: typeof initialState, action: { payload: any }) => {
    state.meals = action.payload;
  },
  [TimeLineTypes.SET_EXCEPTIONS]: (state: typeof initialState, action: { payload: any }) => {
    state.exceptions = action.payload;
  },
  [TimeLineTypes.SET_TIME_OFFS]: (state: typeof initialState, action: { payload: any }) => {
    state.timeOffs = action.payload;
  },
  [TimeLineTypes.SET_AUDIT_LOG]: (state: typeof initialState, action: { payload: any }) => {
    state.auditLog = action.payload;
  },
  [TimeLineTypes.SET_SAVE_WARNINGS]: (state: typeof initialState, action: { payload: IAgentTimeline[] }) => {
    state.agentsWithSaveWarnings = action.payload;
  },
  [TimeLineTypes.SET_COPY_TO]: (state: typeof initialState, action: { payload: ICopyToMenuParam }) => {
    const { isOpen, selectedActivity, isMultiple, isVisible }: ICopyToMenuParam = action.payload;
    state.copyToOpen = {
      isOpen,
      selectedActivity: selectedActivity || null,
      isMultiple,
      isVisible: typeof isVisible === 'boolean' ? isVisible : true,
    };
  },
  [TimeLineTypes.SET_IS_MODIFIED]: (state: typeof initialState, action: { payload: boolean }) => {
    state.history.current.isModified = action.payload;
  },

  [TimeLineTypes.LOADING]: (state: typeof initialState, action: { payload: boolean }) => {
    state.loading = action.payload;
  },
  [TimeLineTypes.SET_DATA]: (
    state: typeof initialState,
    action: {
      payload: {
        agents: IAgentTimeline[];
        isMerge: boolean;
        isSaveToHistory?: boolean;
        isModified: boolean;
        isSaveSelected: boolean;
        updateAgents?: boolean;
        clearHistory?: boolean;
        currentDate?: string;
        isSaveModified?: boolean;
      };
    },
  ) => {
    const {
      agents,
      isMerge,
      isSaveToHistory,
      isModified,
      isSaveSelected,
      updateAgents,
      clearHistory,
      currentDate,
      isSaveModified,
    } = action.payload;
    //return initial state
    if (!isSaveSelected) {
      state.selectedAgents = [];
      state.selectedActivity = [];
    } else {
      const { selectedActivities, selectedAgents } = SchSelectedActivity.getUpdatedSelectedActivity(
        state.selectedActivity,
        agents,
      );
      state.selectedAgents = selectedAgents;
      state.selectedActivity = selectedActivities;
    }

    state.targetInfo = null;

    //save changes to history
    if (isSaveToHistory) {
      state.history.past = DateUtils.pushToFixedArray<IHistoryData>(state.history.past, Object.assign({}, state.history.current));
      state.history.future = [];
    }
    const isSomeModified = agents.some(el => el.isModified);
    // Boolean(isModified) && isSomeModified ? (state.history.current.isModified = isModified) : null;
    // if (!isModified && !somModified) {
    state.history.current.isModified = (isModified && isSomeModified) || isSomeModified;
    // }

    if (isMerge) {
      const { newAgents, updatedAgents } = agents.reduce<{
        newAgents: IAgentTimeline[];
        updatedAgents: IAgentTimeline[];
      }>(
        (acc, agent) => {
          const foundedAgent = state.history.current.data.find(_agent => _agent.agentId === agent.agentId);
          if (!foundedAgent) {
            acc.newAgents.push(agent);
          } else {
            acc.updatedAgents.push(agent);
          }
          return acc;
        },
        { newAgents: [], updatedAgents: [] },
      );
      state.history.current.data = state.history.current.data.map(agent => {
        if (agent.isFixLater || (isSaveModified && agent.isModified)) {
          state.history.current.isModified = true;
          return agent;
        }
        const foundedAgent = updatedAgents.find(_agent => _agent.agentId === agent.agentId);

        if (!foundedAgent) {
          return agent;
        }
        return foundedAgent;
      });
      state.history.current.data = [...state.history.current.data, ...newAgents];
      state.history.current.isModified = state.history.current.data.some(el => el.isModified);
    } else {
      //initialize history
      state.history.current.data = agents;
    }

    if (updateAgents) {
      // update agents in history
      // if agent already in history state, we leave it. if not, we add it
      const newPast = state.history.past.map(state => {
        const newState = [...state.data];

        agents.forEach(agent => {
          const foundedAgent = newState.find(_agent => _agent.agentId === agent.agentId);
          if (!foundedAgent) {
            newState.push(agent);
          }
        });

        return {
          ...state,
          data: newState,
        };
      });

      const newFuture = state.history.future.map(state => {
        const newState = [...state.data];

        agents.forEach(agent => {
          const foundedAgent = newState.find(_agent => _agent.agentId === agent.agentId);
          if (!foundedAgent) {
            newState.push(agent);
          }
        });

        return {
          ...state,
          data: newState,
        };
      });

      state.history.past = newPast;
      state.history.future = newFuture;
    }
    if (clearHistory) {
      state.history.past = [];
      state.history.future = [];
    }

    // todo: temp
    if (!isModified && currentDate) {
      const date = new Date(currentDate).getTime();

      state.agentWorkDays = agents.reduce((acc, agent) => {
        const day = agent.days.find(d => d.date === date);
        if (day && day.id != 0 && day.dayState && day.dayState.startDateTime && day.dayState.endDateTime) {
          return acc + 1;
        }
        return acc;
      }, 0);
    }
    // state.loading = false;
  },
  [TimeLineTypes.CHANGE_STORE_BY_HISTORY]: (
    state: typeof initialState,
    action: { payload: 'undo' | 'redo' | 'clear' },
  ) => {
    const {
      past,
      current,
      future,
      current: { isModified },
    } = state.history;

    if (action.payload === 'clear') {
      state.history.past = [];
      state.history.future = [];
    }

    if (action.payload === 'undo') {
      if (!isModified) return;
      const previous = past[past.length - 1];
      if (!previous) return;

      state.history.past = past.slice(0, past.length - 1);
      state.history.current = previous;
      state.history.future = [current, ...future];
    } else if (action.payload === 'redo') {
      const next = future[0];
      if (!next) return;
      const newFuture = future.slice(1);

      state.history.past = DateUtils.pushToFixedArray<IHistoryData>(past, current);
      state.history.current = next;
      state.history.future = newFuture;
    }

    //update selected activities
    const { selectedActivities, selectedAgents } = SchSelectedActivity.getUpdatedSelectedActivity(
      state.selectedActivity,
      state.history.current.data,
    );
    state.selectedActivity = selectedActivities;
    state.selectedAgents = selectedAgents;
  },
  [TimeLineTypes.COPY_ACTIVITIES]: (state: typeof initialState, action: { payload: ISelectedActivity[] }) => {
    state.targetInfo = null;
    let copyActivities = action.payload;

    if (SchSelectedActivity.isWork(copyActivities[0])) {
      copyActivities = SchSelectedActivity.selectShiftsBySelectedActivities(
        state.selectedActivity,
        state.history.current.data,
      );
    }

    // if (copyActivities.some(e => e.start === e.shiftStart && e.end === e.shiftEnd)) return;
    let elementsType = BufferElementsType.DIFFERENT;
    const possibleFullShiftActivity = (activity: ISelectedActivity) =>
      SchSelectedActivity.isWork(activity) ||
      SchSelectedActivity.isWorkSet(activity) ||
      SchSelectedActivity.isActivitySet(activity) ||
      activity._type === SchStateType.SHIFT ||
      activity._type === SchStateType.TIME_OFF ||
      activity._type === SchStateType.EXCEPTION ||
      activity._type === SchStateType.DAY_OFF;

    const isFullShiftActivity = copyActivities.every(
      e =>
        possibleFullShiftActivity(e) &&
        e.start === e.shiftStart &&
        e.end === e.shiftEnd &&
        e._type === copyActivities[0]._type,
    );
    if (isFullShiftActivity) {
      elementsType = BufferElementsType.SHIFT_OR_WORK_SET;
    } else if (
      copyActivities.every(
        e => e.start !== e.shiftStart || e.end !== e.shiftEnd || e._type === SchStateType.MARKED_TIME,
      )
    ) {
      elementsType = BufferElementsType.STATE;
    }
    const timeLines = state.history.current.data;
    const elements = copyActivities.reduce((acc: IBufferElement[], activity: ISelectedActivity) => {
      const index = timeLines.findIndex(t => t.agentId === activity.agentId);
      if (index === -1) return acc;

      const timeLine = timeLines[index];
      return [...acc, { index, timeLine, activity }];
    }, []);

    state.buffer = {
      elements: elementsType === BufferElementsType.STATE ? [elements[elements.length - 1]] : elements,
      elementsType,
      stateType: copyActivities[0]?._type,
    };
  },
  [TimeLineTypes.CLEAR_BUFFER]: (state: typeof initialState) => {
    state.targetInfo = null;
    state.buffer = {
      elements: null,
      elementsType: BufferElementsType.NONE,
      stateType: SchStateType.NONE,
    };
  },

  [TimeLineTypes.SET_SELECTED_ACTIVITY]: (state: typeof initialState, action: { payload: any }) => {
    state.selectedActivity = action.payload;
  },
  [TimeLineTypes.OPEN_MENU]: (state: typeof initialState) => {
    state.popUpOpen = true;
  },
  [TimeLineTypes.TOGGLE_INSERT_WORK_SET]: (state: typeof initialState) => {
    state.insertWorkSetOpen = !state.insertWorkSetOpen;
  },
  [TimeLineTypes.TOGGLE_INSERT_ACTIVITY_SET]: (state: typeof initialState) => {
    state.insertActivitySet = !state.insertActivitySet;
  },
  [TimeLineTypes.TOGGLE_SET_ACTIVITIES_FOR]: (state: typeof initialState, action: { payload: SetActivitiesFor }) => {
    state.setActivitiesFor = action.payload;
  },
  [TimeLineTypes.CLOSE_MENU]: (state: typeof initialState) => {
    state.popUpOpen = false;
  },
  [TimeLineTypes.OPEN_EDIT_FULL_DAY_ITEM]: (state: typeof initialState) => {
    state.editFullDayItemOpen = true;
  },
  [TimeLineTypes.CLOSE_EDIT_FULL_DAY_ITEM]: (state: typeof initialState) => {
    state.editFullDayItemOpen = false;
  },
  [TimeLineTypes.OPEN_CONFIRMATION]: (
    state: typeof initialState,
    action: {
      payload: { onConfirm?: () => void; onDiscard?: () => void; onClose?: () => void; onResult?: () => void };
    },
  ) => {
    state.confirmPopUp = {
      isOpen: true,
      onConfirm: () => {},
      onDiscard: () => {},
      onClose: () => {},
      onResult: () => {}, // default values
      ...action.payload,
    };
  },
  [TimeLineTypes.SET_DEFAULT_CONFIRMATION]: (state: typeof initialState) => {
    state.confirmPopUp = {
      isOpen: false,
      onConfirm: () => {},
      onClose: () => {},
      onDiscard: () => {},
      onResult: () => {},
    };
  },
  [TimeLineTypes.CLOSE_CONFIRMATION]: (state: typeof initialState) => {
    state.confirmPopUp.isOpen = false;
  },
  [TimeLineTypes.OPEN_MODIFIED_POPUP]: (
    state: typeof initialState,
    action: {
      payload: { onConfirm?: () => void; onDiscard?: () => void; onClose?: () => void; onResult?: () => void };
    },
  ) => {
    state.scheduleModifiedPopUp = {
      isOpen: true, // default values
      ...action.payload,
    };
  },
  [TimeLineTypes.CLOSE_MODIFIED_POPUP]: (state: typeof initialState) => {
    state.scheduleModifiedPopUp.isOpen = false;
  },
  [TimeLineTypes.OPEN_EDIT_COMMENT_MENU]: (state: typeof initialState) => {
    state.editCommentMenuOpen = true;
  },
  [TimeLineTypes.CLOSE_EDIT_COMMENT_MENU]: (state: typeof initialState) => {
    state.editCommentMenuOpen = false;
  },
  [TimeLineTypes.OPEN_DELETE_MENU]: (state: typeof initialState) => {
    state.deleteShiftMenuOpen = true;
  },
  [TimeLineTypes.CLOSE_DELETE_MENU]: (state: typeof initialState) => {
    state.deleteShiftMenuOpen = false;
  },
  [TimeLineTypes.OPEN_CLEANUP_MENU]: (state: typeof initialState) => {
    state.cleanupMenuOpen = true;
  },
  [TimeLineTypes.CLOSE_CLEANUP_MENU]: (state: typeof initialState) => {
    state.cleanupMenuOpen = false;
  },
  [TimeLineTypes.OPEN_NEW_SHIFT_MENU]: (state: typeof initialState) => {
    state.newShiftMenuOpen = true;
  },
  [TimeLineTypes.CLOSE_NEW_SHIFT_MENU]: (state: typeof initialState) => {
    state.newShiftMenuOpen = false;
  },
  [TimeLineTypes.OPEN_INSERT_BREAK_MENU]: (state: typeof initialState) => {
    state.insertBreakMenuOpen = true;
  },
  [TimeLineTypes.CLOSE_INSERT_BREAK_MENU]: (state: typeof initialState) => {
    state.insertBreakMenuOpen = false;
  },
  [TimeLineTypes.OPEN_INSERT_MEAL_MENU]: (state: typeof initialState) => {
    state.insertMealMenuOpen = true;
  },
  [TimeLineTypes.CLOSE_INSERT_MEAL_MENU]: (state: typeof initialState) => {
    state.insertMealMenuOpen = false;
  },
  [TimeLineTypes.OPEN_ERROR_POPUP]: (state: typeof initialState, action: { payload: any }) => {
    state.errorPopUpIsOpen = action.payload;
  },
  [TimeLineTypes.OPEN_WARNING_POPUP]: (state: typeof initialState, action: { payload: any }) => {
    state.warningPopUpIsOpen = action.payload;
  },
  [TimeLineTypes.OPEN_SUCCESS_POPUP]: (state: typeof initialState, action: { payload: any }) => {
    state.successPopUpIsOpen = action.payload;
  },
  [TimeLineTypes.SET_OPEN_MEETING_SCHEDULER_MENU]: (state: typeof initialState, action: { payload: boolean }) => {
    state.meetingSchedulerOpen = action.payload;
  },
  [TimeLineTypes.SET_OPEN_INSERT_EXCEPTION_MENU]: (state: typeof initialState, action: { payload: any }) => {
    state.insertExceptionOpen = action.payload;
  },
  [TimeLineTypes.SET_OPEN_INSERT_TIME_OFF_MENU]: (state: typeof initialState, action: { payload: any }) => {
    state.insertTimeOffOpen = action.payload;
  },
  [TimeLineTypes.SET_OPEN_SCHEDULE_RESTORE]: (state: typeof initialState, action: { payload: any }) => {
    state.restoreScheduleOpen = action.payload;
  },
  [TimeLineTypes.SET_OPEN_EDIT_MULTIPLE]: (state: typeof initialState, action: { payload: any }) => {
    state.editMultipleOpen = action.payload;
  },
  [TimeLineTypes.SET_OPEN_MULTIPLE_CLEANUP]: (state: typeof initialState, action: { payload: any }) => {
    state.multipleCleanupOpen = action.payload;
  },
  [TimeLineTypes.SELECT_SHIFT_BY_SELECTED_ACTIVITY]: (state: typeof initialState) => {
    state.selectedActivity = SchSelectedActivity.selectShiftsBySelectedActivities(
      state.selectedActivity,
      state.history.current.data,
    );
  },
  [TimeLineTypes.OPEN_MEMO_INFO]: (state: typeof initialState) => {
    state.tzMenu = false;
    state.multipleDropdownOpen = false;
    state.viewMenu = false;
    state.columnsMenu = false;
    state.memoOpen = true;
  },
  [TimeLineTypes.SET_CALCULATED_SCHEDULE]: (state: typeof initialState, action: { payload: ICalculatedSchedule }) => {
    if (!state.history.current.data.length) return;
    state.calculatedSchedule = action.payload;
    if (action.payload.agentsTimeline) {
      state.history.current.data = action.payload.agentsTimeline;
    }
  },
  [TimeLineTypes.SET_SCHEDULE_FORECAST]: (state: typeof initialState, action: { payload: number[] }) => {
    if (!state.history.current.data.length || !Array.isArray(action.payload) || !action.payload.length) return;
    state.calculatedSchedule.forecast = action.payload;
  },
  [TimeLineTypes.CLEAR_REBUILD_SCHEDULE]: (state: typeof initialState, action: { payload: ICalculatedSchedule }) => {
    state.calculatedSchedule = action.payload;
  },
  [TimeLineTypes.SET_OPEN_REBUILD_SCHEDULE]: (state: typeof initialState, action: { payload: any }) => {
    if (action.payload.isOpen && !state.history.current.data.length) return;
    state.rebuildScheduleOpen = action.payload;
  },
  [TimeLineTypes.SET_OPEN_BUILD_SCHEDULE]: (state: typeof initialState, action: { payload: any }) => {
    if (action.payload.isOpen && !state.history.current.data.length) return;
    state.buildScheduleOpen = action.payload;
  },
  [TimeLineTypes.CLOSE_MEMO_INFO]: (state: typeof initialState) => {
    state.memoOpen = false;
  },
  [TimeLineTypes.CLEAR_MEMO_INFO_DATA]: (state: typeof initialState) => {
    state.memoInfo = null;
  },
  [TimeLineTypes.ADD_MEMO_INFO_DATA]: (state: typeof initialState, action: { payload: any }) => {
    state.memoInfo = action.payload;
  },
  [TimeLineTypes.OPEN_SUB_MENU]: (state: typeof initialState) => {
    state.tzMenu = false;
    state.multipleDropdownOpen = false;
    state.viewMenu = false;
    state.columnsMenu = false;
    state.submenuOpen = true;
  },

  [TimeLineTypes.CHANGE_CALENDAR_VISIBILITY]: (state: typeof initialState, action: { payload: any }) => {
    state.calendarOpen = action.payload;
  },
  [TimeLineTypes.SET_SCHEDULER_LIST_OPEN]: (state: typeof initialState, action: { payload: boolean }) => {
    state.meetingSchedulerListIsOpen = action.payload;
  },
  [TimeLineTypes.SET_SCHEDULER_CALENDAR_OPEN]: (state: typeof initialState, action: { payload: boolean }) => {
    state.meetingSchedulerCalendarIsOpen = action.payload;
  },
  [TimeLineTypes.CHANGE_SEARCH_SETTINGS_VISIBILITY]: (state: typeof initialState, action: { payload: any }) => {
    state.searchSettingsIsOpen = action.payload;
  },
  [TimeLineTypes.CHANGE_DISPLAY_SETTINGS_VISIBILITY]: (state: typeof initialState, action: { payload: any }) => {
    state.displaySettingsIsOpen = action.payload;
  },
  [TimeLineTypes.CLOSE_SUB_MENU]: (state: typeof initialState) => {
    state.submenuOpen = false;
  },
  [TimeLineTypes.CLEAR_SUB_MENU_DATA]: (state: typeof initialState) => {
    state.submenuInfo = null;
  },
  [TimeLineTypes.ADD_SUB_MENU_DATA]: (state: typeof initialState, action: { payload: any }) => {
    state.submenuInfo = action.payload;
  },

  [TimeLineTypes.CLEAR_EDIT_COMMENT_MENU_DATA]: (state: typeof initialState) => {
    state.editCommentMenuInfo = null;
  },
  [TimeLineTypes.ADD_EDIT_COMMENT_MENU_DATA]: (state: typeof initialState, action: { payload: any }) => {
    state.editCommentMenuInfo = action.payload;
  },

  [TimeLineTypes.CHANGE_COLUMNS]: (state: typeof initialState, action: { payload: any }) => {
    state.columns = action.payload;
    state.targetInfo = null;
  },
  [TimeLineTypes.SHOW_COLUMNS_MENU]: (state: typeof initialState, action: { payload: any }) => {
    state.columnsMenu = action.payload;
    state.multipleDropdownOpen = false;
    state.tzMenu = false;
    state.viewMenu = false;
    state.submenuOpen = false;
  },
  [TimeLineTypes.SHOW_VIEW_MENU]: (state: typeof initialState, action: { payload: any }) => {
    state.viewMenu = action.payload;
    state.multipleDropdownOpen = false;
    state.tzMenu = false;
    state.columnsMenu = false;
    state.submenuOpen = false;
  },
  [TimeLineTypes.SHOW_TZ_MENU]: (state: typeof initialState, action: { payload: any }) => {
    state.tzMenu = action.payload;
    state.multipleDropdownOpen = false;
    state.viewMenu = false;
    state.columnsMenu = false;
    state.submenuOpen = false;
  },
  [TimeLineTypes.CLOSE_ALL_MENU]: (state: typeof initialState) => {
    state.tzMenu = false;
    state.multipleDropdownOpen = false;
    state.viewMenu = false;
    state.columnsMenu = false;
    state.submenuOpen = false;
    state.calendarOpen = false;
    state.isTargetMenuOpen = false;
    state.switchToClassicOpen = false;
  },
  [TimeLineTypes.TARGET_MENU_OPEN]: (state: typeof initialState, action: { payload: any }) => {
    state.isTargetMenuOpen = action.payload;
  },
  [TimeLineTypes.CHANGE_ACCOUNT_VISIBILITY]: (state: typeof initialState, action: { payload: any }) => {
    state.switchToClassicOpen = action.payload;
  },
  [TimeLineTypes.CLOSE_ALL_POPUPS]: (state: typeof initialState) => {
    state.insertActivitySet = false;
    state.confirmPopUp.isOpen = false;
    state.errorPopUpIsOpen = { isOpen: false, data: '' };
    state.warningPopUpIsOpen = { isOpen: false, data: '', agents: [] };
    state.insertExceptionOpen = { isOpen: false, isFullDay: false };
    state.insertTimeOffOpen = { isOpen: false, isFullDay: false };
    state.cleanupMenuOpen = false;
    state.editCommentMenuOpen = false;
    state.insertBreakMenuOpen = false;
    state.insertMealMenuOpen = false;
    state.insertWorkSetOpen = false;
    state.newShiftMenuOpen = false;
    state.popUpOpen = false;
    state.searchSettingsIsOpen = false;
    state.displaySettingsIsOpen = false;
    state.editFullDayItemOpen = false;
    state.restoreScheduleOpen = false;
    state.copyToOpen = { isOpen: false, selectedActivity: null, isMultiple: false };
    state.multipleWizardOpen = false;
    state.rebuildScheduleOpen = { isOpen: false };
    state.deleteShiftMenuOpen = false;
    state.multipleCleanupOpen = false;
    state.meetingSchedulerOpen = false;
    state.buildScheduleOpen = { isOpen: false };
  },

  [TimeLineTypes.SET_VIEW_SORT_TYPE]: (state: typeof initialState, action: { payload: any }) => {
    if (state.sortBy.agentSort && state.sortBy.agentSort.findIndex(({ id }) => id === action.payload) !== -1) {
      state.sortBy.agentSort = state.sortBy.agentSort.filter(({ id }) => id !== action.payload);
    } else {
      const findColumn = (columnsForTable ?? []).find(({ id }) => id === action.payload);
      if (findColumn) {
        const existsAgentSort = !state.sortBy.agentSort ? [] : state.sortBy.agentSort;
        state.sortBy.agentSort = [...existsAgentSort, findColumn];
      }
    }
  },
  [TimeLineTypes.SET_TIME_FORMAT]: (state: typeof initialState, action: { payload: any }) => {
    state.timeFormat = action.payload;
  },
  [TimeLineTypes.SET_TEXT_COEFFICIENT]: (state: typeof initialState, action: { payload: any }) => {
    state.textCoefficient = action.payload;
  },
  [TimeLineTypes.SELECT_AGENT]: (state: typeof initialState, action: { payload: any }) => {
    if (Array.isArray(action.payload)) {
      state.selectedAgents = action.payload;
    } else {
      state.selectedAgents = [action.payload];
    }
  },
  [TimeLineTypes.CLEAR_SELECT_ACTIVITIES]: (state: typeof initialState) => {
    state.targetInfo = null;
    state.selectedActivity = [];
  },
  [TimeLineTypes.CLEAR_SELECT_AGENT]: (state: typeof initialState) => {
    state.targetInfo = null;
    state.selectedAgents = [];
  },
  [TimeLineTypes.ADD_SELECT_AGENT]: (state: typeof initialState, action: { payload: any }) => {
    state.selectedAgents = [action.payload, ...state.selectedAgents];
  },
  [TimeLineTypes.SET_TIME_DISCRETENESS]: (state: typeof initialState, action: { payload: any }) => {
    state.timeDiscreteness = action.payload;
  },
  [TimeLineTypes.TOGGLE_FULL_DAY_VIEW]: (state: typeof initialState) => {
    state.fullDayView = !state.fullDayView;
  },
  [TimeLineTypes.TOGGLE_DELIMITER]: (state: typeof initialState) => {
    state.showDelimiter = !state.showDelimiter;
  },
  [TimeLineTypes.TOGGLE_CUSTOM_COLORS]: (state: typeof initialState) => {
    state.useCustomColors = !state.useCustomColors;
  },
  [TimeLineTypes.TOGGLE_INSERT_MARKED_TIME]: (state: typeof initialState) => {
    state.insertMarkedTime = !state.insertMarkedTime;
  },
  [TimeLineTypes.SET_OPEN_MULTIPLE_WIZARD]: (state: typeof initialState, action: { payload: any }) => {
    state.multipleWizardOpen = action.payload.value;
    state.multipleWizardType = action.payload.type;
    state.multipleDropdownOpen = false;
  },
  [TimeLineTypes.SET_OPEN_MULTIPLE_WIZARD_DROPDOWN]: (state: typeof initialState, action: { payload: any }) => {
    state.tzMenu = false;
    state.viewMenu = false;
    state.columnsMenu = false;
    state.submenuOpen = false;
    state.multipleDropdownOpen = action.payload;
  },
  [TimeLineTypes.SET_MULTIPLE_WIZARD_TYPE]: (state: typeof initialState, action: { payload: WizardType }) => {
    state.multipleWizardType = action.payload;
  },
  [TimeLineTypes.SET_SORT_BY]: (state: typeof initialState, action: { payload: ISortBy }) => {
    state.sortBy = action.payload;
    state.sortingProcess=true;
  },
  [TimeLineTypes.SET_TARGET_INFO]: (state: typeof initialState, action: { payload: ITargetInfo }) => {
    state.targetInfo = action.payload;
  },
  [TimeLineTypes.CLEAR_TARGET_INFO]: (state: typeof initialState) => {
    state.targetInfo = null;
  },
  [TimeLineTypes.RESTORE_TIMELINE_SETTINGS]: (state: typeof initialState, action: { payload: ITimeLineStateSave }) => {
    return { ...state, ...action.payload };
  },
  [TimeLineTypes.RESET_TIMELINE_DATA]: (state: typeof initialState) => {
    Object.keys(initialState).forEach(key => {
      //@ts-ignore
      state[key] = initialState[key];
    });
  },
  [TimeLineTypes.SET_CHART_CONTROL]: (state: typeof initialState, action: { payload: IControlChartState }) => {
    state.calculatedSchedule.control = {
      ...state.calculatedSchedule.control,
      [action.payload.name]: action.payload.value,
    };
  },

  [TimeLineTypes.SCROLL_TO_INDEX]: (state: typeof initialState, action: { payload: number }) => {
    state.scrollToIndex = action.payload;
  },
  [TimeLineTypes.SET_SORTING_PROCESS]: (state: typeof initialState, action: { payload: boolean }) => {
    state.sortingProcess = action.payload;
  },
  [TimeLineTypes.SET_IS_TIMELINE_DISABLED]: (state: typeof initialState, action: { payload: boolean }) => {
    state.isTimeLineDisabled = action.payload;
  },
});

export default timeLineReducer;
