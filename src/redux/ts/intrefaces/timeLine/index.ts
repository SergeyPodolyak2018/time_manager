import { SCH_STATE_VALUES } from '../../../../common/constants';
import { RefType, SchStateType } from '../../../../common/constants/schedule';
import { IBusinessUnits, ISites } from '../../../../common/interfaces/config';
import { ITimezone } from '../../../../common/interfaces/config/ITimezone';
import { ISchActivity, ISchState } from '../../../../common/interfaces/schedule/IAgentSchedule';
import { IMeetingInfo } from '../../../../common/interfaces/schedule/IMeetingInfo';
import { ICfgAuditLog } from '../../../../common/models/cfg.auditLog';
import { ReviewWarningsType } from '../../../../components/ScheduleComponents/Popups/ReviewWarningsPopup/ReviewWarningsPopup';
import { IChartHistory } from '../chart/IHistory';
import { IAgentTimeline } from './IAgentTimeline';
import { ITimelineHistory } from './IHistory';
import { WizardType } from './WizardType';

export interface ITimeLine {
  meetingSchedulerCalendarIsOpen?: boolean;
  meetingSchedulerListIsOpen?: boolean;
  agentsWithSaveWarnings: IAgentTimeline[];
  reviewWarningsType: ReviewWarningsType;
  loading: boolean;
  selectedAgents: number[];
  selectedActivity: ISelectedActivity[];
  sortType: 'bySite' | 'byName';
  popUpOpen: boolean;
  editFullDayItemOpen: boolean;
  submenuOpen: boolean;
  targetInfo: ITargetInfo | null;
  submenuInfo: ISubMenuType | null;
  memoOpen: boolean;
  memoInfo: IMemoInfoType | null;
  history: ITimelineHistory;
  sortBy: ISortBy;
  sortingProcess: boolean;
  breaks: any[] | null;
  meals: any[] | null;
  shifts: any[] | null;
  exceptions: IException[] | null;
  timeOffs: ITimeOff[] | null;
  auditLog: ICfgAuditLog | null;
  columns: IPossibleColumns[];
  view: 'table' | 'site' | 'team';
  timeFormat: TimeFormatType;
  columnsMenu: boolean;
  viewMenu: boolean;
  tzMenu: boolean;
  textCoefficient: number;
  newShiftMenuOpen: boolean;
  insertMealMenuOpen: boolean;
  insertBreakMenuOpen: boolean;
  insertExceptionOpen: IInsertMenuParam;
  insertTimeOffOpen: IInsertMenuParam;
  editMultipleOpen: IInsertMenuParam;
  multipleCleanupOpen: boolean;
  restoreScheduleOpen: boolean;
  copyToOpen: ICopyToMenuParam;
  insertWorkSetOpen: boolean;
  confirmPopUp: {
    isOpen: boolean;
    onConfirm: () => void;
    onClose: () => void;
    onDiscard: () => void;
    onResult: (res: 'save' | 'discard' | 'close') => void;
  };
  scheduleModifiedPopUp: {
    onConfirm?: () => void;
    onDiscard?: () => void;
    onClose?: () => void;
    onResult?: () => void;
    isOpen: boolean;
  };
  rebuildScheduleOpen: {
    isOpen: boolean;
  };
  buildScheduleOpen: {
    isOpen: boolean;
  };
  error: any;
  timeDiscreteness: number;
  fullDayView: boolean;
  deleteShiftMenuOpen: boolean;
  cleanupMenuOpen: boolean;
  editCommentMenuOpen: boolean;
  editCommentMenuInfo: any;
  saveErrors: [];
  showDelimiter: boolean;
  useCustomColors: boolean;
  errorPopUpIsOpen: IErrorPopUpParam;
  meetingSchedulerOpen: boolean;
  multipleWizardOpen: boolean;
  multipleWizardType: WizardType;
  multipleDropdownOpen: boolean;
  calendarOpen: boolean;
  switchToClassicOpen: boolean;
  searchSettingsIsOpen: boolean;
  displaySettingsIsOpen: boolean;
  buffer: IBuffer;
  isTargetMenuOpen: boolean;
  insertMarkedTime: boolean;
  saveAgentDayParams: ISaveAgentDayParams;
  insertActivitySet: boolean;
  warningPopUpIsOpen: IWarningPopUpParam;
  successPopUpIsOpen: ISuccessPopUpParam;
  setActivitiesFor: SetActivitiesFor;
  calculatedSchedule: ICalculatedSchedule;
  // todo: temp
  agentWorkDays: number;
  scrollToIndex: number;
  sitesMultipleTimezonesWarning: boolean;
  options: IOptions;
  isTimeLineDisabled: boolean;
}

