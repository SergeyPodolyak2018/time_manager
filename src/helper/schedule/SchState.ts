import { clone, isNil, omit } from 'ramda';

import { SCH_STATE_TYPE } from '../../common/constants';
import { SchStateType, WORK_ID } from '../../common/constants/schedule';
import { ITimezone } from '../../common/interfaces/config/ITimezone';
import { IAgentSchedule, ISchState } from '../../common/interfaces/schedule/IAgentSchedule';
import {
  IEditMultipleSchState,
  MoveTo,
} from '../../components/ScheduleComponents/Popups/NewMultipleWizardMenu/multipleStates/EditMultiple/EditMultipleWizard';
import { ISelectedActivity } from '../../redux/ts/intrefaces/timeLine';
import DateUtils from '../dateUtils';
import DateUtilsTimZone from '../DateUtilsTimeZone';
import Utils from '../utils';
import SchSelectedActivity from './SchSelectedActivity';

export const itemsThatCantBeMovedWithShift = [
  SchStateType.EXCEPTION,
  SchStateType.MEAL,
  SchStateType.TIME_OFF,
  SchStateType.MARKED_TIME,
];
interface IEditActivitySetOptions {
  moveTime:
    | {
        time: string;
        direction: {
          forward: boolean;
          backward: boolean;
        };
      }
    | undefined;
  setTime:
    | {
        time: string;
        isNextDay: boolean;
      }
    | undefined;
  duration: string | undefined;
}

class SchState {
  constructor(options: IAgentSchedule) {
    Object.assign(this, options);
  }

  static convertWithTz(states: ISchState[], tzSite: ITimezone, tzSelected: ITimezone) {
    return states.map(state => {
      return {
        ...state,
        shortName: String(state.shortName),
        name: String(state.name),
        startDateTime: DateUtils.convertAccordingToTz(state.startDateTime, tzSite, tzSelected),
        endDateTime: DateUtils.convertAccordingToTz(state.endDateTime, tzSite, tzSelected),
      };
    });
  }

  static convertWithTzMom(states: ISchState[], tzSite: ITimezone, tzSelected: ITimezone) {
    return states.map(state => {
      return {
        ...state,
        shortName: String(state.shortName),
        name: String(state.name),
        startDateTime: DateUtilsTimZone.convertAccordingToTz(state.startDateTime, tzSite, tzSelected, true, true),
        endDateTime: DateUtilsTimZone.convertAccordingToTz(state.endDateTime, tzSite, tzSelected, true, true),
      };
    });
  }

  static convertWithTzAdoptive(states: ISchState[]) {
    return states.map(state => {
      return {
        ...state,
        shortName: String(state.shortName),
        name: String(state.name),
        startDateTime: DateUtils.convertAccordingToTzWithoutOfset(state.startDateTime),
        endDateTime: DateUtils.convertAccordingToTzWithoutOfset(state.endDateTime),
      };
    });
  }

  static prepareForPerformance(states: ISchState[], tzSite: ITimezone, tzSelected: ITimezone) {
    return states.map(state => {
      return {
        ...omit(['memo', 'refType'], state),
        shortName: String(state.shortName),
        name: String(state.name),
        startDateTime: DateUtils.convertAccordingToTz(state.startDateTime, tzSite, tzSelected),
        endDateTime: DateUtils.convertAccordingToTz(state.endDateTime, tzSite, tzSelected),
      };
    });
  }

  static convertWithoutTz(states: ISchState[]) {
    return states.map(state => {
      return {
        ...omit(['isSelected', 'changed'], state),
        shortName: String(state.shortName),
        name: String(state.name),
        startDateTime: DateUtils.convertToIsoWithoutTz(state.startDateTime),
        endDateTime: DateUtils.convertToIsoWithoutTz(state.endDateTime),
      };
    });
  }

