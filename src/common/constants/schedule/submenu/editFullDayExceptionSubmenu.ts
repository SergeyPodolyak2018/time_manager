import { IMenuItem, MenuType, SubmenuOption } from './common';
import SchUtils from '../../../../helper/schedule/SchUtils';

export const editFullDayExceptionSubmenu: IMenuItem[] = [
  {
    name: 'Edit Full-Day Exception',
    menuType: MenuType.EDIT_FULL_DAY_EXCEPTION,
    disabled: false,
    separator: true,
    submenuOption: SubmenuOption.EDIT_EXCEPTION,
  },
  {
    name: 'Insert Day Off',
    menuType: MenuType.EDIT_FULL_DAY_EXCEPTION,
    submenuOption: SubmenuOption.EDIT_TIME_OFF,
  },
  {
    name: 'Insert Full-Day Time Off',
    menuType: MenuType.EDIT_FULL_DAY_EXCEPTION,
    submenuOption: SubmenuOption.EDIT_TIME_OFF,
  },
  {
    name: 'Insert Shift',
    menuType: MenuType.EDIT_FULL_DAY_EXCEPTION,
    separator: true,
    submenuOption: SubmenuOption.EDIT_TIME_OFF,
  },
  {
    name: 'Schedule History',
    menuType: MenuType.EDIT_FULL_DAY_EXCEPTION,
    submenuOption: SubmenuOption.SCHEDULE_HISTORY,
  },
  {
    name: 'Cleanup Day',
    menuType: MenuType.EDIT_FULL_DAY_EXCEPTION,
    separator: true,
    submenuOption: SubmenuOption.CLEANUP_DAY,
  },
  {
    name: 'Show Memo',
    menuType: MenuType.EDIT_FULL_DAY_EXCEPTION,
    visible: (data: any) =>
      data.selectedActivities &&
      data.selectedAgents &&
      SchUtils.memoIsExist(data.selectedActivities[0], data.selectedAgents[0]),
    submenuOption: SubmenuOption.SHOW_MEMO,
  },
  {
    name: 'Copy',
    menuType: MenuType.EDIT_FULL_DAY_EXCEPTION,
    separator: true,
    submenuOption: SubmenuOption.COPY_ITEM,
  },
  {
    name: 'Select all of type',
    menuType: MenuType.EDIT_FULL_DAY_EXCEPTION,
    submenuOption: SubmenuOption.SELECT_ALL_OF_TYPE,
  },
];