export interface IOptions {
  pinColumn: boolean;
}

export enum SetActivitiesFor {
  NONE = '',
  WORK = 'Work',
  ACTIVITY_SET = 'Activity Set',
  WORK_SET = 'Work Set',
}
export type TimeFormatType = '12hours' | '24hours';
export interface ISaveAgentDayParams {
  ignoreWarnings?: boolean;
  checkTimestamp?: boolean;
  refreshSchedule?: boolean;
  allOrNothing?: boolean;
}

export interface ISelectedActivity {
  refId: number;
  isFullDay: boolean;
  states?: ISchState[];
  type: SCH_STATE_VALUES;
  id: number;
  uniqueId: number;
  agentId: number;
  shiftName: string;
  activities: ISchActivity[];
  shiftStart: number;
  shiftEnd: number;
  name: string;
  agentName: string;
  start: number;
  end: number;
  dayIndex: number;
  dayDate: number;
  stateIndex?: number;
  stateId: number;
  shortName: string;
  date: string;
  memo?: string;
  _type: SchStateType;
  _id: number;
  isPaid?: boolean;
  refType?: RefType;
  paidMinutes?: number;
  setId?: number;
  isFullShiftActivity?: boolean;
  warningPopUpIsOpen?: boolean;
  meetingInfo?: IMeetingInfo;
}

export type RefTypeEnum = 0 | 1 | 2 | 4 | 5 | 6 | 7;

export interface ISubMenuType {
  type: string;
  agentId: number;
  activityId: number;
  left: number;
  top: number;
  isRight?: boolean;
  menuType: number;
  dateTime: number | string;
  dateTimeSite: string;
}

export interface IMemoInfoType {
  agentId: number;
  activityId: number;
  memo: string;
  left: number;
  top: number;
  isRight?: boolean;
  referenceElement: any;
}

export interface IEditCommentMenu {
  agent: IAgentTimeline;
}

export enum SORT_TYPE {
  REGULAR,
  AGENT,
}

export enum AGENT_SORT {
  NONE = 0,
  EMPLOYEE_ID = 1,
  FIRST_NAME = 2,
  LAST_NAME = 3,
  TEAM = 4,
  CONTRACT = 5,
  RANK = 6,
  HIRE_DATE = 7,
  SITE = 8,
  BU = 9,
  CARPOOL = 10,
  ROTATION = 11,
}

export enum SORT_MODE {
  NONE = 0,
  SHIFT_START = 100,
  SHIFT_LENGTH = 101,
  SHIFT_NAME = 102,
  PAID_HOURS = 103,
  OVERTIME_HOURS = 104,
  SHIFT_END = 105,
  WEEK_PAID = 106,
  PERIOD_PAID = 107,
  FIRST_EXCEPTION_START = 108,
  USER_NAME = 109,
  FIRST_MEAL_START = 110,
  RANKING_POSITION = 111,
}

export enum SORT_ORDER {
  SORT_ORDER_ASC,
  SORT_ORDER_DESC,
}

export interface IPossibleColumns {
  id: string;
  name: string;
  visible: boolean;
  change: boolean;
  width: number;
  sortType?: number;
  sortMode?: number;
}

