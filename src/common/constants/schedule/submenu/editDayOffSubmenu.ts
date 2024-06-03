import { IMenuItem, MenuType, SubmenuOption } from './common';

export const editDayOffSubmenu: IMenuItem[] = [
  {
    name: 'Insert Full-Day Time Off',
    menuType: MenuType.EDIT_DAY_OFF,
    submenuOption: SubmenuOption.INSERT_TIME_OFF_FULL_DAY,
  },
  {
    name: 'Insert Full-Day Exception',
    menuType: MenuType.EDIT_DAY_OFF,
    submenuOption: SubmenuOption.INSERT_EXCEPTION_FULL_DAY,
  },
  {
    name: 'Insert Shift',
    menuType: MenuType.EDIT_DAY_OFF,
    submenuOption: SubmenuOption.INSERT_SHIFT,
  },
  {
    name: 'Insert Work Set',
    menuType: MenuType.EDIT_DAY_OFF,
    separator: true,
    submenuOption: SubmenuOption.INSERT_WORK_SET,
  },
  {
    name: 'Schedule History',
    menuType: MenuType.EDIT_DAY_OFF,
    submenuOption: SubmenuOption.SCHEDULE_HISTORY,
  },
  {
    name: 'Cleanup Day',
    menuType: MenuType.EDIT_DAY_OFF,
    separator: true,
    submenuOption: SubmenuOption.CLEANUP_DAY,
  },
  {
    name: 'Select all of type',
    menuType: MenuType.EDIT_DAY_OFF,
    submenuOption: SubmenuOption.SELECT_ALL_OF_TYPE,
  },
];
