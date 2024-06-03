export interface ICfgTimeOff {
  id: number;
  buId: number;
  siteId: number | Array<number>;
  name: string;
  shortName: string;
  isPaid: boolean;
  color: number;
  fontColor: number;
  tradeRule: TradeRuleEnum;
  isHasLimit: boolean;
}

export type TradeRuleEnum = 1 | 2 | 3 | 4;
