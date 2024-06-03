import moment from 'moment';
import { isEmpty, isNil, omit, pathOr } from 'ramda';
import { v4 } from 'uuid';

import restApi from '../../api/rest';
import { SCH_STATE_TYPE, ZERO_TIME_FOR_OLE_DATE_IN_TIMESTAMP } from '../../common/constants';
import { DayType, OverlappingWarning, RefType, SchStateType } from '../../common/constants/schedule';
import { IAgentSchedule, ISchActivity, ISchDayState, ISchState } from '../../common/interfaces/schedule/IAgentSchedule';
import { IWarning } from '../../common/interfaces/schedule/IWarning';
import { MoveTo } from '../../components/ScheduleComponents/Popups/NewMultipleWizardMenu/multipleStates/EditMultiple/EditMultipleWizard';
import { IMainState as NewShiftMainState } from '../../components/ScheduleComponents/Popups/NewMultipleWizardMenu/multipleStates/newShifts';
import { ISelectedActivity, IShifts, ITimeOff, SetActivitiesFor } from '../../redux/ts/intrefaces/timeLine';
import { IAgentDayTimeline, IAgentTimeline } from '../../redux/ts/intrefaces/timeLine/IAgentTimeline';
import DateUtils from '../dateUtils';
import DateUtilsTimeZone from '../DateUtilsTimeZone';
import Utils from '../utils';
import SchActivitySet from './SchActivitySet';
import SchDay from './SchDay';
import SchSelectedActivity from './SchSelectedActivity';
import SchState from './SchState';
import SchUtils from './SchUtils';

export interface IRemoveAgentDay {
  [date: number | string]: number[];
}

class SchAgent {
  constructor(options: IAgentTimeline) {
    Object.assign(this, options);
  }

  static fixTimeOffResponseInZeroTime(reqAgents: IAgentTimeline[], resAgents: IAgentSchedule[]): IAgentSchedule[] {
    return resAgents.map(resAgent => {
      const reqAgent = reqAgents.find(a => a.agentId === resAgent.agentId);
      if (!reqAgent) return resAgent;
      const { tzSite, tzSelected } = reqAgent._TZ_INTERNAL_USAGE;
      return {
        ...resAgent,
        days: resAgent.days.map(resDay => {
          const reqDay = reqAgent.days.find(d => DateUtils.getDay(d.date) === DateUtils.getDay(resDay.date));
          if (!reqDay) return resDay;
          const isNeedToConvertToTz = reqDay?.dayState?.startDateTime === ZERO_TIME_FOR_OLE_DATE_IN_TIMESTAMP;
          if (!isNeedToConvertToTz) return resDay;

          const isNeedToSetFullDay = resDay.dayState?.startDateTime === ZERO_TIME_FOR_OLE_DATE_IN_TIMESTAMP;
          let startDateTime: number;
          let endDateTime: number;

          if (isNeedToSetFullDay) {
            startDateTime = DateUtils.setDayTime(resDay.date, '00:00');
            endDateTime = DateUtils.setDayTime(resDay.date, '00:00', true);

            startDateTime = DateUtils.convertAccordingToTzTimestamp(startDateTime, tzSelected, tzSite);

            endDateTime = DateUtils.convertAccordingToTzTimestamp(endDateTime, tzSelected, tzSite);
          } else {
            startDateTime = DateUtils.convertAccordingToTzTimestamp(
              resDay.dayState?.startDateTime ?? 0,
              tzSelected,
              tzSite,
            );

            endDateTime = DateUtils.convertAccordingToTzTimestamp(
              resDay.dayState?.endDateTime ?? 0,
              tzSelected,
              tzSite,
            );
          }

          const dayState = resDay.dayState
            ? {
                ...resDay.dayState,
                startDateTime,
                endDateTime,
              }
            : resDay.dayState;

          return {
            ...resDay,
            dayState: dayState,
          };
        }),
      };
    });
  }
  static fixExceptionResponsePaidOurs(reqAgents: IAgentTimeline[], resAgents: IAgentSchedule[]): IAgentSchedule[] {
    return resAgents.map(resAgent => {
      const reqAgent = reqAgents.find(a => a.agentId === resAgent.agentId);
      if (!reqAgent) return resAgent;
      return {
        ...resAgent,
        days: resAgent.days.map(resDay => {
          const reqDay = reqAgent.days.find(d => DateUtils.getDay(d.date) === DateUtils.getDay(resDay.date));
          if (!reqDay) return resDay;
          const dayState =
            resDay.dayState && resDay.dayState.type === SchStateType.EXCEPTION
              ? {
                  ...resDay.dayState,
                  paidMinutes: reqDay.dayState?.paidMinutes,
                  isFullDay: reqDay.dayState?.isFullDay,
                }
              : resDay.dayState;
          const states: ISchState[] = [];

          for (const i of resDay.states) {
            if (i.type === SchStateType.EXCEPTION) {
              const temp = reqDay.states.find(el => el.type === i.type && el.startDateTime === i.startDateTime);
              states.push({
                ...i,
                paidMinutes: temp?.paidMinutes || 0,
                isFullDay: temp?.isFullDay || true,
              });
            } else {
              states.push(i);
            }
          }
          return {
            ...resDay,
            dayState: dayState,
            paidMinutes: dayState?.type === SchStateType.EXCEPTION ? reqDay.dayState?.paidMinutes : resDay.paidMinutes,
            states,
          };
        }),
      };
    });
  }

  static findShiftInSelectedDate(agent: IAgentTimeline, date: string | number): ISchDayState | undefined | null {
    const { tzSite, tzSelected } = agent._TZ_INTERNAL_USAGE;
    const day = agent.days.find(
      day =>
        day.dayState?.startDateTime &&
        DateUtils.isSameDayOfWeek(
          DateUtils.convertAccordingToTzTimestamp(day.dayState.startDateTime, tzSite, tzSelected),
          date,
        ),
    );
    return day?.dayState;
  }

  static prepareAgentForPerformance(agents: IAgentTimeline[]) {
    return agents
      .filter(agent => agent.isModified)
      .map(agent => {
        const _agent: IAgentSchedule = {
          ...omit(
            [
              '_TZ_INTERNAL_USAGE',
              'activities',
              'shiftStartTime',
              'shiftEndTime',
              'activities',
              'isBuild',
              'isSave',
              'isModified',
              'isFixLater',
              'shortTimeZone',
              'timeZone',
              'timeZoneDifference',
            ],
            agent,
          ),
          startDate: DateUtils.convertToIsoWithoutTz(agent.startDate),
          endDate: DateUtils.convertToIsoWithoutTz(agent.endDate),
          days: SchDay.prepareDaysForPerformance(agent.days),
        };

        return _agent as IAgentSchedule;
      });
  }

  static prepareAgentsForSave(agents: IAgentTimeline[], forValidate = false): IAgentSchedule[] {
    return agents
      .map(agent => {
        const _agent: IAgentSchedule = {
          ...omit(
            [
              '_TZ_INTERNAL_USAGE',
              'activities',
              'shiftStartTime',
              'shiftEndTime',
              'activities',
              'isBuild',
              'isSave',
              'isModified',
              'isFixLater',
              'shortTimeZone',
              'timeZone',
              'timeZoneDifference',
            ],
            agent,
          ),
          startDate: DateUtils.convertToIsoWithoutTz(agent.startDate),
          endDate: DateUtils.convertToIsoWithoutTz(agent.endDate),
          days: SchDay.prepareDaysForSave(agent.days, forValidate),
        };

        return _agent as IAgentSchedule;
      })
      .filter(agent => agent.days.length);
  }

  static prepareAgentsForBuild(agents: IAgentTimeline[]): IAgentSchedule[] {
    return agents
      .filter(agent => agent.isBuild)
      .map(agent => {
        const _agent: IAgentSchedule = {
          ...omit(
            [
              '_TZ_INTERNAL_USAGE',
              'activities',
              'shiftStartTime',
              'shiftEndTime',
              'activities',
              'isBuild',
              'isSave',
              'isModified',
              'isFixLater',
              'shortTimeZone',
              'timeZone',
              'timeZoneDifference',
              'useTotalHours',
              'shift',
              'timezoneId',
            ],
            agent,
          ),
          startDate: DateUtils.convertToIsoWithoutTz(+agent.startDate),
          endDate: DateUtils.convertToIsoWithoutTz(+agent.endDate),
          days: SchDay.prepareDaysForBuild(agent.days),
        };
        return _agent;
      });
  }

