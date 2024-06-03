import { omit } from 'ramda';

import { SchStateType } from '../../common/constants/schedule';
import { ITimezone } from '../../common/interfaces/config/ITimezone';
import { ISchDayState } from '../../common/interfaces/schedule/IAgentSchedule';
import DateUtils from '../dateUtils';
import DateUtilsTimeZone from '../DateUtilsTimeZone';

class SchDayState {
  constructor(options: ISchDayState) {
    Object.assign(this, options);
  }

  static create({
    type,
    startDateTime,
    endDateTime,
    id,
    isFullDay,
    name,
    shortName,
    isPaid,
    paidMinutes,
  }: ISchDayState): ISchDayState {
    return {
      type,
      startDateTime,
      endDateTime,
      id,
      isFullDay,
      name,
      shortName,
      isPaid,
      paidMinutes,
    };
  }

  static editTime(dayState: ISchDayState, startDateTime: number, endDateTime: number): ISchDayState {
    return {
      ...dayState,
      name: String(dayState.name),
      shortName: String(dayState.shortName),
      startDateTime,
      endDateTime,
    };
  }

  static moveDayState(dayState: ISchDayState, differenceInTime: number) {
    if (!dayState.startDateTime || !dayState.endDateTime) return dayState;
    return {
      ...dayState,
      name: String(dayState.name),
      shortName: String(dayState.shortName),
      startDateTime: +dayState.startDateTime + differenceInTime,
      endDateTime: +dayState.endDateTime + differenceInTime,
      changed: true,
    };
  }

  static setStartEnd(dayState: ISchDayState, start: number, end: number) {
    if (!dayState.startDateTime || !dayState.endDateTime) return dayState;
    return {
      ...dayState,
      name: String(dayState.name),
      shortName: String(dayState.shortName),
      startDateTime: start,
      endDateTime: end,
      changed: true,
    };
  }

  static remove(dayState: ISchDayState): ISchDayState {
    return {
      ...dayState,
      name: String(dayState.name),
      shortName: String(dayState.shortName),
      type: SchStateType.NONE,
    };
  }

  static prepareDayStateForSave(dayState: ISchDayState | null, tzSite: ITimezone, tzSelected: ITimezone) {
    if (!dayState || dayState.type === SchStateType.NONE) return null;
    return {
      ...dayState,
      name: String(dayState.name),
      shortName: String(dayState.shortName),
      startDateTime: dayState.startDateTime
        ? DateUtils.convertAccordingToTz(dayState.startDateTime, tzSite, tzSelected)
        : dayState.startDateTime,
      endDateTime: dayState.endDateTime
        ? DateUtils.convertAccordingToTz(dayState.endDateTime, tzSite, tzSelected)
        : dayState.endDateTime,
    };
  }
  static prepareDayStateForSaveMom(dayState: ISchDayState | null, tzSite: ITimezone, tzSelected: ITimezone) {
    if (!dayState || dayState.type === SchStateType.NONE) return null;
    return {
      ...dayState,
      name: String(dayState.name),
      shortName: String(dayState.shortName),
      startDateTime: dayState.startDateTime
        ? DateUtilsTimeZone.convertAccordingToTz(dayState.startDateTime, tzSite, tzSelected, true, true)
        : dayState.startDateTime,
      endDateTime: dayState.endDateTime
        ? DateUtilsTimeZone.convertAccordingToTz(dayState.endDateTime, tzSite, tzSelected, true, true)
        : dayState.endDateTime,
    };
  }
  static prepareDayStateForSaveWithoutOfset(dayState: ISchDayState | null) {
    if (!dayState || dayState.type === SchStateType.NONE) return null;
    return {
      ...dayState,

      name: String(dayState.name),
      shortName: String(dayState.shortName),
      startDateTime: dayState.startDateTime
        ? DateUtils.convertAccordingToTzWithoutOfset(dayState.startDateTime)
        : dayState.startDateTime,
      endDateTime: dayState.endDateTime
        ? DateUtils.convertAccordingToTzWithoutOfset(dayState.endDateTime)
        : dayState.endDateTime,
    };
  }

  static prepareDayStateForPerformance(
    dayState: ISchDayState | null,
    tzSite: ITimezone,
    tzSelected: ITimezone,
  ): ISchDayState | null {
    if (!dayState || dayState.type === SchStateType.NONE || dayState.type === SchStateType.DAY_OFF) return null;
    return {
      ...omit(['memo', 'refType'], dayState),
      name: String(dayState.name),
      shortName: String(dayState.shortName),
      startDateTime: dayState.startDateTime
        ? DateUtils.convertAccordingToTz(dayState.startDateTime, tzSite, tzSelected)
        : dayState.startDateTime,
      endDateTime: dayState.endDateTime
        ? DateUtils.convertAccordingToTz(dayState.endDateTime, tzSite, tzSelected)
        : dayState.endDateTime,
    };
  }

  static prepareDayStateForBuild(dayState: ISchDayState) {
    return {
      ...omit(['changed'], dayState),
      name: String(dayState.name),
      shortName: String(dayState.shortName),
      startDateTime: dayState?.startDateTime
        ? DateUtils.convertToIsoWithoutTz(dayState.startDateTime)
        : dayState.startDateTime,
      endDateTime: dayState?.endDateTime ? DateUtils.convertToIsoWithoutTz(dayState.endDateTime) : dayState.endDateTime,
    };
  }
}

export default SchDayState;
