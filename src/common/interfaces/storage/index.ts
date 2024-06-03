import { FilterState, TimeLineState, ChartState, ControlPanelState } from '../../constants';
import { IPossibleColumns, ISortBy } from '../../../redux/ts/intrefaces/timeLine';
import { IFilterSidebarState } from '../../../redux/ts/intrefaces/filter';
import { ITimezone } from '../config/ITimezone';

export interface IStorageBaseObject {
  [TimeLineState]: ITimeLineStateSave;
  [ChartState]: IChartStateSave;
  [FilterState]: IFilterStateSave;
  [ControlPanelState]:IControlPanelStateSave;
}

export interface ITimeLineStateSave {
  sortType: 'bySite' | 'byName';
  sortBy: ISortBy;
  columns: IPossibleColumns[];
  view: 'table' | 'site' | 'team';
  timeFormat: '12hours' | '24hours';
  textCoefficient: number;
  timeDiscreteness: number;
  fullDayView: boolean;
  showDelimiter: boolean;
  useCustomColors: boolean;
}
export interface IChartStateSave {
  bindGraph: boolean;
}

export interface IFilterStateSave {
  sidebar: IFilterSidebarState;
}
export interface IControlPanelStateSave {
  selectedTz: ITimezone;
}

export interface IControlChartState {
  name:string;
  value: any;
}