  static moveShiftItems(states: ISchState[], time: number, moveExceptions = true) {
    return states
      .map(state => {
        const cantBeMoved = itemsThatCantBeMovedWithShift.includes(state?.type);
        if (cantBeMoved && moveExceptions) return state;
        return {
          ...state,
          shortName: String(state.shortName),
          name: String(state.name),
          startDateTime: +state.startDateTime + time,
          endDateTime: +state.endDateTime + time,
        };
      })
      .sort((a, b) => Number(a.endDateTime) - Number(b.endDateTime));
  }

  static isCanOverlapped(state1: ISchState, state2: ISchState) {
    const allowedOverlappingItemsWithActivitySetAndShift = [
      SchStateType.BREAK,
      SchStateType.MEAL,
      SchStateType.EXCEPTION,
      SchStateType.TIME_OFF,
      SchStateType.MARKED_TIME,
    ];
    const mealAndBreakIsCanOverlapsWith =
      state2.type === SchStateType.EXCEPTION ||
      state2.type === SchStateType.TIME_OFF ||
      state2.type === SchStateType.MARKED_TIME ||
      state2.type === SchStateType.ACTIVITY_SET ||
      state2.type === SchStateType.ACTIVITY;

    if (
      (state1.type === SchStateType.ACTIVITY_SET &&
        allowedOverlappingItemsWithActivitySetAndShift.includes(state2.type)) ||
      (state2.type === SchStateType.ACTIVITY_SET &&
        allowedOverlappingItemsWithActivitySetAndShift.includes(state1.type))
    ) {
      return true;
    }
    if (
      (state1.type === SchStateType.SHIFT && allowedOverlappingItemsWithActivitySetAndShift.includes(state2.type)) ||
      (state2.type === SchStateType.SHIFT && allowedOverlappingItemsWithActivitySetAndShift.includes(state1.type))
    ) {
      return true;
    }
    if (state1.type === SchStateType.TIME_OFF)
      return (
        state2.type === SchStateType.EXCEPTION ||
        state2.type === SchStateType.BREAK ||
        state2.type === SchStateType.MEAL ||
        state2.type === SchStateType.MARKED_TIME
      );
    if (state1.type === SchStateType.EXCEPTION)
      return (
        state2.type === SchStateType.EXCEPTION ||
        state2.type === SchStateType.BREAK ||
        state2.type === SchStateType.MEAL ||
        state2.type === SchStateType.MARKED_TIME
      );
    if (state1.type === SchStateType.BREAK || state1.type === SchStateType.MEAL) return mealAndBreakIsCanOverlapsWith;
    return false;
  }

  static pasteState(states: ISchState[], state: ISchState) {
    // if (this.isWorkSet(state) || this.isActivitySet(state)) {
    //   const _states = clone(this.getWorkAndWorkSet([...states, state]));
    //   const otherStates = this.getActivitiesWithoutWorkSet(states);
    //   const newStates: ISchState[] = [];
    //
    //   _states.map(_state => {
    //     if (JSON.stringify(_state) === JSON.stringify(state)) {
    //       const updatedState = state;
    //
    //       // const startTimeDif = +activity.start - +state.startDateTime;
    //       // const endTimeDif = +activity.end - +state.endDateTime;
    //
    //       const [prevWork, prevWorkIndex] = Utils.findItemAndIndex<ISchState>(
    //         states,
    //         _state => this.isWork(_state) && _state.endDateTime === state.startDateTime,
    //       );
    //       const [nextWork, nextWorkIndex] = Utils.findItemAndIndex<ISchState>(
    //         states,
    //         _state => this.isWork(_state) && _state.startDateTime === state.endDateTime,
    //       );
    //       const isNotCreateWork = this.isActivitySet(updatedState) && !prevWork && !nextWork;
    //
    //       // update or create new work activity before work set
    //       if (prevWork && !isNil(prevWorkIndex)) {
    //         const newPrevWork = {
    //           ...prevWork,
    //           endDateTime: updatedState.startDateTime,
    //         };
    //         _states[prevWorkIndex] =
    //           +newPrevWork.endDateTime <= +newPrevWork.startDateTime ? (null as unknown as ISchState) : newPrevWork;
    //       } else {
    //         if (!isNotCreateWork) {
    //           const work = this.createWorkActivity(+state.startDateTime, +updatedState.startDateTime);
    //           work && newStates.push(work);
    //         }
    //       }
    //
    //       // update or create new work activity after work set
    //       if (nextWork && !isNil(nextWorkIndex)) {
    //         const newNextWork = {
    //           ...nextWork,
    //           startDateTime: updatedState.endDateTime,
    //         };
    //         _states[nextWorkIndex] =
    //           +newNextWork.endDateTime <= +newNextWork.startDateTime ? (null as unknown as ISchState) : newNextWork;
    //       } else {
    //         if (!isNotCreateWork) {
    //           const work = this.createWorkActivity(+updatedState.endDateTime, +state.endDateTime);
    //           work && newStates.push(work);
    //         }
    //       }
    //     }
    //     return state;
    //   });
    //   return [..._states.filter(state => state), ...newStates, ...otherStates];
    // }
    return [...states, state];
  }

