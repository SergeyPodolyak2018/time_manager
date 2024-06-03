import { extendMoment } from 'moment-range';
import * as Moment from 'moment-timezone';

import { ITimezone } from '../common/interfaces/config/ITimezone';

import CacheManager from './cacheManager';

const moment = extendMoment(Moment);

type TDangerousTime = { start: number; end: number };

class DateUtilsTimeZone {
  private timezoneDifference: CacheManager;
  private dangerousDayStorage: CacheManager;
  private dangerousTimeStampStorage: CacheManager;

  constructor() {
    this.timezoneDifference = new CacheManager(30);
    this.dangerousDayStorage = new CacheManager(100);
    this.dangerousTimeStampStorage = new CacheManager(100);
  }

  getTzDifference(_date: string, tzSite: ITimezone, tzSelected: ITimezone) {
    //const time = moment().format('hh:mm:ss');
    const dateTime = _date + 'T' + '00:00:00';
    const dateTimeEtalon = _date + 'T' + '00:00:00';
    const cacheKey = dateTime + 'V' + dateTimeEtalon + 'V' + tzSite.timezoneId + 'V' + tzSelected.timezoneId;
    const value = this.timezoneDifference.getFromCache<number>(cacheKey);
    if (value) return value;
    const timSite = moment.tz(dateTime, tzSite.name);
    let timSelected = timSite.valueOf();
    if (tzSelected.timezoneId !== 0) {
      timSelected = moment.tz(dateTime, tzSelected.name).valueOf();
    }
    const dif = timSite.diff(timSelected);
    const result = moment.tz(dateTimeEtalon, 'UTC').valueOf() + dif;
    this.timezoneDifference.addToCache(cacheKey, result);
    return result;
  }

  getTimeIntz(date: string, tzSite: ITimezone, tzSelected: ITimezone) {
    const timSite = moment.tz(date, tzSite.name);
    let timSelected = timSite.valueOf();
    if (tzSelected.timezoneId !== 0) {
      timSelected = moment.tz(date, tzSelected.name).valueOf();
    }
    const dif = timSite.diff(timSelected);
    const result = moment.tz(date, 'UTC').valueOf() + dif;
    return result;
  }

  getTzDifferenceInSomeTime(_date: number, tzSelected: ITimezone) {
    const tzObj = moment.tz.zone(tzSelected.name);
    if (tzObj) {
      return tzObj.utcOffset(_date) * 60000;
    }
    return 0;
  }
  getSummerWinterTimeCorrector(_date: number, targetTz: ITimezone) {
    const tzObj = moment.tz.zone(targetTz.name);
    if (tzObj) {
      const timeinTz = moment.tz(_date, targetTz.name).valueOf();
      const right = tzObj.utcOffset(timeinTz + 2700000);
      const midle = tzObj.utcOffset(timeinTz);
      const left = tzObj.utcOffset(timeinTz - 2700000);
      if (left === midle && right === midle) return 0;
      if (midle !== left && midle > left) return (left - midle) * 60000;
      if (midle !== right) return (midle - right) * 60000;
    }
    return 0;
  }

  convertAccordingToTz(
    _date: number | string,
    targetTz: ITimezone,
    tzSelected: ITimezone,
    disableTimeCorector?: boolean,
    postfix?: boolean,
  ) {
    let rez = '';
    const internalPostfix = postfix ? 'Z' : '';
    if (
      tzSelected.name === 'Site' ||
      targetTz.name === tzSelected.name ||
      tzSelected.currentOffset === targetTz.currentOffset
    ) {
      rez = moment.tz(_date, 'UTC').format('YYYY-MM-DDTHH:mm:ss') + internalPostfix;
    } else {
      const newDate = moment.tz(_date, 'UTC').valueOf();
      const ofset = this.getTzDifferenceInSomeTime(newDate, tzSelected);
      let timechangeCorrector = this.getSummerWinterTimeCorrector(newDate + ofset, targetTz);
      if (disableTimeCorector) {
        timechangeCorrector = 0;
      }
      const newTime = newDate + ofset;
      rez = moment.tz(newTime + timechangeCorrector, targetTz.name).format('YYYY-MM-DDTHH:mm:ss') + internalPostfix;
    }
    return rez;
  }

  getDateInTZ(_date: string) {
    const timSelected = moment.tz(_date, 'UTC').valueOf();
    return timSelected;
  }