  static clearAgentsFromTempFields(agents: IAgentSchedule[]): any[] {
    return agents.map(agent => {
      return {
        ...agent,
        days: agent.days.map(day => {
          return {
            ...day,
            dayState: { ...omit(['changed'], day.dayState) },
            states: day.states.map(state => {
              return { ...omit(['changed'], state) };
            }),
          };
        }),
      };
    });
  }

  static prepareAgentsForCopy(agents: IAgentTimeline[]): IAgentSchedule[] {
    return agents
      .filter(agent => agent.isBuild)
      .map(agent => {
        const _agent: IAgentSchedule = {
          ...omit(
            [
              '_TZ_INTERNAL_USAGE',
              'activities',
              'shiftStartTime',
              'shiftEndTime',
              'activities',
              'isBuild',
              'isSave',
              'isModified',
              'isFixLater',
              'shortTimeZone',
              'timeZone',
              'timeZoneDifference',
              'changed',
            ],
            agent,
          ),
          startDate: DateUtils.convertToIsoWithoutTz(+agent.startDate),
          endDate: DateUtils.convertToIsoWithoutTz(+agent.endDate),
          days: SchDay.prepareDaysForCopy(agent.days),
        };
        return _agent;
      });
  }

  static filterBuildInSnapshotByRequestedDate(
    reqAgents: IAgentSchedule[] | IAgentTimeline[],
    resAgents: IAgentSchedule[] | IAgentTimeline[],
  ) {
    return resAgents.map(agent => {
      return {
        ...agent,
        days: [agent.days[0]],
      };
    });
  }

  static dayOffDataTimesInSelectTz(
    data: IAgentSchedule[],
    timelines: IAgentTimeline[],
    dayType: number,
  ): IAgentSchedule[] {
    return data.map(agent => {
      const agentTimeline = timelines.find(a => a.agentId === agent.agentId);
      let tzSite = {
        currentOffset: 0,
        gswTimezoneId: 0,
        description: 'empty tz',
        name: 'uncnown',
        timezoneId: 0,
        value: 0,
      };
      let tzSelected = tzSite;
      if (agentTimeline) {
        tzSite = agentTimeline._TZ_INTERNAL_USAGE.tzSite;
        tzSelected = agentTimeline._TZ_INTERNAL_USAGE.tzSelected;
      }

      return {
        ...agent,
        days: agent.days.map(day =>
          day.type === dayType
            ? {
                ...day,
                dayState: {
                  ...day.dayState,
                  startDateTime: DateUtilsTimeZone.getTzDifference(
                    DateUtils.getMidnight(day.startDateTime).split('T')[0],
                    tzSite,
                    tzSelected,
                  ),
                  endDateTime: DateUtilsTimeZone.getTzDifference(
                    DateUtils.getMidnight(day.endDateTime).split('T')[0],
                    tzSite,
                    tzSelected,
                  ),
                },
                startDateTime: DateUtilsTimeZone.getTzDifference(
                  DateUtils.getMidnight(day.startDateTime).split('T')[0],
                  tzSite,
                  tzSelected,
                ),
                prevEndDateTime: day.prevEndDateTime ? new Date(day.prevEndDateTime).getTime() : undefined,
                nextStartDateTime: day.prevEndDateTime ? new Date(day.prevEndDateTime).getTime() : undefined,
                endDateTime: DateUtilsTimeZone.getTzDifference(
                  DateUtils.getMidnight(day.endDateTime).split('T')[0],
                  tzSite,
                  tzSelected,
                ),
              }
            : { ...day },
        ),
      } as IAgentSchedule;
    });
  }

  static getModifiedAgentDays(agents: IAgentTimeline[]) {
    return agents.reduce((acc: IAgentTimeline[], agent) => {
      if (agent.isModified) {
        acc.push({
          ...agent,
          days: agent.days.filter(day => day.isModified),
        });
      }
      return acc;
    }, []);
  }

  static getAgentDaysForBuild(agents: IAgentTimeline[]) {
    return agents.reduce((acc: IAgentTimeline[], agent) => {
      if (agent.isBuild) {
        acc.push({
          ...agent,
          days: agent.days.filter(day => day.isBuild),
        });
      }
      return acc;
    }, []);
  }

  static insertState(
    agents: IAgentTimeline[],
    selectedActivity: ISelectedActivity,
    states: ISchState,
    ignoreWarning = true,
  ): IAgentTimeline[] {
    const shiftStartTime = selectedActivity.start;
    const shiftEndTime = selectedActivity.end;
    return agents.map(agent => {
      if (agent.agentId !== selectedActivity.agentId) return agent;
      let isModified = false;
      let isBuild = false;
      let days = agent.days;
      days = days.map(agentDay => {
        if (
          (agentDay.dayState?.endDateTime === shiftEndTime ||
            agentDay.dayState?.endDateTime === selectedActivity.shiftEnd) &&
          (agentDay.dayState?.startDateTime === shiftStartTime ||
            agentDay.dayState?.startDateTime === selectedActivity.shiftStart)
        ) {
          const dayType =
            agentDay.dayState.isFullDay && agentDay.dayState.type === SchStateType.EXCEPTION
              ? DayType.SHIFT_EXCEPTION
              : agentDay.type;

          const _day = { ...agentDay, type: dayType, isBuild: true, isModified: true };
          isModified = true;
          isBuild = true;
          _day.states = [..._day.states, states];
          const { day, warnings } = SchDay.validateDay(_day, agent, states);
          if (!ignoreWarning && !isEmpty(warnings)) {
            throw new OverlappingWarning(warnings.map(m => `${m}`).join('\n'));
          }
          return day;
        }

        return agentDay;
      });

      if (isModified) return { ...agent, isModified, isBuild, days };

      return agent;
    });
  }

  static insertMarkedTime(agent: IAgentTimeline, state: ISchState): IAgentTimeline {
    return {
      ...agent,
      isModified: true,
      isBuild: true,
      days: agent.days.map(day => {
        if (DateUtils.isSameDayOfWeek(day.dayState?.startDateTime || day.date, state.startDateTime)) {
          if (day.dayState?.startDateTime && day.dayState?.endDateTime) {
            const shiftStartDateTime = day.dayState.startDateTime;
            const shiftEndDateTime = day.dayState.endDateTime;

            const newShiftStartDateTime =
              state.startDateTime < shiftStartDateTime ? state.startDateTime : shiftStartDateTime;
            const newShiftEndDateTime = state.endDateTime > shiftEndDateTime ? state.endDateTime : shiftEndDateTime;

            const states = SchState.extendWorkActivityInShift(
              [...day.states, state],
              +newShiftStartDateTime,
              +newShiftEndDateTime,
            );
            return {
              ...day,
              dayState: {
                ...day.dayState,
                startDateTime: newShiftStartDateTime,
                endDateTime: newShiftEndDateTime,
              },
              startDateTime: newShiftStartDateTime,
              endDateTime: newShiftEndDateTime,
              isModified: true,
              isBuild: true,
              states,
            };
          }
        }
        return day;
      }),
    };
  }

  static insertStates(agents: IAgentTimeline[], states: ISchState[]): IAgentTimeline[] {
    return agents.map(agent => {
      let days = agent.days;
      days = days.map(day => {
        const shiftStartTime = day.dayState?.startDateTime || day.startDateTime;
        const shiftEndTime = day.dayState?.endDateTime || day.endDateTime;
        const dayType =
          day.dayState?.isFullDay && day.dayState.type === SchStateType.EXCEPTION ? DayType.SHIFT_EXCEPTION : day.type;
        const _day = { ...day, type: dayType, isBuild: true, isModified: true };
        _day.states = [
          ..._day.states,
          ...states.filter(
            state =>
              state.startDateTime > shiftStartTime &&
              state.startDateTime < shiftEndTime &&
              state.endDateTime < shiftEndTime &&
              state.endDateTime > shiftStartTime,
          ),
        ];
        return SchDay.validateDay(_day).day;
      });
      return { ...agent, isModified: true, isBuild: true, days };
    });
  }