  static moveShiftItem(states: ISchState[], item: ISelectedActivity, time: number) {
    return states.map((state, index) => {
      if (item.stateIndex !== undefined && +item.stateIndex === index) {
        let endTime = +state.endDateTime + time < item.shiftEnd ? +state.endDateTime + time : item.shiftEnd;
        const startTime =
          endTime - (item.end - item.start) > item.shiftStart ? endTime - (item.end - item.start) : item.shiftStart;

        if (endTime - (item.end - item.start) < startTime + (item.end - item.start)) {
          endTime = startTime + (item.end - item.start);
        }
        return {
          ...state,
          startDateTime: startTime,
          endDateTime: endTime,
          changed: true,
        };
      } else {
        return state;
      }
    });
  }

  static changeShiftTime(states: ISchState[], activity: ISelectedActivity, moveComponents?: boolean) {
    const isShift = activity.stateIndex === undefined;
    let _states = [...states];
    if (activity.type === SCH_STATE_TYPE[SchStateType.EXCEPTION] && isShift) {
      _states = this.removeStatesByTypes(states, [SchStateType.EXCEPTION]).states;
    }
    const { states: editedStates, differentTime } = this.editWorkActivity(_states, activity);
    _states = editedStates;
    if (!moveComponents) return _states;

    return this.moveStates(_states, differentTime);
  }

  static moveStates(states: ISchState[], differentTime: number) {
    return states.map(_state => {
      if (this.isWork(_state) || this.isWorkSet(_state)) return _state;
      return {
        ..._state,
        startDateTime: +_state.startDateTime + differentTime,
        endDateTime: +_state.endDateTime + differentTime,
      };
    });
  }

