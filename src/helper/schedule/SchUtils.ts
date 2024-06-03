import { clone, isEmpty, isNil } from 'ramda';

import { ISortAgentDaySnapshot } from '../../api/ts/interfaces/config.payload';
import { IfilterAgentDay, IInputfilterAgentDay } from '../../api/ts/interfaces/schedulePayload';
import { columnsForTable, SCH_STATE_TYPE } from '../../common/constants';
import { DayType, SchStateType, WORK_ID } from '../../common/constants/schedule';
import { DynamicObject } from '../../common/interfaces';
import { IBusinessUnits, ISite, ITeam } from '../../common/interfaces/config';
import { ITimezone } from '../../common/interfaces/config/ITimezone';
import { IAgentSchedule, ISchActivity, ISchDay } from '../../common/interfaces/schedule/IAgentSchedule';
import {
  AGENT_SORT,
  IActivitiesSetGroup,
  IPossibleColumns,
  ISelectedActivity,
  IShifts,
  ISnapShotRequest,
  ISortBy,
  ISubMenuType,
  SORT_ORDER,
  TimeFormatType,
  TTimezoneHashes,
} from '../../redux/ts/intrefaces/timeLine';
import { IAgentTimeline, ITimelineAgentActivity } from '../../redux/ts/intrefaces/timeLine/IAgentTimeline';
import DateUtils, { formatTime } from '../dateUtils';
import Utils from '../utils';
import SchAgent from './SchAgent';
import SchState, { itemsThatCantBeMovedWithShift } from './SchState';

export interface ISelected {
  buId: number[];
  siteId: number[];
  teamId: number[];
  agentId: number[];
  activities: number[];
}

export interface ITarget {
  type: string;
  elements: number[];
}

const columnsForTableFromDay = {
  siteName: {
    idInTable: 'siteName',
    idFromServer: 'siteName',
    handler: (data: any) => data,
  },
  teamName: {
    idInTable: 'teamName',
    idFromServer: 'teamName',
    handler: (data: any) => data,
  },
  agentName: {
    idInTable: 'agentName',
    idFromServer: 'agentName',
    handler: (data: any) => data,
  },
  sharedTransport: {
    idInTable: 'sharedTransport',
    idFromServer: 'sharedTransport',
    handler: (data: any) => data,
  },
  overtimeMinutes: {
    idInTable: 'overtime',
    idFromServer: 'overtime',
    handler: (data: number) => `${Math.floor(data / 60)}:${Utils.to2Digits(data % 60)}`,
  },
  paidMinutes: {
    idInTable: 'paidHours',
    idFromServer: 'paidMinutes',
    handler: (data: number) => `${Math.floor(data / 60)}:${Utils.to2Digits(data % 60)}`,
  },
  accessibility: {
    idInTable: 'accessibility',
    idFromServer: 'accessibility',
    handler: (data: any) => data,
  },
  comments: {
    idInTable: 'comments',
    idFromServer: 'Comments',
    handler: (data: any) => data,
  },
};

const columnsForTableFromState = {
  startDateTime: {
    idInTable: 'shiftStartTime',
    idFromServer: 'startDateTime',
    handler: (data: any) => {
      const parsedData = new Date(data);
      return `${Utils.to2Digits(parsedData.getUTCHours())}:${Utils.to2Digits(parsedData.getUTCMinutes())}`;
    },
  },
  endDateTime: {
    idInTable: 'shiftEndTime',
    idFromServer: 'endDateTime',
    handler: (data: any) => {
      const parsedData = new Date(data);
      return `${Utils.to2Digits(parsedData.getUTCHours())}:${Utils.to2Digits(parsedData.getUTCMinutes())}`;
    },
  },
  name: {
    idInTable: 'shift',
    idFromServer: 'name',
    handler: (data: any) => data,
  },
  useTotalHours: {
    idInTable: 'useTotalHours',
    idFromServer: 'useTotalHours',
    handler: (data: any) => data,
  },
};

class SchUtils {
  public errors: { [errorName: string]: Error };

  breakItems = ['break', 'meal', 'exception', 'time_off', 'activity', 'work_set', 'marked_time', 'activity_set'];
  fullDayItems = ['exception', 'time_off'];

  constructor() {
    this.errors = {
      invalidShiftRange: {
        name: 'invalidShiftRange',
        message: 'Invalid shift range. Start time must be less than end time',
        cause: { code: 1 },
      },
      invalidShiftStartTime: {
        name: 'invalidShiftStartTime',
        message: 'Invalid shift range. The start time must not start on the previous day',
        cause: { code: 2 },
      },
      shiftsOverlap: {
        name: 'shiftsOverlap',
        message: 'Invalid shift range. Shifts must not overlap.',
        cause: { code: 3 },
      },
    };
  }

  encodeSiteObjectID(siteID: number, objectID: number) {
    let id = objectID;
    if (objectID <= 0 && siteID > 0 && Math.abs(objectID) >> 16 == 0) {
      id = -1 * ((siteID << 16) + Math.abs(objectID));
    }
    return id;
  }

  itemTypeIsValid = (activity: any) => {
    return activity.type !== 'activity';
  };

  getValidItemsList = (activities: any[]) => {
    const clonedActivities = clone(activities);
    const validList: any = clonedActivities.map((activity: any) => {
      if (this.itemTypeIsValid(activity) && activity.inCurrentDate) {
        return activity;
      }
    });
    return validList.filter((activity: any) => activity);
  };