  static updateAgentDay({
    agents,
    updatedActivities,
    timeForMove,
    isChangeType,
    item,
    isEditedInReviewWarning = false,
    moveExceptions = true,
    cleanMeetingRef = false,
  }: {
    agents: IAgentTimeline[];
    updatedActivities: ISelectedActivity[];
    timeForMove?: number | null;
    isChangeType?: boolean;
    item?: ITimeOff;
    isEditedInReviewWarning?: boolean;
    moveExceptions?: boolean;
    cleanMeetingRef?: boolean;
  }): { agents: IAgentTimeline[]; warnings: string[] } {
    let warnings: string[] = [];
    return {
      agents: agents.map((agent: IAgentTimeline) => {
        let isBuild = false;
        // let shiftStartTime = agent.shiftStartTime;
        // let shiftEndTime = agent.shiftEndTime;
        const days = agent.days.map((day, index) => {
          const newActivity = updatedActivities.find(
            activity => +activity.dayIndex === index && activity.agentId === agent.agentId,
          );

          if (newActivity) {
            isBuild = true;
            let newDay: IAgentDayTimeline;
            if (timeForMove) {
              newDay = SchDay.moveDayShift(day, timeForMove, moveExceptions);
            } else {
              newDay = SchDay.changeActivityTime(day, newActivity, isChangeType);
            }

            if (item) {
              newDay = SchDay.changeItemType(newDay, item);
            }

            if (
              newActivity.stateIndex !== undefined &&
              newActivity.type === SCH_STATE_TYPE[SchStateType.EXCEPTION] &&
              newActivity.stateIndex
            ) {
              const validationResult = SchDay.validateDay(newDay, agent, newDay.states[newActivity.stateIndex]);
              newDay = validationResult.day;
              warnings = [...warnings, ...validationResult.warnings];
            } else {
              SchDay.validateDay(newDay, agent);
            }

            return {
              ...newDay,
              isBuild,
              isEditedInReviewWarning: false,
              states: newDay.states.map((s, index) => {
                if (index === updatedActivities[0].stateIndex) {
                  if (s.refType === RefType.MEETING && cleanMeetingRef) {
                    return {
                      ...s,
                      refId: 0,
                      refType: 0,
                      changed: true,
                    };
                  }
                  return {
                    ...s,
                    changed: true,
                  };
                }
                return s;
              }),
            };
          }

          return day;
        });
        if (isBuild) {
          return {
            ...agent,
            isBuild,
            isModified: isBuild,
            days,
            isEditedInReviewWarning: isEditedInReviewWarning && isBuild,
          };
        }
        return agent;
      }),
      warnings,
    };
  }

  static moveAgentsShift(
    agents: IAgentTimeline[],
    activities: ISelectedActivity[],
    differenceInTime: number,
    moveExceptions = true,
  ) {
    const usedIds: any[] = [];
    let warnings: string[] = [];
    return {
      agents: agents.map(agent => {
        let isBuild = false;

        const agentActivities = activities.filter(activity => activity.agentId === agent.agentId);
        const days = agent.days.map((agentDay, index) => {
          const dayActivity = agentActivities.find(
            activity => +activity.dayIndex === index && !usedIds.includes(activity.id),
          );
          usedIds.push(dayActivity?.id);
          if (dayActivity) {
            isBuild = true;

            const isShift =
              (dayActivity?.type === 'shift' ||
                dayActivity?.type === 'activity_set' ||
                dayActivity?.type === 'exception' ||
                dayActivity?.type === 'time_off') &&
              dayActivity?.stateIndex === undefined;

            if (isShift) {
              const day = SchDay.moveDayShift(agentDay, differenceInTime, moveExceptions);
              SchDay.validateDay(day, agent);
              return day;
            }
            const result = SchDay.moveDayShiftItems(
              agentDay,
              activities.filter(ac => ac.agentId === agent.agentId),
              differenceInTime,
              dayActivity._type,
              agent,
            );

            if (result.warnings) {
              warnings = [...warnings, ...result.warnings];
            }

            return result.day ? result.day : result;
          }
          ``;
          return agentDay;
        });

        if (isBuild) {
          return { ...agent, isBuild, days };
        }

        return agent;
      }),
      warnings,
    };
  }

  static moveAgentShift(
    agent: IAgentTimeline,
    activity: ISelectedActivity,
    differenceInTime: number,
    moveExceptions = true,
  ): IAgentTimeline {
    let isBuild = false;
    const days = agent.days.map(day => {
      const isNewActivity =
        day.dayState && activity.start === day.dayState.startDateTime && activity.agentId === agent.agentId;

      if (isNewActivity) {
        isBuild = true;
        const newDay = SchDay.moveDayShift(day, differenceInTime, moveExceptions);
        SchDay.validateDay(newDay, agent);
        return { ...newDay, isBuild };
      }

      return day;
    });
    if (isBuild) {
      return { ...agent, isBuild, isModified: isBuild, days };
    }
    return agent;
  }

  static moveAgentShiftItem(
    agent: IAgentTimeline,
    activity: ISelectedActivity,
    differenceInTime: number,
  ): IAgentTimeline {
    let isBuild = false;

    const days = agent.days.map((day, index) => {
      const isNewActivity = +activity.dayIndex === index && activity.agentId === agent.agentId;

      if (isNewActivity) {
        isBuild = true;
        const newDay = SchDay.moveDayShiftItem(day, activity, differenceInTime);
        // SchDay.validateDay(newDay);
        // newDay = {
        //   ...newDay,

        // }
        return { ...newDay, isBuild };
      }

      return day;
    });
    if (isBuild) {
      return { ...agent, isBuild, isModified: isBuild, days };
    }
    return agent;
  }

  static prepareIfFullDayTimeOff(agents: IAgentTimeline[], response: IAgentTimeline[]): IAgentTimeline[] {
    return response.map(agent => {
      const _agent = agents.find(_agent => _agent.agentId === agent.agentId);
      if (!_agent) return agent;

      const days = agent.days.map(day => {
        if (day.dayState?.type === SchStateType.DAY_OFF && day.dayState.isFullDay) {
          const dayState = {
            ...day.dayState,
            startDateTime:
              _agent._TZ_INTERNAL_USAGE.tzSelected.timezoneId !== 0
                ? new Date(
                    DateUtils.convertDayStartDelimiter(
                      day.startDateTime,
                      _agent._TZ_INTERNAL_USAGE.tzSite,
                      _agent._TZ_INTERNAL_USAGE.tzSelected,
                    ),
                  ).getTime()
                : day.dayState.startDateTime,
            endDateTime:
              _agent._TZ_INTERNAL_USAGE.tzSelected.timezoneId !== 0
                ? new Date(
                    DateUtils.convertDayStartDelimiter(
                      day.endDateTime,
                      _agent._TZ_INTERNAL_USAGE.tzSite,
                      _agent._TZ_INTERNAL_USAGE.tzSelected,
                    ),
                  ).getTime()
                : day.dayState.endDateTime,
          };

          return { ...day, dayState };
        }
        return day;
      });
      return { ...agent, days };
    });
  }

