import { InfoType } from '../../../common/constants';
import { SchStateType } from '../../../common/constants/schedule';
import { IAgentSchedule } from '../../../common/interfaces/schedule/IAgentSchedule';
import { TypeOrArrayOfTypes } from '../../../common/types';
import { ApiCallParams } from '../apiCall';
import { ISchScenarioParams } from './SchScenarioParams';
import { IAgentTimeline } from '../../../redux/ts/intrefaces/timeLine/IAgentTimeline';
import {ICfgBreak, ICfgMeal, IShifts} from '../../../redux/ts/intrefaces/timeLine';

export interface FetchBu {
  buId?: TypeOrArrayOfTypes<number>;
  infoType?: number;
}

export type FetchTeams = ApiCallParams<'/customer/config/buildTreeWithTeamByBuAndSiteId', 'post'>;

export interface SearchTeams {
  firstName: string;
}

export interface FetchAgents {
  teamId: number[];
  buId: number;
  siteId: number;
  infoType?: InfoType;
  snapshotId?: string;
  contractId?: number | number[];
}

export interface SearchAgents {
  firstName?: string;
  lastName?: string;
  employeeId?: string;
}

export type FindShifts = ApiCallParams<'/customer/config/findShifts', 'post'>;
// {
//   buId?: TypeOrArrayOfTypes<number>;
//   siteId?: TypeOrArrayOfTypes<number>;
//   shiftId?: TypeOrArrayOfTypes<number>;
//   contractId?: TypeOrArrayOfTypes<number>;
//   date?: string | string[];
//   mealId?: TypeOrArrayOfTypes<number>;
//   breakId?: TypeOrArrayOfTypes<number>;
//   taskSequenceId?: TypeOrArrayOfTypes<number>;
//   snapshotId?: string;
//   provideMeals?: boolean;
//   provideBreaks?: boolean;
// }
export interface FindMeals {
  buId?: TypeOrArrayOfTypes<number>;
  siteId?: TypeOrArrayOfTypes<number>;
  agentId?: TypeOrArrayOfTypes<number>;
  teamId?: TypeOrArrayOfTypes<number>;
  id?: TypeOrArrayOfTypes<number>;
  type?: TypeOrArrayOfTypes<SchStateType>;
  useAgentFilter?: boolean;
}

export interface FindBreaks {
  buId?: TypeOrArrayOfTypes<number>;
  siteId?: TypeOrArrayOfTypes<number>;
  agentId?: TypeOrArrayOfTypes<number>;
  teamId?: TypeOrArrayOfTypes<number>;
  id?: TypeOrArrayOfTypes<number>;
  type?: TypeOrArrayOfTypes<SchStateType>;
  useAgentFilter?: boolean;
}

export interface ICloseAgentDaySnapshot {
  snapshotId: string;
  isLast?: boolean;
}

export interface IOpenAgentDaySnapshot {
  agentId?: number[];
  siteId?: number[];
  buId?: number[];
  teamId?: number[];
  employeeId?: number[];
  firstName?: string;
  lastName?: string;
  date: string;
  activities?: number[];
  timezoneId?: number;
  contractId?: number | number[];
  startDate?: string;
  endDate?: string;
  groupMode?: number;
  sortMode?: number;
  ascending?: boolean;
}

export interface IFindAgentDayFromSnapshot {
  contractId?: TypeOrArrayOfTypes<number>;
  date: string;
  timezoneId?: number;
  infoType?: InfoType;
  snapshotId: string;
  firstIndex?: number;
  lastIndex?: number;
  autoRefresh?: boolean;
  startDate?: string;
  endDate?: string;
  stateTypes?: SchStateType[];
}

export interface ISortAgentDaySnapshot {
  snapshotId?: string;
  groupMode?: number;
  sortMode?: number;
  ascending?: boolean;
  date?: string;
}

export interface IFetchAgentDayFromSnapshot {
  date?: string;
  timezoneId?: number;
  infoType?: 0 | 1 | 2;
  snapshotId: string;
  firstIndex?: number;
  lastIndex?: number;
  autoRefresh?: boolean;
}