  shiftTypeIsValid = (activity: any) => {
    if (this.fullDayItems.includes(activity.type) && this.isUndefined(activity.stateIndex)) {
      return true;
    }

    return (
      !this.breakItems.includes(activity.type) || (this.breakItems.includes(activity) && activity.isFullShiftActivity)
    );
  };

  memoIsExist = (selectedActivity: ISelectedActivity, selectedAgent: IAgentTimeline) => {
    if (!selectedActivity || !selectedAgent) return false;
    const memo = isNil(selectedActivity?.stateIndex)
      ? selectedAgent?.days[selectedActivity?.dayIndex].dayState?.memo
      : selectedAgent?.days[selectedActivity?.dayIndex].states.find(
          state => state.startDateTime === selectedActivity.start && state.endDateTime === selectedActivity.end,
        )?.memo || '';

    return !!memo;
  };

  getValidShiftsList = (data: any, date: string) => {
    return data.flatMap((element: any) => {
      if (element.activities.length) {
        return element.activities.filter(
          (activity: any) =>
            !activity.stateIndex &&
            this.shiftTypeIsValid(activity) &&
            DateUtils.isStartDateTimeInCurrentDate(activity.start, activity.end, date),
        );
      }
    });
  };

  isFullDayTimeOff = (data: ISelectedActivity[]) => {
    return data[0].type === 'time_off' && this.isUndefined(data[0].stateIndex);
  };

  isFullDayException = (data: ISelectedActivity[]) => {
    return data[0].type === 'exception' && this.isUndefined(data[0].stateIndex);
  };

  isDayOff = (data: ISelectedActivity[]) => {
    return data[0].type === 'day_off';
  };

  isUndefined = (value: any) => {
    return value === undefined;
  };

  removeAgentActivity(day: ISchDay, activity: ISelectedActivity) {
    if (activity.stateIndex !== undefined) {
      const index = activity.stateIndex;
      day.states = day.states.filter(state => state !== day.states[index]);
      day.isModified = true;
    }
    return day;
  }

  getTimeFromDate(dateString: string) {
    const date = new Date(dateString);
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    return `${hours}:${minutes}`;
  }

  requiredFields(elements: any[], fields: string[]) {
    const newArrElements: any[] = [];
    for (let i = 0; i < elements.length; i++) {
      const tempObj: DynamicObject = {};
      for (let j = 0; j < fields.length; j++) {
        tempObj[fields[j]] = elements[i][fields[j]];
      }
      newArrElements.push(tempObj);
    }
    return newArrElements;
  }

  getElementsByID(selectedId: number[], all: any[]): ISchActivity[] {
    return selectedId
      .map(el => {
        return all.find(element => element.id === el) || null;
      })
      .filter(el => el) as ISchActivity[];
  }

  async prepareDataForTimeline(
    data: IAgentTimeline[],
    dateNow: string,
    filterData: IBusinessUnits,
    allTimezone: TTimezoneHashes,
    selectedTimezone: any,
  ) {
    let preparedData = this.addTimeZone(data, filterData, allTimezone, selectedTimezone, dateNow);
    preparedData = await this.linearizeData(preparedData, dateNow);
    return await this.getFieldsForTable(preparedData, dateNow);
  }

  prepareFilterAgentDay = (data: IInputfilterAgentDay): IfilterAgentDay => {
    const { agentId, buId, siteId, teamId, activities } = data;
    return {
      agentId,
      siteId,
      buId,
      teamId,
      activities,
      date: '',
      timezoneId: 0,
    };
  };

  createSnapshotTemplate = (data: ISnapShotRequest): ISnapShotRequest => {
    const {
      snapshotId,
      agentId,
      buId,
      siteId,
      teamId,
      contractId,
      employeeId,
      firstName,
      lastName,
      startDate,
      endDate,
      stateTypes,
      date,
      timezoneId,
      groupMode,
      sortMode,
      ascending,
      activities,
    } = data;
    return {
      agentId,
      snapshotId,
      siteId,
      buId,
      stateTypes,
      teamId,
      contractId,
      employeeId,
      firstName,
      lastName,
      date: date,
      startDate: startDate || timezoneId === 0 ? DateUtils.getPreviousDayWithMoment(date) : date,
      endDate: endDate || date,
      timezoneId,
      groupMode,
      sortMode,
      ascending,
      activities,
    };
  };

  isSortColumnIncludes = (sortBy: ISortBy, column: IPossibleColumns) => {
    const columns = sortBy.column ? [...(sortBy.agentSort ?? []), sortBy.column] : [...(sortBy.agentSort ?? [])];
    return columns.some(({ id }) => id === column.id);
  };

  sortColumnRemove = (sortBy: ISortBy, column: IPossibleColumns): ISortBy => {
    const newSortBy: ISortBy = {};
    newSortBy.agentSort = sortBy.agentSort?.filter(({ id }) => id !== column.id);
    if (sortBy.column?.id !== column.id) {
      newSortBy.column = sortBy.column;
    }
    newSortBy.order = sortBy.order;
    return newSortBy;
  };

