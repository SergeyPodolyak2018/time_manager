import { createSelector } from '@reduxjs/toolkit';

import { TimeLineState } from '../../common/constants';
import {
    IBuffer, IOptions, ITimeLine, SetActivitiesFor, TimeFormatType
} from '../ts/intrefaces/timeLine';
import { IAgentTimeline } from '../ts/intrefaces/timeLine/IAgentTimeline';
import { rootSelector } from '.';

export const timeLineSelector = createSelector(rootSelector, state => state[TimeLineState]);

export const isLoadingSelector = createSelector(timeLineSelector, (data: ITimeLine) => data.loading);

export const getIsAnyPopupOpen = createSelector(timeLineSelector, (state: ITimeLine) => {
  return (
    state.insertActivitySet ||
    state.confirmPopUp.isOpen ||
    state.cleanupMenuOpen ||
    state.editCommentMenuOpen ||
    state.insertBreakMenuOpen ||
    state.insertMealMenuOpen ||
    state.insertWorkSetOpen ||
    state.insertExceptionOpen.isOpen ||
    state.insertTimeOffOpen.isOpen ||
    state.newShiftMenuOpen ||
    state.popUpOpen ||
    state.restoreScheduleOpen ||
    state.calendarOpen ||
    state.searchSettingsIsOpen ||
    state.displaySettingsIsOpen ||
    state.copyToOpen.isOpen ||
    state.rebuildScheduleOpen.isOpen ||
    state.errorPopUpIsOpen.isOpen ||
    state.editFullDayItemOpen ||
    state.multipleWizardOpen ||
    state.deleteShiftMenuOpen ||
    state.multipleCleanupOpen ||
    state.warningPopUpIsOpen.isOpen ||
    state.meetingSchedulerOpen ||
    state.buildScheduleOpen.isOpen ||
    state.insertMarkedTime ||
    state.editMultipleOpen.isOpen ||
    state.setActivitiesFor !== SetActivitiesFor.NONE
  );
});

export const getIsAnyMenuOpen = createSelector(timeLineSelector, (state: ITimeLine) => {
  return (
    state.tzMenu ||
    state.multipleDropdownOpen ||
    state.viewMenu ||
    state.columnsMenu ||
    state.submenuOpen ||
    state.isTargetMenuOpen ||
    state.calendarOpen ||
    state.switchToClassicOpen
  );
});

export const getAgentWorksDay = createSelector(timeLineSelector, (data: ITimeLine) => data.agentWorkDays);

export const getSelectedActivitySelector = createSelector(timeLineSelector, (data: ITimeLine) => data.selectedActivity);

export const getSaveWarnings = createSelector(
  timeLineSelector,
  data => data.agentsWithSaveWarnings as IAgentTimeline[],
);

export const getSaveParams = createSelector(timeLineSelector, data => data.saveAgentDayParams);

export const getSaveErrors = createSelector(timeLineSelector, data => data.saveErrors);

export const getReviewWarningsType = createSelector(timeLineSelector, data => data.reviewWarningsType);

export const getModifiedAgents = createSelector(timeLineSelector, data => {
  return data.history.current.data.reduce((acc: IAgentTimeline[], agent) => {
    if (agent.isModified) acc.push(agent);
    return acc;
  }, []);
});

export const getSelectedAgentSelector = createSelector(timeLineSelector, data => {
  if (data.selectedActivity.length) {
    return data.selectedActivity.reduce((acc: IAgentTimeline[], activity) => {
      const agent = data.history.current.data.find(_agent => _agent.agentId === activity.agentId);
      if (agent) acc.push(agent);

      return acc;
    }, []) as IAgentTimeline[];
  } else {
    return data.selectedAgents.reduce((acc: IAgentTimeline[], agentId) => {
      const agent = data.history.current.data.find(_agent => _agent.agentId === agentId);
      if (agent) acc.push(agent);
      return acc;
    }, []) as IAgentTimeline[];
  }
});

export const getSelectedAgents = createSelector(timeLineSelector, data => {
  return data.selectedActivity.reduce((acc: IAgentTimeline[], activity) => {
    const agent = data.history.current.data.find(_agent => _agent.agentId === activity.agentId);
    if (agent) acc.push(agent);
    return acc;
  }, []) as IAgentTimeline[];
});

export const isPopUoOpenSelector = createSelector(timeLineSelector, data => data.popUpOpen);

export const isEditFullDayItemOpenSelector = createSelector(timeLineSelector, data => data.editFullDayItemOpen);

export const isErrorPopUpOpenSelector = createSelector(timeLineSelector, data => data.errorPopUpIsOpen);

export const isWarningPopUpOpenSelector = createSelector(timeLineSelector, data => data.warningPopUpIsOpen);

export const isSuccessPopUpOpenSelector = createSelector(timeLineSelector, data => data.successPopUpIsOpen);

