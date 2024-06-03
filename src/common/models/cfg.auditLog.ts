import { IAgentSchedule } from '../interfaces/schedule/IAgentSchedule';
export enum ActionType {
  UNKNOWN = 0,
  MODIFY = 1,
  CLEANUP = 2,
  PUBLISH = 3,
  TRADE = 4,
  ROLLBACK = 5,
}
export interface SchTransaction {
  userId: number;
  userName?: string;
  userFirstName?: string;
  userLastName?: string;
  siteId: number;
  action: ActionType;
  rollbackAuditId: number;
  auditId: number;
  timestamp: number;
}

export interface ICfgAuditLog {
  transactions: SchTransaction[];
  schedules: IAgentSchedule[];
}
