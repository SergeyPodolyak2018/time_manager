import { clone, isNil, mergeDeepRight, omit } from 'ramda';

import { SCH_STATE_TYPE } from '../../common/constants';
import { SchStateType, WORK_ID } from '../../common/constants/schedule';
import { ISchActivity, ISchState } from '../../common/interfaces/schedule/IAgentSchedule';
import { IBreakMeal, IException, ISelectedActivity, IShifts, ITimeOff } from '../../redux/ts/intrefaces/timeLine';
import {
  IAgentDayTimeline,
  IAgentTimeline,
  ITimelineAgentActivity,
} from '../../redux/ts/intrefaces/timeLine/IAgentTimeline';
import DateUtils from '../dateUtils';
import SchUtils from './SchUtils';

class SchSelectedActivity {
  constructor(options: ITimelineAgentActivity) {
    Object.assign(this, options);
  }

  static isShift(selectedActivity: ISelectedActivity) {
    return selectedActivity?.type === SCH_STATE_TYPE[SchStateType.SHIFT];
  }

  static isFullDay(selectedActivity: ISelectedActivity) {
    const msIn24Hours = 86400000;
    return (
      Math.abs(selectedActivity.start - selectedActivity.end) >= msIn24Hours &&
      (selectedActivity._type === SchStateType.TIME_OFF || selectedActivity._type === SchStateType.EXCEPTION)
    );
  }

  static isFullShiftActivity(selectedActivity: ISelectedActivity) {
    return selectedActivity.shiftStart === selectedActivity.start && selectedActivity.shiftEnd === selectedActivity.end;
  }

  static selectShiftsBySelectedActivities(selectedActivities: ISelectedActivity[], agents: IAgentTimeline[]) {
    return selectedActivities.map(activity => {
      const agent = agents.find(_agent => _agent.agentId === activity.agentId);
      if (!agent) return activity;
      const shift = agent.activities.find(
        shift => shift._type === SchStateType.SHIFT && +shift.dayIndex === +activity.dayIndex,
      );
      if (!shift) return activity;
      return shift as unknown as ISelectedActivity;
    });
  }
  static getMarkedTimeByTimeInShift = (
    activity: ISelectedActivity,
    clickDate?: number | string,
  ): ISchState | undefined => {
    const markedTime = activity?.states?.filter(st => st.type === ('marked_time' as any));

    if (markedTime && clickDate) {
      const clickDateTime = parseInt(`${clickDate}`, 10);
      return markedTime.find(mt => {
        const markedTimeStart = parseInt(`${mt.startDateTime}`, 10);
        const markedTimeEnd = parseInt(`${mt.endDateTime}`, 10);
        return markedTimeStart <= clickDateTime && markedTimeEnd >= clickDateTime;
      });
    }
    return undefined;
  };

  static groupActivities(activities: ITimelineAgentActivity[]): ITimelineAgentActivity[] {
    const shifts = activities.filter(activity => isNil(activity.stateIndex));
    const states = activities.filter(activity => !isNil(activity.stateIndex));
    const result: ITimelineAgentActivity[] = [];

    for (const shift of shifts) {
      result.push({ ...shift, states: [] });
    }

    for (const state of states) {
      const shiftIndex = result.findIndex(_shift => _shift.dayIndex === state.dayIndex);
      if (shiftIndex === -1) continue;
      result[shiftIndex].states?.push(state);
    }
    return result;
  }

  static updateActivityTime(activities: ISelectedActivity[], { start, end }: { start?: number; end?: number }) {
    return activities.map(activity => {
      return { ...activity, start: start ? start : activity.start, end: end ? end : activity.end };
    });
  }

  /**
   *
   * @param {Object} activity
   * @return {boolean}
   */
  static isWorkSet(activity: ISelectedActivity) {
    return (
      activity?.refId !== WORK_ID &&
      activity?._type === SchStateType.ACTIVITY_SET &&
      activity?.stateId === WORK_ID &&
      activity.refType !== WORK_ID
    );
  }

  /**
   *
   * @param {Object} activity
   * @return {boolean}
   */
  static isActivitySet(activity: ISelectedActivity) {
    if (activity?.states?.find(activity => activity.isFullShiftActivity)) {
      return true;
    }
    return activity?._type === SchStateType.ACTIVITY_SET && activity?.stateId !== WORK_ID;
  }

  /**
   *
   * @param {Object} activity
   * @return {boolean}
   */
  static isWork(activity: ISelectedActivity) {
    return (
      activity?.refId === WORK_ID && activity?._type === SchStateType.ACTIVITY_SET && activity?.stateId === WORK_ID
    );
  }

  /**
   *
   * @param {Object} activity
   * @return {boolean}
   */
  static isActivitySetInside(activity: ISelectedActivity[] | ISelectedActivity) {
    if (Array.isArray(activity)) {
      return (
        activity.filter(
          el =>
            el.states &&
            el.states.findIndex(
              (state: any) =>
                state.type && state.type === SchStateType.ACTIVITY_SET && state.refType === SchStateType.ACTIVITY_SET,
            ) > -1,
        ).length > 0 || activity.filter(el => el._type === SchStateType.ACTIVITY_SET).length > 0
      );
    } else {
      return (
        (activity.states &&
          activity.states.findIndex((state: any) => state.type && state.refType === SchStateType.ACTIVITY_SET) > -1) ||
        activity._type === SchStateType.ACTIVITY_SET
      );
    }
  }