  static mergeAgentDays(agents: IAgentTimeline[], newAgents: IAgentTimeline[], ignoreWarnings = true) {
    return agents.map(agent => {
      const { tzSite, tzSelected } = agent._TZ_INTERNAL_USAGE;
      //new agent data
      const newAgent = newAgents.find(item => item.agentId === agent.agentId);
      if (newAgent) {
        const removedDays: IAgentDayTimeline[] = [];
        const newDays: IAgentDayTimeline[] = [];

        newAgent.days
          .filter(day => day.type !== DayType.NONE)
          .map(newDay => {
            const oldDay = agent.days.find(_day => _day.uuid === newDay.uuid);
            if (!oldDay) return newDays.push({ ...newDay, isModified: true });

            const oldDayDate = DateUtils.getDayByDate(
              pathOr(oldDay.startDateTime, ['dayState', 'startDateTime'], oldDay),
              tzSite,
              tzSelected,
            );

            const newDayDate = DateUtils.getDayByDate(
              pathOr(newDay.startDateTime, ['dayState', 'startDateTime'], newDay),
              tzSite,
              tzSelected,
            );
            const timestamp = newDay.timestamp || oldDay.timestamp;

            // if new day moved to new date
            // need to remove from old date
            if (newDayDate !== oldDayDate) {
              // if moved two shift and second shift moved to next day
              const oldDayInCurrentDate = agent.days.find(
                _day =>
                  newDayDate ===
                  DateUtils.getDayByDate(
                    pathOr(_day.startDateTime, ['dayState', 'startDateTime'], _day),
                    tzSite,
                    tzSelected,
                  ),
              );
              // const newDayInCurrentDay = newAgent.days.find(_day => _day.uuid === oldDayInCurrentDate?.uuid);

              // if old date moved to other date
              // no need to remove this day if new shift replaced to this day
              let replacedDayInCurrentDateChangedToOtherDate = false;
              if (oldDayInCurrentDate && newDay) {
                const oldDayDate = DateUtils.getDayByDate(
                  pathOr(oldDayInCurrentDate.startDateTime, ['dayState', 'startDateTime'], oldDayInCurrentDate),
                  tzSite,
                  tzSelected,
                );
                const newDayInCurrentDate = DateUtils.getDayByDate(
                  pathOr(newDay.startDateTime, ['dayState', 'startDateTime'], newDay),
                  newDay.timeZoneSite,
                  newDay.timeZoneSelected,
                );

                replacedDayInCurrentDateChangedToOtherDate = oldDayDate !== newDayInCurrentDate;
                if (
                  !ignoreWarnings &&
                  oldDayInCurrentDate &&
                  oldDayInCurrentDate?.type !== DayType.NONE &&
                  !replacedDayInCurrentDateChangedToOtherDate
                ) {
                  throw Error(SchDay.warnings.oldShiftCanBeRemoved);
                }
              }

              const isNewDayExistInNewDaysPayload = newAgent.days.find(day => {
                const _startTime = pathOr(day.startDateTime, ['dayState', 'startDateTime'], day);

                const _dayDate = DateUtils.getDayByDate(_startTime, day.timeZoneSite, day.timeZoneSelected);
                return _dayDate === oldDayDate;
              });

              !isNewDayExistInNewDaysPayload && removedDays.push(SchDay.removeAgentDay(oldDay, true));
              newDays.push({ ...newDay, uuid: v4(), isModified: true, timestamp: 0 });
            } else {
              newDays.push({ ...newDay, isModified: true, timestamp });
            }
          });

        const agentDays = agent.days.map(day => {
          const oldDayDate = DateUtils.getDayByDate(
            pathOr(day.startDateTime, ['dayState', 'startDateTime'], day),
            tzSite,
            tzSelected,
          );

          const [newDay, index] = Utils.findItemAndIndex(newDays, newDay => {
            const newDayDate = DateUtils.getDayByDate(
              pathOr(newDay.startDateTime, ['dayState', 'startDateTime'], newDay),
              tzSite,
              tzSelected,
            );
            return oldDayDate === newDayDate;
          });
          const [removedDay, removeDayIndex] = Utils.findItemAndIndex(removedDays, newDay => {
            const newDayDate = DateUtils.getDayByDate(
              pathOr(newDay.startDateTime, ['dayState', 'startDateTime'], newDay),
              tzSite,
              tzSelected,
            );
            return oldDayDate === newDayDate;
          });
          if (removedDay && !isNil(removeDayIndex)) {
            removedDays.splice(removeDayIndex, 1);
            return removedDay;
          } else if (newDay && !isNil(index)) {
            newDays.splice(index, 1);
            return newDay;
          } else {
            return day;
          }
        });
        //remove duplicated
        const mergedDays = [...agentDays, ...newDays, ...removedDays];

        const lostFields = {
          buName: agent.buName,
          agentName: agent.agentName,
          siteName: agent.siteName,
          teamName: agent.teamName,
        };
        return { ...agent, ...newAgent, days: mergedDays, isModified: true, ...lostFields };
      }
      return agent as IAgentTimeline;
    }) as IAgentTimeline[];
  }

  static clearIsModified(agents: IAgentTimeline[], clearAgents: IAgentTimeline[]): IAgentTimeline[] {
    const targetIds = clearAgents.map(a => a.agentId);
    return agents.map(el => {
      let days = el.days;
      if (targetIds.includes(el.agentId)) {
        const clearAgent = clearAgents.find(a => a.agentId === el.agentId);
        if (clearAgent) {
          const agentIds = clearAgent.days.map(d => d.date);
          days = (el.days ?? []).map(d =>
            agentIds.includes(d.date) ? { ...d, isModified: false, isBuild: false } : d,
          );
          el.isModified = days.some(d => !!d.isModified);
          el.isBuild = days.some(d => !!d.isBuild);
        }
      }

      return { ...el, days };
    });
  }

  static prepareDataForNewShift(
    agent: IAgentTimeline,
    formData: NewShiftMainState,
    currentDate: string,
  ): IAgentTimeline[] {
    const shift =
      formData.showAll || !Array.isArray(formData.filteredShifts)
        ? formData.shifts[formData.selectedShift]
        : formData.filteredShifts[formData.selectedShift];
    const ids = SchUtils.requiredFields(SchUtils.getElementsByID(formData.checkedActivitiesSets, formData.activities), [
      'id',
      'setId',
    ]);

    const tempObject: IAgentTimeline = {
      ...agent,
      isModified: true,
      isBuild: true,
      buId: agent.buId,
      agentId: agent.agentId,
      siteId: agent.siteId,
      teamId: agent.teamId,
      startDate: agent.startDate,
      endDate: agent.endDate,
      days: [
        {
          timeZoneSite: agent._TZ_INTERNAL_USAGE.tzSite,
          timeZoneSelected: agent._TZ_INTERNAL_USAGE.tzSelected,
          isModified: true,
          isBuild: true,
          date: currentDate,
          activities: ids,
          activitySets: SchActivitySet.getActivitySetsByID(
            formData.checkedActivitiesSets,
            formData.activities,
            formData.activitiesSet,
          ),
          dayState: {
            id: shift.id,
            type: SchStateType.SHIFT,
            startDateTime: DateUtils.setDayTime(
              currentDate,
              String(formData.startTime),
              false,
              formData.previousStartDay,
            ),
            endDateTime: DateUtils.setDayTime(currentDate, String(formData.endTime), formData.nextEndDay),
          },
          startDateTime: DateUtils.setDayTime(
            currentDate,
            String(formData.startTime),
            false,
            formData.previousStartDay,
          ),
          endDateTime: DateUtils.setDayTime(currentDate, String(formData.endTime), formData.nextEndDay),
          type: DayType.SHIFT,
          id: shift.id,
          states: [
            {
              endDateTime: DateUtils.setDayTime(currentDate, String(formData.endTime), formData.nextEndDay),
              id: SchUtils.requiredFields(
                SchUtils.getElementsByID(formData.checkedActivitiesSets, formData.activities),
                ['setId'],
              )[0].setId,
              type: SchStateType.ACTIVITY_SET,
              startDateTime: DateUtils.setDayTime(
                currentDate,
                String(formData.startTime),
                false,
                formData.previousStartDay,
              ),
            },
          ],
        },
      ],
    };
    return [tempObject];
  }

