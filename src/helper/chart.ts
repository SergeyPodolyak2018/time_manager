import { clone, isEmpty, isNil } from 'ramda';

import { IBusinessUnits } from '../common/interfaces/config';
import { ISnapShot } from '../redux/ts/intrefaces/timeLine';
import Utils from './utils';

interface IGetTypeAndId {
  id: number;
  type: number;
  siteId: number;
  activityId: number;
  buId: number;
}

export const targetType = {
  ACTIVITY: 0,
  MULTI_SITE_ACTIVITY: 1,
  SITE: 2,
  BUSINESS_UNIT: 3,
  ENTERPRISE: 4,
};

export const getTypeAndId = (data: IBusinessUnits): IGetTypeAndId => {
  const keysMain = Object.keys(data);
  for (const i of keysMain) {
    if (data[i].isAllActivitiesChecked) {
      return {
        type: targetType.BUSINESS_UNIT,
        id: Utils.stringChecker(data[i].buId),
        siteId: -1,
        activityId: -1,
        buId: Utils.stringChecker(data[i].buId),
      };
    } else {
      const sites = data[i].sites;
      const keysSites = Object.keys(sites);
      for (const j of keysSites) {
        if (sites[j].isAllActivitiesChecked) {
          return {
            type: targetType.SITE,
            id: Utils.stringChecker(sites[j].siteId),
            siteId: Utils.stringChecker(sites[j].siteId),
            activityId: -1,
            buId: Utils.stringChecker(data[i].buId),
          };
        } else {
          const activities = sites[j].activities;
          const keysActivities = Object.keys(activities);
          const checkedActivities = keysActivities.filter(key => activities[key].isChecked);
          for (const k of keysActivities) {
            if (activities[k].isChecked) {
              if (activities[k].activityId !== 0 && checkedActivities.length === 1) {
                return {
                  type: targetType.ACTIVITY,
                  id: Utils.stringChecker(activities[k].activityId),
                  siteId: Utils.stringChecker(sites[j].siteId),
                  activityId: Utils.stringChecker(activities[k].activityId),
                  buId: Utils.stringChecker(data[i].buId),
                };
              } else {
                return {
                  type: targetType.SITE,
                  id: Utils.stringChecker(sites[j].siteId),
                  siteId: Utils.stringChecker(sites[j].siteId),
                  activityId: -1,
                  buId: Utils.stringChecker(data[i].buId),
                };
              }
            }
          }
        }
      }
    }
  }
  return { type: 0, id: 0, buId: 0, siteId: 0, activityId: 0 };
};

export const getNameByIdAndType = (data: IGetTypeAndId, allData: IBusinessUnits): string => {
  if (data.type === targetType.BUSINESS_UNIT) {
    return allData[data.id].name;
  }
  if (data.type === targetType.SITE) {
    return allData[data.buId].sites[data.siteId].name;
  }
  if (data.type === targetType.ACTIVITY) {
    return allData[data.buId]?.sites[data.siteId]?.activities[data.activityId]?.name || '';
  }
  return '';
};

export const getTargetType = (snapshot: ISnapShot) => {
  if (snapshot.buId && snapshot.buId.length > 0) {
    return targetType.BUSINESS_UNIT;
  }
  if (snapshot.siteId && snapshot.siteId.length > 0) {
    return targetType.SITE;
  }
  return 0;
};

export const getTargetId = (snapshot: ISnapShot) => {
  if (snapshot.buId && snapshot.buId.length > 0) {
    return snapshot.buId[0];
  }
  if (snapshot.siteId && snapshot.siteId.length > 0) {
    return snapshot.siteId[0];
  }
  return 0;
};

export enum EPerfInfoItems {
  ITEM_DIFFERENCE_CALCULATED = -1,
  ITEM_DIFFERENCE_REQUIRED = -2,
  ITEM_DIFFERENCE_STAFFING_CALCULATED_OVERTIME_REQUIRED = -3,
  ITEM_DIFFERENCE_COVERAGE_SCHEDULED_OVERTIME_SCHEDULED = -4,

  ITEM_COVERAGE_SCHEDULED = 21,
  ITEM_STAFFING_CALCULATED = 12,
  ITEM_STAFFING_REQUIRED = 16,
  ITEM_OVERTIME_REQUIRED = 91,
  ITEM_OVERTIME_SCHEDULED = 90,
}

