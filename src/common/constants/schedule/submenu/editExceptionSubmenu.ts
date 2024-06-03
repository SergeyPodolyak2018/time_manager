import { IMenuItem, IVisibleData, MenuType, SubmenuOption } from './common';
import SchSelectedActivity from '../../../../helper/schedule/SchSelectedActivity';

export const editExceptionSubmenu: IMenuItem[] = [
  {
    name: 'Insert',
    menuType: MenuType.EDIT_EXCEPTION,
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
        name: 'Insert Work Set',
        submenuOption: SubmenuOption.INSERT_WORK_SET,
      },
    ],
  },
  {
    name: 'Edit',
    menuType: MenuType.EDIT_EXCEPTION,
    visible: true,
    submenuOption: SubmenuOption.EDIT_SUBMENU,
    submenu: [
      {
        name: 'Edit Shift',
        submenuOption: SubmenuOption.EDIT_SHIFT,
      },
      {
        name: 'Edit Exception',
        submenuOption: SubmenuOption.EDIT_EXCEPTION,
      },
    ],
  },
  {
    name: 'Set Activities For',
    menuType: MenuType.EDIT_EXCEPTION,
    separator: true,
    submenuOption: SubmenuOption.SET_ACTIVITIES_FOR,
    visible: (data: IVisibleData) => data.selectedActivities.length === 1,
    submenu: [
      {
        name: 'Activity Set',
        visible: (data: IVisibleData) => SchSelectedActivity.isActivitySet(data.selectedActivities[0]),
        submenuOption: SubmenuOption.SET_ACTIVITIES_FOR_ACTIVITY_SET,
      },
      {
        name: 'Work Set',
        visible: (data: IVisibleData) => SchSelectedActivity.isWorkSet(data.selectedActivities[0]),
        submenuOption: SubmenuOption.SET_ACTIVITIES_FOR_WORK_SET,
      },
      {
        name: 'Work',
        submenuOption: SubmenuOption.SET_ACTIVITIES_FOR_WORK,
      },
    ],
  },
  {
    name: 'Edit Multiple',
    menuType: MenuType.EDIT_EXCEPTION,
    visible: (data: IVisibleData) => data.selectedActivities && data.selectedActivities.length > 1,
    separator: true,
    submenuOption: SubmenuOption.EDIT_MULTIPLE,
  },
  {
    name: 'Delete',
    menuType: MenuType.EDIT_EXCEPTION,
    submenuOption: SubmenuOption.EDIT_EXCEPTION,
    separator: true,
  },
  {
    name: 'Insert Day Off',
    menuType: MenuType.EDIT_EXCEPTION,
    submenuOption: SubmenuOption.INSERT_DAY_OFF,
    visible: (data: IVisibleData) => data.selectedActivities.length === 1,
  },
  {
    name: 'Insert Full-Day Time Off',
    menuType: MenuType.EDIT_EXCEPTION,
    submenuOption: SubmenuOption.INSERT_TIME_OFF_FULL_DAY,
    visible: (data: IVisibleData) => data.selectedActivities.length === 1,
  },
  {
    name: 'Insert Full-Day Exception',
    menuType: MenuType.EDIT_EXCEPTION,
    separator: true,
    submenuOption: SubmenuOption.INSERT_EXCEPTION_FULL_DAY,
    visible: (data: IVisibleData) => data.selectedActivities.length === 1,
  },

  {
    name: 'Schedule History',
    menuType: MenuType.EDIT_EXCEPTION,
    separator: true,
    submenuOption: SubmenuOption.SCHEDULE_HISTORY,
  },
  {
    name: 'Copy',
    menuType: MenuType.EDIT_EXCEPTION,
    separator: true,
    submenuOption: SubmenuOption.COPY_ITEM,
  },
  {
    name: 'Show Memo',
    menuType: MenuType.EDIT_EXCEPTION,
    visible: (data: IVisibleData) => data.selectedActivities[0]?.memo !== '',
    separator: true,
    submenuOption: SubmenuOption.SHOW_MEMO,
  },
  {
    name: 'Select all of type',
    menuType: MenuType.EDIT_EXCEPTION,
    submenuOption: SubmenuOption.SELECT_ALL_OF_TYPE,
  },
];