  static insertDay = (
    agent: IAgentTimeline,
    currentDate: any,
    dayState: ISchDayState | null = null,
    dayType: DayType = DayType.DAY_OFF,
  ): IAgentTimeline[] => {
    const days = [
      {
        isBuild: true,
        date: DateUtils.getMidnight(currentDate),
        timeZoneSite: agent._TZ_INTERNAL_USAGE.tzSite,
        timeZoneSelected: agent._TZ_INTERNAL_USAGE.tzSelected,
        activities: [],
        activitySets: [],
        dayState: dayState,
        startDateTime: dayState?.startDateTime ? dayState.startDateTime : currentDate,
        endDateTime: dayState?.endDateTime ? dayState.endDateTime : currentDate + 86400000,
        type: dayType,
        paidMinutes: dayState?.paidMinutes,
        id: dayState?.id || 0,
        states: [],
      },
    ];

    return [
      {
        ...agent,
        isModified: true,
        isBuild: true,
        days: days,
      },
    ];
  };

  static mergeAgents(agents: IAgentTimeline[], newAgents: IAgentTimeline[]) {
    return agents.map(agent => {
      const newAgentData = newAgents.find(_agent => _agent.agentId === agent.agentId);
      return {
        ...agent,
        ...newAgentData,
        isEditedInReviewWarning: agent?.isEditedInReviewWarning || newAgentData?.isEditedInReviewWarning || false,
      };
    });
  }

  /**
   *
   * @param agents
   * @param dates [{ date: [agentId, agentId] }]
   *
   */

  static removeAgentDayByDate(
    agents: IAgentTimeline[],
    dates: IRemoveAgentDay,
  ): { updatedAgents: IAgentTimeline[]; isModified: boolean } {
    let isAnyModified = false;
    const _agents = agents.map(agent => {
      let isModified = false;
      const days = agent.days.map(day => {
        const date = Object.keys(dates).find(d => +d === +day.date);
        if (date && dates[date].includes(agent.agentId)) {
          isModified = true;
          isAnyModified = true;
          return SchDay.removeAgentDay(day, false);
        }
        return day;
      });

      return {
        ...agent,
        days,
        isModified: agent.isModified || isModified,
      };
    });
    return {
      isModified: isAnyModified,
      updatedAgents: _agents,
    };
  }

  static collectAgentWarnings(agents: IAgentTimeline[], validationResponse: IWarning[]) {
    return agents
      .filter(a => a.isModified)
      .map(agent => {
        const agentWarnings = validationResponse.filter((_agent: IWarning) => _agent.agentId === agent.agentId);
        if (agentWarnings.length) {
          const ignoredWarnings = 'There is no schedule for the day.';
          const _warnings = agentWarnings
            .map(warning => {
              const newWarning = {
                ...warning,
                errors: !Array.isArray(warning.errors) ? (warning.errors = [warning.errors]) : warning.errors,
                messages: !Array.isArray(warning.messages) ? (warning.messages = [warning.messages]) : warning.messages,
              };
              const indexIgnoredWarnings = newWarning.messages.findIndex(msg => msg === ignoredWarnings);

              indexIgnoredWarnings !== -1 && newWarning.messages.splice(indexIgnoredWarnings, 1);
              if (!newWarning.messages.length && !newWarning.errors.length) return null;
              return newWarning;
            })
            .filter(warning => warning) as IWarning[];

          return {
            ...agent,
            warnings: _warnings[0] ? _warnings[0] : null,
            isModified: true,
            isEditedInReviewWarning: false,
          };
        }

        return {
          ...agent,
          warnings: null,
          isModified: false,
          isBuild: false,
          isFixLater: false,
          isEditedInReviewWarning: false,
        };
      });
  }

  static deleteAgentActivities(agents: IAgentTimeline[], activities: ISelectedActivity[]): IAgentTimeline[] {
    return agents.map(agent => {
      const activitiesSorted = activities.filter(activity => activity.agentId === agent.agentId);

      if (activitiesSorted.length === 0) return agent;

      const days = agent.days.map(day => {
        let states = [...day.states];
        let dayModified = false;

        for (const activity of activitiesSorted) {
          if (activity.dayDate !== day.date) continue;

          if (activity.type === SCH_STATE_TYPE['8'] || SchSelectedActivity.isWork(activity)) {
            day = SchDay.removeAgentDay(day, true);
            dayModified = true;
          } else if (
            activity.type === SCH_STATE_TYPE['4'] ||
            activity.type === SCH_STATE_TYPE['5'] ||
            activity.type === SCH_STATE_TYPE['3'] ||
            activity.type === SCH_STATE_TYPE['2'] ||
            activity.type === SCH_STATE_TYPE['6'] ||
            activity.type === SCH_STATE_TYPE['9'] ||
            SchSelectedActivity.isWorkSet(activity) ||
            SchSelectedActivity.isActivitySet(activity)
          ) {
            states =
              SchSelectedActivity.isWorkSet(activity) || SchSelectedActivity.isActivitySet(activity)
                ? SchState.removeWorkSetByTime(states, activity)
                : SchState.removeStateItemByStartEndTimeAndId(states, activity);
            dayModified = true;
          }
        }

        if (dayModified) {
          return SchDay.removeUnusedActivities({
            ...day,
            isModified: true,
            isBuild: true,
            states: states,
          });
        }

        return day;
      });

      return { ...agent, days, isBuild: true, isModified: true };
    });
  }

  static isDaysOverlappingConflict(newTimeLine: IAgentTimeline): void {
    const tzOffset =
      newTimeLine._TZ_INTERNAL_USAGE.tzSite.currentOffset - newTimeLine._TZ_INTERNAL_USAGE.tzSelected.currentOffset;
    const startDays = (newTimeLine.days ?? [])
      .filter(day => day.dayState?.type === SchStateType.SHIFT)
      .map(day =>
        new Date(DateUtils.getRound1mTimestamp(Number(day.dayState?.startDateTime ?? 0)) + tzOffset * 6e4).getUTCDay(),
      );

    const isConflict = startDays.some((d, _, arr) => arr.indexOf(d) !== arr.lastIndexOf(d));
    if (isConflict) throw { message: `The agent already has a shift on this day. First, clear the agent day` };
  }

  static updateMultipleAgentsStatesTime(
    agents: IAgentTimeline[],
    timeMs: number,
    selectedStates: ISchState[],
    action: MoveTo,
    duration?: number,
  ): { agents: IAgentTimeline[]; isValid: boolean; isModified: boolean } {
    let isAgentsValid = true;
    let isAgentsModified = false;
    const _agents = agents.map(agent => {
      const { days, isModified, isValid } = SchDay.updateMultipleAgentDayStates(
        agent.days,
        timeMs,
        selectedStates,
        action,
        duration,
      );

      if (!isAgentsModified) isAgentsModified = isModified;
      if (isAgentsValid) isAgentsValid = isValid;

      return {
        ...agent,
        isModified,
        days: days,
        isValid: isValid,
      };
    });

    return { agents: _agents, isModified: isAgentsModified, isValid: isAgentsValid };
  }

  static filterAgentDaysByDate(agents: IAgentTimeline[], selectedDate: string | Date, stateTypes: SchStateType[]) {
    return agents.reduce((_agents: IAgentTimeline[], agent) => {
      //const preparedDay = agent.days.find(day => DateUtils.getDay(day.date) === new Date(selectedDate).getDay());
      const preparedDays = agent.days.filter(day => {
        return !!day.states.find(
          state =>
            stateTypes.includes(state.type) &&
            (DateUtilsTimeZone.dayTzComparator(state.startDateTime, selectedDate) ||
              DateUtilsTimeZone.dayTzComparator(state.endDateTime, selectedDate)),
        );
      });

      if (preparedDays.length) _agents.push({ ...agent, days: [...preparedDays] });
      return _agents;
    }, [] as IAgentTimeline[]);
  }