  static editWorkActivity(
    states: ISchState[],
    activity: ISelectedActivity,
  ): { states: ISchState[]; differentTime: number } {
    const workSet = this.getWorkAndWorkSet(states);
    if (!workSet.length) return { states, differentTime: 0 };
    const activities = this.getActivitiesWithoutWorkSet(states);

    const lastIndex = workSet.length - 1;
    const firstIndex = 0;

    const firstWorkActivityIndex = workSet.findIndex(state => this.isWork(state));
    const lastWorkActivityIndex = Utils.findLastIndex<ISchState>(workSet, state => this.isWork(state));

    const isNotCreateWork = firstWorkActivityIndex === -1 && lastWorkActivityIndex === -1;

    const isCreateInStart = firstWorkActivityIndex !== firstIndex && !isNotCreateWork;
    const isCreateInEnd = lastWorkActivityIndex !== lastIndex && !isNotCreateWork;

    // const isStartTimeChange = +workSet[firstIndex].startDateTime !== +activity.start;
    // const isEndTimeChange = +workSet[lastIndex].endDateTime !== +activity.end;

    let differentTime = 0;
    // only change if first or last index in array
    let _states = workSet
      .map((state, index) => {
        if (!isCreateInStart && !isCreateInEnd && firstWorkActivityIndex === index && lastWorkActivityIndex === index) {
          differentTime = DateUtils.getRound1mTimestamp(activity.start - +state.startDateTime);

          return { ...state, startDateTime: activity.start, endDateTime: activity.end };
        }
        if (!isCreateInStart && firstWorkActivityIndex === index) {
          differentTime = DateUtils.getRound1mTimestamp(activity.start - +state.startDateTime);

          if (+activity.start >= +state.endDateTime) return null;
          return { ...state, startDateTime: activity.start };
        }
        if (!isCreateInEnd && lastWorkActivityIndex === index) {
          differentTime = DateUtils.getRound1mTimestamp(activity.end - +state.endDateTime);
          if (+activity.end <= +state.startDateTime) return null;
          return { ...state, endDateTime: activity.end };
        }
        return state;
      })
      .filter(state => state) as ISchState[];

    //else push new work in start on end
    if (isCreateInStart) {
      const workStart = this.createWorkActivity(+activity.start, +states[0].startDateTime);
      if (workStart) {
        _states = [workStart, ..._states];
      }
    }
    if (isCreateInEnd) {
      const workEnd = this.createWorkActivity(+states[states.length - 1].endDateTime, +activity.end);
      if (workEnd) {
        _states = [..._states, workEnd];
      }
    }

    return { states: [..._states, ...activities], differentTime };
  }

  static getWorkAndWorkSet(states: ISchState[]) {
    return states
      .filter(state => this.isWork(state) || this.isWorkSet(state) || this.isActivitySet(state))
      .sort((a, b) => Number(a.endDateTime) - Number(b.endDateTime));
  }

  static getActivitySets(states: ISchState[]) {
    return states
      .filter(state => this.isWorkSet(state) || this.isActivitySet(state))
      .sort((a, b) => Number(a.endDateTime) - Number(b.endDateTime));
  }

  static getActivitiesWithoutWorkSet(states: ISchState[]) {
    return states.filter(state => !this.isWork(state) && !this.isWorkSet(state) && !this.isActivitySet(state));
  }

  static createWorkActivity(startDateTime: number, endDateTime: number): ISchState | null {
    if (startDateTime >= endDateTime) return null;
    return {
      refId: WORK_ID,
      id: WORK_ID,
      name: 'Work',
      type: SchStateType.ACTIVITY_SET,
      startDateTime,
      endDateTime,
    } as ISchState;
  }

  static changeStateByIndex(states: ISchState[], activity: ISelectedActivity, isChangeType?: boolean) {
    if (SchSelectedActivity.isWorkSet(activity) || SchSelectedActivity.isActivitySet(activity)) {
      return this.editWorkSetActivity(states, activity);
    }

    return states.map((state, index) => {
      if (activity.stateIndex !== undefined && index === +activity.stateIndex) {
        let currentState = { ...state, startDateTime: activity.start, endDateTime: activity.end, changed: true };

        //if work set changed need to change nearby work activities
        if (isChangeType) {
          currentState = { ...currentState, name: activity.name, id: activity.id };
          // @ts-ignore
          if ('isPaid' in currentState && 'isPaid' in activity) currentState.isPaid = activity.isPaid;
          if ('shortName' in currentState && 'shortName' in activity) currentState.shortName = activity.shortName;
        }

        if (
          activity.type === SCH_STATE_TYPE[SchStateType.EXCEPTION] ||
          activity.type === SCH_STATE_TYPE[SchStateType.TIME_OFF]
        ) {
          currentState = { ...currentState, memo: activity.memo };
        }
        return currentState;
      }
      return state;
    });
  }

