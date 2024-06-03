import { IMenuItem, IVisibleData, MenuType, SubmenuOption } from './common';
import { BufferElementsType } from '../../../../redux/ts/intrefaces/timeLine';
import SchSelectedActivity from '../../../../helper/schedule/SchSelectedActivity';

export const editActivitySubmenu: IMenuItem[] = [
  {
    name: 'Insert',
    menuType: MenuType.ACTIVITY,
    submenuOption: SubmenuOption.INSERT_SUBMENU,
    visible: (data: IVisibleData) => data.selectedActivities.length === 1,
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
    menuType: MenuType.ACTIVITY,
    visible: (data: IVisibleData) => data.selectedActivities.length === 1,
    submenuOption: SubmenuOption.EDIT_SUBMENU,
    submenu: [
      {
        name: 'Edit Shift',
        submenuOption: SubmenuOption.EDIT_SHIFT,
      },
      {
        name: 'Edit Activity',
        submenuOption: SubmenuOption.EDIT_ACTIVITY,
      },
    ],
  },
  {
    name: 'Edit Multiple',
    menuType: MenuType.ACTIVITY,
    submenuOption: SubmenuOption.EDIT_SUBMENU,
    visible: (data: IVisibleData) => data.selectedActivities.length > 1,
  },
  {
    name: 'Set Activities For',
    menuType: MenuType.ACTIVITY,
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
    name: 'Delete',
    menuType: MenuType.ACTIVITY,
    separator: true,
    submenuOption: SubmenuOption.DELETE,
  },
  {
    name: 'Insert Day Off',
    menuType: MenuType.ACTIVITY,
    submenuOption: SubmenuOption.INSERT_DAY_OFF,
    visible: (data: IVisibleData) => data.selectedActivities.length === 1,
  },
  {
    name: 'Insert Full-Day Time Off',
    menuType: MenuType.ACTIVITY,
    submenuOption: SubmenuOption.INSERT_TIME_OFF_FULL_DAY,
    visible: (data: IVisibleData) => data.selectedActivities.length === 1,
  },
  {
    name: 'Insert Full-Day Exception',
    menuType: MenuType.ACTIVITY,
    separator: true,
    submenuOption: SubmenuOption.INSERT_EXCEPTION_FULL_DAY,
    visible: (data: IVisibleData) => data.selectedActivities.length === 1,
  },
  {
    name: 'Schedule History',
    menuType: MenuType.ACTIVITY,
    separator: true,
    submenuOption: SubmenuOption.SCHEDULE_HISTORY,
    visible: (data: IVisibleData) => data.selectedActivities.length === 1,
  },
  {
    name: 'Copy',
    menuType: MenuType.ACTIVITY,
    submenuOption: SubmenuOption.COPY_SHIFT,
  },
  {
    name: 'Copy to ...',
    menuType: MenuType.ACTIVITY,
    submenuOption: SubmenuOption.COPY_SHIFT,
  },
  {
    name: 'Paste Item',
    menuType: MenuType.ACTIVITY,
    separator: true,
    disabled: (data: any) => !data.buffer || data.buffer.elementsType !== BufferElementsType.STATE,
    submenuOption: SubmenuOption.PASTE_ITEM,
  },
  {
    name: 'Cleanup Day',
    menuType: MenuType.ACTIVITY,
    submenuOption: SubmenuOption.CLEANUP_DAY,
  },
  {
    name: 'Select all of type',
    menuType: MenuType.ACTIVITY,
    submenuOption: SubmenuOption.SELECT_ALL_OF_TYPE,
  },
];
