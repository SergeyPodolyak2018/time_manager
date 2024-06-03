import moment from 'moment';
import { clone, isEmpty, omit } from 'ramda';
import { v4 } from 'uuid';

import { SCH_STATE_TYPE, ZERO_TIME_FOR_OLE_DATE_IN_TIMESTAMP } from '../../common/constants';
import { DayType, SchStateType, WORK_ID } from '../../common/constants/schedule';
import { ITimezone } from '../../common/interfaces/config/ITimezone';
import {
  IAgentSchedule,
  ISchActivity,
  ISchDay,
  ISchDayState,
  ISchState,
  ISchWorkState,
} from '../../common/interfaces/schedule/IAgentSchedule';
import { ICreateSchDay } from '../../common/interfaces/schedule/ICreateSchDay';
import { ISchDayDatesAgentIds } from '../../common/interfaces/schedule/ISchDay';
import { MoveTo } from '../../components/ScheduleComponents/Popups/NewMultipleWizardMenu/multipleStates/EditMultiple/EditMultipleWizard';
import { ISelectedActivity, ITimeOff, SetActivitiesFor } from '../../redux/ts/intrefaces/timeLine';
import { IAgentDayTimeline, IAgentTimeline } from '../../redux/ts/intrefaces/timeLine/IAgentTimeline';
import DateUtils from '../dateUtils';
import DateUtilsTimeZone from '../DateUtilsTimeZone';
import Utils from '../utils';
import SchActivity from './SchActivity';
import SchActivitySet from './SchActivitySet';
import SchDayState from './SchDayState';
import SchSelectedActivity from './SchSelectedActivity';
import SchState, { itemsThatCantBeMovedWithShift } from './SchState';

export enum SchDayWarnings {
  OLD_SHIFT_CAN_BE_REMOVED,
}

class SchDay {
  constructor(options: ISchDay) {
    Object.assign(this, options);
  }

  static get errors() {
    return {
      enableToInsert: 'Enable to insert state into full day schedule or schedule missing',
      activitiesEmpty:
        'Constraint violation: Shift must contain at least one activity set with at least one activity. Action disallowed',
    };
  }
  static get warnings() {
    return {
      oldShiftCanBeRemoved: 'You moved the shift to another day. The old shift may be deleted this day',
    };
  }

  static removeAgentDay(day: IAgentDayTimeline, isBuild = true) {
    return {
      ...day,
      type: DayType.NONE,
      uuid: v4(),
      activities: [],
      activitySets: [],
      states: [],
      coverage: [],
      dayState: day.dayState ? SchDayState.remove(day.dayState) : day.dayState,
      isModified: true,
      isBuild,
    };
  }

  static removeAgentDayForSave(day: ISchDay) {
    return {
      ...day,
      type: DayType.NONE,
      activities: [],
      activitySets: [],
      states: [],
      coverage: [],
      dayState: day.dayState ? SchDayState.remove(day.dayState) : day.dayState,
      isModified: true,
      startDateTime: day.dayState?.startDateTime
        ? DateUtils.convertAccordingToTz(day.dayState.startDateTime, day.timeZoneSite, day.timeZoneSelected)
        : DateUtils.convertToIsoWithoutTz(day.startDateTime),
      endDateTime: day.dayState?.endDateTime
        ? DateUtils.convertAccordingToTz(day.dayState.endDateTime, day.timeZoneSite, day.timeZoneSelected)
        : DateUtils.convertToIsoWithoutTz(day.endDateTime),
      nextStartDateTime: day.nextStartDateTime
        ? DateUtils.convertAccordingToTz(day.nextStartDateTime, day.timeZoneSite, day.timeZoneSelected)
        : undefined,
      prevEndDateTime: day.prevEndDateTime
        ? DateUtils.convertAccordingToTz(day.prevEndDateTime, day.timeZoneSite, day.timeZoneSelected)
        : undefined,
      date: DateUtils.convertToIsoWithoutTz(day.date),
    };
  }

  static prepareDaysForBuild(days: IAgentDayTimeline[]): ISchDay[] {
    return days
      .filter(day => day.isBuild)
      .map(day => {
        const dayState = SchDayState.prepareDayStateForSaveWithoutOfset(day.dayState);
        let _day = {
          ...omit(
            ['isBuild', 'isModified', 'timeZoneSite', 'timeZoneSelected', 'isSelected', 'timezoneId', 'changed'],
            day,
          ),
          startDateTime: day.dayState?.startDateTime
            ? DateUtils.convertAccordingToTzWithoutOfset(day.dayState.startDateTime)
            : DateUtils.convertToIsoWithoutTz(day.startDateTime),
          endDateTime: day.dayState?.endDateTime
            ? DateUtils.convertAccordingToTzWithoutOfset(day.dayState.endDateTime)
            : DateUtils.convertToIsoWithoutTz(day.endDateTime),
          nextStartDateTime: day.nextStartDateTime
            ? DateUtils.convertAccordingToTzWithoutOfset(day.nextStartDateTime)
            : undefined,
          prevEndDateTime: day.prevEndDateTime
            ? DateUtils.convertAccordingToTzWithoutOfset(day.prevEndDateTime)
            : undefined,
          date:
            day.dayState?.startDateTime !== ZERO_TIME_FOR_OLE_DATE_IN_TIMESTAMP && dayState?.startDateTime
              ? DateUtils.getMidnight(dayState.startDateTime)
              : DateUtils.getMidnight(day.date),
          activitySets: SchActivitySet.convertWithoutTz(day.activitySets),
          states: SchState.convertWithTzAdoptive(day.states),
          uuid: day.uuid ? day.uuid : v4(),
          dayState,
          timestamp: day.timestamp,
        } as ISchDay;
        if (_day.dayState?.type === SchStateType.EXCEPTION) {
          _day = this.removeStatesByType(_day, [SchStateType.EXCEPTION]);
        }
        return _day as ISchDay;
      });
  }