  static editWorkSetActivity(states: ISchState[], activity?: ISelectedActivity, options?: IEditActivitySetOptions) {
    const _states: ISchState[] = clone(states);
    const newStates: ISchState[] = [];
    states.map((state, index) => {
      if (state.isSelected || (!isNil(activity?.stateIndex) && activity?.stateIndex === index)) {
        const moveTimeMs = options?.moveTime?.time ? DateUtils.convertTimeToMs(options.moveTime.time) : 0;
        const setTime = options?.setTime;
        const startOffset = setTime?.time
          ? DateUtils.getStartOffset(state.startDateTime, setTime.time, setTime.isNextDay)
          : 0;

        let startDateTime = activity?.start || state.startDateTime;
        startDateTime = options?.moveTime?.direction.forward ? +startDateTime + moveTimeMs : startDateTime;
        startDateTime = options?.moveTime?.direction.backward ? +startDateTime - moveTimeMs : startDateTime;
        startDateTime = +startDateTime + startOffset;

        let endDateTime = activity?.end || state.endDateTime;
        endDateTime = options?.moveTime?.direction.forward ? +endDateTime + moveTimeMs : endDateTime;
        endDateTime = options?.moveTime?.direction.backward ? +endDateTime - moveTimeMs : endDateTime;
        endDateTime = +endDateTime + startOffset;

        const durationMs = options?.duration
          ? DateUtils.getDeltaDuration(startDateTime, endDateTime, options.duration)
          : 0;
        endDateTime = +endDateTime + durationMs;

        const updatedState = { ...state, startDateTime, endDateTime };

        // const startTimeDif = +activity.start - +state.startDateTime;
        // const endTimeDif = +activity.end - +state.endDateTime;

        const [prevWork, prevWorkIndex] = Utils.findItemAndIndex<ISchState>(
          states,
          _state => this.isWork(_state) && _state.endDateTime === state.startDateTime,
        );
        const [nextWork, nextWorkIndex] = Utils.findItemAndIndex<ISchState>(
          states,
          _state => this.isWork(_state) && _state.startDateTime === state.endDateTime,
        );
        const isNotCreateWork = this.isActivitySet(updatedState) && !prevWork && !nextWork;

        // update or create new work activity before work set
        if (prevWork && !isNil(prevWorkIndex)) {
          const newPrevWork = {
            ...prevWork,
            endDateTime: startDateTime,
          };
          _states[prevWorkIndex] =
            +newPrevWork.endDateTime <= +newPrevWork.startDateTime ? (null as unknown as ISchState) : newPrevWork;
        } else {
          if (!isNotCreateWork) {
            const work = this.createWorkActivity(+state.startDateTime, +updatedState.startDateTime);
            work && newStates.push(work);
          }
        }

        // update or create new work activity after work set
        if (nextWork && !isNil(nextWorkIndex)) {
          const newNextWork = {
            ...nextWork,
            startDateTime: endDateTime,
          };
          _states[nextWorkIndex] =
            +newNextWork.endDateTime <= +newNextWork.startDateTime ? (null as unknown as ISchState) : newNextWork;
        } else {
          if (!isNotCreateWork) {
            const work = this.createWorkActivity(+endDateTime, +state.endDateTime);
            work && newStates.push(work);
          }
        }

        // update selected state
        _states.splice(index, 1, updatedState);
      }
      return state;
    });
    return [..._states.filter(state => state), ...newStates];
  }

  static removeStateItemByIndex(states: ISchState[], activity: ISelectedActivity) {
    return states.filter((state, index) => index !== (activity.stateIndex !== undefined && +activity.stateIndex));
  }

  static removeStateItemByStartEndTimeAndId(states: ISchState[], activity: ISelectedActivity) {
    return states.filter(
      state =>
        !(
          state.startDateTime === activity.start &&
          state.endDateTime === activity.end &&
          state.type === activity._type
        ),
    );
  }

