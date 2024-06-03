import {
  AGENT_SORT,
  IPossibleColumns,
  ISortBy,
  SORT_MODE,
  SORT_ORDER,
  SORT_TYPE,
} from '../../redux/ts/intrefaces/timeLine';

export const MainPath = '/customer/NewSupervisor';

export const LoginState = 'Login';
export const LoadingState = 'Loading';
export const FilterState = 'Filter';
export const TimeLineState = 'TimeLine';
export const ControlPanelState = 'ControlPanel';
export const SnapShotsState = 'SnapShots';
export const ChartState = 'ChartState';
export const GlobalErrorState = 'ErrorSlice';
export const ConfirmPopup = 'ConfirmPopup';
export const ScheduleScenariosState = 'ScheduleScenariosState';
export const ColorsState = 'Colors';

export const columnsForTable: IPossibleColumns[] = [
  {
    id: 'siteName',
    name: 'Site',
    visible: true,
    change: true,
    width: 85,
    sortType: SORT_TYPE.AGENT,
    sortMode: AGENT_SORT.SITE,
  },
  {
    id: 'teamName',
    name: 'Team',
    visible: true,
    change: false,
    width: 85,
    sortType: SORT_TYPE.AGENT,
    sortMode: AGENT_SORT.TEAM,
  },
  {
    id: 'agentName',
    name: 'Agent',
    visible: true,
    change: false,
    width: 140,
    sortType: SORT_TYPE.REGULAR,
    sortMode: AGENT_SORT.FIRST_NAME,
    // sortMode: AGENT_SORT.LAST_NAME,
  },
  {
    id: 'sharedTransport',
    name: 'Shared transport',
    visible: false,
    change: true,
    width: 85,
    sortType: SORT_TYPE.REGULAR,
    sortMode: AGENT_SORT.CARPOOL,
  },
  {
    id: 'overtime',
    name: 'Overtime',
    visible: false,
    change: true,
    width: 85,
    sortType: SORT_TYPE.REGULAR,
    sortMode: SORT_MODE.OVERTIME_HOURS,
  },
  {
    id: 'paidHours',
    name: 'Paid hours',
    visible: false,
    change: true,
    width: 85,
    sortType: SORT_TYPE.REGULAR,
    sortMode: SORT_MODE.PAID_HOURS,
  },
  {
    id: 'useTotalHours',
    name: 'Use total hours',
    visible: false,
    change: true,
    width: 85,
    sortType: SORT_TYPE.REGULAR,
    sortMode: SORT_MODE.SHIFT_LENGTH,
  },
  {
    id: 'shiftStartTime',
    name: 'Shift start time',
    visible: false,
    change: true,
    width: 85,
    sortType: SORT_TYPE.REGULAR,
    sortMode: SORT_MODE.SHIFT_START,
  },
  {
    id: 'shiftEndTime',
    name: 'Shift end time',
    visible: false,
    change: true,
    width: 85,
    sortType: SORT_TYPE.REGULAR,
    sortMode: SORT_MODE.SHIFT_END,
  },
  {
    id: 'shift',
    name: 'Shift',
    visible: false,
    change: true,
    width: 85,
    sortType: SORT_TYPE.REGULAR,
    sortMode: SORT_MODE.SHIFT_NAME,
  },
  {
    id: 'accessibility',
    name: 'Accessibility',
    visible: false,
    change: true,
    width: 85,
  },
  {
    id: 'comments',
    name: 'Comments',
    visible: false,
    change: true,
    width: 85,
  },
  {
    id: 'timeZone',
    name: 'Full time zone',
    visible: false,
    change: true,
    width: 200,
  },
  {
    id: 'shortTimeZone',
    name: 'Short time zone',
    visible: false,
    change: true,
    width: 85,
  },
  {
    id: 'timeZoneDifference',
    name: 'Time zone difference',
    visible: false,
    change: true,
    width: 200,
  },
];

export const initSortBy = ((): ISortBy => {
  const columnTeam = columnsForTable.find(({ sortMode }) => sortMode === AGENT_SORT.TEAM);
  const columnSite = columnsForTable.find(({ sortMode }) => sortMode === AGENT_SORT.SITE);
  const columnAgent = columnsForTable.find(({ sortMode }) => sortMode === AGENT_SORT.FIRST_NAME);
  const agentSort = [];
  if (columnTeam) {
    agentSort.push(columnTeam);
  }
  if (columnSite) {
    agentSort.push(columnSite);
  }
  return {
    agentSort,
    column: columnAgent,
    order: SORT_ORDER.SORT_ORDER_ASC,
  };
})();

export const lazyLoadingConf = {
  maxConcurrentRequests: 6,
  pageSize: 400,
};

export const filterSidebarState = {
  width: 370,
  isCollapsed: false,
};