  static pasteStateInAgents(
    agents: IAgentTimeline[],
    state: ISchState,
    startShiftDateTime: number | string,
    pasteStartTime: number | null,
    isOffsetState = true,
  ): { updatedAgents: IAgentTimeline[]; newState: ISchState; warnings: string[] } {
    let newState = state;
    let warnings: string[] = [];
    const offsetStart = Utils.getParsedNum(state.startDateTime) - Utils.getParsedNum(startShiftDateTime);
    const duration = Utils.getParsedNum(state.endDateTime) - Utils.getParsedNum(state.startDateTime);
    const updatedAgents = agents.map(agent => ({
      ...agent,
      days: agent.days.map(day => {
        const _state = { ...state };
        if (isOffsetState) {
          if (pasteStartTime === null) {
            _state.startDateTime = DateUtils.getRound1mTimestamp(
              Utils.getParsedNum(day.dayState?.startDateTime ?? day.startDateTime) + offsetStart,
            );
            _state.endDateTime = DateUtils.getRound1mTimestamp(
              Utils.getParsedNum(day.dayState?.startDateTime ?? day.startDateTime) + offsetStart + duration,
            );
          } else {
            const start = pasteStartTime - offsetStart;
            _state.startDateTime = DateUtils.getRound1mTimestamp(start + offsetStart);
            const endDateTime = DateUtils.getRound1mTimestamp(start + offsetStart + duration);
            if (day.dayState?.endDateTime && +endDateTime > +day.dayState?.endDateTime) {
              _state.endDateTime = day.dayState?.endDateTime;
            } else {
              _state.endDateTime = endDateTime;
            }
          }
        }
        newState = _state;
        day = { ...day, states: SchState.pasteState(day.states, _state), isBuild: true };
        if (newState.type === SchStateType.EXCEPTION) {
          const validationResult = SchDay.validateDay(day, agent, newState);
          day = validationResult.day;
          warnings = [...warnings, ...validationResult.warnings];
        }
        return day;
      }),
      isBuild: true,
    }));
    return { updatedAgents, newState, warnings };
  }

  static pasteShiftInAgents(
    agents: IAgentTimeline[],
    agentDayTimeline: IAgentDayTimeline,
    pasteStartTime: number | null,
    params: {
      isOffsetDay?: boolean;
      isBuild?: boolean;
      isModified?: boolean;
      needMerge?: boolean;
    },
  ): IAgentTimeline[] {
    if (!pasteStartTime) return [];

    const copyDayState = agentDayTimeline.dayState as ISchDayState;
    const shiftStartDateTime = Utils.getParsedNum(copyDayState.startDateTime ?? agentDayTimeline.startDateTime);
    const shiftEndDateTime = Utils.getParsedNum(copyDayState.endDateTime ?? agentDayTimeline.endDateTime);
    const copyStates = agentDayTimeline.states as ISchState[];

    const extraFields: any = {};
    if (params.isBuild) extraFields.isBuild = params.isBuild;
    if (params.isModified) extraFields.isModified = params.isModified;

    return agents.map((agent: IAgentTimeline) => {
      const targetDate = DateUtils.getLocalTargetDate(agent, pasteStartTime);
      const startDateTime = DateUtils.getRound1mTimestamp(pasteStartTime);
      const endDateTime = DateUtils.getRound1mTimestamp(startDateTime + shiftEndDateTime - shiftStartDateTime);

      const _day = SchDay.createDay(
        {
          id: agentDayTimeline.id,
          type: agentDayTimeline.type,
          date: targetDate,
          startDateTime,
          endDateTime,
          dayState: {
            ...copyDayState,
            startDateTime,
            endDateTime,
          },
          states: copyStates.map(s => ({
            ...s,
            startDateTime: DateUtils.getRound1mTimestamp(
              startDateTime + Utils.getParsedNum(s.startDateTime) - shiftStartDateTime,
            ),
            endDateTime: DateUtils.getRound1mTimestamp(
              endDateTime + Utils.getParsedNum(s.endDateTime) - shiftEndDateTime,
            ),
          })),
          activities: [...agentDayTimeline.activities],
          activitySets: [...agentDayTimeline.activitySets],
        },
        // agent._TZ_INTERNAL_USAGE.tzSelected,
        // agent._TZ_INTERNAL_USAGE.tzSite,
      );

      let needNewDay = true;
      //@ts-ignore
      const days = params.needMerge
        ? (agent.days ?? []).reduce((acc: IAgentDayTimeline[], d: IAgentDayTimeline) => {
            if (d.date === targetDate) {
              needNewDay = false;
              return [...acc, { ..._day, ...extraFields }];
            }
            return [...acc];
          }, [])
        : [];

      if (needNewDay) {
        days.push({ ..._day, ...extraFields });
      }

      //@ts-ignore
      return { ...agent, days, ...extraFields } as IAgentTimeline;
    });
  }

  static validateAgents(agents: IAgentTimeline[]): { agents: IAgentTimeline[]; isValid: boolean; messages: string[] } {
    const performance = Utils.getFuncPerformance('validateAgents');
    let isValid = true;
    const messages: string[] = [];
    const _agents = agents.map(agent => {
      let isAgentValid = true;
      const days = agent.days.map(day => {
        try {
          SchDay.validateDay(day, agent);
          return day;
        } catch (e: any) {
          isValid = false;
          isAgentValid = false;
          messages.push(e.message);
          return { ...day, errors: e.message, isValid: false };
        }
      });
      return {
        ...agent,
        isValid: isAgentValid,
        days,
      };
    });
    performance();
    return { agents: _agents, isValid, messages };
  }

  static moveStatesToDate(
    updatedAgents: IAgentTimeline[],
    agents: IAgentTimeline[],
    dateFrom: number,
    dateTo: number,
    stateTypes: SchStateType[],
  ) {
    return updatedAgents.map(updatedAgent => {
      const agent = agents.find(_agent => _agent.agentId === updatedAgent.agentId);
      if (!agent) return updatedAgent;
      const { days, isModified, isValid, errors } = SchDay.moveStatesToDate(
        updatedAgent.days,
        agent.days,
        dateFrom,
        dateTo,
        stateTypes,
      );
      return {
        ...updatedAgent,
        isModified,
        isValid,
        days,
        errors,
      };
    });
  }

  static insertWorkSet(agents: IAgentTimeline[], startTime: number | string): IAgentTimeline[] {
    return agents.map(agent => {
      let isModified = false;
      let isBuild = false;

      const days = agent.days
        .map(day => {
          // const states = this.getDayStatesByDateTime(day, shiftStartTime);
          if (DateUtils.isSameDayOfWeek(day.dayState?.startDateTime || day.date, startTime)) {
            isModified = true;
            isBuild = true;

            return { ...day, isBuild, isModified };
          }

          return day;
        })
        .filter(day => day?.dayState?.type !== SchStateType.NONE);

      if (isModified) return { ...agent, isModified, isBuild, days };

      return agent;
    });
  }

  static getDayStatesByDateTime(
    agentOrDay: IAgentTimeline | IAgentDayTimeline,
    dateTime: string | number | Date,
  ): ISchState[] {
    const timestamp =
      typeof dateTime === 'string' || typeof dateTime === 'number' ? new Date(dateTime).getTime() : dateTime.getTime();

    const days =
      'days' in agentOrDay
        ? (Array.isArray(agentOrDay.days) ? agentOrDay.days : []).reduce(
            (acc: IAgentDayTimeline[], d: IAgentDayTimeline) => [...acc, d],
            [],
          )
        : [agentOrDay];

    return days.reduce(
      (acc: ISchState[], d: IAgentDayTimeline) => [
        ...acc,
        ...((d.states ?? []).filter(
          s => new Date(s.startDateTime).getTime() <= timestamp && new Date(s.endDateTime).getTime() > timestamp,
        ) ?? []),
      ],
      [],
    );
  }

  static makeDaysModified(agents: IAgentTimeline[]): IAgentTimeline[] {
    return agents.map(agent => {
      let isModified = false;
      let isBuild = false;
      const days = agent.days.map(day => {
        isModified = true;
        isBuild = true;

        return { ...day, isBuild, isModified };
      });

      return isModified ? { ...agent, isModified, isBuild, days } : agent;
    });
  }

  static removeTimeStampInNullState(agents: IAgentTimeline[]): IAgentTimeline[] {
    return agents.map(agent => {
      const days = agent.days.map(day => {
        if (!day.dayState || day.dayState.type === 0) {
          return { ...day, timestamp: 0 };
        }
        return day;
      });
      return { ...agent, days };
    });
  }