  createSortPayload = (
    sortBy: ISortBy,
    snapshotId: string | null = null,
    date: string | null = null,
  ): ISortAgentDaySnapshot => {
    const columnTeam = columnsForTable.find(({ sortMode }) => sortMode === AGENT_SORT.TEAM);
    const columnSite = columnsForTable.find(({ sortMode }) => sortMode === AGENT_SORT.SITE);
    const payload: ISortAgentDaySnapshot = {
      groupMode: 0,
      sortMode: 0,
    };
    if (snapshotId) {
      payload.snapshotId = snapshotId;
    }
    if (date) {
      payload.date = date;
    }
    if (sortBy.order !== undefined) {
      payload.ascending = sortBy.order === SORT_ORDER.SORT_ORDER_ASC;
    }

    if (sortBy.column !== undefined) {
      payload.sortMode = payload.sortMode = sortBy.column.sortMode ?? 0;
    }
    const agentSortModes = [columnTeam, columnSite];
    payload.sortMode = agentSortModes.reduce((acc, column) => {
      if (column && this.isSortColumnIncludes(sortBy, column)) {
        return acc ? (acc << 8) + (column.sortMode ?? 0) : column.sortMode ?? 0;
      }
      return acc;
    }, payload.sortMode);

    return payload;
  };

  getLeft(start: number, mainData: string | number) {
    const secInday = 86400;
    const data = new Date(start);
    const dayStartms = DateUtils.getWorkDayInMs(mainData);
    const momentStartms = data.getTime();
    const leftInSec = (momentStartms - dayStartms) / 1000;
    return (leftInSec * 100) / secInday;
  }

  getWidth(start: number, end: number) {
    const secInday = 86400;
    const widthInSec = (end - start) / 1000;

    return (widthInSec * 100) / secInday;
  }

  getLeftForTime(index: number) {
    const secInday = 86400;
    const secInHour = 3600;
    const secInHalfHour = 1800;
    const elementsec = (index + 1) * secInHour - secInHalfHour;

    return (elementsec * 100) / secInday;
  }

  getRightForLineByTime(index: number) {
    const secInday = 86400;
    const secInHour = 3600;
    const elementsec = index * secInHour;

    return (elementsec * 100) / secInday;
  }

  intersection(first: any, second: any) {
    first = new Set(first);
    second = new Set(second);
    return [...first].filter(item => second.has(item));
  }

  columnContentHandler = (columnId: string, content: any, format: string, agent: any, currentDate: any) => {
    switch (columnId) {
      case 'shiftStartTime':
      case 'shiftEndTime':
        return formatTime[format as keyof typeof formatTime](content);
      case 'comments': {
        const commentDay = agent.days.find((day: any) => SchAgent.activityIsInCurrentDay(currentDate, day, agent));

        return commentDay ? commentDay.comments : '';
      }
      default:
        return content;
    }
  };

  getSelectedElements(
    data: IBusinessUnits,
    allData: IBusinessUnits,
    includeAgentIdIfAllTeamChecked = false,
    includeSitesIfAllBUChecked = false,
  ): ISelected {
    const selected: ISelected = {
      buId: [],
      siteId: [],
      teamId: [],
      agentId: [],
      activities: [],
    };
    const keysMain = Object.keys(data);
    for (const i of keysMain) {
      if (data[i].isAllChecked && data[i].isAllActivitiesChecked) {
        selected.buId.push(Utils.stringChecker(data[i].buId));
        if (includeSitesIfAllBUChecked) {
          selected.siteId.push(...Object.keys(data[i].sites).map(el => Utils.stringChecker(el)));
        }
      } else {
        const fetchedBu = allData[i];
        const sites = data[i].sites;
        for (const siteId in sites) {
          const fetchedSite = fetchedBu.sites[siteId];
          if (!sites[siteId].isAllActivitiesChecked) {
            selected.activities = [
              ...selected.activities,
              ...Object.values(fetchedSite.activities)
                .filter(activity => data[i].sites[siteId].activities[activity.activityId]?.isChecked)
                .map(activity => +activity.activityId),
            ];
          }

          if (sites[siteId].isAllChecked) {
            selected.buId.push(Utils.stringChecker(sites[siteId].buId));
            selected.siteId.push(Utils.stringChecker(sites[siteId].siteId));
          } else {
            // teams
            const teams = sites[siteId].teams;

            for (const teamId in teams) {
              const fetchedTeam = fetchedSite.teams[teamId];
              if (teams[teamId].isAllChecked) {
                selected.buId.push(Utils.stringChecker(teams[teamId].buId));
                selected.siteId.push(Utils.stringChecker(teams[teamId].siteId));
                selected.teamId.push(
                  this.encodeSiteObjectID(teams[teamId].siteId, Utils.stringChecker(teams[teamId].teamId)),
                );

                if (includeAgentIdIfAllTeamChecked) {
                  for (const agentId in fetchedTeam.agents) {
                    selected.agentId.push(Utils.stringChecker(agentId));
                  }
                }
              } else {
                const agents = teams[teamId].agents;
                for (const agentId in agents) {
                  if (agents[agentId].isChecked) {
                    selected.buId.push(Utils.stringChecker(agents[agentId].buId));
                    selected.teamId.push(
                      this.encodeSiteObjectID(teams[teamId].siteId, Utils.stringChecker(teams[teamId].teamId)),
                    );
                    selected.agentId.push(Utils.stringChecker(agents[agentId].agentId));
                    selected.siteId.push(Utils.stringChecker(sites[siteId].siteId));
                  }
                }
              }
            }
          }
        }
      }
    }

    return {
      buId: [...new Set(selected.buId)],
      siteId: [...new Set(selected.siteId)],
      teamId: [...new Set(selected.teamId)],
      agentId: [...new Set(selected.agentId)],
      activities: [...new Set(selected.activities)],
    } satisfies ISelected;
  }

