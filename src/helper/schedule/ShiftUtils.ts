import { IBuffer, ISelectedActivity } from '../../redux/ts/intrefaces/timeLine';
import { MenuType } from '../../common/constants/schedule/submenu/common';
import { SCH_STATE_TYPE } from '../../common/constants';
import SchSelectedActivity from './SchSelectedActivity';
import { ISchState } from '../../common/interfaces/schedule/IAgentSchedule';
import SchUtils from './SchUtils';
import { IAgentTimeline, ITimelineAgentActivity } from '../../redux/ts/intrefaces/timeLine/IAgentTimeline';
import DateUtils from '../dateUtils';
import { propOr } from 'ramda';
import { createElement } from 'react';

class ShiftUtils {
  constructor() {}
  getType(dataForClick: ISelectedActivity): MenuType {
    let menuType: MenuType = MenuType.DAY;
    switch (dataForClick.type) {
      case SCH_STATE_TYPE[0]:
        //todo: check items
        break;
      case SCH_STATE_TYPE[1]:
        menuType = MenuType.EDIT_DAY_OFF;
        break;
      case SCH_STATE_TYPE[2]:
        menuType = SchUtils.isFullDayTimeOff([dataForClick]) ? MenuType.EDIT_FULL_DAY_TIME_OFF : MenuType.EDIT_TIME_OFF;
        break;
      case SCH_STATE_TYPE[3]:
        menuType = dataForClick.stateIndex === undefined ? MenuType.EDIT_FULL_DAY_EXCEPTION : MenuType.EDIT_EXCEPTION;
        break;
      case SCH_STATE_TYPE[4]:
        menuType = MenuType.EDIT_BREAK;
        break;
      case SCH_STATE_TYPE[5]:
        menuType = MenuType.EDIT_MEAL;
        break;
      case SCH_STATE_TYPE[6]:
        menuType = SchSelectedActivity.isWork(dataForClick) ? MenuType.SHIFT : MenuType.WORK_SET;
        break;
      case SCH_STATE_TYPE[7]:
        menuType = MenuType.ACTIVITY;
        break;
      case SCH_STATE_TYPE[8]:
        menuType = MenuType.SHIFT;
        break;
      case SCH_STATE_TYPE[9]:
        menuType = MenuType.EDIT_MARKED_TIME;
        break;
      case SCH_STATE_TYPE[10]:
        //todo: check items
        break;
      default:
        menuType = MenuType.DAY;
        break;
    }

    return menuType;
  }

  getStyle(
    left: number,
    width: number,
    zIndex: number,
    color: string,
    height: string,
    top: string,
    boxShadow: string,
    border: string,
  ): any {
    return {
      left: `${left}%`,
      width: border !== 'none' ? `calc(${width}% - 2px)` : `${width}%`,
      zIndex: zIndex,
      boxShadow,
      height,
      top,
      background: color,
      border,
    };
  }

  getEmptyBGStyle(
    left: number,
    width: number,
    zIndex: number,
    color: string,
    height: string,
    top: string,
    boxShadow: string,
    border: string,
  ): any {
    return {
      left: `${left}%`,
      width: `${width}%`,
      zIndex: zIndex,
      boxShadow,
      height,
      top,
      background: color,
      border,
    };
  }

  getDecoratorStyle(element: any, buffer: IBuffer): any {
    if (!buffer.elements) return { display: 'none' };
    const targetIndex = buffer.elements.findIndex(
      e =>
        (e.activity.uniqueId === element.uniqueId && e.activity.id === element.id) ||
        (e.activity?.states ?? []).some((s: ISchState) => s.id === element.id),
    );

    if (targetIndex === -1) return { display: 'none' };

    return buffer.elements[targetIndex].activity.dayDate === element.dayDate &&
      (buffer.elements[targetIndex].activity.uniqueId === element.uniqueId ||
        (buffer.elements[targetIndex]?.activity?.states ?? []).some((s: ISchState) => s.id === element.id))
      ? { display: 'inherit', zIndex: '100000', position: 'absolute' }
      : { display: 'none' };
  }

  isStateFromPreviousDay(element: ITimelineAgentActivity, agent: IAgentTimeline, currentDateSelector: string) {
    const { tzSite, tzSelected } = agent._TZ_INTERNAL_USAGE;
    const state = this._getActivityState(element, agent);
    if (!state) return false;
    const activityStartTime = DateUtils.convertAccordingToTz(state.startDateTime, tzSite, tzSelected);
    const dayStartTime = DateUtils.convertAccordingToTz(
      +new Date(new Date(currentDateSelector).toUTCString()),
      tzSite,
      tzSelected,
    );
    return activityStartTime < dayStartTime;
  }

  hasMemo(element: ITimelineAgentActivity, agent: IAgentTimeline) {
    const state = this._getActivityState(element, agent);
    return !!state?.memo;
  }

  _getActivityState(element: ITimelineAgentActivity, agent: IAgentTimeline) {
    const { dayIndex, start, end } = element;
    const day = agent.days[dayIndex];
    let dayStates = propOr([], 'states', day) as any[];
    if (day.dayState) {
      dayStates = [...dayStates, day.dayState];
    }
    return dayStates.find(state => state.startDateTime === start && state.endDateTime === end);
  }

  isSelected(element: ITimelineAgentActivity, selectedActivities: ISelectedActivity[]) {
    const typeindex = selectedActivities.findIndex(
      pelement =>
        pelement.type === element.type &&
        String(pelement.uniqueId) === String(element.uniqueId) &&
        pelement.dayIndex === element.dayIndex,
    );
    return typeindex !== -1;
  }

  nameElements(
    discret: number,
    start: number,
    end: number,
    style: string,
    scale: number,
    name?: string,
  ): JSX.Element[] {
    let quantity = Math.floor((end - start) / 1000 / 60 / discret);
    const elements: JSX.Element[] = [];
    const milisec = end - start;
    const discInMiliSec = discret * 60 * 1000;
    const width = (discInMiliSec * 100) / milisec;
    const diference = discret - (end - start) / 1000 / 60;
    if (quantity === 0 && diference < 46) {
      quantity = 1;
    }
    let scaleConst = 1;
    if (scale > 250) {
      scaleConst = 1.5;
    }
    if (scale < 100) {
      scaleConst = scale / 80;
    }
    for (let i = 0; i < quantity; i++) {
      const el = createElement(
        'div',
        {
          key: i,
          className: style,
          style: {
            fontSize: `calc(14px * ${scaleConst})`,
            width: `${width}%`,
            marginLeft: quantity === 1 ? 'auto' : 'none',
            marginRight: quantity === 1 ? 'auto' : 'none',
          },
        },
        createElement('span', null, name),
      );
      elements.push(el);
    }
    return elements;
  }
}

export default new ShiftUtils();
