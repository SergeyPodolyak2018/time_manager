import { ISelected } from './SchUtils';
import {
  IPayLoadOpenAgentSnapshot
} from '../../api/ts/interfaces/openAgentSnapshot';
import {
  IPayLoadOpenMeetingSnapshot
} from '../../api/ts/interfaces/openMeetingtSnapshot';
import {
  IPayLoadGetMeetingFromSnapshot
} from '../../api/ts/interfaces/getMeetingtFromSnapshot';

class SchMeetingScheduler {
  static prepareDataForOpenAgentSnapshot(filterAgents: ISelected, date: string, snapshotId?: string):IPayLoadOpenAgentSnapshot {
    return {
      agentId: filterAgents.agentId,
      siteId: filterAgents.siteId,
      buId: filterAgents.buId,
      teamId: filterAgents.teamId,
      startDate: date,
      endDate: date,
      enableSecondarySkills: false,
      snapshotId,
    }
  }
  static prepareDataForOpenMeetingSnapshot(snapshotId: string):IPayLoadOpenMeetingSnapshot {
    return {
      snapshotId,
    }
  }
  static prepareDataForGetMeetingFromSnapshot(snapshotId: string, count:number):IPayLoadGetMeetingFromSnapshot {
    return {
      snapshotId,
      firstIndex: 0,
      lastIndex: count>0?count-1:0
    }
  }
  static toMinutes (time: string): number {
    const hours = Number.parseInt(time.split(':')[0]);
    const minutes = Number.parseInt(time.split(':')[1]);
    const mainTime = hours * 60 + minutes;
    return mainTime;
  };
}

export default SchMeetingScheduler;
