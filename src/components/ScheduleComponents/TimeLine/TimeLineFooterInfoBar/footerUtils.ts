import { ISelectedActivity } from '../../../../redux/ts/intrefaces/timeLine';
import { IAgentTimeline } from '../../../../redux/ts/intrefaces/timeLine/IAgentTimeline';
import SchUtils from '../../../../helper/schedule/SchUtils';
import { breakItems } from '.';
import DateUtils from '../../../../helper/dateUtils';

export function getActivityDate(data: ISelectedActivity[], agent: IAgentTimeline[]) {
  if (data[0]?.type === 'activity' && agent[0]?._TZ_INTERNAL_USAGE.tzSite && agent[0]?._TZ_INTERNAL_USAGE.tzSelected) {
    return DateUtils.convertAccordingToTz(
      data[0].start,
      agent[0]._TZ_INTERNAL_USAGE.tzSite,
      agent[0]._TZ_INTERNAL_USAGE.tzSelected,
    );
  }
  return '';
}

export function getDate(data: ISelectedActivity[], agent: IAgentTimeline[], startTime: number) {
  if (data && data[0] && agent && agent[0]) {
    if (breakItems.includes(data[0].type)) {
      return DateUtils.convertAccordingToTz(
        data[0].start,
        agent[0]._TZ_INTERNAL_USAGE.tzSite,
        agent[0]._TZ_INTERNAL_USAGE.tzSelected,
      );
    }
    if (SchUtils.isFullDayException(data) || SchUtils.isDayOff(data)) {
      return new Date(data[0].dayDate).toISOString();
    } else if (SchUtils.isFullDayTimeOff(data)) {
      return DateUtils.convertAccordingToTz(
        startTime,
        agent[0]?._TZ_INTERNAL_USAGE.tzSite,
        agent[0]?._TZ_INTERNAL_USAGE.tzSelected,
      );
    } else if (agent[0] && startTime) {
      return DateUtils.convertAccordingToTz(
        startTime,
        agent[0]?._TZ_INTERNAL_USAGE.tzSite,
        agent[0]?._TZ_INTERNAL_USAGE.tzSelected,
      );
    }
  }
  return '';
}