  getSelectedElementsSyncForMultipleFilter = (data: IBusinessUnits, allData: IBusinessUnits): ISelected => {
    const selected: ISelected = {
      buId: [],
      siteId: [],
      teamId: [],
      agentId: [],
      activities: [],
    };
    const keysMain = Object.keys(data);
    for (const i of keysMain) {
      if (data[i].isChecked) {
        selected.buId.push(Utils.stringChecker(data[i].buId));
        const sites = data[i].sites;
        const keysSites = Object.keys(sites);
        for (const j of keysSites) {
          if (!sites[j].isAllActivitiesChecked) {
            selected.activities = [
              ...selected.activities,
              ...Object.values(allData[i].sites[j].activities)
                .filter(activity => data[i].sites[j].activities[activity.activityId]?.isChecked)
                .map(activity => +activity.activityId),
            ];
          }

          if (sites[j].isAllChecked) {
            selected.buId.push(Utils.stringChecker(sites[j].buId));
            selected.siteId.push(Utils.stringChecker(sites[j].siteId));
          } else {
            const teams = sites[j].teams;
            const keysTeams = Object.keys(teams);
            for (const k of keysTeams) {
              if (teams[k].isAllChecked) {
                selected.buId.push(Utils.stringChecker(teams[k].buId));
                selected.siteId.push(Utils.stringChecker(teams[k].siteId));
                selected.teamId.push(this.encodeSiteObjectID(teams[k].siteId, Utils.stringChecker(teams[k].teamId)));
              } else {
                const agents = teams[k].agents;
                const keysAgents = Object.keys(agents);
                for (const m of keysAgents) {
                  if (agents[m].isChecked) {
                    selected.buId.push(Utils.stringChecker(agents[m].buId));
                    selected.siteId.push(Utils.stringChecker(agents[m].siteId));
                    selected.teamId.push(
                      this.encodeSiteObjectID(agents[m].siteId, Utils.stringChecker(agents[m].teamId)),
                    );
                    selected.agentId.push(Utils.stringChecker(agents[m].agentId));
                  }
                }
              }
            }
          }
        }
      }
    }

    return {
      buId: [...new Set(selected.buId)],
      siteId: [...new Set(selected.siteId)],
      teamId: [...new Set(selected.teamId)],
      agentId: [...new Set(selected.agentId)],
      activities: [...new Set(selected.activities)],
    } satisfies ISelected;
  };

  getAgentsFromTeam = (team: ITeam) => Object.keys(team.agents).map(el => Utils.stringChecker(team.agents[el].agentId));

  getAgentsFromSite = (site: ISite) => {
    const agents = [];
    const tempagents = Object.keys(site.teams).map(el => this.getAgentsFromTeam(site.teams[el]));
    for (const i of tempagents) {
      if (Array.isArray(i)) agents.push(...i);
    }
    return agents;
  };

  getActivities = (checked: IBusinessUnits, allData: IBusinessUnits) => {
    const result = [];
    const bu = Object.keys(checked);
    for (const i of bu) {
      const sites = Object.keys(checked[i].sites);
      for (const j of sites) {
        let activitiestemp: any[] = [];
        if (checked[i].sites[j].isAllActivitiesChecked) {
          activitiestemp = Object.keys(allData[i].sites[j].activities);
        }
        if (!checked[i].sites[j].isAllActivitiesChecked && checked[i].sites[j].isActivityChecked) {
          activitiestemp = Object.keys(checked[i].sites[j].activities);
        }
        const activities = activitiestemp.map(el => Utils.stringChecker(el));
        result.push(...activities);
      }
    }
    return result;
  };

  mergeActivities = (checkedItems: IBusinessUnits, filterData: IBusinessUnits) => {
    const result = clone(checkedItems);
    const bu = Object.keys(checkedItems);
    for (const i of bu) {
      const sites = Object.keys(checkedItems[i]?.sites ?? {});
      for (const j of sites) {
        result[i].sites[j].activities = filterData[i]?.sites[j]?.activities ?? {};
      }
    }
    return result;
  };

