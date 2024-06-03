import { IChartsData } from '../timeLine';

export interface IChartHistory {
  past: IChartHistoryData[];
  current: IChartHistoryData;
  future: IChartHistoryData[];
}

export interface IChartHistoryData {
  data: IChartsData;
  granularity: number;
  isModified?: boolean;
}