export interface IFindPerformanceDataFromSnapshot {
  targetId: number;
  targetType?: number; //ACTIVITY = 0 , MULTI_SITE_ACTIVITY = 1, SITE = 2, BUSINESS_UNIT = 3, ENTERPRISE = 4
  startDate: string;
  endDate: string;
  granularity?: number;
  timezoneOption?: number; //OPTION_SERVER_TZ = -1, OPTION_TARGET_TZ = 0, OPTION_USER_TZ = 1, TZ_OPTION_LOCAL_TZ = 2
  timezoneId?: number;
  requestedItems?: number[];
  branch?: number; //ActivitySelectionBranch ,SITE_BRANCH = 0, VIRTUAL_ACTIVITY_BRANCH = 1
  snapshotId: string;
  agentDays?: IAgentSchedule[];
}

export interface IFindShiftItemsPayload {
  buId?: number | Array<number>;
  siteId?: number | Array<number>;
  shiftId?: number | Array<number>;
  agentId?: number | Array<number>;
  teamId?: number | Array<number>;
  id?: number | Array<number>;
  useAgentFilter?: boolean;
}

export interface IInsertAgentDayPayload {
  agentId: number[];
  siteId: number[];
  buId: number[];
  teamId: number[];
  contractId: number[];
  agentDays: IAgentSchedule[];
  buildAgentDay: boolean;
  ignoreWarnings: boolean;
  allOrNothing: boolean;
  autoCommit: boolean;
}

export interface IBuildScheduleData {
  agents: number[];
  overtimeEnabled: boolean;
  overtimeDaily?: number;
  minimizeAgent: number;
  multiply: number;
  smooth: number;
  midMeal: number;
  midBreak: number;
}

export interface IGetScenarioParamsPayload {
  scheduleId: number;
  siteIds: number[];
}

export interface ISetScenarioParamsPayload {
  scheduleId: number;
  params: ISchScenarioParams[];
}

export interface IRebuildRequestPayload {
  requestId: string;
  sid: string;
}

export interface ICreateReOptimizationParam {
  siteId: number;
  agents?: number[];
  teams?: number[];
  staffingType: number;
  teamConstraints: number;
  teamWorkWindow: number;
  isMultiSkill: boolean;
  isExcludeGranted: boolean;
  isShuffleAgents: boolean;
  isIgnoreConstraints: boolean;
  isSynchStartTime: boolean;
  isSynchDaysOff: boolean;
  isSynchDuration: boolean;
  isSynchMeals: boolean;
  isSynchBreaks: boolean;
  grantAllPreferences: boolean;
  useSecondaryActivities: boolean;
}

export interface ICreateReOptimizationRequestPayload {
  scheduleId: number;
  params: ICreateReOptimizationParam[];
  activities?: number[];
  reOptimizationType: ReOptimizationType;
  timezoneId?: number;
  startDate?: string;
  endDate?: string;
  dates: string[];
  startMinute: number;
  isModified: boolean;
  isFixShiftStart: boolean;
  isFixShiftEnd: boolean;
  isFixShiftPaidDuration: boolean;
  useCurrentAgentDayActivities: boolean;
  saveToCommitted: boolean;
}

export enum ReOptimizationType {
  BREAKS = 1,
  BREAKS_MEALS,
  ACTIVITIES,
  BREAKS_MEALS_ACTIVITIES,
  SHIFTS,
}

export enum TargetType {
  ACTIVITY = 0,
  MULTI_SITE_ACTIVITY = 1,
  SITE = 2,
  BUSINESS_UNIT = 3,
  ENTERPRISE = 4,
}

export interface ICalcSchedule {
  currentDate: number;
  dayDate: string;
  forecast: number[];
  granularity: number;
  shifts: IShifts[],
  meals: ICfgMeal[],
  breaks: ICfgBreak[],
  agents: IAgentTimeline[];
  overtimeAgents: number[];
  agentIdsSmaller: number[],
  agentIdsLarger: number[],
  agentIdsEarlier: number[],
  agentIdsLater: number[],
  isOvertimeEnabled: boolean;
  overtimeDaily: number;
  smooth?: number;
  multiply?: number;
  midMeal?: number;
  midBreak?: number;
  agentCountLevel?: number;
}

export interface ISessionRequestIdPayload {
  requestId: string;
}

export interface ISessionCancelRequestPayload {
  requestId: string;
}

export interface ISessionRequestStatusPayload {
  requestId: string;
}

export type TGetColorsPayload = {
  buId: number
}