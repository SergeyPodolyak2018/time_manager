import { ISchAvailability } from '../../common/interfaces/schedule/IAgentSchedule';
import { ITimezone } from '../../common/interfaces/config/ITimezone';
import DateUtils from '../dateUtils';
import DateUtilsTz from '../DateUtilsTimeZone'

class SchAvailability {
  constructor(options: ISchAvailability) {
    Object.assign(this, options);
  }

  static convertWithTz(availabilities: ISchAvailability[], tzSite: ITimezone, tzSelected: ITimezone) {
    return availabilities.map(availability => {
      return {
        ...availability,
        startDateTime: DateUtils.convertAccordingToTz(availability.startDateTime, tzSite, tzSelected),
        endDateTime: DateUtils.convertAccordingToTz(availability.endDateTime, tzSite, tzSelected),
      };
    });
  }
  static convertWithTzMom(availabilities: ISchAvailability[], tzSite: ITimezone, tzSelected: ITimezone) {
    return availabilities.map(availability => {
      return {
        ...availability,
        startDateTime: DateUtilsTz.convertAccordingToTz(availability.startDateTime, tzSite, tzSelected,true,true),
        endDateTime: DateUtilsTz.convertAccordingToTz(availability.endDateTime, tzSite, tzSelected,true,true),
      };
    });
  }

  static convertWithoutTz(availabilities: ISchAvailability[]) {
    return availabilities.map(availability => {
      return {
        ...availability,
        startDateTime: DateUtils.convertToIsoWithoutTz(availability.startDateTime),
        endDateTime: DateUtils.convertToIsoWithoutTz(availability.endDateTime),
      };
    });
  }

  static moveAvailabilities(availabilities: ISchAvailability[], time: number) {
    return availabilities.map(availability => {
      return {
        ...availability,
        startDateTime: +availability.startDateTime + time,
        endDateTime: +availability.endDateTime + time,
      };
    });
  }
}

export default SchAvailability;