  static prepareDaysForCopy(days: IAgentDayTimeline[]): ISchDay[] {
    return days
      .filter(day => day.isBuild)
      .map(day => {
        const _day = {
          ...omit(['isBuild', 'isModified', 'timeZoneSite', 'timeZoneSelected', 'isSelected'], day),
          startDateTime: DateUtils.convertToIsoWithoutTz(day.startDateTime),
          endDateTime: DateUtils.convertToIsoWithoutTz(day.endDateTime),
          nextStartDateTime: day.nextStartDateTime ? DateUtils.convertToIsoWithoutTz(day.nextStartDateTime) : undefined,
          prevEndDateTime: day.prevEndDateTime ? DateUtils.convertToIsoWithoutTz(day.prevEndDateTime) : undefined,
          date: day.dayState?.startDateTime
            ? DateUtils.getMidnight(DateUtils.convertToIsoWithoutTz(day.dayState.startDateTime))
            : DateUtils.getMidnight(DateUtils.convertToIsoWithoutTz(day.date)),
          activitySets: SchActivitySet.convertWithoutTz(day.activitySets),
          states: SchState.convertWithoutTz(day.states),
          dayState: day.dayState ? SchDayState.prepareDayStateForBuild(day.dayState) : day.dayState,
          timestamp: day.timestamp || 0,
        };
        return _day as ISchDay;
      });
  }

  static removeStatesByType(day: ISchDay, stateTypes: SchStateType[]): ISchDay {
    const { states, isModified } = SchState.removeStatesByTypes(day.states, stateTypes);
    return {
      ...day,
      isModified,
      states: states,
    };
  }

  static prepareDaysForSave(days: IAgentDayTimeline[], forValidate = false): ISchDay[] {
    const _days: ISchDay[] = [];
    days
      .filter(day => day.isModified)
      .sort((day1, day2) => +day1.startDateTime - +day2.startDateTime)
      .map(day => {
        const dayState = SchDayState.prepareDayStateForSaveMom(day.dayState, day.timeZoneSite, day.timeZoneSelected);
        const preparedDay = {
          ...omit(['isBuild', 'isModified', 'timeZoneSite', 'timeZoneSelected'], day),
          startDateTime: dayState?.startDateTime
            ? dayState?.startDateTime ||
              DateUtilsTimeZone.convertAccordingToTz(
                day.startDateTime,
                day.timeZoneSite,
                day.timeZoneSelected,
                true,
                true,
              )
            : DateUtilsTimeZone.convertAccordingToTz(
                day.startDateTime,
                day.timeZoneSite,
                day.timeZoneSelected,
                true,
                true,
              ),
          endDateTime: DateUtilsTimeZone.convertAccordingToTz(
            day.endDateTime,
            day.timeZoneSite,
            day.timeZoneSelected,
            true,
            true,
          ),
          nextStartDateTime: day.nextStartDateTime
            ? DateUtilsTimeZone.convertAccordingToTz(
                day.nextStartDateTime,
                day.timeZoneSite,
                day.timeZoneSelected,
                true,
                true,
              )
            : undefined,
          prevEndDateTime: day.prevEndDateTime
            ? DateUtilsTimeZone.convertAccordingToTz(
                day.prevEndDateTime,
                day.timeZoneSite,
                day.timeZoneSelected,
                true,
                true,
              )
            : undefined,
          date: day.dayState?.startDateTime
            ? DateUtils.getMidnight(
                dayState?.startDateTime ||
                  DateUtilsTimeZone.convertAccordingToTz(
                    day.startDateTime,
                    day.timeZoneSite,
                    day.timeZoneSelected,
                    true,
                    true,
                  ),
              )
            : DateUtils.convertToIsoWithoutTz(day.date),
          activitySets: SchActivitySet.convertWithTzMom(day.activitySets, day.timeZoneSite, day.timeZoneSelected),
          // activities: this.prepareActivitiesForSave(),
          states: SchState.convertWithTzMom(day.states, day.timeZoneSite, day.timeZoneSelected),
          dayState: dayState,
          timestamp: day.timestamp,
        };

        // remove duplicate dayStates in states array
        if (dayState) {
          preparedDay.states = preparedDay.states.filter(
            s =>
              s.startDateTime !== dayState.startDateTime ||
              s.endDateTime !== dayState.endDateTime ||
              s.type !== dayState.type,
          );
        }

        _days.push(preparedDay as ISchDay);

        return preparedDay;
      });
    if (!forValidate) return _days;
    return _days.filter(day => day.dayState);
  }

