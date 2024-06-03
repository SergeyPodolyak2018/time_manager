import { DayType, SchStateType } from '../../constants/schedule';
import { ISchActivity, ISchActivitySet } from './IAgentSchedule';

export interface ICreateSchState {
  id?: number;
  name?: string;
  shortName?: string;
  startDateTime?: string | number;
  endDateTime?: string | number;
  isPaid?: boolean;
  isFullDay?: boolean;
  isSelected?: boolean;
  paidMinutes?: number;
  memo?: string;
  type?: SchStateType;
}

export interface ICreateSchDayState {
  id?: number;
  type?: SchStateType;
  name?: string;
  shortName?: string;
  startDateTime?: string | number;
  endDateTime?: string | number;
  isPaid?: boolean;
  isFullDay?: boolean;
  paidMinutes?: number;
  memo?: string;
}

export interface ICreateSchDay {
  id?: number;
  date?: string | number;
  startDateTime?: number | string;
  endDateTime?: number | string;
  type?: DayType;
  dayState?: ICreateSchDayState;
  states?: ICreateSchState[];
  activities?: ISchActivity[];
  activitySets: ISchActivitySet[];
}
