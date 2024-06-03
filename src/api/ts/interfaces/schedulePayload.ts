import { DayFlag, DayType } from '../../../common/constants/schedule';
import { TypeOrArrayOfTypes } from '../../../common/types';
import { IAgentSchedule } from '../../../common/interfaces/schedule/IAgentSchedule';

export interface Availability {
  startDateTime: string;
  endDateTime: string;
}

export interface ActivitySet {
  activitySetId: number;
  refId: number;
  activities: number[];
  availabilities: Availability[];
}

export interface SaveAgentDay {
  userId?: number;
  scheduleId?: number;
  siteId: number;
  teamId: number;
  agentId: number;
  date: string;
  dayId: number;
  dayType: DayType;
  startDateTime?: string;
  endDateTime?: string;
  swordDescribe?: string;
  flag?: DayFlag;
  paidMinutes?: number;
  workMinutes?: number;
  states: any[];
  vacationMinutes?: number;
  overtimeMinutes?: number;
  activities?: number[];
  activitySetInfo?: ActivitySet[];
  prevEndDateTime?: string;
  nextStartDateTime: string;
  eligibleForTrade?: boolean;
  timestamp?: number;
  ignoreWarnings?: boolean;
  autoCommit?: boolean;
}

export interface ISchSnapshot {
  snapshotId: string;
  agentDayCount: number;
  agentCount: number;
  timestamp: number;
}

export interface IfilterAgentDay {
  agentId: number[];
  siteId: number[];
  buId: number[];
  teamId: number[];
  activities: string[] | number[];
  date: string;
  timezoneId: number;
}

export interface IInputfilterAgentDay {
  agentId: number[];
  siteId: number[];
  buId: number[];
  teamId: number[];
  activities: string[] | number[];
}

export interface IAuditLog {
  siteId: number;
  teamIds?: TypeOrArrayOfTypes<number>;
  agentIds?: TypeOrArrayOfTypes<number>;
  date: string;
}

export interface IRollbackSchedule {
  auditId: number;
  siteId: number;
  teamIds?: TypeOrArrayOfTypes<number>;
  agentIds?: TypeOrArrayOfTypes<number>;
  date: string;
}

export interface IDeleteAgentDay {
  startDateTime: string;
  endDateTime: string;
  agentFilter: {
    // siteId: number;
    // buId: number;
    agentId?: number | number[];
    siteId?: number | number[];
    wmTeamId?: number | number[];
  };
}

export interface IValidateAgentDay {
  scheduleId?: number;
  agentDays: IAgentSchedule[];
}