  static prepareDaysForPerformance(days: IAgentDayTimeline[]): ISchDay[] {
    const _days: ISchDay[] = [];
    days
      .filter(day => day.isModified)
      .map(day => {
        const dayState = SchDayState.prepareDayStateForPerformance(
          day.dayState,
          day.timeZoneSite,
          day.timeZoneSelected,
        );

        const preparedDay: ISchDay = {
          ...omit(['isBuild', 'isModified', 'timeZoneSite', 'timeZoneSelected'], day),
          startDateTime: dayState?.startDateTime
            ? dayState?.startDateTime ||
              DateUtils.convertAccordingToTz(day.startDateTime, day.timeZoneSite, day.timeZoneSelected)
            : DateUtils.convertAccordingToTz(day.startDateTime, day.timeZoneSite, day.timeZoneSelected),
          endDateTime: DateUtils.convertAccordingToTz(day.endDateTime, day.timeZoneSite, day.timeZoneSelected),
          nextStartDateTime: day.nextStartDateTime
            ? DateUtils.convertAccordingToTz(day.nextStartDateTime, day.timeZoneSite, day.timeZoneSelected)
            : undefined,
          prevEndDateTime: day.prevEndDateTime
            ? DateUtils.convertAccordingToTz(day.prevEndDateTime, day.timeZoneSite, day.timeZoneSelected)
            : undefined,
          date: day.dayState?.startDateTime
            ? DateUtils.getMidnight(
                dayState?.startDateTime ||
                  DateUtils.convertAccordingToTz(day.startDateTime, day.timeZoneSite, day.timeZoneSelected),
              )
            : DateUtils.convertToIsoWithoutTz(day.date),
          activitySets: SchActivitySet.convertWithTz(day.activitySets, day.timeZoneSite, day.timeZoneSelected),
          states: SchState.prepareForPerformance(day.states, day.timeZoneSite, day.timeZoneSelected),
          dayState: dayState,
          timestamp: day.timestamp,
        } as ISchDay;

        // remove duplicate dayStates in states array
        if (dayState) {
          preparedDay.states = preparedDay.states.filter(
            s =>
              s.startDateTime !== dayState.startDateTime ||
              s.endDateTime !== dayState.endDateTime ||
              s.type !== dayState.type,
          );
        }

        _days.push(preparedDay as ISchDay);

        return preparedDay;
      });
    return _days;
  }

  static validateWorkSetSync(state: ISchWorkState, agentInfo?: IAgentTimeline): string | null {
    const messages = {
      endTimeShift: `%0: The time range 00:00 - +12:00 violates the following constraint(s): Maximum time constraint. The end time must not be later than 12:00`,
    };
    const errors: string[] = [];
    const { date, endDateTime } = state;

    if (DateUtils.getRound1mTimestamp(new Date(endDateTime).getTime() - new Date(date).getTime()) > 129600000)
      errors.push(Utils.errorMessage(messages.endTimeShift, [agentInfo?.agentName || 'WorkSet']));

    return errors.length ? errors.map(m => `${m}`).join('\n') : null;
  }