  dayTzComparator(dateItem: number | string, selectedDate: string | Date) {
    const dayItem = moment.tz(dateItem, 'UTC').format('DD');
    const daySelected = moment.tz(selectedDate, 'UTC').format('DD');
    return dayItem === daySelected;
  }
  isThisdayDangerous(date: string, targetTz: ITimezone) {
    const tzObj = moment.tz.zone(targetTz.name);
    const dateTimePoint1 = moment.tz(date + 'T' + '00:00:00', targetTz.name).valueOf();
    const dateTimePoint2 = moment.tz(date + 'T' + '23:59:59', targetTz.name).valueOf();
    const cacheKey = dateTimePoint1 + 'V' + dateTimePoint2 + 'V' + targetTz.timezoneId;
    const value = this.dangerousDayStorage.getFromCache<string>(cacheKey);
    if (value) {
      if (value === 'true') return true;
      if (value === 'false') return false;
    }
    if (tzObj) {
      const left = tzObj.utcOffset(dateTimePoint1);
      const right = tzObj.utcOffset(dateTimePoint2);
      if (left !== right) {
        this.dangerousDayStorage.addToCache(cacheKey, 'true');
        return true;
      }
    }
    this.dangerousDayStorage.addToCache(cacheKey, 'false');
    return false;
  }
  getDangerousTime(date: string, targetTz: ITimezone, selectedTz: ITimezone): TDangerousTime {
    const tzObj = moment.tz.zone(targetTz.name);
    const dateTimePoint1 = moment.tz(date + 'T' + '00:00:00', targetTz.name).valueOf();
    const cacheKey = dateTimePoint1 + 'V' + targetTz.timezoneId;
    const value = this.dangerousTimeStampStorage.getFromCache<TDangerousTime>(cacheKey);
    const selectedTzName = targetTz.name;
    if (value) {
      const tempValStart = moment.tz(value.start, targetTz.name).format('YYYY-MM-DDTHH:mm:ss');
      const tempValEnd = moment.tz(value.end, targetTz.name).format('YYYY-MM-DDTHH:mm:ss');
      return {
        start: this.getTimeIntz(tempValStart, targetTz, selectedTz),
        end: this.getTimeIntz(tempValEnd, targetTz, selectedTz),
      };
    }
    if (tzObj) {
      const etalonOfset = tzObj.utcOffset(dateTimePoint1);

      let investigatingPoint = dateTimePoint1;
      let dangerousTime = 0;
      let endTime = 0;
      const LAST_MINUTE = 59 * 60 * 1000;
      const ONE_MINUTE = 60000;
      const ONE_OUR = 3600000;

      while (dangerousTime === 0 || investigatingPoint < dateTimePoint1 + LAST_MINUTE) {
        const tempOfset = tzObj.utcOffset(investigatingPoint);
        if (tempOfset !== etalonOfset) {
          dangerousTime = investigatingPoint;
          endTime = dangerousTime;
          if (tempOfset > etalonOfset) {
            endTime = dangerousTime + ONE_OUR;
          } else {
            endTime = dangerousTime - ONE_OUR;
          }

          this.dangerousTimeStampStorage.addToCache(cacheKey, { start: dangerousTime, end: endTime });
          break;
        }
        investigatingPoint = investigatingPoint + ONE_MINUTE;
      }
      const tempValStart = moment.tz(dangerousTime, selectedTzName).format('YYYY-MM-DDTHH:mm:ss');
      const tempValEnd = moment.tz(endTime, selectedTzName).format('YYYY-MM-DDTHH:mm:ss');
      return {
        start: this.getTimeIntz(tempValStart, targetTz, selectedTz),
        end: this.getTimeIntz(tempValEnd, targetTz, selectedTz),
      };
    }
    return { start: 0, end: 0 };
  }
  getTimeDST(start: number, end: number, targetTz: ITimezone, selectedTz: ITimezone): number {
    const startConverted = this.convertAccordingToTz(start, targetTz, selectedTz, true);
    const endConverted = this.convertAccordingToTz(end, targetTz, selectedTz, true);
    if (targetTz) {
      const startTime = moment.tz(startConverted, targetTz.name).valueOf();
      const endTime = moment.tz(endConverted, targetTz.name).valueOf();
      const tzObj = moment.tz.zone(targetTz.name);
      if (tzObj) {
        const left = tzObj.utcOffset(startTime);
        const right = tzObj.utcOffset(endTime);
        if (left < right) {
          //winter time
          return 1;
        }
        if (left > right) {
          //summer time
          return -1;
        }
        return 0;
      }
      return 0;
    }
    return 0;
  }
  getCompensativeTimeDST(start: number, end: number, targetTz: ITimezone, selectedTz: ITimezone): number {
    const ONE_OUR = 60 * 60 * 1000;
    if (selectedTz.timezoneId !== 0) {
      const startConverted = this.convertAccordingToTz(start, targetTz, selectedTz, true);
      const endConverted = this.convertAccordingToTz(end, targetTz, selectedTz, true);
      if (targetTz) {
        const startTime = moment.tz(startConverted, targetTz.name).valueOf();
        const endTime = moment.tz(endConverted, targetTz.name).valueOf();
        const tzObj = moment.tz.zone(targetTz.name);
        if (tzObj) {
          const left = tzObj.utcOffset(startTime);
          const right = tzObj.utcOffset(endTime);
          if (left < right) {
            //winter time
            return ONE_OUR;
          }
          if (left > right) {
            //summer time
            return -ONE_OUR;
          }
          return 0;
        }
        return 0;
      }
      return 0;
    }
    return 0;
  }

  getUTCTime(date: string): number {
    return moment.tz(date, 'UTC').valueOf();
  }
  getUTCTimeISO(date: number): string {
    return moment.tz(date, 'UTC').format('YYYY-MM-DDTHH:mm:ss');
  }
  getNextDayUTC(date: number): number {
    return moment.tz(date, 'UTC').add(1, 'days').valueOf();
  }
  getNextDayUTCISO(date: number): string {
    return moment.tz(date, 'UTC').add(1, 'days').format('YYYY-MM-DD');
  }
  getDayUTCISO(date: number): string {
    return moment.tz(date, 'UTC').format('YYYY-MM-DD');
  }
  ckeckTZExist(): boolean {
    return true;
  }
}

export default new DateUtilsTimeZone();