  static getEditedInReviewWarnings(agents: IAgentTimeline[]): { edited: IAgentTimeline[]; ignored: IAgentTimeline[] } {
    const edited: IAgentTimeline[] = [];
    const ignored: IAgentTimeline[] = [];
    agents.map(agent => {
      if (agent.isEditedInReviewWarning) return edited.push(agent);
      ignored.push(agent);
    });
    return { edited, ignored };
  }

  static collectAgentInfo(agentDays: IAgentTimeline[]): {
    agentId: number[];
    teamId: number[];
    siteId: number[];
    buId: number[];
  } {
    return agentDays.reduce(
      (acc: { siteId: number[]; teamId: number[]; agentId: number[]; buId: number[] }, day) => ({
        ...acc,
        siteId: !acc.siteId.includes(day.siteId) ? [...acc.siteId, day.siteId] : [...acc.siteId],
        teamId: !acc.teamId.includes(day.teamId) ? [...acc.teamId, day.teamId] : [...acc.teamId],
        agentId: !acc.agentId.includes(day.agentId) ? [...acc.agentId, day.agentId] : [...acc.agentId],
        buId: !acc.buId.includes(day.buId) ? [...acc.buId, day.buId] : [...acc.buId],
      }),
      { siteId: [], teamId: [], agentId: [], buId: [] },
    );
  }

  static checkCopiedAgentDays(
    agentDays: IAgentTimeline[],
    type: SchStateType | DayType,
    item: ISelectedActivity,
    isShift: boolean,
  ): Promise<{ agentDays: IAgentTimeline[]; errors: string[] }> {
    if (type === SchStateType.EXCEPTION) {
      return this.filterPossibleException(agentDays, item, isShift);
    }
    if (type === SchStateType.TIME_OFF) {
      return this.filterPossibleTimeOff(agentDays, item, isShift);
    }
    if (type === SchStateType.BREAK) {
      return this.filterPossibleBreaks(agentDays, item);
    }
    if (type === SchStateType.MEAL) {
      return this.filterPossibleMeals(agentDays, item);
    }
    if (type === SchStateType.ACTIVITY_SET && item.stateId !== 0) {
      return this.filterPossibleActivitySets(agentDays, item);
    }
    if (type === SchStateType.SHIFT) {
      return this.filterPossibleShifts(agentDays);
    }
    if (type === SchStateType.MARKED_TIME) {
      return this.filterPossibleMarkedTime(agentDays, item);
    }
    if (type === SchStateType.ACTIVITY_SET && item.stateId === 0) {
      return this.filterPossibleShifts(agentDays);
    }

    return Promise.resolve({ agentDays, errors: [] });
  }

  static async filterPossibleMarkedTime(
    agentDays: IAgentTimeline[],
    item: ISelectedActivity,
  ): Promise<{ agentDays: IAgentTimeline[]; errors: string[] }> {
    const errors: string[] = [];
    const errMsg = {
      cannotBeCopied: '%0: Marked time cannot be copied',
    };
    const { buId, siteId } = this.collectAgentInfo(agentDays);

    const markedTimes = await restApi.findMarkedTimes({ siteId, buId }).then(res => res.data);

    const result = agentDays.reduce((acc: IAgentTimeline[], agentDay) => {
      const days = agentDay.days.filter(() => {
        const possibleSiteIds = markedTimes.find(({ id }) => id === item.stateId)?.siteId ?? [];

        let isCanBeCopied;
        if (Array.isArray(possibleSiteIds)) {
          isCanBeCopied = possibleSiteIds.includes(agentDay.siteId);
        } else {
          isCanBeCopied = possibleSiteIds === agentDay.siteId;
        }

        if (!isCanBeCopied) errors.push(Utils.errorMessage(errMsg.cannotBeCopied, [agentDay.agentName]));
        return isCanBeCopied;
      });

      return days.length ? [...acc, { ...agentDay, days }] : [...acc];
    }, []);

    return { agentDays: result, errors };
  }

  static async filterPossibleActivitySets(
    agentDays: IAgentTimeline[],
    item: ISelectedActivity,
  ): Promise<{ agentDays: IAgentTimeline[]; errors: string[] }> {
    const errors: string[] = [];
    const errMsg = {
      cannotBeCopied: '%0: Activity Set cannot be copied',
    };
    const { buId, siteId } = this.collectAgentInfo(agentDays);

    const activitySets = await restApi.getActivitySet({ siteId, buId }).then(res => res.data);

    const result = agentDays.reduce((acc: IAgentTimeline[], agentDay) => {
      const days = agentDay.days.filter(() => {
        const possibleSiteIds = activitySets.find(({ id }) => id === item.stateId)?.siteId ?? [];
        let isCanBeCopied: boolean;
        if (Array.isArray(possibleSiteIds)) {
          isCanBeCopied = possibleSiteIds.includes(agentDay.siteId);
        } else {
          isCanBeCopied = possibleSiteIds === agentDay.siteId;
        }
        if (!isCanBeCopied) errors.push(Utils.errorMessage(errMsg.cannotBeCopied, [agentDay.agentName]));
        return isCanBeCopied;
      });

      return days.length ? [...acc, { ...agentDay, days }] : [...acc];
    }, []);

    return { agentDays: result, errors };
  }

  static async filterPossibleException(
    agentDays: IAgentTimeline[],
    item: ISelectedActivity,
    isShift: boolean,
  ): Promise<{ agentDays: IAgentTimeline[]; errors: string[] }> {
    const errors: string[] = [];
    const errMsg = {
      cannotBeCopied: '%0: Exception cannot be copied',
    };
    const { buId, siteId } = this.collectAgentInfo(agentDays);

    const exceptions = await restApi.findExceptions({ siteId, buId }).then(res => res.data);

    const result = agentDays.reduce((acc: IAgentTimeline[], agentDay) => {
      const days = agentDay.days.filter(day => {
        const itemId = isShift ? day.dayState?.id : item.stateId;
        const possibleSiteIds = exceptions.find(({ id }) => id === itemId)?.siteId ?? [];

        let isCanBeCopied: boolean;
        if (Array.isArray(possibleSiteIds)) {
          isCanBeCopied = possibleSiteIds.includes(agentDay.siteId);
        } else {
          isCanBeCopied = possibleSiteIds === agentDay.siteId;
        }
        if (!isCanBeCopied) errors.push(Utils.errorMessage(errMsg.cannotBeCopied, [agentDay.agentName]));
        return isCanBeCopied;
      });

      return days.length ? [...acc, { ...agentDay, days }] : [...acc];
    }, []);

    return { agentDays: result, errors };
  }

  static async filterPossibleMeals(
    agentDays: IAgentTimeline[],
    item: ISelectedActivity,
  ): Promise<{ agentDays: IAgentTimeline[]; errors: string[] }> {
    const errors: string[] = [];
    const errMsg = {
      cannotBeCopied: '%0: Meal cannot be copied',
    };
    const { buId, siteId } = this.collectAgentInfo(agentDays);

    const meals = await restApi.findMeals({ siteId, buId }).then(res => res.data);

    const result = agentDays.reduce((acc: IAgentTimeline[], agentDay) => {
      const days = agentDay.days.filter(() => {
        const possibleSiteIds = meals.find(({ id }) => id === item.stateId)?.siteId ?? [];

        let isCanBeCopied: boolean;
        if (Array.isArray(possibleSiteIds)) {
          isCanBeCopied = possibleSiteIds.includes(agentDay.siteId);
        } else {
          isCanBeCopied = possibleSiteIds === agentDay.siteId;
        }
        if (!isCanBeCopied) errors.push(Utils.errorMessage(errMsg.cannotBeCopied, [agentDay.agentName]));
        return isCanBeCopied;
      });

      return days.length ? [...acc, { ...agentDay, days }] : [...acc];
    }, []);

    return { agentDays: result, errors };
  }