  static validateDay(
    day: IAgentDayTimeline,
    agentInfo?: IAgentTimeline,
    insertedState?: ISchState,
  ): { day: IAgentDayTimeline; warnings: string[] } {
    const messages = {
      invalidStateRange: '%0 (%1 - %2): Incorrect startTime and endTime. Start time must be less than end time',
      shiftOverlaps: 'Constraint violation: %0 (%1 - %2) falls out of the Shift (%3 - %4)',
      markedTimeOverlaps: 'Constraint violation: Marked Time (%0 - %1) falls out of Shift (%2 - %3)',
      overlapShiftStart: '%0 %1: Incorrect startTime, conflict with %2 %3',
      overlapShiftEnd: '%0 %1: Incorrect endTime, conflict with %2 %3',
      overlapStateStart: '%0 (%1 - %2): Incorrect startTime, conflict with %3 (%4 - %5)',
      overlapStateEnd: '%0 %1: Incorrect endTime, conflict with %2 %3',
      activitySetOverlaps: 'Activity Set state %0 (%1 - %2) overlaps another Activity Set state %3 (%4 - %5)',
      endTimeShift: `%0: The time range 00:00 - +12:00 violates the following constraint(s): Maximum time constraint. The end time must not be later than 12:00`,
      itemsOverlap: 'Current %0 %1 (%2: %3 - %4) overlaps %5 "%6" (%7: %8 - %9)',
      exceptionOverlap: `Inserted exception %0 overlap the existing %1`,
    };

    const errors: string[] = [];
    const warnings: string[] = [];
    const shift = day.dayState;
    const isShift = day.type === DayType.SHIFT;
    if (!shift) throw new Error('dayState not found');

    const shiftStartTime = shift.startDateTime || day.startDateTime;
    const shiftEndTime = shift.endDateTime || day.endDateTime;

    if (shiftStartTime >= shiftEndTime) {
      errors.push(Utils.errorMessage(messages.invalidStateRange, [shift.name, shiftStartTime, shiftEndTime]));
    }

    // const date = DateUtils.getMidnight(shiftStartTime)

    //check shift end time is not after 12:00
    if (isShift) {
      this.checkShiftEndTimeLessThan12NextDay(
        +shiftStartTime,
        +shiftEndTime,
        day.timeZoneSite,
        day.timeZoneSelected,
        () => {
          errors.push(Utils.errorMessage(messages.endTimeShift, [agentInfo?.agentName || shift.name]));
        },
      );
    }

    SchState.checkActivitySetOverlaps(day.states, (state1, state2) => {
      !errors.includes(
        Utils.errorMessage(messages.activitySetOverlaps, [
          state2.name,
          state2.startDateTime,
          state2.endDateTime,
          state1.name,
          state1.startDateTime,
          state1.endDateTime,
        ]),
      ) &&
        errors.push(
          Utils.errorMessage(messages.activitySetOverlaps, [
            state1.name,
            state1.startDateTime,
            state1.endDateTime,
            state2.name,
            state2.startDateTime,
            state2.endDateTime,
          ]),
        );
    });
    const markedTimeActivityState = day.states.find(ac => ac.type === SchStateType.MARKED_TIME);

    if (markedTimeActivityState) {
      const markedTimeStart = parseInt(`${markedTimeActivityState.startDateTime}`);
      const markedTimeEnd = parseInt(`${markedTimeActivityState.endDateTime}`);
      const activityStart = parseInt(`${shiftStartTime}`);
      const activityEnd = parseInt(`${shiftEndTime}`);
      if (markedTimeStart < activityStart || markedTimeEnd > activityEnd) {
        errors.push(
          Utils.errorMessage(messages.markedTimeOverlaps, [
            DateUtils.getTimeFromDate(markedTimeStart),
            DateUtils.getTimeFromDate(markedTimeEnd),
            shiftStartTime,
            shiftEndTime,
          ]),
        );
      }
    }

    const states = SchState.getNonOverlappingStates(day.states);

    const updatedStates = states.reduce((dayStates: ISchState[], state, index) => {
      const start = state.startDateTime;
      const end = state.endDateTime;

      //check overlaps with shift
      if (start < shiftStartTime || start > shiftEndTime || end > shiftEndTime || end < shiftStartTime) {
        const name = SchState.isWorkSet(state) ? 'Work set' : state.name;
        errors.push(Utils.errorMessage(messages.shiftOverlaps, [name, start, end, shiftStartTime, shiftEndTime]));
      }
      const targetStates = states.filter((s1, idx1) => index !== idx1);
      const newStates = [] as ISchState[];
      let isDeleteState = false;
      targetStates.forEach(s1 => {
        const start2 = s1.startDateTime;
        const end2 = s1.endDateTime;

        if (SchState.isWorkSet(s1) || SchState.isWorkSet(state)) return;
        if (SchState.isActivitySet(s1) || SchState.isActivitySet(state)) return;

        const isExceptionOverlapping = state.type === SchStateType.EXCEPTION && s1.type === SchStateType.EXCEPTION;
        if (DateUtils.checkTimeRanges(start, end, start2, end2)) {
          if (isExceptionOverlapping) {
            if ((insertedState && s1 === insertedState) || (!insertedState && s1.refId !== 0)) {
              const newRanges = DateUtils.subtractTimeRanges(start, end, start2, end2);
              if (!isEmpty(newRanges)) {
                newRanges.forEach(range => {
                  newStates.push({
                    ...state,
                    startDateTime: range.start.valueOf() as number,
                    endDateTime: range.end.valueOf() as number,
                  });
                });
              } else isDeleteState = true;
              if (state.name) {
                const newState = insertedState || states.find(state => state.refId !== 0);

                warnings.push(Utils.errorMessage(messages.exceptionOverlap, [newState?.name || '', state.name]));
              }
            }
          } else {
            // we can insert break and meal items in activity set and shift
            // so we dont need to check if they are overlapping
            if (SchState.isCanOverlapped(s1, state) || SchState.isCanOverlapped(state, s1)) {
              return;
            }

            if (
              !errors.includes(
                Utils.errorMessage(messages.overlapStateStart, [
                  state.name,
                  state.startDateTime,
                  state.endDateTime,
                  s1.name,
                  s1.startDateTime,
                  s1.endDateTime,
                ]),
              )
            ) {
              errors.push(
                Utils.errorMessage(messages.overlapStateStart, [
                  s1.name,
                  s1.startDateTime,
                  s1.endDateTime,
                  state.name,
                  state.startDateTime,
                  state.endDateTime,
                ]),
              );
            }
          }
        }
      });
      if (!isDeleteState) isEmpty(newStates) ? dayStates.push(state) : (dayStates = [...dayStates, ...newStates]);
      return dayStates;
    }, []);
    // days filtered by type, we count only days with type SHIFT.
    const daysWithShifts = (agentInfo?.days ?? []).filter(day => {
      return day.type === DayType.SHIFT;
    });
    // gathering dates do check
    const otherDaysShiftsTimes = daysWithShifts?.map(day => {
      return [day.startDateTime, day.endDateTime];
    });
    // essentially if we have something to check
    if (otherDaysShiftsTimes && daysWithShifts) {
      // get index of overlapped day
      const overlappedShiftIndex = DateUtils.isTimeSegmentOverlapsWithAnyOther(
        [shiftStartTime, shiftEndTime],
        otherDaysShiftsTimes,
      );
      if (overlappedShiftIndex > -1) {
        // collecting info
        const overlappedShift = daysWithShifts[overlappedShiftIndex];
        const currentShiftStartDayString = new Date(shiftStartTime).toISOString().split('T')[0];
        const currentShiftType = SCH_STATE_TYPE[shift.type || 0].replaceAll('_', ' ');
        const currentShiftName = shift.name;

        const overlappedShiftStartTime = overlappedShift?.startDateTime;
        const overlappedShiftEndTime = overlappedShift?.endDateTime;
        const overlappedShiftName = overlappedShift?.dayState?.name;
        const overlappedShiftStartDayString = overlappedShiftStartTime
          ? new Date(overlappedShiftStartTime).toISOString().split('T')[0]
          : '';
        const overlappedShiftType = SCH_STATE_TYPE[overlappedShift?.dayState?.type || 0].replaceAll('_', ' ');

        // if found overlapping shift is not current shift, checking by uuid
        if (day.uuid !== overlappedShift?.uuid) {
          const overlappedShiftTypeCapitalized = overlappedShiftType.replace(/(^\w{1})|(\s+\w{1})/g, letter =>
            letter.toUpperCase(),
          );
          // capitalize each word in type
          const capitalizedType = currentShiftType.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase());

          errors.push(
            Utils.errorMessage(messages.itemsOverlap, [
              capitalizedType,
              currentShiftName ? `"${currentShiftName}"` : '',
              currentShiftStartDayString,
              shiftStartTime,
              shiftEndTime,
              overlappedShiftTypeCapitalized,
              overlappedShiftName,
              overlappedShiftStartDayString,
              overlappedShiftStartTime,
              overlappedShiftEndTime,
            ]),
          );
        }
      }
    }