export const commonElementLimits = {
  columnsMinWidth: 50,
  columnsMaxWidth: 450,
  filterSidebarMinWidth: 180,
  filterSidebarMaxWidth: 450,
};

export const CFG_INFO_TYPE = Object.freeze({
  /**
   * Provide Object ID only
   */
  OBJECT_ID: 0,
  /**
   * Provide Full Object information
   */
  OBJECT: 1,
  /**
   * Provide Brief or Short Object information
   */
  OBJECT_SHORT: 2,
});

export const SCH_STATE_TYPE = Object.freeze({
  /**
   * Nothing is scheduled for the agent. This is more theoretical state because there's really
   * no state scheduled but, nevertheless, it is sometimes useful to describe this "special -- empty"
   * agent state, e.g. when generating agent's compliance report.
   */
  0: 'none',
  /**
   * Day off state. This state is full-day state.
   */
  1: 'day_off',
  /**
   * Time Off. This state may and may not be full-day state depending on Time Off type.
   */
  2: 'time_off',
  /**
   * Exception state. This state may and may not be full-day state depending on exception type.
   */
  3: 'exception',
  /**
   * Break state. It is part-day state and so it always has start time and end time defined.
   * Break state can only exist within shift boundaries.
   */
  4: 'break',
  /**
   * Meal state. This state part-day state and so it always has start time and end time defined.
   * Meal state can only exist within shift boundaries.
   */
  5: 'meal',
  /**
   * Work Activity state. It is part-day state and so it always has start time and end time defined.
   * Since multi-skill agents can be scheduled to work on more then one activity at a time, there can
   * be several overlapping activity states for the same period of time. Activity state can only exist
   * within shift boundaries.
   */
  6: 'activity',
  /**
   * Activity Set state is artificial state - agent is never scheduled for this state. This state is
   * introduced just as a mean to group several Activity states into one logical state. Just as activity set
   * groups several activities together, Activity Set state group several Activity states. All Activity states
   * that are for activities that don't belong to any activity set are assigned to hypothetical "Work"
   * Activity Set state.
   */
  7: 'activity_set',
  /**
   * Shift state. Shift state is artificial state - agent is never scheduled for such state.
   * It is only introduced to describe scheduled shift boundaries, which all other part-day states
   * should fit in. There may also be situations that because of constraints no state can be scheduled
   * for some time window within shift boundaries. In such case Shift state is provided as scheduled state
   * for that time, and it should to be treated as a forced paid break.
   */
  8: 'shift',
  /**
   * Marked Time state. It is part-day state and so it always has start time and end time defined.
   * Marked Time state can only exist within shift boundaries and shall never overlap any Time Off state.
   */
  9: 'marked_time',
  10: 'workSet',
});

export type SCH_STATE_KEYS = keyof typeof SCH_STATE_TYPE;
export type SCH_STATE_VALUES = (typeof SCH_STATE_TYPE)[SCH_STATE_KEYS];

export const SCH_STATE_LAYOUT = Object.freeze({
  /**
   * Full-day states only, like Shift, Full-Day Exception, Day Off and Full-Day Time Off.
   */
  DAY: 0,

  /**
   * All states presented sequentially
   * Scheduled states are presented sequentially so that there is only one state at every given moment.
   * Exception to that are Activity states that are indeed scheduled concurrently. For instance,
   * multi-skilled agent is scheduled to work on two different activities at the same time.
   * This exception also applies to Shift state, which always works as a kind of vessel for all other
   * states and the most important characteristic of which are start and end times. This presentation
   * method is most natural for presenting agent schedules. Note that Marked Time state is never sequential
   * and will overlap other states because it is assumed as "transparent" by its nature.
   */
  SEQUENTIAL: 1,

  /**
   * States presented in overlapped way.
   * Scheduled states are presented in an overlapped providing information what scheduled state is hidden
   * behind others. This presentation method is very useful when editing scheduled states manually.
   */
  OVERLAPPED: 2,
});

export enum InfoType {
  /**
   * Provide Object ID only
   */
  OBJECT_ID = 0,
  /**
   * Provide Full Object information
   */
  OBJECT = 1,
  /**
   * Provide Brief or Short Object information
   */
  OBJECT_SHORT = 2,
}

export const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

//we take current year, next 10 years and previous 10 years
const currentYear = new Date().getFullYear();
export const years: string[] = [];

for (let i = currentYear - 10; i <= currentYear + 10; i++) {
  years.push(i.toString());
}
export const dayNameLocal = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const dayNameLocalFull = ['Monday', 'Tuesday', 'Wednesday', 'Thurthday', 'Friday', 'Saturday', 'Sunday'];
export const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const ZERO_TIME_FOR_OLE_DATE_IN_TIMESTAMP = -2209161600000;
export const ZERO_TIME_FOR_OLE_DATE_IN_ISO = '1899-12-30T00:00Z';