  linearizeData = async (agents: IAgentTimeline[], targetDate: string): Promise<IAgentTimeline[]> => {
    // const fieldsDay = ['comments', 'overtimeMinutes','paidMinutes'];
    for (const i in agents) {
      const activities: any[] = [];
      if (agents[i].days.length > 0) {
        for (let j = 0; j < agents[i].days.length; j++) {
          const day = agents[i].days[j];
          const agentId = agents[i].agentId;
          if (day.dayState && day.dayState.startDateTime && day.dayState.endDateTime) {
            if (DateUtils.isDateInRange(day.dayState.startDateTime, day.dayState.endDateTime, targetDate)) {
              const start = day.dayState.startDateTime;
              const end = day.dayState.endDateTime;
              const activitySet = day.activitySets.find(a => a.id === WORK_ID);
              const stateActivities = activitySet?.activities
                .map(id => day.activities.find(a => +a?.id === +id))
                .filter(_ => _) as ISchActivity[];

              activities.push({
                ...day.dayState,
                refId: 0,
                stateId: 0,
                type: SCH_STATE_TYPE[day.dayState.type as keyof typeof SCH_STATE_TYPE],
                start,
                end,
                _id: day.dayState.id, // TODO replace with id
                id: `${agents[i].agentId}I${day.dayState.id}${j}`,
                agentId,
                uniqueId: `${agents[i].agentId}I${day.dayState.id}`,
                date: targetDate,
                dayIndex: j,
                memo: day.dayState.memo,
                shortName: day.dayState.shortName,
                activities: day.type === DayType.SHIFT ? stateActivities : day.activities,
                shiftName: day.dayState.name,
                shiftStart: day.startDateTime,
                shiftEnd: day.endDateTime,
                dayDate: day.date,
                name: day.dayState.name,
                isFullDay: day.dayState.isFullDay,
                _type: day.dayState.type,
                paidMinutes: day.dayState.paidMinutes,
                isPaid: day.dayState.isPaid,
                states: day.states,
              });
            }
          } else {
            if (day.dayState && day.dayState.type === SchStateType.DAY_OFF) {
              if (DateUtils.isDateInRange(day.startDateTime, day.endDateTime, targetDate)) {
                const startTime = day.startDateTime;
                const endTime = day.endDateTime;

                activities.push({
                  type: SCH_STATE_TYPE[day.dayState.type as keyof typeof SCH_STATE_TYPE],
                  start: startTime,
                  end: endTime,
                  id: `${agents[i].agentId}I${day.dayState.id}${j}`,
                  uniqueId: `${agents[i].agentId}I${day.dayState.id}`,
                  agentId,
                  date: targetDate,
                  dayIndex: j,
                  isFullDay: day.dayState.isFullDay,
                  shortName: day.dayState.shortName,
                  activities: day.activities,
                  shiftName: day.dayState.name,
                  shiftStart: day.startDateTime,
                  shiftEnd: day.endDateTime,
                  dayDate: day.date,
                  name: day.dayState.name,
                  _type: day.dayState.type,
                });
              }
            }
          }
          if (
            day.dayState &&
            day.states &&
            day.dayState.startDateTime &&
            day.states.length > 0 &&
            !(
              day.isFullDay ||
              day.dayState.type === SchStateType.TIME_OFF ||
              day.dayState.type === SchStateType.EXCEPTION
            )
          ) {
            const states = day.states;
            const types = [];
            const startTime = day.startDateTime;
            const endTime = day.endDateTime;
            for (const k in states) {
              const state = states[k];
              // if (states[k].id !== 0) {
              // if (isDateInRange(states[k].startDateTime, states[k].endDateTime, targetDate)) {
              let type = SCH_STATE_TYPE[state.type];
              let stateActivities: ISchActivity[] = [];
              if (SchState.isWork(state)) {
                const activitySet = day.activitySets.find(a => a.id === WORK_ID);
                stateActivities = activitySet?.activities
                  .map(id => day.activities.find(a => +a?.id === +id))
                  .filter(_ => _) as ISchActivity[];

                type = SCH_STATE_TYPE[SchStateType.ACTIVITY];
              } else {
                const activitySet = day.activitySets.find(a => a.refId === state?.refId);
                stateActivities = activitySet?.activities
                  .map(id => day.activities.find(a => +a?.id === +id))
                  .filter(_ => _) as ISchActivity[];
              }

              types.push(type);
              activities.push({
                ...states[k],
                type: type,
                start: state.startDateTime,
                end: state.endDateTime,
                id: `${agents[i].agentId}I${day.dayState.id}I${states[k].shortName}I${states[k].startDateTime}I${i}`,
                uniqueId: `${agents[i].agentId}I${states[k].shortName}I${states[k].startDateTime}`,
                agentId,
                stateId: state.id,
                shortName: state.shortName,
                name: state.name,
                activities: stateActivities,
                isFullDay: day.dayState.isFullDay,
                shiftName: day.dayState.name,
                shiftStart: day.dayState.startDateTime || day.startDateTime,
                shiftEnd: day.dayState.endDateTime || day.endDateTime,
                dayDate: day.date,
                date: targetDate,
                dayIndex: j,
                stateIndex: Number(k),
                inCurrentDate: DateUtils.isDateInRange(states[k].startDateTime, state.endDateTime, targetDate),
                _type: state.type,
                isFullShiftActivity: state.startDateTime === startTime && state.endDateTime === endTime,
              });
            }
            // }
            // }
          }
        }
      }
      agents[i].activities = activities;
    }
    return agents;
  };

  updateActivitiesToDate = (selectedActivities: any[], agents: IAgentTimeline[]) => {
    return selectedActivities.map((activity: any) => {
      const agent = agents.find(agent => activity.agentId === agent.agentId);
      if (agent) {
        const targetDay = agent.days[activity.dayIndex];
        if (isEmpty(targetDay.activities)) {
          const newDate = agent.days.find(
            day =>
              day.dayState &&
              day.dayState.startDateTime &&
              day.dayState.endDateTime &&
              day.dayState.type !== 0 &&
              DateUtils.isDateInRange(day.dayState.startDateTime, day.dayState.endDateTime, activity.date),
          );
          return newDate
            ? {
                ...activity,
                dayIndex: agent.days.indexOf(newDate),
              }
            : activity;
        }
      }
      return activity;
    });
  };