  static smartSetTime(selectedActivity: ISelectedActivity, start: number, end: number): { start: number; end: number } {
    const duration = selectedActivity.end - selectedActivity.start;
    if (start > selectedActivity.shiftStart && end < selectedActivity.shiftEnd) {
      return {
        start: start,
        end: end,
      };
    } else if (start < selectedActivity.shiftStart) {
      return {
        start: selectedActivity.shiftStart,
        end: selectedActivity.shiftStart + duration,
      };
    } else if (end > selectedActivity.shiftEnd) {
      return {
        start: selectedActivity.shiftEnd - duration,
        end: selectedActivity.shiftEnd,
      };
    } else {
      return {
        start: start,
        end: end,
      };
    }
  }

  static convertToState(activity: ISelectedActivity): ISchState {
    return {
      refId: activity.refId,
      id: activity.stateId,
      name: activity.name,
      shortName: activity.shortName,
      startDateTime: activity.start,
      endDateTime: activity.end,
      isPaid: activity.isPaid,
      isFullDay: activity.isFullDay,
      paidMinutes: activity.paidMinutes,
      memo: activity.memo,
      refType: activity.refType,
      type: activity._type,
    };
  }

  static moveActivityTime(activities: ISelectedActivity[], milliseconds: number) {
    return activities.map(activity => {
      if (activity._type === SchStateType.SHIFT) {
        return {
          ...activity,
          start: +activity.start + milliseconds,
          end: +activity.end + milliseconds,
          shiftStart: activity.shiftStart + milliseconds,
          shiftEnd: activity.shiftEnd + milliseconds,
        };
      } else {
        return {
          ...activity,
          start: +activity.start + milliseconds,
          end: +activity.end + milliseconds,
        };
      }
    });
  }

  static updateActivityMemo(activities: ISelectedActivity[], { memo }: { memo: string }) {
    return activities.map(activity => {
      return { ...activity, memo: memo ? memo : '' };
    });
  }

  static updateItems(activities: ISelectedActivity[], item: ITimeOff) {
    return activities.map(activity => {
      return {
        ...activity,
        id: item.id,
        isPaid: item.isPaid,
        name: item?.name ?? '',
        shortName: item?.shortName ?? '',
      };
    });
  }

  static updateActivityType(
    activities: ISelectedActivity[],
    { item }: { item: IBreakMeal | IException | IShifts | ITimeOff },
  ) {
    return activities.map(activity => {
      const newActivity = { ...activity, name: item.name, id: item.id };
      if ('isPaid' in newActivity && 'isPaid' in item) newActivity.isPaid = item.isPaid;
      if ('shortName' in newActivity && 'shortName' in item) newActivity.shortName = item.shortName;
      return newActivity;
    });
  }

  static getSelectedTimelines(
    activities: ISelectedActivity[],
    isActivitySet: boolean,
    isFixShiftActivity = false,
  ): { shift: HTMLDivElement | null; activity: ISelectedActivity }[] {
    let shift: HTMLDivElement | null = null;
    return activities
      .map(activity => {
        if (!isActivitySet) {
          shift = document.querySelector(
            `[data-test="${activity.type}"][data-shiftitem="${activity.stateIndex}${activity.type}${activity.agentId}${activity.dayDate}"][datatype="shiftItemAsShift"][data-selected="true"]`,
          );

          if (shift === null) {
            shift = isFixShiftActivity
              ? document.querySelector(
                  `[data-test="${activity.type}"][data-shiftitem="${
                    activity.stateIndex !== undefined ? activity.stateIndex : activity.dayIndex
                  }${activity.type}${activity.agentId}${activity.dayDate}"]`,
                )
              : document.querySelector(
                  `[data-test="${activity.type}"][data-shiftitem="${
                    activity.stateIndex !== undefined ? activity.stateIndex : activity.dayIndex
                  }${activity.type}${activity.agentId}${activity.dayDate}"][data-selected="true"]`,
                );
          }
        } else {
          shift = document.querySelector(
            `[data-test="${activity.type}"][data-shiftitem="${
              activity.stateIndex !== undefined ? activity.stateIndex : activity.dayIndex
            }${activity.type}${activity.agentId}${activity.dayDate}"]`,
          );
        }

        return { shift, activity };
      })
      .filter(s => s.shift !== null);
  }

