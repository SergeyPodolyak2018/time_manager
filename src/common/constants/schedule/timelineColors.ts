import { SchStateType } from './index';

export enum CatalogKey {
  SHIFT = 'shift',
  WORK_SET = 'workSet',
  ACTIVITY = 'activity',
  ACTIVITY_SET = 'activity_set',
  BREAK = 'break',
  MEAL = 'meal',
  DAY_OFF = 'day_off',
  TIME_OFF = 'time_off',
  EXCEPTION = 'exception',
  MARKED_TIME = 'marked_time',
  SHIFT_WITH_MARKED_TIME = 'shift_with_marked_time',
}
export enum CatalogKeyReverted {
  shift = 'SHIFT', 
  workSet = 'WORK_SET',
  activity = 'ACTIVITY',
  activity_set = 'ACTIVITY_SET',
  break = 'BREAK',
  meal = 'MEAL',
  day_off = 'DAY_OFF',
  time_off = 'TIME_OFF',
  exception = 'EXCEPTION',
  marked_time = 'MARKED_TIME',
  shift_with_marked_time = 'SHIFT_WITH_MARKED_TIME',
}

export interface ICatalog {
  [key: string]: {
    zindex: number;
    color: string;
    height: string;
    top: string;
    boxShadow: string;
    border: string;
  };
}
export interface ICatalog3 {
  name: string;
  testName: string;
  id: string;
  color: string;
  type: number;
  checked: boolean;
  disableIfMultisite?: boolean;
  editDisable: boolean;
  canDelete: boolean;
}
export const catalog: ICatalog = {
  [CatalogKey.SHIFT]: {
    zindex: 50,
    color: 'rgba(0,0,0,0)',
    height: '100%',
    top: '50%',
    boxShadow: 'none',
    border: '1px solid #000',
  },
  [CatalogKey.ACTIVITY]: {
    zindex: 50,
    color: 'linear-gradient(360deg, #0434B0 -18.95%, #058EFF 116.2%)',
    height: '100%',
    top: '50%',
    boxShadow: 'none',
    border: 'none',
  },
  [CatalogKey.WORK_SET]: {
    zindex: 51,
    color: 'linear-gradient(360deg, rgb(19 39 91) -18.95%, rgb(0 114 207) 116.2%)',
    height: '100%',
    top: '50%',
    boxShadow: 'none',
    border: 'none',
  },
  [CatalogKey.ACTIVITY_SET]: {
    zindex: 100,
    color: 'linear-gradient(180deg, #FFED47 20.27%, #F4BC0B 116%)',
    height: '100%',
    top: '50%',
    boxShadow: 'none',
    border: 'none',
  },
  [CatalogKey.BREAK]: {
    zindex: 250,
    color: 'linear-gradient(180deg, #EBEBEB 26.64%, #B8B8B8 102.21%)',
    boxShadow: 'rgb(108, 108, 108, 0.3) -3px 0px 4px 0px inset',
    top: '50%',
    height: '100%',
    border: 'none',
  },
  [CatalogKey.MEAL]: {
    zindex: 250,
    color: 'linear-gradient(180deg, #70EEFF 44.99%, #00DEFC 76.6%)',
    boxShadow: 'rgba(30, 154, 172, 0.3) -3px 0px 4px 0px inset',
    top: '50%',
    height: '100%',
    border: 'none',
  },
  [CatalogKey.DAY_OFF]: {
    zindex: 250,
    color: 'linear-gradient(180deg, #93F2AE 0%, #5AD044 100%)',
    top: '50%',
    height: '100%',
    boxShadow: 'none',
    border: 'none',
  },
  [CatalogKey.TIME_OFF]: {
    zindex: 251,
    color: 'linear-gradient(180deg, #1FE592 -20%, #1D5180 180%)',
    boxShadow: 'rgb(43, 115, 90, 0.3) -3px 0px 4px 0px inset',
    top: '50%',
    height: '100%',
    border: 'none',
  },
  [CatalogKey.EXCEPTION]: {
    zindex: 200,
    color: 'linear-gradient(180deg, #FF9895 15.29%, #DA3732 148%)',
    boxShadow: 'rgba(166, 33, 33, 0.3) -3px 0px 4px 0px inset',
    top: '50%',
    height: '100%',
    border: 'none',
  },
  [CatalogKey.MARKED_TIME]: {
    zindex: 400,
    color: 'linear-gradient(180deg, #FFC700 0%, #FF4D00 237.5%)',
    boxShadow: 'none',
    height: '4px',
    top: '2px',
    border: 'none',
  },
};