  linearizePotentialActivities = async (agents: IAgentTimeline[], targetDate: string): Promise<any[]> => {
    const activities: any[] = [];
    for (const i in agents) {
      if (agents[i].days.length > 0) {
        for (let j = 0; j < agents[i].days.length; j++) {
          const day = agents[i].days[j];
          const agentId = agents[i].agentId;
          if (day.dayState && day.dayState.startDateTime && day.dayState.endDateTime) {
            if (DateUtils.isDateInRange(day.dayState.startDateTime, day.dayState.endDateTime, targetDate)) {
              const start = day.dayState.startDateTime;
              const end = day.dayState.endDateTime;
              if (day.dayState.changed) {
                activities.push({
                  type: SCH_STATE_TYPE[day.dayState.type as keyof typeof SCH_STATE_TYPE],
                  start,
                  end,
                  _id: day.dayState.id, // TODO replace with id
                  id: `${agents[i].agentId}I${day.dayState.id}${j}`,
                  agentId,
                  uniqueId: `${agents[i].agentId}I${day.dayState.id}`,
                  date: targetDate,
                  dayIndex: j,
                  shortName: day.dayState.shortName,
                  activities: day.activities,
                  shiftName: day.dayState.name,
                  shiftStart: day.startDateTime,
                  shiftEnd: day.endDateTime,
                  dayDate: day.date,
                  name: day.dayState.name,
                  isFullDay: day.dayState.isFullDay,
                  _type: day.dayState.type,
                  paidMinutes: day.dayState.paidMinutes,
                  isPaid: day.dayState.isPaid,
                  states: day.states,
                });
              }
            }
          } else {
            if (day.dayState && day.dayState.type === SchStateType.DAY_OFF) {
              if (DateUtils.isDateInRange(day.startDateTime, day.endDateTime, targetDate)) {
                const startTime = day.startDateTime;
                const endTime = day.endDateTime;
                if (day.dayState.changed) {
                  activities.push({
                    type: SCH_STATE_TYPE[day.dayState.type as keyof typeof SCH_STATE_TYPE],
                    start: startTime,
                    end: endTime,
                    id: `${agents[i].agentId}I${day.dayState.id}${j}`,
                    uniqueId: `${agents[i].agentId}I${day.dayState.id}`,
                    agentId,
                    date: targetDate,
                    dayIndex: j,
                    isFullDay: day.dayState.isFullDay,
                    shortName: day.dayState.shortName,
                    activities: day.activities,
                    shiftName: day.dayState.name,
                    shiftStart: day.startDateTime,
                    shiftEnd: day.endDateTime,
                    dayDate: day.date,
                    name: day.dayState.name,
                    _type: day.dayState.type,
                  });
                }
              }
            }
          }
          if (
            day.dayState &&
            day.states &&
            day.dayState.startDateTime &&
            day.states.length > 0 &&
            !(
              day.isFullDay ||
              day.dayState.type === SchStateType.TIME_OFF ||
              day.dayState.type === SchStateType.EXCEPTION
            )
          ) {
            const states = day.states;
            const types = [];
            for (const k in states) {
              // if (states[k].id !== 0) {
              if (DateUtils.isDateInRange(states[k].startDateTime, states[k].endDateTime, targetDate)) {
                const type =
                  states[k].id === WORK_ID && states[k].type === SchStateType.ACTIVITY_SET
                    ? SCH_STATE_TYPE[SchStateType.ACTIVITY_SET]
                    : SCH_STATE_TYPE[states[k].type as SchStateType];
                types.push(type);
                if (states[k].changed) {
                  activities.push({
                    type: type,
                    start: states[k].startDateTime,
                    end: states[k].endDateTime,
                    id: `${agents[i].agentId}I${day.dayState.id}I${states[k].shortName}I${states[k].startDateTime}I${i}`,
                    uniqueId: `${agents[i].agentId}I${states[k].shortName}I${states[k].startDateTime}`,
                    agentId,
                    stateId: states[k].id,
                    shortName: states[k].shortName,
                    name: states[k].name,
                    activities: day.activities,
                    isFullDay: day.dayState.isFullDay,
                    shiftName: day.dayState.name,
                    shiftStart: day.dayState.startDateTime || day.startDateTime,
                    shiftEnd: day.dayState.endDateTime || day.endDateTime,
                    dayDate: day.date,
                    date: targetDate,
                    dayIndex: j,
                    stateIndex: Number(k),
                    _type: states[k].type,
                  });
                }
              }
              // }
            }
          }
        }
      }
    }
    return activities;
  };