  static moveSelectedTimelines(
    data: { shift: HTMLDivElement | null; activity: ISelectedActivity }[],
    direction: 'left' | 'right',
    stepMinutes: number,
    cb?: () => void,
  ) {
    data.forEach(({ shift, activity }) => {
      if (!shift) return;

      const duration = DateUtils.getDuration(+activity?.start, +activity?.end);
      const isFullDayItem = duration === '24:00';
      const isFullDay = (activity?.type === 'exception' || activity?.type === 'time_off') && isFullDayItem;
      if (isFullDay) return;

      const isShift =
        ((activity?.type === 'shift' ||
          activity?.type === 'activity_set' ||
          activity?.type === 'exception' ||
          activity?.type === 'time_off') &&
          activity?.stateIndex === undefined) ||
        (!SchUtils.breakItems && activity?.stateIndex === 0);

      const isActivitySet = activity?.type === 'activity_set';
      const shiftElement =
        isActivitySet && activity?.stateIndex === 0 && activity.isFullShiftActivity
          ? (shift.parentElement as HTMLDivElement)
          : shift;
      const shiftOrTimeline = shift.parentElement as HTMLDivElement;

      const reg = new RegExp(/[(/)]/);
      let parentLeftPercent: string;
      let parentWidthPercent;
      if (shiftOrTimeline.style.left !== '') {
        [parentLeftPercent] = shiftOrTimeline.style.left.split('%');
        parentWidthPercent = shiftOrTimeline.style.width.split(reg)[1].split('%')[0];
      } else {
        parentLeftPercent = '';
        parentWidthPercent = 100;
      }
      const parentLeft = !isShift ? +parentLeftPercent : 0;
      const parentWidth = !isShift ? +parentWidthPercent : 100;

      let left =
        (SchUtils.getLeft(+activity.start + stepMinutes * 60000, String(activity.date)) - parentLeft) /
        (parentWidth * 0.01);

      const { min: shiftMinPercent, max: shiftMaxPercent } = shift.dataset;
      if (!isShift) {
        if (shiftMinPercent && left < +shiftMinPercent) {
          left = +shiftMinPercent;
        }
        if (shiftMaxPercent && left > +shiftMaxPercent) {
          left = +shiftMaxPercent;
        }

        const maxWidth = 100 - parseFloat(shiftElement.style.width);
        if (left < 0) {
          left = 0;
        }
        if (left > maxWidth) {
          left = maxWidth;
        }
      }

      if (
        (direction === 'left' && (!isShift || (shiftMaxPercent && shiftElement.style.left > shiftMaxPercent))) ||
        (direction === 'right' && (!isShift || (shiftMinPercent && shiftElement.style.left < shiftMinPercent))) ||
        (!shiftMinPercent && !shiftMaxPercent)
      ) {
        shiftElement.style.left = `${left}%`;
      }
    });
    if (cb) cb();
  }
  static getActivitiesStrings(activities: ISchActivity[]) {
    if (!activities || !activities.length) return '';
    return (
      activities
        //.filter(activity => activity.setId === 0)
        .map(activity => activity.name)
        .join(', ')
    );
  }

  static getActivitySetStrings(activities: ISchActivity[]) {
    if (!activities || !activities.length) return '';
    const activitiesString = activities
      .filter(activity => activity.setId !== 0)
      .map(activity => activity.name)
      .join(', ');

    if (!activitiesString) {
      return activities
        .filter(activity => activity.setId === 0)
        .map(activity => activity.name)
        .join(', ');
    }
    return activitiesString;
  }

  static collectAgentDaysByActivities(timeLines: IAgentTimeline[], activities: ISelectedActivity[]): IAgentTimeline[] {
    return activities
      .reduce((acc: IAgentTimeline[], activity) => {
        const agents = [...acc];

        const idx: number = (() => {
          const _idx = agents.findIndex(agent => agent.agentId === activity.agentId);
          if (_idx !== -1) return _idx;

          const _agent = timeLines.find(agent => agent.agentId === activity.agentId);
          if (!_agent) return -1;

          return agents.push(_agent) - 1;
        })();

        return agents.map((a, i) => {
          if (idx !== i) return a;
          return {
            ...a,
            days: a.days.map(d => {
              if (d.date !== activity.dayDate) return d;
              return { ...d, isSelected: true };
            }),
          };
        });
      }, [])
      .map(agent => ({
        ...agent,
        days: agent.days
          .filter(day => day.isSelected)
          .map(day => ({ ...omit(['isSelected'], day) } as IAgentDayTimeline)),
      }));
  }

  static getUpdatedSelectedActivity(
    selectedActivities: ISelectedActivity[],
    agents: IAgentTimeline[],
  ): { selectedActivities: ISelectedActivity[]; selectedAgents: number[] } {
    const selectedActivity: ISelectedActivity[] = [];
    const selectedAgents: number[] = [];
    const list = clone(selectedActivities);
    list.forEach((x: ISelectedActivity) => {
      const currentAgent = agents.find(agent => agent.agentId === x.agentId);
      if (currentAgent) {
        const groupedActivities = SchSelectedActivity.groupActivities(currentAgent.activities);
        const activity = groupedActivities.find(activity => activity.id === x.id.toString());
        selectedAgents.push(currentAgent.agentId);
        if (activity) {
          const dayDate = DateUtils.setDayTime(activity.start, '00:00');
          selectedActivity.push(mergeDeepRight(x, { ...activity, dayDate }) as unknown as ISelectedActivity);
        }
      }
    });

    return { selectedAgents: selectedAgents, selectedActivities: selectedActivity };
  }
}

export default SchSelectedActivity;