export const isEditCommentMenuOpenSelector = createSelector(timeLineSelector, data => data.editCommentMenuOpen);

export const isDeleteShiftMenuOpenSelector = createSelector(timeLineSelector, data => data.deleteShiftMenuOpen);

export const isCleanupMenuOpenSelector = createSelector(timeLineSelector, data => data.cleanupMenuOpen);

export const getConfirmPopUp = createSelector(timeLineSelector, data => data.confirmPopUp);

export const getInsertActivitySet = createSelector(timeLineSelector, data => data.insertActivitySet);

export const getScheduleModifiedPopUp = createSelector(timeLineSelector, data => data.scheduleModifiedPopUp);

export const isNewShiftOpenSelector = createSelector(timeLineSelector, data => data.newShiftMenuOpen);

export const getMultipleWizardType = createSelector(timeLineSelector, data => data.multipleWizardType);

export const isInsertBreakOpenSelector = createSelector(timeLineSelector, data => data.insertBreakMenuOpen);

export const isInsertMealOpenSelector = createSelector(timeLineSelector, data => data.insertMealMenuOpen);

export const isInsertExceptionOpenSelector = createSelector(timeLineSelector, data => data.insertExceptionOpen);

export const isInsertTimeOffOpenSelector = createSelector(timeLineSelector, data => data.insertTimeOffOpen);

export const isEditMultipleOpenSelector = createSelector(timeLineSelector, data => data.editMultipleOpen);

export const getInsertWorkSetOpen = createSelector(timeLineSelector, data => data.insertWorkSetOpen);

export const getInsertMarkedTimeOpen = createSelector(timeLineSelector, data => data.insertMarkedTime);

export const isRestoreScheduleOpenSelector = createSelector(timeLineSelector, data => data.restoreScheduleOpen);

export const isCopyToOpenSelector = createSelector(timeLineSelector, data => data.copyToOpen);

export const isSubMenuOpenSelector = createSelector(timeLineSelector, data => data.submenuOpen);

export const isMemoOpenSelector = createSelector(timeLineSelector, data => data.memoOpen);

export const scheduleCalculatedSelector = createSelector(timeLineSelector, data => data.calculatedSchedule);

export const isRebuildScheduleOpenSelector = createSelector(timeLineSelector, data => data.rebuildScheduleOpen);

export const isBuildScheduleOpenSelector = createSelector(timeLineSelector, data => data.buildScheduleOpen);

export const getBreaks = createSelector(timeLineSelector, data => data.breaks);

export const getMeals = createSelector(timeLineSelector, data => data.meals);

export const getShifts = createSelector(timeLineSelector, data => data.shifts);

export const getExceptions = createSelector(timeLineSelector, data => data.exceptions);

export const getTimeOff = createSelector(timeLineSelector, data => data.timeOffs);

export const getAuditLog = createSelector(timeLineSelector, data => data.auditLog);

export const getSetActivitiesFor = createSelector(timeLineSelector, (data: ITimeLine) => data.setActivitiesFor);

export const getEditCommentMenuDataSelector = createSelector(timeLineSelector, data => data.editCommentMenuInfo);

export const getSubMenuDataSelector = createSelector(timeLineSelector, data => data.submenuInfo);

export const getMemoInfoSelector = createSelector(timeLineSelector, data => data.memoInfo);

export const getDataSelector = createSelector(timeLineSelector, data => {
  return data.history.current.data;
});

export const meetingSchedulerListIsOpen = createSelector(timeLineSelector, data => data.meetingSchedulerListIsOpen);
export const meetingSchedulerCalendar = createSelector(timeLineSelector, data => data.meetingSchedulerCalendarIsOpen);
export const calendarIsOpen = createSelector(timeLineSelector, data => data.calendarOpen);
export const searchSettingsIsOpen = createSelector(timeLineSelector, data => data.searchSettingsIsOpen);
export const displaySettingsIsOpen = createSelector(timeLineSelector, data => data.displaySettingsIsOpen);
export const targetMenuIsOpen = createSelector(timeLineSelector, data => data.isTargetMenuOpen);

export const switchToClassicOpen = createSelector(timeLineSelector, data => data.switchToClassicOpen);

export const getInitDataSelector = createSelector(timeLineSelector, data => {
  return data.history.past.length ? data.history.past[0].data : data.history.current.data;
});

export const getModifiedData = createSelector(timeLineSelector, data => {
  return data.history.current.data.reduce((acc: IAgentTimeline[], agent) => {
    agent.isModified && acc.push(agent);
    return acc;
  }, []);
});

export const getModifiedAgentDays = createSelector(timeLineSelector, data => {
  return data.history.current.data.reduce((acc: IAgentTimeline[], agent) => {
    if (agent.isModified || agent.isFixLater) {
      acc.push({
        ...agent,
        days: agent.days.filter(day => day.isModified),
      });
    }
    return acc;
  }, []);
});

