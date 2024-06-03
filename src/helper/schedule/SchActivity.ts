import { ISchActivity } from '../../common/interfaces/schedule/IAgentSchedule';
import { omit } from 'ramda';
import Utils from '../utils';

class SchActivity {
  constructor(options: ISchActivity) {
    Object.assign(this, options);
  }

  static updateActivities(activities: ISchActivity[], newActivities: ISchActivity[], activityIds: number[]) {
    const _new = newActivities.map(_ => omit(['openHours'], _));
    const concatActivities = [..._new, ...activities].filter(a => activityIds.includes(a.id));

    return Utils.removeFirstDuplicatesByKey<ISchActivity, keyof ISchActivity>(concatActivities, 'id');
  }

  static removeActivities(activities: ISchActivity[], newActivities: ISchActivity[], activityIds: number[]) {
    const _new = newActivities.map(_ => omit(['openHours'], _));
    const concatActivities = [..._new, ...activities].filter(a => activityIds.includes(a.id));

    return Utils.removeFirstDuplicatesByKey<ISchActivity, keyof ISchActivity>(concatActivities, 'id');
  }
}

export default SchActivity;