export type TTimezoneHashes = { [key: number]: ITimezone };
export interface IControlPanel {
  timezone: ITimezone[];
  selectedTz: ITimezone;
  activeDate: string;
  sitesMultipleTimezonesWarning: boolean;
  loader: IControlPanelLoader;
  timezonesHash: TTimezoneHashes;
}

export enum ControlPanelLoaderKey {
  timezones = 'timezones',
}

export interface IControlPanelLoader {
  [ControlPanelLoaderKey.timezones]: boolean;
}

export enum ContractShiftType {
  PRIMARY = 1,
  SECONDARY = 2,
}

export interface IShiftContract {
  id: number;
  shiftId: number;
  shiftType: ContractShiftType;
}

export interface IShifts {
  shiftContracts: IShiftContract[];

  openWeekDays: boolean[];
  shiftTitle: string;
  id: number;
  buId: number;
  siteId: number[];
  name: string;
  breaks: ICfgBreak[];
  meals: ICfgMeal[];
  minDuration?: number;
  maxDuration?: number;
  earliestStartTime?: number;
  latestEndTime?: number;
  latestEndDuration?: number;
  latestStartDuration?: number;
  earliestEndDuration?: number;
}

export interface ICfgBreak {
  id: number;
  buId: number;
  siteId: number | number[];
  name: string;
  shortName: string;
  isPaid: boolean;
  duration: number;
  startStep: number;
  siteInfo?: ISiteInfo;
  minLengthBefore: number;
  maxLengthBefore: number;
  minLengthAfter: number;
  startOffset: number;
  maxDistance: number;
  anchor: number;
}

export interface ICfgMeal {
  id: number;
  buId: number;
  siteId: number | number[];
  name: string;
  shortName: string;
  isPaid: boolean;
  duration: number;
  endTime: number;
  startStep: number;
  siteInfo?: ISiteInfo;
  startTime: number;
  endDuration: number;
  lengthBeforeMeal: number;
  lengthAfterMeal: number;
}

export interface ISiteInfo {
  id: number;
  name: string;
}

export interface IBreakMeal {
  anchor: number;
  buId: number;
  duration: number;
  id: number;
  isPaid: boolean;
  maxDistance: number;
  maxLengthBefore: number;
  minLengthAfter: number;
  minLengthBefore: number;
  name: string;
  shortName: string;
  memo: string;
  siteId: number[];
  startOffset: number;
  startStep: number;
  color?:string,
  fontColor?:string,
}

export interface IException {
  buId: number;
  id: number;
  siteId: number[];
  sites?: ISites;
  name: string;
  shortName: string;
  isPaid: boolean;
  isFullDay: boolean;
  color?: string;
  fontColor?: string;
  isUsedInMeeting: boolean;
  isConvertable2dayOff: boolean;
  isOnsite: boolean;
  isUsedAsVacation: boolean;
  timeOffTypeId: number;
  tradeRule: number;
  isAgentInit: boolean;
  startDate: number;
  endDate: number;
  isBreaksDuringException: boolean;
  siteInfo: ISiteInfo[];

}

export interface ITimeOff {
  buId: number;
  color?: string;
  fontColor?: string;
  id: number;
  isHasLimit: boolean;
  isPaid: boolean;
  name: string;
  shortName: string;
  siteId: number[];
  // sites?: ISites;
  tradeRule: number;
  siteInfo: ISiteInfo[];
}

export interface IActivities {
  id: number;
  setId: number;
  name: string;
}
export interface IActivitiesSetGroup {
  id: number;
  buId: number;
  siteId: number[];
  name: string;
  activities: IActivities[];
  open: boolean;
}

export interface ISnapShotRequest {
  snapshotId?: string;
  agentId?: number[];
  siteId?: number[];
  buId?: number[];
  teamId?: number[];
  contractId?: number[];
  employeeId?: number[];
  firstName?: string;
  lastName?: string;
  date: string;
  activities?: number[];
  timezoneId: number;
  groupMode?: number;
  sortMode?: number;
  ascending?: boolean;
  startDate?: string;
  endDate?: string;
  stateTypes?: SchStateType[];
}

