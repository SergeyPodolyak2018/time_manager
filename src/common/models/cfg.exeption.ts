import { ISites } from '../interfaces/config';

export interface ICfgException {
  id: number;
  buId: number;
  siteId: Array<number>;
  sites: ISites;
  name: string;
  shortName: string;
  isPaid: boolean;
  isFullDay: boolean;
  color: number;
  fontColor: number;
  isUsedInMeeting: boolean;
  isOnsite: boolean;
  isConvertable2dayOff: boolean;
  isUsedAsVacation: boolean;
  timeOffTypeId: number;
  tradeRule: TradeRuleEnum;
  isAgentInit: boolean;
  startDate: number;
  endDate: number;
  isBreaksDuringException: boolean;
}

export type TradeRuleEnum = 1 | 2 | 3 | 4;