  static removeWorkSet(states: ISchState[], activity: ISelectedActivity) {
    const _states = states.filter(
      (state, index) => index !== (activity.stateIndex !== undefined && +activity.stateIndex),
    );
    return this.mergeNeighboringWorkActivities(_states);
  }

  static removeWorkSetsById(states: ISchState[], activity: ISelectedActivity) {
    const workStates: ISchState[] = [];
    const _states = states.filter(state => {
      if (activity.stateId !== state.id) {
        return true;
      } else {
        const isCreateWork = states.find(s => this.isWork(s));
        const workState = this.createWorkActivity(+state.startDateTime, +state.endDateTime);
        isCreateWork && workState && workStates.push(workState);
        return false;
      }
    });
    return this.mergeNeighboringWorkActivities([...workStates, ..._states]);
  }

  static removeWorkSetByTime(states: ISchState[], activity: ISelectedActivity) {
    const index = states.findIndex(
      state => state.startDateTime === activity.start && state.endDateTime === activity.end,
    );
    const stateForRemove = states[index];
    if (index === -1 || !stateForRemove) return states;
    const newWork = this.createWorkActivity(+stateForRemove.startDateTime, +stateForRemove.endDateTime);

    const _states = [...states];
    const isWorkExist = states.find(state => this.isWork(state));
    if (newWork && isWorkExist) {
      _states.splice(index, 1, newWork);
    } else {
      _states.splice(index, 1);
    }

    return this.mergeNeighboringWorkActivities(_states);
  }

  static mergeNeighboringWorkActivities(states: ISchState[]) {
    const workSet = this.getWorkAndWorkSet(states);
    const activities = this.getActivitiesWithoutWorkSet(states);

    const mergeWork = () => {
      for (const [index, state] of workSet.entries()) {
        if (!this.isWork(state)) return;
        const nextIndex = index + 1;
        const nextState = workSet[nextIndex];
        if (nextState && this.isWork(nextState)) {
          workSet[nextIndex] = {
            ...nextState,
            startDateTime: state.startDateTime,
            endDateTime: nextState.endDateTime,
          };

          workSet.splice(index, 1);
          mergeWork();
          break;
        }
      }
    };
    mergeWork();

    return [...workSet, ...activities];
  }

  static updateMultipleAgentState(
    states: ISchState[],
    timeMs: number,
    selectedStates: ISchState[],
    action: MoveTo,
    duration?: number,
  ): { states: ISchState[]; isModified: boolean } {
    let isModified = false;
    const _states = states.map((state: IEditMultipleSchState) => {
      if (selectedStates.find(_state => _state.type === state.type)) {
        if (!(state?.checked === undefined || state?.checked)) return state;

        let startDateTime, endDateTime;
        if (action === 'forward') {
          startDateTime = +state.startDateTime + timeMs;
          endDateTime = +state.endDateTime + timeMs;
        } else if (action === 'backward') {
          startDateTime = +state.startDateTime - timeMs;
          endDateTime = +state.endDateTime - timeMs;
        } else {
          // action === 'set'
          startDateTime = timeMs;
          endDateTime = timeMs + (duration ? duration : +state.endDateTime - +state.startDateTime);
        }
        endDateTime = duration ? startDateTime + duration : endDateTime;
        isModified = true;
        return {
          ...state,
          startDateTime: startDateTime,
          endDateTime: endDateTime,
        };
      }
      return state;
    });
    return { states: _states, isModified };
  }

  static moveStatesToDate(
    updatedStates: IEditMultipleSchState[],
    states: ISchState[],
    stateTypes: SchStateType[],
    dateTo: number,
  ) {
    let statesForMove = updatedStates.filter(
      state => stateTypes.includes(state.type) && (state.checked === undefined || state.checked),
    );
    if (statesForMove.length === 0) return { states, isModified: false };

    statesForMove = statesForMove.map(state => {
      return {
        ...state,
        startDateTime: DateUtils.setDayFromDate(+state.startDateTime, dateTo),
        endDateTime: DateUtils.setDayFromDate(+state.endDateTime, dateTo),
      };
    });
    return { states: [...statesForMove, ...states], isModified: true };
  }