export interface ISnapShot {
  agentId?: number[];
  siteId?: number[];
  buId?: number[];
  teamId?: number[];
  employeeId?: number[];
  firstName?: string;
  lastName?: string;
  date: string;
  timezoneId: number;
  id: string;
  agentCount?: number;
  agentDayCount?: number;
  timestamp?: number;
}

export interface ISnapShots {
  snapShots: { [key: string]: ISnapShot };
  last: string;
}
export interface IChartsData {
  ITEM_COVERAGE_SCHEDULED: number[];
  ITEM_STAFFING_CALCULATED: number[];
  ITEM_STAFFING_REQUIRED: number[];
  ITEM_DIFFERENCE_STAFFING_CALCULATED_OVERTIME_REQUIRED: number[];
  ITEM_DIFFERENCE_COVERAGE_SCHEDULED_OVERTIME_SCHEDULED: number[];
}

export interface ICharts {
  active: string[];
  checkedItems: IBusinessUnits;
  useMSA: boolean;
  bindGraph: boolean;
  history: IChartHistory;
  loading: boolean;
  containerScrollPosition: number;
}

export interface IInsertMenuParam {
  isOpen: boolean;
  isFullDay: boolean;
}

export interface ICopyToMenuParam {
  isOpen: boolean;
  selectedActivity: ISelectedActivity[] | null;
  isMultiple: boolean;
  isVisible?: boolean;
}

export interface IErrorPopUpParam {
  isOpen: boolean;
  data: string;
}

export interface IWarningPopUpParam {
  isOpen: boolean;
  data: string;
  agents?: IAgentTimeline[];
  onApplyAction?: () => void;
  rerender?: boolean;
  scheduleShiftItems?: boolean;
  isSaveSelected?: boolean;
  refreshTimeline?: boolean;
  ignoreWarnings?: boolean;
  discard?: boolean;
}

export interface ISuccessPopUpParam {
  isOpen: boolean;
  data: string;
}

export interface ISortBy {
  agentSort?: IPossibleColumns[];
  column?: IPossibleColumns;
  order?: SORT_ORDER;
}

export interface ITargetInfo {
  top: number;
  left: number;
  time: string;
  agentId: number;
}

export interface IBuffer {
  elements: IBufferElement[] | null;
  elementsType: BufferElementsType;
  stateType: SchStateType;
}

export interface IBufferElement {
  index: number;
  timeLine: IAgentTimeline;
  activity: ISelectedActivity;
}

export enum BufferElementsType {
  NONE,
  SHIFT_OR_WORK_SET,
  STATE,
  DIFFERENT,
}

export interface IRebuildScheduleParam {
  isOpen: boolean;
}

export interface IBuildScheduleParam {
  isOpen: boolean;
}

export interface ICalculatedSchedule {
  shifts: IShifts[];
  meals: ICfgMeal[];
  breaks: ICfgBreak[];
  agentsTimeline?: IAgentTimeline[];
  forecast: number[];
  isCalculated: boolean;
  isRecalculation: boolean;
  data: {
    coverage: { value: number }[];
    shifts: { startShift: number; endShift: number; isDayOff: boolean }[];
  };
  control: {
    agents: number[];
    agentIdsSmaller: number[];
    agentIdsLarger: number[];
    agentIdsEarlier: number[];
    agentIdsLater: number[];
    overtimeEnabled: boolean;
    overtimeDaily: number;
    coverageSmoothing: number;
    coverageMultiply: number;
    mealsPositioning: number;
    breaksPositioning: number;
    agentsCount: number;
  };
}

export type IColor = {
  [K in keyof typeof SchStateType]?:{
    color?: string,
    fontColor?: string
  }
}
export type IColors = {
  [key: number]: IColor;
}
export type IColorPayload = {
  buId:number;
  colors:IColor;
}