    if (errors.length > 0) throw new Error(errors.map(m => `${m}`).join('\n'));
    const _states = [...SchState.getOverlappingStates(day.states), ...updatedStates].sort((a, b) => {
      return Number(a.endDateTime) - Number(b.endDateTime);
    });
    return { day: { ...day, states: _states }, warnings };
  }

  static changeItemType(day: IAgentDayTimeline, item: ITimeOff): IAgentDayTimeline {
    let newDay = day;
    newDay = {
      ...newDay,
      dayState: newDay.dayState
        ? {
            ...newDay.dayState,
            name: item?.name ?? '',
            shortName: item?.shortName ?? '',
            id: item.id,
            isPaid: item.isPaid,
          }
        : null,
    };
    return newDay;
  }

  static changeActivityTime(
    day: IAgentDayTimeline,
    activity: ISelectedActivity,
    isChangeType?: boolean,
  ): IAgentDayTimeline {
    let newDay = day;
    const isShift = activity.stateIndex === undefined;

    if (
      isShift &&
      (activity.type === SCH_STATE_TYPE[SchStateType.TIME_OFF] ||
        activity.type === SCH_STATE_TYPE[SchStateType.EXCEPTION] ||
        activity.type === SCH_STATE_TYPE[SchStateType.SHIFT] ||
        activity.type === SCH_STATE_TYPE[SchStateType.ACTIVITY] ||
        activity.type === SCH_STATE_TYPE[SchStateType.ACTIVITY_SET])
    ) {
      // edit shift
      newDay = {
        ...day,
        startDateTime: activity.start,
        endDateTime: activity.end,
        type: activity.type === SCH_STATE_TYPE[SchStateType.EXCEPTION] ? DayType.SHIFT_EXCEPTION : day.type,
        dayState: day.dayState
          ? {
              ...day.dayState,
              startDateTime: activity.start,
              endDateTime: activity.end,
              isFullDay: false,
              isPaid: activity.isPaid,
              paidMinutes: activity.isPaid ? activity.paidMinutes : 0,
            }
          : null,
        paidMinutes: activity.isPaid ? activity.paidMinutes : 0,
        isModified: true,
        isBuild: true,
        states: SchState.changeShiftTime(day.states, activity),
      };
      if (
        activity.type === SCH_STATE_TYPE[SchStateType.TIME_OFF] ||
        activity.type === SCH_STATE_TYPE[SchStateType.EXCEPTION]
      ) {
        newDay = {
          ...newDay,
          dayState: newDay.dayState ? { ...newDay.dayState, memo: activity.memo } : null,
        };
      }
      if (
        !(
          activity.type === SCH_STATE_TYPE[SchStateType.ACTIVITY] ||
          activity.type === SCH_STATE_TYPE[SchStateType.ACTIVITY_SET]
        ) &&
        isChangeType
      ) {
        newDay = {
          ...newDay,
          id: activity.id,
          dayState: newDay.dayState ? { ...newDay.dayState, name: activity.name, id: activity.id } : null,
        };
        if (newDay.dayState) {
          if ('isPaid' in newDay.dayState && 'isPaid' in activity) newDay.dayState.isPaid = activity.isPaid;
          if ('shortName' in newDay.dayState && 'shortName' in activity) newDay.dayState.shortName = activity.shortName;
        }
      }
    } else if (
      activity.type === SCH_STATE_TYPE[SchStateType.ACTIVITY] ||
      activity.type === SCH_STATE_TYPE[SchStateType.BREAK] ||
      activity.type === SCH_STATE_TYPE[SchStateType.MEAL] ||
      activity.type === SCH_STATE_TYPE[SchStateType.MARKED_TIME] ||
      activity.type === SCH_STATE_TYPE[SchStateType.EXCEPTION] ||
      activity.type === SCH_STATE_TYPE[SchStateType.TIME_OFF] ||
      activity.type === SCH_STATE_TYPE[SchStateType.ACTIVITY_SET]
    ) {
      // edit states (break/meal/exception)
      newDay = {
        ...day,
        dayState: day.dayState,
        isModified: true,
        isBuild: true,
        states: SchState.changeStateByIndex(day.states, activity, isChangeType),
      };
    }
    return newDay;
  }

  static moveDayShift(day: IAgentDayTimeline, differenceInTime: number, moveExceptions = true) {
    const date = new Date(
      this.getAgentDayDateFromTimestamp(day.timeZoneSelected, day.timeZoneSite, +day.startDateTime + differenceInTime),
    ).getTime();
    let startDateTime = +day.startDateTime + differenceInTime;
    let endDateTime = +day.endDateTime + differenceInTime;

    if (!day.dayState) {
      return {
        ...day,
        date,
        isBuild: true,
        startDateTime,
        endDateTime,
        states: SchState.moveShiftItems(day.states, differenceInTime, moveExceptions),
        changed: true,
      };
    }
    let diffForCurrentDay = differenceInTime;
    if (day.type === DayType.SHIFT) {
      const cantBeMoved = day.states.filter(state => itemsThatCantBeMovedWithShift.includes(state?.type));

      const firstStateStartTime = +cantBeMoved[0]?.startDateTime;
      const lastStateEndTime = +cantBeMoved[cantBeMoved.length - 1]?.endDateTime;
      if (firstStateStartTime < startDateTime) {
        startDateTime = +firstStateStartTime;
        diffForCurrentDay = startDateTime - +day.startDateTime;
        endDateTime = +day.endDateTime + diffForCurrentDay;
      } else if (lastStateEndTime > endDateTime) {
        endDateTime = +lastStateEndTime;
        diffForCurrentDay = endDateTime - +day.endDateTime;
        startDateTime = +day.startDateTime + diffForCurrentDay;
      }
    }

    const dayState = SchDayState.moveDayState(day.dayState, diffForCurrentDay);

    return {
      ...day,
      date,
      isBuild: true,
      dayState: dayState,
      startDateTime: startDateTime,
      endDateTime: endDateTime,
      states: SchState.moveShiftItems(day.states, diffForCurrentDay, dayState.type !== SchStateType.EXCEPTION),
    };
  }

  static moveDayShiftItem(day: IAgentDayTimeline, item: ISelectedActivity, differenceInTime: number) {
    return {
      ...day,
      isBuild: true,
      states: SchState.moveShiftItem(day.states, item, differenceInTime),
    };
  }

  static smartUpdateWorkSetTime(
    day: IAgentDayTimeline,
    selectedAgentActivities: ISelectedActivity[],
    differenceInTime: number,
  ) {
    const patchedDay: IAgentDayTimeline = {
      ...day,
      states: day.states.map((state, index) => {
        if (index === selectedAgentActivities[0]?.stateIndex) {
          return {
            ...state,
            changed: true,
          };
        }
        return state;
      }),
    };

    const updatedActivities = selectedAgentActivities.map(activity => {
      const { start, end } = SchSelectedActivity.smartSetTime(
        activity,
        activity.start + differenceInTime,
        activity.end + differenceInTime,
      );
      return {
        ...activity,
        start,
        end,
      };
    });
    let _day = patchedDay;
    updatedActivities.map(activity => {
      _day = this.changeActivityTime(patchedDay, activity, false);
    });
    return _day;
  }

  static moveDayShiftItems(
    day: IAgentDayTimeline,
    selectedAgentActivities: ISelectedActivity[],
    differenceInTime: number,
    activityType: SchStateType,
    agent?: IAgentTimeline,
  ) {
    if (
      SchSelectedActivity.isWorkSet(selectedAgentActivities[0]) ||
      SchSelectedActivity.isActivitySet(selectedAgentActivities[0])
    )
      return this.smartUpdateWorkSetTime(day, selectedAgentActivities, differenceInTime);

    let warnings: string[] = [];
    const activitiesIndexes: number[] = [];

    const filteredStates: ISchState[] = day.states.map((state, index) => {
      const findedItem = selectedAgentActivities.find(
        item => item.end === state.endDateTime && activityType === state.type,
      );
      if (findedItem) {
        activitiesIndexes.push(index);
        const { start, end } = SchSelectedActivity.smartSetTime(
          findedItem,
          +state.startDateTime + differenceInTime,
          +state.endDateTime + differenceInTime,
        );
        return {
          ...state,
          startDateTime: start,
          endDateTime: end,
          changed: true,
        };
      } else {
        return state;
      }
    });
    day = {
      ...day,
      isBuild: true,
      states: filteredStates,
    };
    if (activityType === SchStateType.EXCEPTION) {
      day = activitiesIndexes.reduce((acc, index) => {
        const validationResult = isEmpty(acc)
          ? SchDay.validateDay(day, agent, day.states[index])
          : SchDay.validateDay(acc, agent, day.states[index]);
        warnings = [...warnings, ...validationResult.warnings];
        return validationResult.day;
      }, {} as IAgentDayTimeline);
    }

    return { day, warnings };
  }

  static updateMultipleAgentDayStates(
    days: IAgentDayTimeline[],
    timeMs: number,
    selectedStates: ISchState[],
    action: MoveTo,
    duration?: number,
  ): { days: IAgentDayTimeline[]; isModified: boolean; isValid: boolean } {
    let isDaysModified = false;
    let isDaysValid = true;

    const _days = days.map(day => {
      const { states, isModified } = SchState.updateMultipleAgentState(
        day.states,
        timeMs,
        selectedStates,
        action,
        duration,
      );
      if (!isDaysModified) isDaysModified = isModified;

      const _day = {
        ...day,
        isModified,
        states,
      };
      try {
        return { ...SchDay.validateDay(_day).day, errors: null, isValid: true };
      } catch (e: any) {
        isDaysValid = false;
        return { ..._day, errors: e.message, isValid: false };
      }
    });

    return { days: _days, isModified: isDaysModified, isValid: isDaysValid };
  }

  static getAgentDayDateFromTimestamp(tzSelected: ITimezone, tzSite: ITimezone, timestamp: number | string) {
    const ts = Utils.getParsedNum(timestamp);
    const offsetDay = DateUtils.getTimezoneOffsetFromSelected(tzSelected, tzSite, ts) * 60000;
    const date = new Date(Utils.getParsedNum(ts) - offsetDay);

    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(
      date.getUTCDate(),
    ).padStart(2, '0')}`;
  }

  static createDay(configDay: ICreateSchDay /*, tzSelected: ITimezone, tzSite: ITimezone*/): ISchDay | null {
    const start = configDay.dayState?.startDateTime ?? configDay.startDateTime;
    const end = configDay.dayState?.endDateTime ?? configDay.startDateTime;

    // const startDate = start ? new Date(SchDay.getAgentDayDateFromTimestamp(tzSelected, tzSite, start)).getTime() : configDay.date;
    const date = configDay.date;
    if (!date) return null;

    const startDateTime = Utils.getParsedNum(start ? start : date);
    const endDateTime = Utils.getParsedNum(
      end ? end : DateUtils.getNextDay(new Date(date).toISOString().split('T')[0]),
    );

    return {
      ...configDay,
      date,
      startDateTime: startDateTime,
      endDateTime: endDateTime,
      type: configDay.type ?? DayType.NONE,
      id: configDay.id ?? 0,
      dayState:
        ({
          id: 0,
          type: DayType.NONE,
          startDateTime,
          endDateTime,
          ...configDay.dayState,
        } as ISchDayState) ?? {},
      states:
        ((configDay.states ?? []).map(s => ({
          id: 0,
          type: SchStateType.NONE,
          ...s,
        })) as ISchState[]) ?? [],
      activities: configDay.activities ?? [],
      activitySets: configDay.activitySets ?? [],
    };
  }

  static moveStatesToDate(
    updatedDays: IAgentDayTimeline[],
    days: IAgentDayTimeline[],
    dateFrom: number,
    dateTo: number,
    stateTypes: SchStateType[],
  ) {
    let isDaysModified = false;
    //move to
    const daysWithNewStates = days
      .map(day => {
        if (new Date(day.dayState?.startDateTime || day.date).getUTCDay() === new Date(dateTo).getUTCDay()) {
          if (day.type !== DayType.SHIFT) {
            return {
              ...day,
              isModified: false,
              isValid: false,
              errors: this.errors.enableToInsert,
            };
          }

          const updatedDay = updatedDays.find(
            _day => new Date(_day.dayState?.startDateTime || _day.date).getUTCDay() === new Date(dateFrom).getUTCDay(),
          );
          if (!updatedDay) return day;

          //const { states, isModified } = SchState.moveStatesToDate(updatedDay.states, day.states, stateTypes, dateTo);
          const { states, isModified } = SchState.moveStatesToDateByDelta(
            updatedDay.states,
            day.states,
            stateTypes,
            dateTo - dateFrom,
          );

          if (!isDaysModified) isDaysModified = isModified;

          return {
            ...day,
            isModified,
            states,
            isValid: true,
          };
        }
        return day;
      })
      .filter(day => day.isModified);

    if (!daysWithNewStates.length)
      return {
        days: [{ errors: this.errors.enableToInsert, date: dateTo }],
        isModified: true,
        isValid: false,
        errors: this.errors.enableToInsert,
      };

    //move from
    const daysWithDeletedStates = updatedDays
      .map(day => {
        if (new Date(day.dayState?.startDateTime || day.date).getUTCDay() === new Date(dateFrom).getUTCDay()) {
          const { states, isModified } = SchState.removeStatesByTypes(day.states, stateTypes);
          if (!isDaysModified) isDaysModified = isModified;

          return {
            ...day,
            isModified,
            states: states,
            isValid: true,
          };
        }

        return day;
      })
      .filter(day => day.isModified);

    return { days: [...daysWithNewStates, ...daysWithDeletedStates], isModified: isDaysModified, isValid: true };
  }

  static collectPreparedDatesAgentIdNull = (agentDays: IAgentSchedule[]): ISchDayDatesAgentIds => {
    const getFieldName = (date: string | number): string =>
      typeof date === 'string' ? date : String(DateUtils.getDateFromString(date)).split('T')[0];
    return agentDays.reduce((acc: ISchDayDatesAgentIds, agent) => {
      const _acc = clone(acc);
      const nullDates = agent.days.reduce(
        (acc: string[], day) => (day.dayState === null ? [...acc, getFieldName(day.date)] : [...acc]),
        [],
      );

      nullDates.forEach((date: string) => {
        if (!Object.keys(_acc).includes(date)) _acc[date] = [];
        _acc[date].push(agent.agentId);
      });

      return _acc;
    }, {});
  };

  /**
   *
   * @param shiftStartTime
   * @param shiftEndTime
   * @param tzSite
   * @param tzSelected
   * @param cbErr
   * @return boolean true - valid, false - invalid
   */
  static checkShiftEndTimeLessThan12NextDay(
    shiftStartTime: number,
    shiftEndTime: number,
    tzSite: ITimezone,
    tzSelected: ITimezone,
    cbErr?: () => any,
  ): boolean {
    const convertedStartTime = DateUtils.convertAccordingToTz(shiftStartTime, tzSite, tzSelected);
    const convertedEndTime = DateUtils.convertAccordingToTz(shiftEndTime, tzSite, tzSelected);

    const startDateMs = moment.utc(convertedStartTime).valueOf();
    const endDateTimeMs = moment.utc(convertedEndTime).valueOf();
    if (
      !DateUtils.isSameDayOfWeek(startDateMs, endDateTimeMs) &&
      DateUtils.checkTimeGreaterThan(new Date(endDateTimeMs).toISOString(), '12:00')
    ) {
      cbErr && cbErr();
      return false;
    }
    return true;
  }

  static updateDayActivities(
    day: IAgentDayTimeline,
    newActivities: ISchActivity[],
    setActivitiesFor: SetActivitiesFor,
    selectedActivity: ISelectedActivity,
  ) {
    let newDay = day;

    const isRemove = !newActivities.length;
    const isCreateWork =
      !isRemove && !day.states.find(state => SchState.isWork(state)) && !day.activitySets.find(a => a.id === WORK_ID);

    let states = newDay.states;
    if (isRemove) {
      states =
        setActivitiesFor === SetActivitiesFor.WORK
          ? SchState.removeWorkState(states)
          : SchState.removeWorkSetsById(states, selectedActivity);
    }

    if (isCreateWork) {
      newDay = this.fillWorkActivitiesToShift(newDay);
      states = newDay.states;
    }
    const activitySets = SchActivitySet.updateActivitySet(newDay.activitySets, newActivities, selectedActivity);
    const activityIds = activitySets.flatMap(a => a.activities);
    const activities = SchActivity.updateActivities(newDay.activities, newActivities, activityIds);

    const _day = {
      ...newDay,
      isModified: true,
      isBuild: true,
      activities: activities,
      activitySets: activitySets,
      states: SchState.mergeNeighboringWorkActivities(states),
    };
    return this.removeUnusedActivities(_day);
  }

  static removeUnusedActivities(day: IAgentDayTimeline) {
    const activitySets = day.activitySets.filter(
      set => !!day.states.find(state => state.id === set.id && state.refId === set.refId),
    );
    const activityIds = activitySets.flatMap(a => a.activities);
    const activities = day.activities.filter(a => activityIds.includes(a.id));
    if (!activitySets.length || !activities.length) throw new Error(this.errors.activitiesEmpty);
    return {
      ...day,
      activitySets,
      activities,
    };
  }

  static fillWorkActivitiesToShift(day: IAgentDayTimeline): IAgentDayTimeline {
    const workStates = [];
    const activitySets = SchState.getActivitySets(day.states);
    if (activitySets.length) {
      const firstStateIndex = 0;
      const lastStateIndex = activitySets.length - 1;

      // create work activity in left position
      activitySets.forEach((state, index) => {
        // const prevSet = activitySets[index - 1];
        const nextSet = activitySets[index + 1];

        const shiftStartDateTime = day.dayState?.startDateTime || day.startDateTime;
        const shiftEndDateTime = day.dayState?.endDateTime || day.endDateTime;
        const isSetInStart = state.startDateTime === shiftStartDateTime;
        const isSetInEnd = state.endDateTime === shiftEndDateTime;
        const singleActivityInState = index === firstStateIndex && index === lastStateIndex;

        if (!singleActivityInState) {
          // [ newWork, firstSet, ...]
          if (firstStateIndex === index && !isSetInStart) {
            const workState = SchState.createWorkActivity(+shiftStartDateTime, +state.startDateTime);
            workState && workStates.push(workState);
          }
          // [ ..., lastSet, newWork ]
          if (lastStateIndex === index && !isSetInEnd) {
            const workStateRight = SchState.createWorkActivity(+state.endDateTime, +shiftEndDateTime);
            workStateRight && workStates.push(workStateRight);
          }
          //create in right [..., activeSet, newWork, ...]
          if (lastStateIndex !== index) {
            const workStateRight = SchState.createWorkActivity(+state.endDateTime, +nextSet.startDateTime);
            workStateRight && workStates.push(workStateRight);
          }
        } else {
          const workStateLeft = SchState.createWorkActivity(+shiftStartDateTime, +state.startDateTime);
          const workStateRight = SchState.createWorkActivity(+state.endDateTime, +shiftEndDateTime);
          workStateLeft && workStates.push(workStateLeft);
          workStateRight && workStates.push(workStateRight);
        }
      });
    } else {
      const workState = SchState.createWorkActivity(+day.startDateTime, +day.endDateTime);
      workState && workStates.push(workState);
    }

    return {
      ...day,
      states: [...day.states, ...workStates],
    };
  }
}

export default SchDay;