  getFieldsForTable = async (agents: any[], targetDate: string) => {
    // const fieldsDay = ['comments', 'overtimeMinutes','paidMinutes'];
    for (const i in agents) {
      if (agents[i].days.length > 0) {
        for (let j = 0; j < agents[i].days.length; j++) {
          const day = agents[i].days[j];
          if (
            !day.dayState ||
            (day.dayState.startDateTime && DateUtils.isStartTimeInDate(day.dayState.startDateTime, targetDate))
          ) {
            const existingKeysFromDay: string[] = this.intersection(
              Object.keys(day),
              Object.keys(columnsForTableFromDay),
            );
            for (const k in existingKeysFromDay) {
              const keyForTable =
                columnsForTableFromDay[existingKeysFromDay[k] as keyof typeof columnsForTableFromDay]['idInTable'];
              agents[i][keyForTable] = columnsForTableFromDay[
                existingKeysFromDay[k] as keyof typeof columnsForTableFromDay
              ].handler(day[existingKeysFromDay[k]]);
            }
          }
          if (
            day.dayState &&
            day.dayState.startDateTime &&
            (day.states.length || day.dayState.type === SchStateType.TIME_OFF) > 0 &&
            !day.isFullDay
          ) {
            if (DateUtils.isStartTimeInDate(day.dayState.startDateTime, targetDate)) {
              const existingKeysFromState: string[] = this.intersection(
                Object.keys(day.dayState),
                Object.keys(columnsForTableFromState),
              );
              for (const l in existingKeysFromState) {
                const keyForTable =
                  columnsForTableFromState[existingKeysFromState[l] as keyof typeof columnsForTableFromState][
                    'idInTable'
                  ];
                agents[i][keyForTable] = columnsForTableFromState[
                  existingKeysFromState[l] as keyof typeof columnsForTableFromState
                ].handler(day.dayState[existingKeysFromState[l]]);
              }
              agents[i]['useTotalHours'] = columnsForTableFromState['useTotalHours'].handler(
                DateUtils.getDatesDiffernce(day.dayState.startDateTime, day.dayState.endDateTime),
              );
            }
          }
        }
      }
    }
    return agents;
  };

  butifyActivityName = (name: string) => {
    return name
      .split('_')
      .map(el => {
        return el[0].toUpperCase() + el.slice(1);
      })
      .join(' ');
  };

  addTimeZone = (
    agents: IAgentSchedule[] | IAgentTimeline[],
    filterData: IBusinessUnits,
    timezones: TTimezoneHashes,
    selectedTimezone: ITimezone,
    date: string,
  ): IAgentTimeline[] => {
    if (!agents?.length) return [];
    const newAgents: IAgentSchedule[] | IAgentTimeline[] = [];
    for (let i = 0; i < agents.length; i++) {
      const agent = clone(agents[i] as IAgentTimeline);
      let tzId: number;
      try {
        tzId = filterData[agent.buId]['sites'][agent.siteId]['timezoneId'];
      } catch (e) {
        try {
          tzId =
            Object.values(filterData[agent.buId]['sites']).find(site => site.name === agent.siteName)?.timezoneId || 0;
        } catch (e) {
          tzId = 0;
        }
      }

      const tzSite = clone(timezones[tzId]);
      const tzSelected = clone(selectedTimezone);
      if (!tzSite) continue;
      const tzOffset = DateUtils.getTimezoneOffsetFromSelected(tzSelected, tzSite, date) / 60;
      agent['timeZone'] = `${tzSite.name} (GMT ${tzSite.value > 0 ? '+' : ''}${tzSite.value / 60})`;
      agent['timezoneId'] = tzId;
      agent['shortTimeZone'] = `GMT ${tzSite.value > 0 ? '+' : ''}${tzSite.value / 60}`;
      agent['timeZoneDifference'] = `GMT ${tzSite.value > 0 ? '+' : ''}${tzSite.value / 60}
      (${Math.abs(tzOffset)} hours ${tzOffset > 0 ? 'behind' : 'ahead'})`;

      if (agent.timeZone === tzSelected.name) tzSelected.name = 'Site';
      tzSite.currentOffset = DateUtils.getTimezoneOffset(tzSite, Date.now());
      tzSelected.currentOffset = DateUtils.getTimezoneOffset(tzSelected, Date.now());

      if (agents[i].days) {
        for (let j = 0; j < agents[i].days.length; j++) {
          agent.days[j]['timeZoneSite'] = tzSite;
          agent.days[j]['timeZoneSelected'] = tzSelected;
        }
      }
      agent['_TZ_INTERNAL_USAGE'] = {
        tzSite,
        tzSelected,
      };
      newAgents.push(agent);
    }

    return newAgents as IAgentTimeline[];
  };

  getSiteId = (data: IBusinessUnits) => {
    let siteId = 0;
    const keysMain = Object.keys(data);
    for (const i of keysMain) {
      const sites = data[i].sites;
      const keysSites = Object.keys(sites);
      for (const j of keysSites) {
        if (sites[j].isChecked) {
          siteId = Utils.stringChecker(sites[j].siteId);
        }
      }
    }
    return siteId;
  };

  getBuId = (data: IBusinessUnits) => {
    let buId = 0;
    const keysMain = Object.keys(data);
    for (const i of keysMain) {
      buId = data[i].buId;
    }
    return buId;
  };

  getSiteTz = (data: IBusinessUnits, allData: any): number => {
    let siteTz = 0;
    const keysMain = Object.keys(data);
    for (const i of keysMain) {
      const sites = data[i].sites;
      const keysSites = Object.keys(sites);
      for (const j of keysSites) {
        siteTz = allData[data[i].buId]['sites'][sites[j].siteId].timezoneId;
      }
    }

    return siteTz;
  };

