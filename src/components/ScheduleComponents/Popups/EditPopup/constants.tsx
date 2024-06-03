import { SCH_STATE_TYPE } from '../../../../common/constants';
import { SchStateType } from '../../../../common/constants/schedule';

export const ItemTypesColumns = {
  NAME: {
    name: 'Name',
    key: 'name',
    className: 'firstTd',
    type: 'common',
  },
  SHORT: {
    name: 'Short',
    key: 'shortName',
    className: 'secTd',
    type: 'common',
  },
  HOURS: {
    name: 'Hours',
    key: 'duration',
    className: 'secTd',
    type: 'common',
  },
  PAID: {
    name: 'Paid',
    key: 'isPaid',
    className: 'fthTd',
    type: 'checkbox',
  },
  SITE: {
    name: 'Site',
    key: 'site',
    className: 'thrTd',
    type: 'common',
  },
  COUNTS: {
    name: 'Paid',
    key: 'isHasLimit',
    className: 'sthTd',
    type: 'checkbox',
  },
  CONVERTIBLE: {
    name: 'Convertible',
    // key: 'isConvertable2dayOff',
    key: 'isFullDay',
    className: 'vthTd',
    type: 'checkbox',
  },
  TIME_OFF: {
    name: 'Time off',
    key: 'isUsedAsVacation',
    className: 'sthTd',
    type: 'checkbox',
  },
  SHIFT_TITLE: {
    name: 'Hours',
    key: 'shiftTitle',
    className: 'sthTd',
    type: 'common',
  },
};

export const ShiftItemsToColumns = {
  [SCH_STATE_TYPE[SchStateType.NONE]]: [],
  [SCH_STATE_TYPE[SchStateType.TIME_OFF]]: [
    ItemTypesColumns.NAME,
    ItemTypesColumns.SHORT,
    ItemTypesColumns.SITE,
    ItemTypesColumns.PAID,
    ItemTypesColumns.COUNTS,
  ],
  [SCH_STATE_TYPE[SchStateType.DAY_OFF]]: [
    ItemTypesColumns.NAME,
    ItemTypesColumns.HOURS,
    ItemTypesColumns.PAID,
    ItemTypesColumns.PAID,
  ],
  [SCH_STATE_TYPE[SchStateType.EXCEPTION]]: [
    ItemTypesColumns.NAME,
    ItemTypesColumns.SHORT,
    ItemTypesColumns.SITE,
    ItemTypesColumns.PAID,
    ItemTypesColumns.CONVERTIBLE,
    ItemTypesColumns.TIME_OFF,
  ],
  [SCH_STATE_TYPE[SchStateType.BREAK]]: [
    ItemTypesColumns.NAME,
    ItemTypesColumns.SHORT,
    ItemTypesColumns.HOURS,
    ItemTypesColumns.PAID,
  ],
  [SCH_STATE_TYPE[SchStateType.MEAL]]: [
    ItemTypesColumns.NAME,
    ItemTypesColumns.SHORT,
    ItemTypesColumns.HOURS,
    ItemTypesColumns.PAID,
  ],
  [SCH_STATE_TYPE[SchStateType.ACTIVITY]]: [],
  [SCH_STATE_TYPE[SchStateType.ACTIVITY_SET]]: [ItemTypesColumns.NAME, ItemTypesColumns.HOURS, ItemTypesColumns.PAID],
  [SCH_STATE_TYPE[SchStateType.SHIFT]]: [ItemTypesColumns.NAME, ItemTypesColumns.SHIFT_TITLE],
  [SCH_STATE_TYPE[SchStateType.MARKED_TIME]]: [],
};
