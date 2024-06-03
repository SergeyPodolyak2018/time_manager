import { ISchActivity, ISchActivitySet } from '../../common/interfaces/schedule/IAgentSchedule';
import { ITimezone } from '../../common/interfaces/config/ITimezone';
import SchAvailability from './SchAvalability';
import { ActivitySetType, WORK_ID } from '../../common/constants/schedule';
import { IActivitiesSetGroup, ISelectedActivity } from '../../redux/ts/intrefaces/timeLine';

class SchActivitySet {
  constructor(options: ISchActivitySet) {
    Object.assign(this, options);
  }

  static convertWithTz(activities: ISchActivitySet[], tzSite: ITimezone, tzSelected: ITimezone) {
    return activities.map(activity => {
      return {
        ...activity,
        availabilities: activity.availabilities
          ? SchAvailability.convertWithTz(activity.availabilities, tzSite, tzSelected)
          : [],
      };
    });
  }
  static convertWithTzMom(activities: ISchActivitySet[], tzSite: ITimezone, tzSelected: ITimezone) {
    return activities.map(activity => {
      return {
        ...activity,
        availabilities: activity.availabilities
          ? SchAvailability.convertWithTzMom(activity.availabilities, tzSite, tzSelected)
          : [],
      };
    });
  }

  static convertWithoutTz(activities: ISchActivitySet[]) {
    return activities.map(activity => {
      return {
        ...activity,
        availabilities: activity.availabilities ? SchAvailability.convertWithoutTz(activity.availabilities) : [],
      };
    });
  }

  static getActivitySetsByID(selectedId: number[], activity: any[], sets: any[]) {
    const setId = activity.find(el => el.id === selectedId[0]).setId;
    const activitySet = sets.find(el => el.id === setId);
    const cutActivitySet = {
      id: activitySet.id,
      activities: activitySet.activities.map((el: any) => el.id),
    };

    return [cutActivitySet];
  }

  static moveActivitySets(activities: ISchActivitySet[], time: number) {
    return activities.map(activity => {
      return {
        ...activity,
        availabilities: activity.availabilities
          ? SchAvailability.moveAvailabilities(activity.availabilities, time)
          : activity.availabilities,
      };
    });
  }

  static groupActivities = (
    activities: ISchActivity[],
    activitiesSet: ISchActivitySet[],
    type: ActivitySetType,
  ): { activities: ISchActivity[]; activitiesSet: IActivitiesSetGroup[] } => {
    let activitiesSetGroup: IActivitiesSetGroup[] = [];
    if (type === ActivitySetType.ALL || type === ActivitySetType.ACTIVITY_SET) {
      activitiesSetGroup = activitiesSet.filter(set=>set.activities[0]).map(set => {
        const activitiesInSet = activities.filter(el => el.setId === set.id);
          return { ...set, activities: activitiesInSet, open: false } as unknown as IActivitiesSetGroup;
      }).filter(set=>set.activities[0]);
    }

    const workActivities = activities.filter(el => el.setId === 0);
    if (workActivities.length && (type === ActivitySetType.ALL || type === ActivitySetType.WORK)) {
      const workSet: IActivitiesSetGroup = {
        id: 0,
        buId: 0,
        siteId: [],
        name: 'Work',
        activities: workActivities,
        open: false,
      };
      activitiesSetGroup.push(workSet);
    }
    return {
      activities: activities,
      activitiesSet: activitiesSetGroup,
    };
  };

  static updateActivitySet(
    activitiesSets: ISchActivitySet[],
    activities: ISchActivity[],
    selectedActivity: ISelectedActivity,
  ) {
    const activitiesIds = activities.map(activity => activity.id);
    const isNewSet = activities.length && !activitiesSets.find(a => activities[0].setId === a.id);

    let updatedSets;
    if (isNewSet) {
      const id = activities[0].setId;
      const newSet: ISchActivitySet = {
        activities: activitiesIds,
        id,
      };
      if (id === WORK_ID) newSet.refId = WORK_ID;
      updatedSets = [...activitiesSets, newSet];
    } else {
      updatedSets = activitiesSets.map(a => {
        if (a.refId === selectedActivity.refId && a.id === selectedActivity.stateId) {
          return {
            ...a,
            activities: activitiesIds,
          };
        }
        return a;
      });
    }

    return updatedSets.filter(sets => sets && sets.activities.length) as ISchActivitySet[];
  }
}

export default SchActivitySet;
