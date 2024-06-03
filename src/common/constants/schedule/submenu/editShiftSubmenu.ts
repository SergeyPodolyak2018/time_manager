import SchSelectedActivity from '../../../../helper/schedule/SchSelectedActivity';
import { BufferElementsType } from '../../../../redux/ts/intrefaces/timeLine';
import { IMenuItem, IVisibleData, MenuType, SubmenuOption } from './common';

export const editShiftSubmenu: IMenuItem[] = [
  {
    name: 'Insert',
    menuType: MenuType.SHIFT,
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
    menuType: MenuType.SHIFT,
    visible: (data: IVisibleData, clickDate) => {
      const existingMarkedTime = SchSelectedActivity.getMarkedTimeByTimeInShift(data.selectedActivities[0], clickDate);
      return data.selectedActivities && data.selectedActivities.length === 1 && !!existingMarkedTime;
    },
    submenuOption: SubmenuOption.EDIT_SUBMENU,
    submenu: [
      {
        name: 'Edit Shift',
        submenuOption: SubmenuOption.EDIT_SUBMENU,
      },
      {
        name: 'Edit Marked Time',
        submenuOption: SubmenuOption.EDIT_SUBMENU,
        getActivity: (data: IVisibleData, clickDate) => {
          const existingMarkedTime = SchSelectedActivity.getMarkedTimeByTimeInShift(
            data.selectedActivities[0],
            clickDate,
          );
          return existingMarkedTime;
        },
      },
    ],
  },
  {
    name: 'Edit Shift',
    menuType: MenuType.SHIFT,
    visible: (data: IVisibleData, clickDate) => {
      const existingMarkedTime = SchSelectedActivity.getMarkedTimeByTimeInShift(data.selectedActivities[0], clickDate);
      return data.selectedActivities && data.selectedActivities.length === 1 && !existingMarkedTime;
    },
    submenuOption: SubmenuOption.EDIT_SUBMENU,
  },
  {
    name: 'Set Activities For',
    menuType: MenuType.SHIFT,
    separator: true,
    submenuOption: SubmenuOption.SET_ACTIVITIES_FOR,
    submenu: [
      // {
      //   name: 'Activity Set',
      //   visible: (data: IVisibleData) => !SchSelectedActivity.isWork(data.selectedActivities[0]),
      //   submenuOption: SubmenuOption.SET_ACTIVITIES_FOR_ACTIVITY_SET,
      // },
      {
        name: 'Work',
        submenuOption: SubmenuOption.SET_ACTIVITIES_FOR_WORK,
      },
    ],
  },
  {
    name: 'Edit Multiple',
    menuType: MenuType.SHIFT,
    visible: (data: IVisibleData) => data.selectedActivities && data.selectedActivities.length > 1,
    separator: true,
    submenuOption: SubmenuOption.EDIT_MULTIPLE,
  },
  {
    name: 'Insert Day Off',
    menuType: MenuType.SHIFT,
    submenuOption: SubmenuOption.INSERT_DAY_OFF,
  },
  {
    name: 'Insert Full-Day Time Off',
    menuType: MenuType.SHIFT,
    submenuOption: SubmenuOption.INSERT_TIME_OFF_FULL_DAY,
  },
  {
    name: 'Insert Full-Day Exception',
    menuType: MenuType.SHIFT,
    separator: true,
    submenuOption: SubmenuOption.INSERT_EXCEPTION_FULL_DAY,
  },
  {
    name: 'Schedule History',
    menuType: MenuType.SHIFT,
    visible: (data: IVisibleData) => data.selectedActivities.length === 1,
    separator: true,
    submenuOption: SubmenuOption.SCHEDULE_HISTORY,
  },
  {
    name: 'Copy',
    menuType: MenuType.SHIFT,
    submenuOption: SubmenuOption.COPY_SHIFT,
  },
  {
    name: 'Copy to ...',
    menuType: MenuType.SHIFT,
    visible: (data: IVisibleData) => data.selectedActivities && data.selectedActivities.length === 1,
    submenuOption: SubmenuOption.COPY_SHIFT,
  },
  {
    name: 'Multiple Copy to ...',
    menuType: MenuType.SHIFT,
    visible: (data: IVisibleData) => data.selectedActivities && data.selectedActivities.length > 1,
    submenuOption: SubmenuOption.COPY_SHIFT,
  },
  {
    name: 'Paste Item',
    menuType: MenuType.SHIFT,
    separator: true,
    disabled: (data: any) => !data.buffer || data.buffer.elementsType !== BufferElementsType.STATE,
    submenuOption: SubmenuOption.PASTE_ITEM,
  },
  {
    name: 'Cleanup Day',
    menuType: MenuType.SHIFT,
    submenuOption: SubmenuOption.CLEANUP_DAY,
  },
  {
    name: 'Select all of type',
    menuType: MenuType.SHIFT,
    submenuOption: SubmenuOption.SELECT_ALL_OF_TYPE,
  },
];