export const reviewWarningCatalog: ICatalog = {
  [CatalogKey.SHIFT]: {
    zindex: 50,
    color: 'rgba(0,0,0,0)',
    height: '100%',
    top: '50%',
    boxShadow: 'none',
    border: '1px solid #000',
  },
  [CatalogKey.SHIFT_WITH_MARKED_TIME]: {
    zindex: 50,
    color: 'rgba(0,0,0,0)',
    height: '60%',
    top: '55%',
    boxShadow: 'none',
    border: '1px solid #000',
  },
  [CatalogKey.ACTIVITY]: {
    zindex: 50,
    color: 'linear-gradient(360deg, #0434B0 -18.95%, #058EFF 116.2%)',
    height: '100%',
    top: '50%',
    boxShadow: 'none',
    border: 'none',
  },
  [CatalogKey.WORK_SET]: {
    zindex: 51,
    color: 'linear-gradient(360deg, rgb(19 39 91) -18.95%, rgb(0 114 207) 116.2%)',
    height: '100%',
    top: '50%',
    boxShadow: 'none',
    border: 'none',
  },
  [CatalogKey.ACTIVITY_SET]: {
    zindex: 100,
    color: 'linear-gradient(180deg, #FFED47 20.27%, #F4BC0B 116%)',
    height: '100%',
    top: '50%',
    boxShadow: 'none',
    border: 'none',
  },
  [CatalogKey.BREAK]: {
    zindex: 250,
    color: 'linear-gradient(180deg, #EBEBEB 26.64%, #B8B8B8 102.21%)',
    boxShadow: 'rgb(108, 108, 108, 0.3) -3px 0px 4px 0px inset',
    top: '50%',
    height: '100%',
    border: 'none',
  },
  [CatalogKey.MEAL]: {
    zindex: 250,
    color: 'linear-gradient(180deg, #70EEFF 44.99%, #00DEFC 76.6%)',
    boxShadow: 'rgba(30, 154, 172, 0.3) -3px 0px 4px 0px inset',
    top: '50%',
    height: '100%',
    border: 'none',
  },
  [CatalogKey.DAY_OFF]: {
    zindex: 250,
    color: 'linear-gradient(180deg, #93F2AE 0%, #5AD044 100%)',
    top: '50%',
    height: '100%',
    boxShadow: 'none',
    border: 'none',
  },
  [CatalogKey.TIME_OFF]: {
    zindex: 251,
    color: 'linear-gradient(180deg, #1FE592 -20%, #1D5180 180%)',
    boxShadow: 'rgb(43, 115, 90, 0.3) -3px 0px 4px 0px inset',
    top: '50%',
    height: '100%',
    border: 'none',
  },
  [CatalogKey.EXCEPTION]: {
    zindex: 200,
    color: 'linear-gradient(180deg, #FF9895 15.29%, #DA3732 148%)',
    boxShadow: 'rgba(166, 33, 33, 0.3) -3px 0px 4px 0px inset',
    top: '50%',
    height: '100%',
    border: 'none',
  },
  [CatalogKey.MARKED_TIME]: {
    zindex: 400,
    color: 'linear-gradient(180deg, #FFC700 0%, #FF4D00 237.5%)',
    boxShadow: 'none',
    height: '4px',
    top: '-2px',
    border: 'none',
  },
};

export const catalog3: ICatalog3[] = [
  {
    name: 'Break',
    testName: 'break',
    id: 'newBreak',
    color: '#D0D0D0',
    type: SchStateType.BREAK,
    checked: false,
    disableIfMultisite: true,
    editDisable: false,
    canDelete: true,
  },
  {
    name: 'Meal',
    testName: 'meal',
    id: 'newMeal',
    color: '#72D7F5',
    type: SchStateType.MEAL,
    checked: false,
    disableIfMultisite: true,
    editDisable: false,
    canDelete: true,
  },
  {
    name: 'Exception',
    testName: 'exception',
    id: 'newException',
    color: '#DA3732',
    type: SchStateType.EXCEPTION,
    checked: false,
    editDisable: false,
    canDelete: true,
  },
  {
    name: 'Time Off',
    testName: 'time-off',
    id: 'newTimeOff',
    color: '#1FE592',
    type: SchStateType.TIME_OFF,
    checked: false,
    editDisable: false,
    canDelete: true,
  },
  {
    name: 'Shift',
    testName: 'shift',
    id: 'newShift',
    color: '#0839B4',
    type: SchStateType.SHIFT,
    checked: false,
    disableIfMultisite: true,
    editDisable: true,
    canDelete: false,
  },
  {
    name: 'Work Set',
    testName: 'work-set',
    id: 'newWorkSet',
    color: '#FEF051',
    type: SchStateType.ACTIVITY_SET,
    checked: false,
    disableIfMultisite: true,
    editDisable: true,
    canDelete: false,
  },
  {
    name: 'Day Off',
    testName: 'day-off',
    id: 'newDayOff',
    color: '#A0E094',
    type: SchStateType.DAY_OFF,
    checked: false,
    editDisable: true,
    canDelete: false,
  },
  {
    name: 'Marked Time',
    testName: 'marked-time',
    id: 'newMarkedTime',
    color: '#EF8650',
    type: SchStateType.MARKED_TIME,
    checked: false,
    editDisable: true,
    disableIfMultisite: true,
    canDelete: true,
  },
];
