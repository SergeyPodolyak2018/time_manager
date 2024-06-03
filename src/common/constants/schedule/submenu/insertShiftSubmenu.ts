import { IMenuItem, IVisibleData, MenuType, SubmenuOption } from './common';
import { BufferElementsType } from '../../../../redux/ts/intrefaces/timeLine';
import DateUtils from '../../../../helper/dateUtils';
import { DayType } from '../index';

export const insertShiftSubmenu: IMenuItem[] = [
  {
    name: 'Insert Day Off',
    menuType: MenuType.DAY,
    submenuOption: SubmenuOption.INSERT_DAY_OFF,
  },
  {
    name: 'Insert Full-Day Time Off',
    menuType: MenuType.DAY,
    submenuOption: SubmenuOption.INSERT_TIME_OFF_FULL_DAY,
  },
  {
    name: 'Insert Full-Day Exception',
    menuType: MenuType.DAY,
    submenuOption: SubmenuOption.INSERT_EXCEPTION_FULL_DAY,
  },
  {
    name: 'Insert Shift',
    menuType: MenuType.DAY,
    submenuOption: SubmenuOption.INSERT_SHIFT,
  },
  {
    name: 'Insert Marked Time',
    menuType: MenuType.DAY,
    visible: (data: IVisibleData, clickDate) => {
      const agent = data.selectedAgents[0];
      if (!agent || !agent?._TZ_INTERNAL_USAGE) return false;
      const { tzSite, tzSelected } = agent._TZ_INTERNAL_USAGE;
      if (!tzSite || !tzSelected) return false;
      let isShiftExist = false;
      if (clickDate) {
        const dateInTzAgent = DateUtils.convertAccordingToTz(clickDate, tzSite, tzSelected);
        isShiftExist = !!agent.days.find(
          day =>
            day.type === DayType.SHIFT &&
            day.dayState?.startDateTime &&
            DateUtils.isSameDayOfWeek(
              DateUtils.convertAccordingToTz(day.dayState.startDateTime, tzSite, tzSelected),
              dateInTzAgent,
            ),
        );
      }

      return isShiftExist;
    },
    submenuOption: SubmenuOption.INSERT_MARKED_TIME,
  },
  {
    name: 'Insert Work Set',
    menuType: MenuType.DAY,
    separator: true,
    submenuOption: SubmenuOption.INSERT_WORK_SET,
    visible: (data: IVisibleData, clickDate) => {
      const agent = data.selectedAgents[0];
      if (!agent || !agent?._TZ_INTERNAL_USAGE) return false;
      const { tzSite, tzSelected } = agent._TZ_INTERNAL_USAGE;
      if (!tzSite || !tzSelected) return false;

      let isShiftExist = false;
      if (clickDate) {
        const dateInTzAgent = DateUtils.convertAccordingToTz(clickDate, tzSite, tzSelected);
        isShiftExist = !!agent.days.find(
          day =>
            day.type === DayType.SHIFT &&
            day.dayState?.startDateTime &&
            DateUtils.isSameDayOfWeek(
              DateUtils.convertAccordingToTz(day.dayState.startDateTime, tzSite, tzSelected),
              dateInTzAgent,
            ),
        );
      }

      return isShiftExist;
    },
  },
  {
    name: 'Schedule History',
    menuType: MenuType.DAY,
    separator: true,
    submenuOption: SubmenuOption.SCHEDULE_HISTORY,
  },
  {
    name: '',
    conditionName: (data: any) => {
      return data.buffer &&
        data.buffer.elementsType === BufferElementsType.SHIFT_OR_WORK_SET &&
        (data.buffer.stateType === 2 || data.buffer.stateType === 3)
        ? 'Paste'
        : 'Paste Shift';
    },
    menuType: MenuType.DAY,
    separator: true,
    disabled: (data: any) => !data.buffer || data.buffer.elementsType !== BufferElementsType.SHIFT_OR_WORK_SET,
    submenuOption: SubmenuOption.PASTE_SHIFT,
  },
  {
    name: 'Cleanup Day',
    menuType: MenuType.DAY,
    submenuOption: SubmenuOption.CLEANUP_DAY,
  },
];