export const getFixLaterAgentDays = createSelector(timeLineSelector, data => {
  return data.history.current.data.reduce((acc: IAgentTimeline[], agent) => {
    if (agent.isFixLater) {
      acc.push({
        ...agent,
        days: agent.days.filter(day => day.isModified),
      });
    }
    return acc;
  }, []);
});

export const getColumns = createSelector(timeLineSelector, data => data.columns);

export const getTimelineOptions = createSelector(timeLineSelector, data => data.options as IOptions);

export const isColumnsMenuShow = createSelector(timeLineSelector, data => data.columnsMenu);

export const isViewMenuShow = createSelector(timeLineSelector, data => data.viewMenu);

export const isTzMenuShow = createSelector(timeLineSelector, data => data.tzMenu);

export const getView = createSelector(timeLineSelector, data => data.view);

export const getTimeFormat = createSelector(timeLineSelector, data => data.timeFormat as TimeFormatType);

export const getTextCoefficient = createSelector(timeLineSelector, data => data.textCoefficient);

export const getIsFullDay = createSelector(timeLineSelector, data => data.fullDayView);

export const getTimeDiscetness = createSelector(timeLineSelector, data => data.timeDiscreteness);

export const getIsModifiedData = createSelector(timeLineSelector, data => data.history.current.isModified);

export const getIsShowDelimiter = createSelector(timeLineSelector, data => data.showDelimiter);

export const getIsUseCustomColors = createSelector(timeLineSelector, data => data.useCustomColors);

export const getSelectedAgentsMulti = createSelector(timeLineSelector, state => {
  return (state.history.current.data ?? []).reduce(
    (acc: IAgentTimeline[], agent: IAgentTimeline) =>
      (state.selectedAgents ?? []).includes(agent.agentId) ? [...acc, agent] : [...acc],
    [],
  );
});
export const getAgentById = createSelector(timeLineSelector, state => {
  return state.history.current.data.find(agent => agent.agentId === state.selectedAgents[0]);
});
export const getTargetInfo = createSelector(timeLineSelector, data => {
  return data.targetInfo;
});

export const isMeetingSchedulerOpen = createSelector(timeLineSelector, data => data.meetingSchedulerOpen);

export const isMultipleWizardOpen = createSelector(timeLineSelector, data => data.multipleWizardOpen);

export const isMultipleMenuShow = createSelector(timeLineSelector, data => data.multipleDropdownOpen);

export const getClickedDay = createSelector(timeLineSelector, data => data.submenuInfo?.dateTimeSite);

export const getSumWidth = createSelector(timeLineSelector, TLstate => {
  let width = 0;
  TLstate.columns.map(element => {
    if (element.visible) {
      width = width + element.width;
    }
  });
  return width;
});

export const getSortBy = createSelector(timeLineSelector, data => data.sortBy);
export const getSortingProcess = createSelector(timeLineSelector, data => data.sortingProcess);

export const getIsOpenSomeModal = createSelector(
  timeLineSelector,
  data =>
    data.insertBreakMenuOpen ||
    data.insertMealMenuOpen ||
    data.restoreScheduleOpen ||
    data.insertExceptionOpen.isOpen ||
    data.insertTimeOffOpen.isOpen ||
    data.insertWorkSetOpen ||
    data.newShiftMenuOpen ||
    data.popUpOpen ||
    data.copyToOpen.isOpen ||
    data.editFullDayItemOpen ||
    data.meetingSchedulerOpen,
);

export const getBuffer = createSelector(timeLineSelector, data => data.buffer as IBuffer);

export const isMultipleCleanupOpen = createSelector(timeLineSelector, data => data.multipleCleanupOpen);
export const getTimeLIneDataForStorage = createSelector(timeLineSelector, data => ({
  sortType: data.sortType,
  sortBy: data.sortBy,
  columns: data.columns,
  view: data.view,
  timeFormat: data.timeFormat,
  textCoefficient: data.textCoefficient,
  timeDiscreteness: data.timeDiscreteness,
  fullDayView: data.fullDayView,
  showDelimiter: data.showDelimiter,
  options: data.options,
  useCustomColors: data.useCustomColors,
}));

export const getErrorPopUpOpen = createSelector(timeLineSelector, data => data.errorPopUpIsOpen.isOpen);

export const getScrollToIndex = createSelector(timeLineSelector, data => data.scrollToIndex);

export const getSitesMultipleTimezonesWarningSelector = createSelector(
  timeLineSelector,
  data => data.sitesMultipleTimezonesWarning,
);

export const isTimeLineDisabled = createSelector(timeLineSelector, data => data.isTimeLineDisabled);