  static moveStatesToDateByDelta(
    updatedStates: IEditMultipleSchState[],
    states: ISchState[],
    stateTypes: SchStateType[],
    delta: number,
  ) {
    let statesForMove = updatedStates.filter(
      state => stateTypes.includes(state.type) && (state.checked === undefined || state.checked),
    );
    if (statesForMove.length === 0) return { states, isModified: false };

    statesForMove = statesForMove.map(state => {
      return {
        ...state,
        startDateTime: +state.startDateTime + delta,
        endDateTime: +state.endDateTime + delta,
      };
    });
    return { states: [...statesForMove, ...states], isModified: true };
  }

  static removeStatesByTypes(states: IEditMultipleSchState[] | ISchState[], stateTypes: SchStateType[]) {
    let isModified = false;
    const _states = states.filter((state: IEditMultipleSchState) => {
      if (stateTypes.includes(state.type) && (state?.checked === undefined || state?.checked)) {
        isModified = true;
        return false;
      }
      return true;
    });
    return { states: _states, isModified };
  }

  static removeWorkState(states: ISchState[]) {
    return states.filter(state => !this.isWork(state));
  }

  /**
   *
   * @param {Object} state
   * @return {boolean}
   */
  static isWorkSet(state: ISchState) {
    return state?.refId !== WORK_ID && state?.type === SchStateType.ACTIVITY_SET && state?.id === WORK_ID;
  }

  /**
   *
   * @param {Object} state
   * @return {boolean}
   */
  static isActivitySet(state: ISchState) {
    //WARN: activity set can have refId === WORK_ID
    return state?.type === SchStateType.ACTIVITY_SET && state?.id !== WORK_ID;
  }

  /**
   *
   * @param {Object} state
   * @return {boolean}
   */
  static isWork(state: ISchState) {
    return state?.refId === WORK_ID && state?.type === SchStateType.ACTIVITY_SET && state?.id === WORK_ID;
  }

  static getNonOverlappingStates(states: ISchState[]) {
    return states.filter(state => {
      return !(state.type === SchStateType.MARKED_TIME) && !this.isWork(state);
    });
  }

  static getOverlappingStates(states: ISchState[]) {
    return states.filter(state => {
      return state.type === SchStateType.MARKED_TIME || this.isWork(state);
    });
  }

  static insertWorkSet(states: ISchState[], state: ISchState): ISchState[] {
    return states.concat([state]);
  }

  static checkActivitySetOverlaps(states: ISchState[], cbErr: (state1: ISchState, state2: ISchState) => void) {
    const _states = this.getWorkAndWorkSet(states);
    _states.forEach((state1: ISchState, index) => {
      const start = state1.startDateTime;
      const end = state1.endDateTime;
      const targetStates = _states.filter((s1, idx1) => index !== idx1);
      targetStates.forEach(state2 => {
        const start2 = state2.startDateTime;
        const end2 = state2.endDateTime;
        if (DateUtils.checkTimeRanges(start, end, start2, end2)) {
          cbErr(state1, state2);
        }
      });
    });
  }

  static extendWorkActivityInShift(states: ISchState[], shiftStartTime: number, shiftEndTime: number) {
    const _states = clone(states);
    const firstWorkActivityIndex = states.findIndex(state => this.isWork(state));
    const lastWorkActivityIndex = Utils.findLastIndex<ISchState>(states, state => this.isWork(state));

    if (firstWorkActivityIndex !== -1) _states[firstWorkActivityIndex].startDateTime = shiftStartTime;
    if (lastWorkActivityIndex !== -1) _states[lastWorkActivityIndex].endDateTime = shiftEndTime;
    return _states;
  }
}

export default SchState;
