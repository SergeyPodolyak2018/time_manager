import * as Moment from 'moment';
import { extendMoment } from 'moment-range';
import DateObject from 'react-date-object';

import { ITimezone } from '../common/interfaces/config/ITimezone';
import { TimeFormatType } from '../redux/ts/intrefaces/timeLine';
import { IAgentTimeline } from '../redux/ts/intrefaces/timeLine/IAgentTimeline';
import CacheManager from './cacheManager';
import SchDay from './schedule/SchDay';
import Utils from './utils';

const moment = extendMoment(Moment);
const FIVE_MIN_MS = 300000;
const HISTORY_SIZE = 10;

export const formatTime = {
  '24hours': (time: string) => time,
  '12hours': (time: string) => {
    if (time) {
      const [hours, minutes]: string[] = time.split(':');
      return `${((Math.floor(+hours) + 11) % 12) + 1}:${Utils.to2Digits(+minutes)} ${
        Math.floor(+hours) > 11 ? 'PM' : 'AM'
      }`;
    } else {
      return time;
    }
  },
};

export const siteTimezone: ITimezone = {
  name: 'Site',
  currentOffset: 0,
  gswTimezoneId: 0,
  timezoneId: 0,
  value: 0,
  description: 'site',
};

class DateUtils {
  public readonly MS_IN_MINUTE = 60000;
  public readonly MS_IN_DAY = 24 * 60 * this.MS_IN_MINUTE;

  private timezoneOffsetCache: CacheManager;

  constructor() {
    this.timezoneOffsetCache = new CacheManager(30);
  }

  getStartOffset = (dateTime: number | string | null, newTime: string, isNextDay: boolean) => {
    if (dateTime === null) return 0;
    const nextDayOffset = isNextDay ? 24 * 60 * 60000 : 0;
    const oldStartValue = this.convertTimeToMinutes(this.convertToIsoWithoutTz(dateTime).split('T')[1]) * 60000;
    const newStartValue = this.convertTimeToMinutes(newTime) * 60000 + nextDayOffset;

    return this.getRound1mTimestamp(newStartValue - oldStartValue);
  };

  getDeltaDuration = (startDateTime: number | string, endDateTime: number | string, newDuration: string): number => {
    const duration = this.getRound1mTimestamp(Utils.getParsedNum(endDateTime) - Utils.getParsedNum(startDateTime));
    return this.convertTimeToMinutes(newDuration) * 60000 - duration;
  };

  getTimestampFromPercent(percent: number): number {
    const totalMinutes = (percent * 1440) / 100;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date.getTime();
  }

  getRound1mTimestamp(timestamp: number | string): number {
    const ms: number = typeof timestamp === 'string' ? moment.utc(timestamp).valueOf() : timestamp;

    return Math.round(ms / 60000) * 60000;
  }

  roundTimestamp(timestamp: number): number {
    const date = new Date(timestamp);
    const minutes = date.getMinutes();
    const remainder = minutes % 15;
    if (remainder < 7.5) {
      date.setMinutes(minutes - remainder);
    } else {
      date.setMinutes(minutes + (15 - remainder));
    }
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date.getTime();
  }

  /**

   Returns a rounded timestamp from a percentage, rounding down to 0 if the total minutes
   is less than 7.5 minutes and rounding up to 15 minutes otherwise.
   @param {number} percent - The percentage to calculate the rounded timestamp from (0-100).
   @returns {number} The rounded timestamp in milliseconds.
   */
  getRoundedTimestampFromPercent(percent: number): number {
    const isNegative = percent < 0;

    if (isNegative) {
      percent = Math.abs(percent);
    }

    // Calculate the total minutes from the percentage.
    const totalMinutes = (percent * 1440) / 100;

    // Round the minutes to the nearest 15 minutes.
    let roundedMinutes = Math.round(totalMinutes / 15) * 15;

    // If the rounded minutes is less than 7.5, round down to 0.
    if (roundedMinutes < 7.5) {
      roundedMinutes = 0;
    }

    if (isNegative) {
      roundedMinutes = totalMinutes - roundedMinutes;
    }

    // Calculate the hours and minutes from the rounded minutes.
    const hours = Math.floor(roundedMinutes / 60);
    const minutes = roundedMinutes % 60;

    // Create a new Date object and set the hours and minutes to the rounded values.
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(0);
    date.setMilliseconds(0);

    // Return the timestamp in milliseconds.
    return date.getTime();
  }

