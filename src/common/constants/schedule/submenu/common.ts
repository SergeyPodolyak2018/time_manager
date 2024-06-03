import { ISelectedActivity } from '../../../../redux/ts/intrefaces/timeLine';
import { ISchState } from '../../../interfaces/schedule/IAgentSchedule';
import { IAgentTimeline } from '../../../../redux/ts/intrefaces/timeLine/IAgentTimeline';

export interface IMenuItem {
  name: string;
  conditionName?: ((data: any) => string) | string;
  menuType: MenuType;
  separator?: boolean;
  visible?: ((data: any, clickDate?: number | string) => boolean) | boolean;
  disabled?: ((data: any) => boolean) | boolean;
  submenu?: ISubmenuItem[];
  submenuOption: SubmenuOption;
}

export interface ISubmenuItem {
  name: string;
  conditionName?: ((data: any) => string) | string;
  separator?: boolean;
  visible?: ((data: any) => boolean) | boolean;
  disabled?: ((data: any) => boolean) | boolean;
  submenuOption: SubmenuOption;
  getActivity?: (data: IVisibleData, clickDate?: string | number | undefined) => ISchState | undefined;
}

export enum MenuType {
  SHIFT,
  DAY,
  EDIT_BREAK,
  EDIT_MEAL,
  EDIT_EXCEPTION,
  EDIT_TIME_OFF,
  EDIT_FULL_DAY_TIME_OFF,
  EDIT_FULL_DAY_EXCEPTION,
  EDIT_DAY_OFF,
  ACTIVITY,
  EDIT_MARKED_TIME,
  WORK_SET,
}

export enum SubmenuOption {
  INSERT_BREAK,
  INSERT_SHIFT,
  INSERT_MEAL,
  EDIT_BREAK,
  EDIT_EXCEPTION,
  EDIT_TIME_OFF,
  INSERT_EXCEPTION,
  INSERT_TIME_OFF,
  DELETE,
  INSERT_WORK_SET,
  SCHEDULE_HISTORY,
  EDIT_MEAL,
  EDIT_SHIFT,
  INSERT_SUBMENU,
  EDIT_SUBMENU,
  INSERT_DAY_OFF,
  INSERT_TIME_OFF_FULL_DAY,
  INSERT_EXCEPTION_FULL_DAY,
  CLEANUP_DAY,
  SELECT_ALL_OF_TYPE,
  COPY_SHIFT,
  COPY_ITEM,
  PASTE_SHIFT,
  PASTE_ITEM,
  EDIT_ACTIVITY,
  EDIT_MULTIPLE,
  INSERT_MARKED_TIME,
  EDIT_WORK_SET,
  EDIT_WORK_SET_SHIFT,
  INSERT_ACTIVITY_SET,
  SHOW_MEMO,
  SET_ACTIVITIES_FOR,
  SET_ACTIVITIES_FOR_WORK,
  SET_ACTIVITIES_FOR_ACTIVITY_SET,
  SET_ACTIVITIES_FOR_WORK_SET,
  EDIT_MARKED_TIME,
}

export interface IVisibleData {
  selectedActivities: ISelectedActivity[];
  selectedAgents: IAgentTimeline[];
}

export enum WarningsSubmenuOptions {
  EDIT,
  REPLACE,
  DELETE,
}
export const warningsSubmenuBtn = [
  {
    name: 'Edit...',
    menuType: MenuType.SHIFT,
    submenuOption: WarningsSubmenuOptions.EDIT,
  },
  // {
  //   name: 'Replace',
  //   menuType: MenuType.DEFAULT,
  //   submenuOption: WarningsSubmenuOptions.REPLACE,
  // },
  // {
  //   name: 'Delete',
  //   menuType: MenuType.DEFAULT,
  //   submenuOption: WarningsSubmenuOptions.DELETE,
  // },
];
