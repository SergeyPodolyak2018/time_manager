import { CfgMarkedTimeType } from '../../../common/interfaces/schedule/IAgentSchedule';

export interface FindMarkedTimePayload {
  agentId?: number | number[];
  siteId?: number | number[];
  buId?: number | number[];
  teamId?: number | number[];
  shiftId?: number | number[];
  id?: number | number[];
  type?: CfgMarkedTimeType;
}
