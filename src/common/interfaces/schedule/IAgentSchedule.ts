import { DayFlag, DayType, RefType, SchStateType } from '../../constants/schedule';
import { TypeOrArrayOfTypes } from '../../types';

export interface IAgentSchedule {
  contractId: number;
  contracts: IContract[];
  agentName: string;
  buId: number;
  buName?: string;
  siteName?: string;
  teamName?: string;
  scheduleId?: number;
  agentId: number;
  userId?: number;
  siteId: number;
  date: string;
  startDate: string | number;
  endDate: string | number;
  teamId: number;
  dayId?: number;
  comments?: string;
  dayType: DayType;
  days: ISchDay[];
  uuid: string;
  timezoneId?: number;
}

export interface ISchDay {
  [key: string]: any;
  coverage?: ISchCoverage[];
  comments?: string;
  flag?: DayFlag;
  date: string | number;
  startDateTime: number | string;
  endDateTime: number | string;
  nextStartDateTime?: number | string;
  prevEndDateTime?: number | string;
  overtimeMinutes?: number;
  paidMinutes?: number;
  swordDescribe?: string;
  vacationMinutes?: number;
  workMinutes?: number;
  eligibleForTrade?: boolean;
  type: DayType;
  id: number;
  isSelected?: boolean;
  uuid?: string;
  dayState: ISchDayState | null;
  states: ISchState[];
  activities: ISchActivity[];
  activitySets: ISchActivitySet[];
  timestamp?: number;
  timezoneId?: number;
}

export interface ISchState {
  refId?: number;
  id: number;
  name?: string;
  shortName?: string;
  startDateTime: string | number;
  endDateTime: string | number;
  isPaid?: boolean;
  isFullDay?: boolean;
  isSelected?: boolean;
  paidMinutes?: number;
  memo?: string;
  refType?: RefType;
  type: SchStateType;
  changed?: boolean;
  isFullShiftActivity?: boolean;
  color?:string;
  fontColor?:string
}

export interface ISchCoverage {
  activityId: number;
  startMinute: number;
  endMinute: number;
}

export interface ISchAvailability {
  startDateTime: number | string;
  endDateTime: number | string;
}

export interface ISchActivitySet {
  activities: number[];
  availabilities?: ISchAvailability[];
  id: number;
  isFullDay?: boolean;
  name?: string;
  refId?: number;
  shortName?: string;
  tradeRule?: number;
  siteId?: TypeOrArrayOfTypes<number>;
}

export interface ISchActivity {
  id: number;
  setId: number;
  siteId: number[];
  name: string;
  shortName: string;
  isFullDay: boolean;
  tradeRule: number;
  virtualActivityId: number;
  maxSimultUsers?: number;
  minStaffing?: number;
  minStaffingType?: number;
  openHours?: IActivityHours;
  activitySkills?: IActivitySkill[];
  timestamp?: number;
}

export interface IActivityHours {
  startTime: object;
  duration: number;
}

export interface IActivitySkill {
  id: number;
  minLevel: number;
  maxLevel: number;
}

export interface ISchDayState {
  id: number;
  type: SchStateType;
  name?: string;
  shortName?: string;
  startDateTime: string | number | null;
  endDateTime: string | number | null;
  isPaid?: boolean;
  isFullDay?: boolean;
  paidMinutes?: number;
  memo?: string;
  changed?: boolean;
  color?:string;
  fontColor?:string;
}

export interface IContract {
  id: number;
  buId: number;
  siteId: number;
  name: string;
  icon: number;
}

export interface IMarkedTime {
  id: number;
  buId: number;
  siteId: number | number[];
  name: string;
  shortName: string;
  isPaid: boolean;
  color: string;
  fontColor: string;
  siteInfo: IMarkedTimeSiteInfo[];
  type: CfgMarkedTimeType;
}

export interface IMarkedTimeSiteInfo {
  id: number;
  name: string;
}

export enum CfgMarkedTimeType {
  NONE = 0,
  OVERTIME = 1,
  PAYBACK = 2,
}

export interface ISchWorkState {
  agentId: number | number[];
  siteId: number | number[];
  date: string | number;
  startDateTime: string | number;
  endDateTime: string | number;
  timezoneId?: number;
  markedTimeId?: number;
  overOfferId?: number;
  activities?: number[];
  virtualActivities?: number[];
}