  getTime = (time: any, timeFormat: string) => {
    return formatTime[timeFormat as keyof typeof formatTime](
      `${Utils.to2Digits(this.getUTCFormat(time).getUTCHours())}:${Utils.to2Digits(
        this.getUTCFormat(time).getUTCMinutes(),
      )}`,
    );
  };

  getDifference = (firstDate: Date | number, secondDate: Date | number) => {
    const diffMs = +firstDate - +secondDate;
    const diffDays = Math.floor(diffMs / 86400000);
    const diffHrs = Math.floor((diffMs % 86400000) / 3600000);
    const diffMins = parseInt(String(((diffMs % 86400000) % 3600000) / 60000), 10);

    const hours = diffDays * 24 + diffHrs;
    return this.getCorrectFormatTime(hours) + ':' + this.getCorrectFormatTime(diffMins);
  };

  getCorrectFormatTime = (value: number) => {
    return value < 10 ? '0' + value : value;
  };

  getUTCFormat = (date: any) => {
    const utcFormat = Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
    );

    return new Date(utcFormat);
  };

  getActivitiesString = (activities: any) => {
    const value: string[] = [];
    activities?.map((item: any) => {
      value.push(item.name);
    });

    return value.join(', ');
  };

  getBreakString = (activity: any, activityName: any, meetingName?: string) => {
    const value =
      activity === 'meal'
        ? 'Meal'
        : activity === 'break'
        ? 'Break'
        : activity === 'exception'
        ? 'Exception'
        : activity === 'time_off'
        ? 'Time Off'
        : activity === 'marked_time'
        ? 'Marked Time'
        : '';

    if (activityName === undefined || activityName === 'undefined') {
      return value;
    }

    return meetingName ? value + ', ' + activityName + ', ' + meetingName : value + ', ' + activityName;
  };

  /**
   Returns the percentage of 24 hours based on the number of minutes.
   @param {number} minutes - The number of minutes.
   @returns {number} The percentage relative to 24 hours.
   */
  convertMinutesToPercent(minutes: number): number {
    return +(minutes / 1440) * 100;
  }

  /**
   * Returns the number of milliseconds corresponding to a percentage of 24 hours, based on the number of minutes.
   * @param {number} percent - percent from 24 hours
   * @returns {number} Number of milliseconds corresponding to a percentage of 24 hours.
   */
  convertPercentToMs(percent: number): number {
    return (+percent / 100) * 86400000; // 86 400 000 - count ms in 24 hours
  }

  /**
   * Rounds up to 5 or 0 minutes
   * @param {number} ms - milliseconds
   * @returns {number} Rounded milliseconds
   */
  roundMs(ms: number) {
    return Math.round(ms / FIVE_MIN_MS) * FIVE_MIN_MS;
  }
  /**
   * Rounds up to 15 or 5 or 0 minutes
   * @param {number} ms - milliseconds
   * @param {step} ms - milliseconds
   * @returns {number} Rounded milliseconds
   */
  roundMsByStep(ms: number, step: number) {
    return Math.round(ms / step) * step;
  }

  /**
   * Format timestamp or date string to 12hours or 24hours format
   * @param {string} time - timestamp | date | string
   * @param {string} format - 12hours or 24hours
   * @param {boolean} withDate - is return with date
   * @returns {string} Return: 01.01.2000T20:20 | 01.01.2000T01:20PM | 20:20 | 01:20PM
   */
  timeFormatting(time: string | number | Date, format: TimeFormatType, withDate = false) {
    const date = moment(time).utc();
    let formattedTime = '';
    // Check if 12-hours format is selected
    if (format === '12hours') {
      formattedTime = date.format('hh:mmA');
    } else if (format === '24hours') {
      formattedTime = date.format('HH:mm');
    }

    // If withDate flag is true, add date to the formatted time string
    if (withDate) {
      formattedTime = date.format('DD.MM.YYYY[T]') + formattedTime;
    }
    return formattedTime;
  }

  getDuration(start: number, end: number) {
    const diffMs = end - start;
    if (diffMs < 0) return 0;
    const diffDays = Math.floor(diffMs / 86400000);
    const diffHrs = Math.floor((diffMs % 86400000) / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);
    const hours = diffDays * 24 + diffHrs;
    return this.addLeadingZero(hours) + ':' + this.addLeadingZero(diffMins);
  }

  /**
   * Returns the ms from time
   * @param {string} time - time for convert ex. 20:10
   * @returns {number} Count of milliseconds in this time
   */
  convertTimeToMs(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    const totalSeconds = hours * 60 * 60 + minutes * 60;
    return totalSeconds * 1000;
  }

  /**
   * Checks if two time ranges overlap.
   * @param {number} start1 - Timestamp of the start of the first range.
   * @param {number} end1 - Timestamp of the end of the first range.
   * @param {number} start2 - Timestamp of the start of the second range.
   * @param {number} end2 - Timestamp of the end of the second range.
   * @returns {boolean} - true if ranges overlap.
   */
  checkTimeRanges(start1: number | string, end1: number | string, start2: number | string, end2: number | string) {
    const range1 = moment.range(new Date(start1), new Date(end1));
    const range2 = moment.range(new Date(start2), new Date(end2));
    return range1.overlaps(range2);
  }

  isTimeSegmentOverlapsWithAnyOther(
    timeSegment: (number | string)[],
    timeSegments: ((string | number)[] | undefined)[],
  ) {
    return timeSegments.findIndex(segment => {
      if (!segment) return false;
      const [start, end] = segment;
      const [timeSegmentStart, timeSegmentEnd] = timeSegment;
      return this.checkTimeRanges(timeSegmentStart, timeSegmentEnd, start, end);
    });
  }

  subtractTimeRanges(start1: number | string, end1: number | string, start2: number | string, end2: number | string) {
    const range1 = moment.range(new Date(start1), new Date(end1));
    const range2 = moment.range(new Date(start2), new Date(end2));
    return range1.subtract(range2);
  }

  setDayFromDate(timestamp: number, date: number): number {
    const oldMoment = moment(timestamp);
    const newMoment = moment(date);

    const hours = oldMoment.hours();
    const minutes = oldMoment.minutes();
    const seconds = oldMoment.seconds();
    const milliseconds = oldMoment.milliseconds();

    oldMoment.date(newMoment.date());

    oldMoment.hours(hours);
    oldMoment.minutes(minutes);
    oldMoment.seconds(seconds);
    oldMoment.milliseconds(milliseconds);

    return oldMoment.valueOf() as number;
  }

  /**
   * set UTC date
   * @param {string} date - ex. "2023-05-06"
   * @returns {number} - return utc timestamp
   */
  setUTCDate(date: string): number {
    const utcMoment = moment.utc(date, 'YYYY-MM-DD'); // create a moment object with UTC date and time
    return utcMoment.valueOf(); // get the Unix timestamp value in milliseconds
  }

  /**
   * set UTC date with time
   * @param {string} date - ex. "2023-05-06T10:10"
   * @returns {number} - return utc timestamp
   */
  setUTCDateWithTime(date: string): number {
    const utcMoment = moment.utc(date, 'YYYY-MM-DDTHH:mm'); // create a moment object with UTC date and time
    return utcMoment.valueOf(); // get the Unix timestamp value in milliseconds
  }

  /**
   * parse string and convert timestamps to selected time format
   * @param {string} inputString - string for parsing
   * @param {string} timeFormat - time format
   * @returns {string} - parsed string
   * @example "Constraint violation: Work set (1684295100000 - 1684302300000) falls out of the Shift (1684305900000 - 1684341900000)"
   * // return  "Constraint violation: Work set (14:40 PM - 18:00 PM) falls out of the Shift (14:40 PM - 18:00 PM)"
   */
  parseStringAndConvertDate(inputString: string, timeFormat: TimeFormatType) {
    const regex = /(\d{13})/g;
    let parsedString = inputString;
    let match;

    while ((match = regex.exec(inputString)) !== null) {
      const timestamp = parseInt(match[0]);
      const formattedTime = this.timeFormatting(timestamp, timeFormat);
      parsedString = parsedString.replace(match[0], formattedTime);
    }

    return parsedString;
  }

  localDate(): string {
    const [mm, dd, yyyy] = new Date().toLocaleDateString().split('/');
    if (!mm || !dd || !yyyy) return '';
    return `${yyyy.padStart(4, '2000')}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }

  toLocalDate(dateExsternal: string): string {
    return moment(dateExsternal).format('llll').split(' ').slice(0, 4).join(' ').replaceAll(',', '');
  }

  toDateObject(date: string): DateObject {
    const [year, month, day] = date.split('-').map(s => Number(s));
    return new DateObject({ year, month, day });
  }

  /**
   * Checks if the provided time is greater than the specified time.
   * @param {string} dateTimeString - The date and time string in "YYYY-MM-DDTHH:mm" format.
   * @param {string} than - The time string to compare against in "HH:mm" format.
   * @returns {boolean} - Returns true if the time is greater than the specified time, false otherwise.
   */
  checkTimeGreaterThan(dateTimeString: string, than: string): boolean {
    const [, hours] = dateTimeString.split('T');
    const time = moment(hours, 'HH:mm');
    const thanTime = moment(than, 'HH:mm');
    return time.isAfter(thanTime, 'minute');
  }

  convertToUTC(date: number) {
    return new Date(date).toUTCString();
  }
  convertAccordingToTz(_date: number | string, targetTz: ITimezone, currentTz: ITimezone): string {
    const dateO = moment.utc(_date);

    const currentTzOffset = this.getTimezoneOffset(currentTz, _date, targetTz);
    const targetTzOffset = this.getTimezoneOffset(targetTz, _date);

    let offset = (targetTzOffset - currentTzOffset) * 60000;
    if (currentTz.name === 'Site' || targetTz.name === 'Site') {
      offset = 0;
    }
    const modifiedData = dateO.valueOf() + offset;
    const targetData = moment.utc(modifiedData);

    const [dayMothYear, time] = targetData.toISOString().split('T');
    const [hour, minute] = time.split(':');
    return `${dayMothYear}T${hour}:${minute}Z`;
  }

  convertAccordingToTzTimestamp(_date: number | string, targetTz: ITimezone, currentTz: ITimezone): number {
    return new Date(this.convertAccordingToTz(_date, targetTz, currentTz)).getTime();
  }

  convertAccordingToTzWithoutOfset(_date: number | string) {
    const dateO = new Date(_date);
    const modifiedData = dateO.getTime();
    const targetData = new Date(modifiedData);

    const [dayMothYear, time] = targetData.toISOString().split('T');
    const [hour, minute] = time.split(':');
    return `${dayMothYear}T${hour}:${minute}Z`;
  }

  convertAccordingToTzInsertMultiple(_date: number | string, targetTz: ITimezone, currentTz: ITimezone) {
    const dateO = new Date(_date);

    const currentTzOffset = this.getTimezoneOffset(currentTz, _date, targetTz);
    const targetTzOffset = this.getTimezoneOffset(targetTz, _date);
    const offset = currentTz.timezoneId !== 0 ? (targetTzOffset - currentTzOffset) * 60000 : 0;

    const modifiedData = dateO.getTime() + offset;
    const targetData = new Date(modifiedData);

    const [dayMothYear, time] = targetData.toISOString().split('T');
    const [hour, minute] = time.split(':');
    return `${dayMothYear}T${hour}:${minute}`;
  }

  convertUtcAccordingToLocalTz(_date: number | string, timezones: ITimezone[]) {
    const targetTz = timezones.find(el => el.name === Intl.DateTimeFormat().resolvedOptions().timeZone);
    if (targetTz) {
      const dateO = moment.utc(_date);
      const targetTzOffset = this.getTimezoneOffset(targetTz, _date);
      const offset = targetTzOffset * 60000;
      const modifiedData = dateO.valueOf() + offset;
      return moment.utc(modifiedData).valueOf();
    }
    return moment.utc(_date).valueOf();
  }

  addTimeToDateByTz(_date: number | string, targetTz: ITimezone, currentTz: ITimezone) {
    const dateO = new Date(_date);

    const targetTzOffset = this.getTimezoneOffset(targetTz, _date);
    const currentTzOffset = this.getTimezoneOffset(currentTz, _date);

    const targetOffset = currentTzOffset === 0 ? 0 : targetTzOffset;
    const offset = (targetOffset - currentTzOffset) * 60000;

    const modifiedData = dateO.getTime() + offset;
    const targetData = new Date(modifiedData);

    const [dayMothYear, time] = targetData.toISOString().split('T');
    const [hour, minute] = time.split(':');
    return `${dayMothYear}T${hour}:${minute}`;
  }

  getTimezoneOffset(timezone: ITimezone, _date: string | number, tzSite?: ITimezone) {
    if (timezone.name === 'Site') return tzSite?.currentOffset ?? 0;
    const date = new Date(_date);

    const [cacheKey] = date.toISOString().split('T');
    const value = this.timezoneOffsetCache.getFromCache<number>(timezone.name + cacheKey);
    if (value) return value;

    try {
      const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
      const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone.name }));
      const mathValue = (tzDate.getTime() - utcDate.getTime()) / 6e4;
      this.timezoneOffsetCache.addToCache(timezone.name + cacheKey, mathValue);
      return mathValue;
    } catch (e) {
      this.timezoneOffsetCache.addToCache(timezone.name + cacheKey, timezone.value);
      return timezone.value;
    }
  }

  getTimezoneOffsetFromSelected(selectedTimeZone: ITimezone, siteTimeZone: ITimezone, _date: string | number) {
    if (selectedTimeZone.timezoneId === 0) return 0;
    const date = new Date(_date);
    try {
      const selectedDate = new Date(date.toLocaleString('en-US', { timeZone: selectedTimeZone.name }));
      const siteDate = new Date(date.toLocaleString('en-US', { timeZone: siteTimeZone.name }));
      return (selectedDate.getTime() - siteDate.getTime()) / 6e4;
    } catch (e) {
      return selectedTimeZone.value - siteTimeZone.value;
    }
  }

  convertDayStartDelimiter(date: number | string, targetTz: ITimezone, currentTz: ITimezone) {
    const dateO = new Date(date);
    const dateOffset = dateO.getTimezoneOffset();

    const currentTzOffset = this.getTimezoneOffset(targetTz, date);
    const targetTzOffset = this.getTimezoneOffset(currentTz, date);

    const targetOffset = currentTz.timezoneId === 0 ? 0 : targetTzOffset;
    const offset = (targetOffset - currentTzOffset - dateOffset) * 60000;

    const modifiedData = dateO.getTime() + offset;
    const targetData = new Date(new Date(modifiedData).toUTCString());

    const [dayMothYear, time] = targetData.toISOString().split('T');
    const [hour, minute] = time.split(':');
    return `${dayMothYear}T${hour}:${minute}`;
  }

  convertToIsoWithoutTz(date: number | string) {
    const dateO = new Date(date);
    const [dayMothYear, time] = dateO.toISOString().split('T');
    const [hour, minute] = time.split(':');
    return `${dayMothYear}T${hour}:${minute}Z`;
  }

  convertToIsoWithoutTime(date: number | string) {
    let dateUpdated = date;
    if (typeof date === 'number') {
      dateUpdated = Math.abs(date);
    }
    const dateO = new Date(dateUpdated);
    const [dayMothYear] = dateO.toISOString().split('T');
    return `${dayMothYear}`;
  }

  getMidnight(timestamp: number | string) {
    if (typeof timestamp === 'string') return timestamp.slice(0, timestamp.indexOf('T')) + 'T00:00';
    const date = new Date(timestamp);
    date.setUTCHours(0, 0, 0, 0);

    const isoString = date.toISOString();
    return isoString.slice(0, isoString.indexOf('T')) + 'T00:00Z';
  }

  /**
   * split string date ex. 10-10-2010T10:10
   * @param date timestamp | Date
   * @return 10-10-2010
   */
  getDateFromString<T>(date: string | number | Date): T | string {
    try {
      return new Date(date).toISOString().split('T')[0];
    } catch (e) {
      return date as T;
    }
  }

  getDayByDate(date: number | string, tzSite?: ITimezone, tzSelect?: ITimezone) {
    if (tzSelect && tzSite) {
      return new Date(this.convertAccordingToTz(date, tzSite, tzSelect)).getUTCDay();
    } else {
      return new Date(date).getUTCDay();
    }
  }

  getDay(date: number | string | Date) {
    if (date instanceof Date) return date.getUTCDay();
    return new Date(date).getUTCDay();
  }

  setDayTime(timestamp: string | number, value: string, isNextDay = false, isPreviousDayStart = false): number {
    const date = new Date(timestamp);

    const [hours, minutes] = value.split(':');
    if (isNextDay) date.setUTCDate(date.getUTCDate() + 1);
    if (isPreviousDayStart) date.setUTCDate(date.getUTCDate() - 1);
    date.setUTCHours(Number(hours));
    date.setUTCMinutes(Number(minutes));
    return date.getTime();
  }

  activeDateConvert(ms: number | string): string {
    const _ms = typeof ms === 'string' ? parseInt(ms) : ms;
    return new Date(_ms).toISOString().split('T')[0];
  }

  getLocalTargetDate(selectedAgent: IAgentTimeline, targetTimestamp: number | string): number {
    return new Date(
      SchDay.getAgentDayDateFromTimestamp(
        selectedAgent._TZ_INTERNAL_USAGE.tzSelected,
        selectedAgent._TZ_INTERNAL_USAGE.tzSite,
        targetTimestamp,
      ),
    ).getTime();
  }

  fixDate(day: number) {
    if (day < 10) {
      return `0${day}`;
    }
    return day;
  }

  isDateInRange = (start: number | string, end: string | number, targetDate: string) => {
    const startDate = typeof start === 'string' ? new Date(start).getTime() : start;
    const endDate = typeof end === 'string' ? new Date(end).getTime() : end;
    const startTargetDate = this.getWorkDayInMs(targetDate);
    const endTargetDate = this.getEndWorkDayInMs(startTargetDate);

    return (
      (startDate >= startTargetDate && startDate <= endTargetDate) ||
      (endDate <= endTargetDate && endDate >= startTargetDate)
    );
  };

  isStartTimeInDate = (start: number | string, targetDate: string) => {
    return moment
      .utc(start)
      .add(1, 'millisecond')
      .isBetween(moment.utc(targetDate).startOf('day'), moment.utc(targetDate).endOf('day'));
  };

  getWorkDayInMs(mainData: string | number) {
    const workDay = new Date(mainData);
    const day = `${workDay.getUTCFullYear()}-${this.fixDate(workDay.getUTCMonth() + 1)}-${this.fixDate(
      workDay.getUTCDate(),
    )}`;
    const dayStart = new Date(day);
    return dayStart.getTime();
  }

  getEndWorkDayInMs(mainDataMs: number) {
    const shiftMs = 24 * 60 * 60 * 1000;
    return mainDataMs + shiftMs;
  }

  isStartDateTimeInCurrentDate = (start: number | string, end: string | number, targetDate: string) => {
    const startDate = typeof start === 'string' ? new Date(start).getTime() : start;
    const endDate = typeof end === 'string' ? new Date(end).getTime() : end;
    const startTargetDate = this.getWorkDayInMs(targetDate);
    const endTargetDate = this.getEndWorkDayInMs(startTargetDate);

    return (
      (startDate >= startTargetDate && startDate < endTargetDate) ||
      (endDate < endTargetDate && endDate > startTargetDate)
    );
  };

  timeConverter = (timeStamp: number | string) => {
    if (typeof timeStamp === 'string') return timeStamp;

    const date = new Date(timeStamp);
    const [dayMothYear, time] = date.toISOString().split('T');
    const [hour, minut] = time.split(':');
    return `${dayMothYear}T${hour}:${minut}`;
  };

  getDatesDiffernce = (date1: number, date2: number) => {
    const diff = (date1 - date2) / 1000;
    const diffmin = diff / 60;
    const diffHour = Math.trunc(diffmin / 60);
    const minuts = Math.trunc(diffHour * 60 - diffmin);
    return `${Math.abs(diffHour)}:${Utils.to2Digits(minuts)}`;
  };

  getDates = (midleDate: string) => {
    const datesprevious = [];
    const datesnext = [];
    const reperPoint = new Date(midleDate + 'T00:00');
    //reperPoint.setTime(reperPoint.getTime() - new Date().getTimezoneOffset() * 60 * 1000);
    for (let i = 1; i < 4; i++) {
      const next = new Date(midleDate + 'T00:00');
      const previous = new Date(midleDate + 'T00:00');
      next.setDate(next.getDate() + i);
      previous.setDate(previous.getDate() - i);
      datesnext.push({
        day: next.getDate(),
        weekDay: next.getDay(),
        date: moment(next).format(),
        active: false,
      });
      datesprevious.push({
        day: previous.getDate(),
        weekDay: previous.getDay(),
        date: moment(previous).format(),
        active: false,
      });
    }
    return [
      ...datesprevious.reverse(),
      {
        day: reperPoint.getDate(),
        weekDay: reperPoint.getDay(),
        date: moment(reperPoint).format(),
        active: true,
      },
      ...datesnext,
    ];
  };

  getDatesByIndex = (newActive: string, index: number) => {
    const datesprevious = [];
    const datesnext = [];
    const reperPoint = new Date(newActive);
    if (index + 1 > 4) {
      const ofset = index + 1 - 4;
      for (let i = 1; i <= ofset; i++) {
        const next = new Date(reperPoint);
        next.setDate(next.getDate() + i);
        datesnext.push({
          day: next.getDate(),
          weekDay: next.getDay(),
          date: next.toISOString(),
          active: false,
        });
      }
      return datesnext;
    } else {
      const ofset = index + 1;
      for (let i = 1; i <= ofset; i++) {
        const previous = new Date(reperPoint);
        previous.setDate(previous.getDate() - i);
        datesprevious.push({
          day: previous.getDate(),
          weekDay: previous.getDay(),
          date: previous.toISOString(),
          active: false,
        });
      }
      return datesprevious;
    }
  };

  getTimeFromDate = (date: number) => {
    const targetDate = new Date(date);
    const hours = this.addLeadingZero(targetDate.getUTCHours());
    const minutes = this.addLeadingZero(targetDate.getUTCMinutes());

    return hours + ':' + minutes;
  };

  roundToNearest15Minutes = (timestamp: number | string) => {
    const date = new Date(timestamp);
    const minutes = date.getMinutes();
    const roundedMinutes = Math.round(minutes / 15) * 15;
    date.setMinutes(roundedMinutes);
    date.setSeconds(0);
    date.setMilliseconds(0);

    return date.getTime();
  };

  addLeadingZero = (date: number) => {
    if (date < 10) {
      return '0' + date;
    }
    return date;
  };

  getTimeInFormatFromDateString = (date: string, timeFormat: string): string => {
    const time = date.split('T')[1].replace('Z', '');
    return formatTime[timeFormat as keyof typeof formatTime](time);
  };

  convertTo24h = (time: string): string => {
    const timeIn12h = this.convert12hto24h(time);
    return timeIn12h ? timeIn12h : time;
  };

  convert12hto24h = (time: string): string | null => {
    let _time = time;
    if (time.split(':').length > 2) {
      const _t = time.split(':');
      _time = `${_t[0]}:${_t[1]}${_t[2].slice(2, _t[2].length)}`;
    }
    const time12hReg = new RegExp(/(\d{1,2}):(\d{2})\s{0,1}(am|pm)/i);
    const parseStr: any[] | null = time12hReg.exec(_time.trim());
    if (!parseStr) return null;

    const [, hoursStr, minutesStr, ampm] = parseStr;
    const hours12h = parseInt(hoursStr);
    const minutes = parseInt(minutesStr);
    if (Number.isNaN(hours12h) || Number.isNaN(minutes)) return null;

    const addH = ampm.toUpperCase() == 'PM' ? 12 : 0;
    const hh = (addH + (hours12h < 12 ? hours12h : 0)).toString().padStart(2, '0');
    const mm = minutes.toString().padStart(2, '0');

    return `${hh}:${mm}`;
  };

  convertMinutesToTime = (totalMinutes: number): string => {
    const hh = Math.floor(totalMinutes / 60);
    const mm = String(totalMinutes - hh * 60).padStart(2, '0');

    return `${hh}:${mm}`;
  };

  convertTimeToMinutes = (time: string): number => {
    const time24h = this.convert12hto24h(time) || time.trim();
    const time24hReg = new RegExp(/(\d{1,2}):(\d{2})/i);
    const parseStr: any[] | null = time24hReg.exec(time24h);
    if (!parseStr) return 0;

    const [, hoursStr, minutesStr] = parseStr;
    const hh = parseInt(hoursStr);
    const mm = parseInt(minutesStr);

    return hh * 60 + mm;
  };

  convertTimestampToTimeHhMmSec = (ms: number): string => {
    const sec = Math.floor(ms / 1000);
    const hh = Math.floor(sec / 3600);
    const mm = Math.floor((sec - hh * 3600) / 60);
    const ss = Math.floor(sec - hh * 3600 - mm * 60);
    return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
  };

  getPreviousDayWithMoment = (currentDay: string) => {
    return moment(currentDay).subtract(1, 'days').startOf('day').format('YYYY-MM-DD').toString();
  };
  getNextDayWithMoment = (currentDay: string) => {
    return moment(currentDay).add(1, 'days').format('YYYY-MM-DD').toString();
  };

  getPreviousDay = (currentDay: string, timezones?: ITimezone[]) => {
    const previous = timezones
      ? new Date(this.convertUtcAccordingToLocalTz(currentDay, timezones))
      : new Date(currentDay);
    previous.setDate(previous.getDate() - 1);
    return previous.toISOString().split('T')[0];
  };

  getNextDay = (currentDay: string, timezones?: ITimezone[]) => {
    const next = timezones ? new Date(this.convertUtcAccordingToLocalTz(currentDay, timezones)) : new Date(currentDay);
    next.setDate(next.getDate() + 1);
    return next.toISOString().split('T')[0];
  };

  getDayBeforeTomorrow = (currentDay: string) => {
    const previous = new Date(currentDay);
    previous.setDate(previous.getDate() - 2);
    return previous.toISOString().split('T')[0];
  };

  getDateListFromRange = (date1: string, date2: string) => {
    const start = moment(date1);
    const end = moment(date2);
    const list = [];
    for (let current = start; current <= end; current.add(1, 'd')) {
      list.push(current.format('YYYY-MM-DD'));
    }
    return list;
  };
  convertDateObjectToDate = (date1: string | Date) => {
    const start = moment(date1);
    return start.format('YYYY-MM-DD');
  };

  convertDateToDateObject = (date1: string) => {
    return new DateObject(date1);
  };

  getCurrentDate = () => {
    const date = new Date();

    return `${date.getFullYear()}-${this.fixDate(date.getMonth() + 1)}-${this.fixDate(date.getDate())}`;
  };

  pushToFixedArray = <Type>(target: Type[], element: Type): Type[] => {
    const newTarget = [];
    target.push(element);
    if (target.length > HISTORY_SIZE) {
      for (let i = 0; i < HISTORY_SIZE; i++) {
        newTarget[i] = target[i + 1];
      }
      return newTarget;
    } else {
      return target;
    }
  };
  convertTimeTo24h = (time: string) => {
    const am = time.includes('AM');
    const [hours, minutes] = time.replace(' AM', '').replace(' PM', '').split(':');

    const prettyMinutes = minutes.replace(/\D/g, '');
    const prettyHours = hours.replace(/\D/g, '');
    if (am) {
      if (prettyHours === '12') {
        return `00:${prettyMinutes}`;
      } else {
        return `${prettyHours}:${prettyMinutes}`;
      }
    }
    if (prettyHours === '12') {
      return `${prettyHours}:${prettyMinutes}`;
    } else {
      return `${Number(prettyHours) + 12}:${prettyMinutes}`;
    }
  };

  isCrossed12PmNextDay(
    startDateTime: number | string,
    endDateTime: number | string,
    tzSite: ITimezone,
    tzSelected: ITimezone,
  ) {
    const MS_IN_36_HOURS = 129600000;
    const MS_IN_MINUTE = 60000;

    const localStartDateTime =
      new Date(startDateTime).getTime() +
      (!!tzSelected.timezoneId ? tzSite.currentOffset - tzSelected.currentOffset : 0) * MS_IN_MINUTE;
    const localStartDateMs = new Date(this.getMidnight(this.convertToIsoWithoutTz(localStartDateTime))).getTime();
    const localEndDateTime =
      new Date(endDateTime).getTime() +
      (!!tzSelected.timezoneId ? tzSite.currentOffset - tzSelected.currentOffset : 0) * MS_IN_MINUTE;
    const localEndDateTimeMs = new Date(this.convertToIsoWithoutTz(localEndDateTime)).getTime();

    return this.getRound1mTimestamp(localEndDateTimeMs - localStartDateMs) > MS_IN_36_HOURS;
  }

  getTZOffsetMs(tzSelected: ITimezone, tzSite: ITimezone): number {
    return tzSelected?.timezoneId !== 0 ? (tzSelected.currentOffset - tzSite.currentOffset) * this.MS_IN_MINUTE : 0;
  }

  getActivityTime(element: any) {
    const start = element.openHours[0]?.startTime;
    const end = element.openHours[0]?.duration * 60 * 1000;

    const startDate = new Date(start).toISOString();
    const endDate = new Date(end).toISOString();

    const [startHours, startMinutes] = this.getSplitedString(startDate);
    const [endHours, endMinutes] = this.getSplitedString(endDate);

    const formattedTime = `   (${startHours}:${startMinutes} - +${endHours}:${endMinutes})`;
    return formattedTime;
  }

  getSplitedString(timeString: string) {
    const timePartsStart = timeString.split('T');
    return timePartsStart[1].split(':');
  }

  isSameDayOfWeek(date1: string | number, date2: string | number) {
    const dayOfWeek1 = moment.utc(date1).format('dddd');
    const dayOfWeek2 = moment.utc(date2).format('dddd');

    return dayOfWeek1 === dayOfWeek2;
  }
  getWeekDates = (dateInTheMiddle: string): [string, string] => {
    const date = new Date(dateInTheMiddle);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff)).toISOString().split('T')[0];
    const sunday = new Date(date.setDate(diff + 6)).toISOString().split('T')[0];
    return [monday, sunday];
  };

  convertStringToTimestamp(date: string) {
    return moment.utc(date).valueOf();
  }
}

export default new DateUtils();
