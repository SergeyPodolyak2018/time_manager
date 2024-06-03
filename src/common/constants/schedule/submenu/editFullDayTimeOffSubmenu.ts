import { IMenuItem, MenuType, SubmenuOption } from './common';
import SchUtils from '../../../../helper/schedule/SchUtils';

export const editFullDayTimeOffSubmenu: IMenuItem[] = [
  {
    name: 'Edit Full-Day Time Off',
    menuType: MenuType.EDIT_FULL_DAY_TIME_OFF,
    disabled: false,
    separator: true,
    submenuOption: SubmenuOption.EDIT_TIME_OFF,
  },
  {
    name: 'Insert Day Off',
    menuType: MenuType.EDIT_FULL_DAY_TIME_OFF,
    submenuOption: SubmenuOption.EDIT_TIME_OFF,
  },
  {
    name: 'Insert Full-Day Exception',
    menuType: MenuType.EDIT_FULL_DAY_TIME_OFF,
    submenuOption: SubmenuOption.INSERT_EXCEPTION_FULL_DAY,
  },
  {
    name: 'Insert Shift',
    menuType: MenuType.EDIT_FULL_DAY_TIME_OFF,
    separator: true,
    submenuOption: SubmenuOption.INSERT_SHIFT,
  },
  {
    name: 'Schedule History',
    menuType: MenuType.EDIT_FULL_DAY_TIME_OFF,
    submenuOption: SubmenuOption.SCHEDULE_HISTORY,
  },
  {
    name: 'Cleanup Day',
    menuType: MenuType.EDIT_FULL_DAY_TIME_OFF,
    separator: true,
    submenuOption: SubmenuOption.CLEANUP_DAY,
  },
  {
    name: 'Show Memo',
    menuType: MenuType.EDIT_FULL_DAY_TIME_OFF,
    visible: (data: any) =>
      data.selectedActivities &&
      data.selectedAgents &&
      SchUtils.memoIsExist(data.selectedActivities[0], data.selectedAgents[0]),
    submenuOption: SubmenuOption.SHOW_MEMO,
  },
  {
    name: 'Copy',
    menuType: MenuType.EDIT_FULL_DAY_TIME_OFF,
    separator: true,
    submenuOption: SubmenuOption.COPY_ITEM,
  },
  {
    name: 'Select all of type',
    menuType: MenuType.EDIT_FULL_DAY_TIME_OFF,
    submenuOption: SubmenuOption.SELECT_ALL_OF_TYPE,
  },
];
