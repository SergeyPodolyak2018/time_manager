import { ISchWorkState } from '../../common/interfaces/schedule/IAgentSchedule';
import { ITimezone } from '../../common/interfaces/config/ITimezone';
import { omit } from 'ramda';
import DateUtils from '../dateUtils';

class SchWorkState {
  constructor(options: ISchWorkState) {
    Object.assign(this, options);
  }

  static convertWithTz(states: ISchWorkState[], tzSite: ITimezone, tzSelected: ITimezone) {
    return states.map(state => {
      return {
        ...state,
        date: DateUtils.getMidnight(state.date),
        startDateTime: DateUtils.convertAccordingToTz(state.startDateTime, tzSite, tzSelected),
        endDateTime: DateUtils.convertAccordingToTz(state.endDateTime, tzSite, tzSelected),
      };
    });
  }

  static convertWithoutTz(states: ISchWorkState[]) {
    return states.map(state => {
      return {
        ...omit(['isSelected', 'changed'], state),
        startDateTime: DateUtils.convertToIsoWithoutTz(state.startDateTime),
        endDateTime: DateUtils.convertToIsoWithoutTz(state.endDateTime),
      };
    });
  }
}

export default SchWorkState;