  getTargetElements = (data: ISelected): ITarget => {
    const targetElements: ITarget = { type: '', elements: [] };
    if (data.buId.length > 0) {
      targetElements.type = 'buId';
    } else if (data.siteId.length > 0) {
      targetElements.type = 'siteId';
    } else if (data.teamId.length > 0) {
      targetElements.type = 'teamId';
    } else if (data.agentId.length > 0) {
      targetElements.type = 'agentId';
    } else if (data.activities.length > 0) {
      targetElements.type = 'activities';
    }
    targetElements.elements.push(...data[targetElements.type as keyof typeof data]);
    return targetElements;
  };

  isActivityFromOneFamily = (families: IActivitiesSetGroup[], selected: number[], newId: number) => {
    if (selected.length === 0) return [newId];
    for (const i of families) {
      const indexOfRelative = i.activities.findIndex(relative => relative.id === newId);
      if (indexOfRelative > -1) {
        const indexOfSelectedRelative = i.activities.findIndex(relative => relative.id === selected[0]);
        if (indexOfSelectedRelative > -1) {
          return [...selected, newId];
        } else {
          return [newId];
        }
      }
    }
    return [];
  };

  convertTimeToTz = (
    selectedAgent: IAgentTimeline,
    time: string,
    date: number | string,
    timeFormat: TimeFormatType,
  ) => {
    const { tzSite, tzSelected } = selectedAgent._TZ_INTERNAL_USAGE;
    return DateUtils.getTimeInFormatFromDateString(
      DateUtils.convertAccordingToTz(
        DateUtils.setDayTime(date, DateUtils.convertTo24h(String(time)), false),
        tzSite,
        tzSelected,
      ),
      timeFormat,
    );
  };

  convertTimeToSelectedTz = (
    time: string,
    date: number | string,
    timeFormat: TimeFormatType,
    tzSite: ITimezone,
    tzSelected: ITimezone,
  ) => {
    return DateUtils.getTimeInFormatFromDateString(
      DateUtils.convertAccordingToTz(
        DateUtils.setDayTime(date, DateUtils.convertTo24h(String(time)), false),
        tzSelected,
        tzSite,
      ),
      timeFormat,
    );
  };

  getShiftTimeFromTimestamp = (shift: IShifts) => {
    return {
      start: DateUtils.convertMinutesToTime(shift.earliestStartTime || 0),
      end: DateUtils.convertMinutesToTime((shift.earliestStartTime || 0) + (shift.minDuration || 0)),
    };
  };

  getIsNextDay = (startTimeMin: number, endTimeMin: number, tzSite: ITimezone, tzSelected: ITimezone) => {
    let startDate = new Date();
    startDate.setUTCHours(Math.floor(startTimeMin / 60));
    startDate.setUTCMinutes(startTimeMin % 60);
    startDate = new Date(DateUtils.convertAccordingToTz(startDate.getTime(), tzSelected, tzSite));

    let endDate = new Date();
    endDate.setUTCHours(Math.floor(endTimeMin / 60));
    endDate.setUTCMinutes(endTimeMin % 60);
    endDate = new Date(DateUtils.convertAccordingToTz(endDate.getTime(), tzSelected, tzSite));

    return endDate.getUTCDay() !== startDate.getUTCDay();
  };

  getStartTimeForTimepicker = (subMenuData: ISubMenuType | null) => {
    return subMenuData ? DateUtils.getTimeFromDate(DateUtils.roundToNearest15Minutes(subMenuData.dateTime)) : '11:00';
  };

  getEndTimeForTimepicker = (subMenuData: ISubMenuType | null) => {
    return subMenuData
      ? DateUtils.getTimeFromDate(DateUtils.roundToNearest15Minutes(subMenuData.dateTime) + 12 * 60 * 60000)
      : '23:00';
  };

  getMinMaxDnDForShift(shift: ITimelineAgentActivity, width: number) {
    const sortedByEndTime = shift.states?.slice().sort((a, b) => a.end - b.end);
    if (!sortedByEndTime) return null;
    const cantBeMoved = sortedByEndTime.filter(
      state => state?._type && itemsThatCantBeMovedWithShift.includes(state?._type),
    );

    if (!cantBeMoved) return null;

    // math min left child
    const firstShiftItem = cantBeMoved[0];
    if (!firstShiftItem) return null;
    const min = Number((this.getLeft(+firstShiftItem.start, String(firstShiftItem.date)) / (100 * 0.01)).toFixed(2));

    //math last child
    const lastShiftItem = cantBeMoved[cantBeMoved.length - 1];
    const leftLastChild = this.getLeft(+lastShiftItem.start, String(lastShiftItem.date)) / (100 * 0.01);
    const lastChildWidth = this.getWidth(+lastShiftItem.start, +lastShiftItem.end) / (100 * 0.01);

    const max = +leftLastChild + +lastChildWidth - width;
    return { min, max };
  }
  getMinMaxDnDForShiftItem(shift: ITimelineAgentActivity, shiftItemWidth: number) {
    const min = Number((this.getLeft(+shift.start, String(shift.date)) / (100 * 0.01)).toFixed(2));
    const shiftWidth = this.getWidth(+shift.start, +shift.end) / (100 * 0.01);
    const max = +min + shiftWidth - shiftItemWidth;
    return { min, max };
  }

  setLeftWithMinMax(left: number, min?: number, max?: number) {
    let _left = left;
    if (min && _left < min) {
      _left = min;
    } else if (max && _left > max) {
      _left = max;
    }
    return _left;
  }
}

export default new SchUtils();
