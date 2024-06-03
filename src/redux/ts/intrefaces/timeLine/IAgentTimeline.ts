import { SCH_STATE_VALUES } from '../../../../common/constants';
import { SchStateType } from '../../../../common/constants/schedule';
import { ITimezone } from '../../../../common/interfaces/config/ITimezone';
import { IAgentSchedule, ISchActivity, ISchDay } from '../../../../common/interfaces/schedule/IAgentSchedule';
import { IWarning } from '../../../../common/interfaces/schedule/IWarning';

export interface IAgentTimeline extends IAgentSchedule {
  activities: ITimelineAgentActivity[];
  _TZ_INTERNAL_USAGE: IAgentInternalTz;
  days: IAgentDayTimeline[];
  warnings?: IWarning | null;
  timezoneId?: number;
  timeZone?: string;
  isBuild?: boolean;
  isModified?: boolean;
  isFixLater?: boolean;
  isSave?: boolean;
  shiftStartTime?: string;
  shiftEndTime?: string;
  shortTimeZone?: string;
  timeZoneDifference?: string;
  errors?: string[];
  isEditedInReviewWarning?: boolean;
  // contracts: IContract[];
}

export interface IAgentDayTimeline extends ISchDay {
  isBuild?: boolean;
  isModified?: boolean;
  timeZoneSite: ITimezone;
  errors?: any;
  timeZoneSelected: ITimezone;
}

export interface ITimelineAgentActivity {
  type: SCH_STATE_VALUES;
  name?: string;
  isFullDay?: boolean;
  start: number;
  end: number;
  _id?: number;
  id: string;
  isPaid?: boolean;
  uniqueId?: string;
  agentId?: number;
  date: string | number;
  shortName?: string;
  dayIndex: number;
  stateIndex?: number;
  activities: ISchActivity[];
  dayDate: number | string;
  stateId?: number;
  memo?: string;
  refId?: number;
  states?: ITimelineAgentActivity[];
  _type?: SchStateType;
  isFullShiftActivity?: boolean;
  color?: string;
  fontColor?: string;
}

export interface IAgentInternalTz {
  tzSite: ITimezone;
  tzSelected: ITimezone;
}