  static async filterPossibleBreaks(
    agentDays: IAgentTimeline[],
    item: ISelectedActivity,
  ): Promise<{ agentDays: IAgentTimeline[]; errors: string[] }> {
    const errors: string[] = [];
    const errMsg = {
      cannotBeCopied: '%0: Break cannot be copied',
    };
    const { buId, siteId } = this.collectAgentInfo(agentDays);

    const exceptions = await restApi.findBreaks({ siteId, buId }).then(res => res.data);

    const result = agentDays.reduce((acc: IAgentTimeline[], agentDay) => {
      const days = agentDay.days.filter(() => {
        const possibleSiteIds = exceptions.find(({ id }) => id === item.stateId)?.siteId ?? [];

        let isCanBeCopied: boolean;
        if (Array.isArray(possibleSiteIds)) {
          isCanBeCopied = possibleSiteIds.includes(agentDay.siteId);
        } else {
          isCanBeCopied = possibleSiteIds === agentDay.siteId;
        }
        if (!isCanBeCopied) errors.push(Utils.errorMessage(errMsg.cannotBeCopied, [agentDay.agentName]));
        return isCanBeCopied;
      });

      return days.length ? [...acc, { ...agentDay, days }] : [...acc];
    }, []);

    return { agentDays: result, errors };
  }

  static async filterPossibleTimeOff(
    agentDays: IAgentTimeline[],
    item: ISelectedActivity,
    isShift: boolean,
  ): Promise<{ agentDays: IAgentTimeline[]; errors: string[] }> {
    const errors: string[] = [];
    const errMsg = {
      cannotBeCopied: '%0: Time Off cannot be copied',
    };
    const { siteId, buId } = this.collectAgentInfo(agentDays);

    const timeOffs = await restApi.findTimeOffs({ siteId, buId }).then(res => res.data);

    const result = agentDays.reduce((acc: IAgentTimeline[], agentDay) => {
      const days = agentDay.days.filter(day => {
        const itemId = isShift ? day.dayState?.id : item.stateId;
        const possibleSiteIds = timeOffs.find(({ id }) => id === itemId)?.siteId ?? [];

        let isCanBeCopied: boolean;
        if (Array.isArray(possibleSiteIds)) {
          isCanBeCopied = possibleSiteIds.includes(agentDay.siteId);
        } else {
          isCanBeCopied = possibleSiteIds === agentDay.siteId;
        }

        if (!isCanBeCopied) errors.push(Utils.errorMessage(errMsg.cannotBeCopied, [agentDay.agentName]));
        return isCanBeCopied;
      });

      return days.length ? [...acc, { ...agentDay, days }] : [...acc];
    }, []);
    return { agentDays: result, errors };
  }

  static async filterPossibleShifts(
    agentDays: IAgentTimeline[],
  ): Promise<{ agentDays: IAgentTimeline[]; errors: string[] }> {
    const errors: string[] = [];
    const errMsg = {
      shiftCannotBeCopied: 'Shift "%0" is not assigned to agent "%1". Shift cannot be pasted',
      activityCannotBeCopied: 'Activity "%0" is not assigned to agent "%1". Shift cannot be pasted',
      crossed12PmNextDay: '%0: New Shift is crossed next midday',
    };
    const { agentId, siteId, teamId } = this.collectAgentInfo(agentDays);

    const { agentActivities, agentShifts }: { agentActivities: ISchActivity[]; agentShifts: IShifts[] } = (
      await Promise.all([restApi.getActivities({ agentId, teamId, siteId }), restApi.getAgentShifts({ siteId })])
    ).reduce(
      (acc: { agentActivities: ISchActivity[]; agentShifts: IShifts[] }, res, idx) => ({
        ...acc,
        [idx ? 'agentShifts' : 'agentActivities']: res.data,
      }),
      { agentActivities: [], agentShifts: [] },
    );

    const result = agentDays.reduce((acc: IAgentTimeline[], agentDay) => {
      const { tzSite, tzSelected } = agentDay._TZ_INTERNAL_USAGE;
      const requiredActivities = agentDay.days.reduce((acc: ISchActivity[], day) => [...acc, ...day.activities], []);
      const days = agentDay.days.filter(day => {
        const activities = day.activities.filter(activity =>
          agentActivities.some(a => a.siteId.includes(agentDay.siteId) && a.id === activity.id),
        );
        const possibleSiteIds = agentShifts.find(({ id }: { id: number }) => id === day.dayState?.id)?.siteId ?? [];
        const isCrossed12PmNextDay = DateUtils.isCrossed12PmNextDay(
          day.startDateTime,
          day.endDateTime,
          tzSite,
          tzSelected,
        );

        if (!possibleSiteIds.includes(agentDay.siteId))
          errors.push(Utils.errorMessage(errMsg.shiftCannotBeCopied, [day.dayState?.name, agentDay.agentName]));
        if (!activities.length)
          errors.push(
            Utils.errorMessage(errMsg.activityCannotBeCopied, [
              requiredActivities.filter(x => !activities.includes(x))[0]?.name,
              agentDay.agentName,
            ]),
          );
        if (isCrossed12PmNextDay) errors.push(Utils.errorMessage(errMsg.crossed12PmNextDay, [agentDay.agentName]));

        return possibleSiteIds.includes(agentDay.siteId) && activities.length && !isCrossed12PmNextDay;
      });

      return days.length ? [...acc, { ...agentDay, days }] : [...acc];
    }, []);

    return { agentDays: result, errors };
  }

  static async filterWithValidatePossibleShifts(agentDays: IAgentSchedule[]): Promise<IAgentSchedule[]> {
    const response: any = await restApi.validateAgentDay({ agentDays }).then(res => res.data);
    return response ? agentDays : [];
  }

  static agentHasActivity = (agent: IAgentTimeline, currentDate: Date) => {
    const days = agent.days ?? [];
    let state = false;
    for (let i = 0; i < days?.length; i++) {
      if (this.activityIsInCurrentDay(currentDate, days[i], agent)) {
        state = true;
        break;
      }
    }
    return state;
  };

  static activityIsInCurrentDay = (currentDate: string | Date, day: IAgentDayTimeline, agent: IAgentTimeline) => {
    const startDateTime = moment.utc(day.startDateTime).valueOf();
    const nextStartDateTime = moment.utc(day.nextStartDateTime ?? startDateTime + 24 * 3600000).valueOf();
    const prevEndDateTime = moment.utc(day.prevEndDateTime ?? startDateTime).valueOf();

    const dayStartTime = moment.utc(
      DateUtils.convertAccordingToTz(
        startDateTime,
        agent._TZ_INTERNAL_USAGE.tzSite,
        agent._TZ_INTERNAL_USAGE.tzSelected,
      ),
    );

    const nextStartDayTime = moment.utc(
      DateUtils.convertAccordingToTz(
        nextStartDateTime,
        agent._TZ_INTERNAL_USAGE.tzSite,
        agent._TZ_INTERNAL_USAGE.tzSelected,
      ),
    );
    const prevEndDayTime = moment.utc(
      DateUtils.convertAccordingToTz(
        prevEndDateTime,
        agent._TZ_INTERNAL_USAGE.tzSite,
        agent._TZ_INTERNAL_USAGE.tzSelected,
      ),
    );

    const date = moment.utc(currentDate);

    return (
      dayStartTime.valueOf() < nextStartDayTime.valueOf() &&
      date.valueOf() <= dayStartTime.valueOf() &&
      date.valueOf() >= prevEndDayTime.valueOf()
    );
  };

  static updateAgentActivity(
    agent: IAgentTimeline,
    activities: ISchActivity[],
    selectedActivities: ISelectedActivity[],
    setActivitiesFor: SetActivitiesFor,
  ): IAgentTimeline {
    const dayIndex = selectedActivities[0].dayIndex;

    return {
      ...agent,
      isModified: true,
      isBuild: true,
      days: agent.days.map((day, index) => {
        if (dayIndex === index)
          return SchDay.updateDayActivities(day, activities, setActivitiesFor, selectedActivities[0]);
        return day;
      }),
    };
  }
}

export default SchAgent;