export const ColumsForChart = [
  {
    idName: 'ITEM_COVERAGE_SCHEDULED',
    name: 'Coverage',
    color: '#BC2739',
    type: 'line',
    idType: 21,
  },
  {
    idName: 'ITEM_STAFFING_CALCULATED',
    name: 'Calculated',
    color: '#053AC4',
    type: 'area',
    idType: -1,
  },
  {
    idName: 'ITEM_STAFFING_REQUIRED',
    name: 'Required',
    color: '#bcb715',
    type: 'line',
    idType: 91,
  },
  {
    idName: 'ITEM_DIFFERENCE_STAFFING_CALCULATED_OVERTIME_REQUIRED',
    name: 'Overtime',
    color: '#06bcad',
    type: 'area',
    idType: -1,
  },
  {
    idName: 'ITEM_DIFFERENCE_COVERAGE_SCHEDULED_OVERTIME_SCHEDULED',
    name: 'Non Overtime Coverage',
    color: '#bc00bc',
    type: 'line',
    idType: -1,
  },
];

export const EPerfInfoItemsNames = {
  21: 'ITEM_COVERAGE_SCHEDULED',
  12: 'ITEM_STAFFING_CALCULATED',
  91: 'ITEM_OVERTIME_REQUIRED',
  90: 'ITEM_OVERTIME_SCHEDULED',
  16: 'ITEM_STAFFING_REQUIRED',
  '-1': 'ITEM_DIFFERENCE_CALCULATED',
  '-2': 'ITEM_DIFFERENCE_REQUIRED',
  '-3': 'ITEM_DIFFERENCE_STAFFING_CALCULATED_OVERTIME_REQUIRED',
  '-4': 'ITEM_DIFFERENCE_COVERAGE_SCHEDULED_OVERTIME_SCHEDULED',
};

export class PerformanceItem {
  private _id: number;
  private _name: string;

  private _values: number[] = [];
  private _wrappedValues: number[] = [];

  public constructor(id: number, name: string, values: number[]) {
    this._id = id;
    this._name = name;
    this._values = values;
  }

  get id(): number {
    return this._id;
  }

  set id(value: number) {
    this._id = value;
  }

  get name(): string {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
  }

  get values(): number[] {
    return this._values;
  }

  set values(value: number[]) {
    this._values = value;
  }

  get wrappedValues(): number[] {
    return this._wrappedValues;
  }

  set wrappedValues(value: number[]) {
    this._wrappedValues = value;
  }

  public subtractData(sub: number[] = []) {
    const subLen = sub.length;

    if (this.values.length === 0) {
      this.wrappedValues = [];
      for (let i = 0; i < subLen; i++) {
        this.values[i] = 0.0;
      }
    } else if (this.values.length !== subLen) {
      throw new Error('sub.length != values.length');
    } else {
      this.wrappedValues = [];

      for (let i = 0; i < subLen; i++) {
        if (sub[i] < 0.0 || this.values[i] < 0.0) {
          this.values[i] = 0.0;
        } else {
          this.values[i] = this.values[i] - sub[i];
        }
      }
    }
  }
}

export const convertData = (perfItems: any[], hours: number, granularityInMinutes: number) => {
  const items = new Map();

  const timeSteps = (hours * 60) / granularityInMinutes + 1;
  const itemsCount = perfItems === null ? 0 : perfItems.length;

  for (let i = 0; i < itemsCount; i++) {
    const data: number[] = [];

    const rawItem = perfItems[i];
    const itemId = rawItem.item;
    const rawData = Array.isArray(rawItem.data) ? rawItem.data : [rawItem.data];
    const count = Math.min(rawData.length, timeSteps);

    for (let j = 0; j < count; j++) {
      const result = Math.floor(rawData[j].value * 100) / 100;
      if (result < 0) {
        data[j] = 0.0;
      } else {
        data[j] = result;
      }
    }

    for (let j = count; j < timeSteps; j++) {
      data[j] = 0.0;
    }

    items.set(
      itemId,
      new PerformanceItem(
        itemId,
        itemId === EPerfInfoItems.ITEM_COVERAGE_SCHEDULED ? 'ScheduleComponents' : 'Calculate',
        data,
      ),
    );
  }

  return items;
};

export const calculateDifference = (
  resultItemId: number,
  minuendItemId: number,
  subtrahendItemId: number,
  mapOfPerfItems: Map<number, PerformanceItem>,
) => {
  let resultItem: PerformanceItem;

  const minuendItem: PerformanceItem | undefined = mapOfPerfItems.get(minuendItemId);
  const subtrahendItem: PerformanceItem | undefined = mapOfPerfItems.get(subtrahendItemId);

  if (isNil(minuendItem) || isEmpty(minuendItem) || isNil(subtrahendItem) || isEmpty(subtrahendItem)) {
    resultItem = new PerformanceItem(resultItemId, 'Diff', []);
  } else {
    resultItem = new PerformanceItem(resultItemId, 'Diff', clone(minuendItem?.values));
    resultItem.subtractData(subtrahendItem?.values);
  }

  mapOfPerfItems.set(resultItemId, resultItem);
};
