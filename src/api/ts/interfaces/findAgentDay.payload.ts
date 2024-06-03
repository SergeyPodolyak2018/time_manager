import { SchStateType } from '../../../common/constants/schedule';
import { InfoType } from '../../../common/constants';

export interface FindAgentDay {
  agentId?: number | number[];
  siteId?: number | number[];
  buId?: number | number[];
  teamId?: number | number[];
  contractId?: number;
  employeeId?: number;
  firstName?: string;
  lastName?: string;
  date: string;
  startDate?: string;
  endDate?: string;
  timezoneId?: number;
  infoType?: InfoType;
  stateLayout?: number;
  activities?: number[];
  virtualActivities?: number[];
  stateTypes?: SchStateType[];
}
