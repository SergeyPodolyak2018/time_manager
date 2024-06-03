import { IMenuItem, MenuType, SubmenuOption } from './common';

export const workSetSubmenu: IMenuItem[] = [
  {
    name: 'Insert',
    menuType: MenuType.WORK_SET,
    submenuOption: SubmenuOption.INSERT_SUBMENU,
    submenu: [
      {
        name: 'Insert Break',
        submenuOption: SubmenuOption.INSERT_BREAK,
      },
      {
        name: 'Insert Meal',
        submenuOption: SubmenuOption.INSERT_MEAL,
      },
      {
        name: 'Insert Exception',
        submenuOption: SubmenuOption.INSERT_EXCEPTION,
      },
      {
        name: 'Insert Time Off',
        submenuOption: SubmenuOption.INSERT_TIME_OFF,
      },
      {
        name: 'Insert Marked Time',
        submenuOption: SubmenuOption.INSERT_MARKED_TIME,
      },
      {
        name: 'Insert Activity Set',
        submenuOption: SubmenuOption.INSERT_ACTIVITY_SET,
      },
      {
        name: 'Insert Work Set',
        submenuOption: SubmenuOption.INSERT_WORK_SET,
      },
    ],
  },
  {
    name: 'Edit',
    menuType: MenuType.WORK_SET,
    submenuOption: SubmenuOption.EDIT_SUBMENU,
    submenu: [
      {
        name: 'Edit Shift',
        submenuOption: SubmenuOption.EDIT_SHIFT,
      },
      {
        name: 'Edit Work Set',
        submenuOption: SubmenuOption.EDIT_WORK_SET,
      },
    ],
  },

  {
    name: 'Delete Work Set',
    menuType: MenuType.WORK_SET,
    separator: true,
    submenuOption: SubmenuOption.DELETE,
  },
  {
    name: 'Insert Day Off',
    menuType: MenuType.WORK_SET,
    submenuOption: SubmenuOption.INSERT_DAY_OFF,
  },
  {
    name: 'Insert Full-Day Time Off',
    menuType: MenuType.WORK_SET,
    submenuOption: SubmenuOption.INSERT_TIME_OFF_FULL_DAY,
  },
  {
    name: 'Insert Full-Day Exception',
    menuType: MenuType.WORK_SET,
    separator: true,
    submenuOption: SubmenuOption.INSERT_EXCEPTION_FULL_DAY,
  },
  {
    name: 'Copy',
    menuType: MenuType.WORK_SET,
    submenuOption: SubmenuOption.COPY_SHIFT,
  },
  {
    name: 'Copy to ...',
    menuType: MenuType.WORK_SET,
    submenuOption: SubmenuOption.COPY_SHIFT,
  },
  {
    name: 'Select all of type',
    menuType: MenuType.WORK_SET,
    submenuOption: SubmenuOption.SELECT_ALL_OF_TYPE,
  },
];
