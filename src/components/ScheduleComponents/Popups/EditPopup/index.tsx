import { clone, isEmpty, isNil } from 'ramda';
import React, { FC, useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import useStateRef from 'react-usestateref';

import restApi from '../../../../api/rest';
import { IFindShiftItemsPayload } from '../../../../api/ts/interfaces/config.payload';
import { SCH_STATE_TYPE } from '../../../../common/constants';
import { RefType, SchStateType, WORK_ID } from '../../../../common/constants/schedule';
import { catalog, CatalogKey, CatalogKeyReverted } from '../../../../common/constants/schedule/timelineColors';
import { ISite, ISites } from '../../../../common/interfaces/config';
import { IContract, ISchState } from '../../../../common/interfaces/schedule/IAgentSchedule';
import DateUtils from '../../../../helper/dateUtils';
import SchAgent from '../../../../helper/schedule/SchAgent';
import SchMeetingScheduler from '../../../../helper/schedule/SchMeetingScheduler';
import SchSelectedActivity from '../../../../helper/schedule/SchSelectedActivity';
import SchState, { itemsThatCantBeMovedWithShift } from '../../../../helper/schedule/SchState';
import Utils from '../../../../helper/utils';
import { usePopUpHotkeys } from '../../../../hooks';
import {
  buildAgentDayInSnapshot,
  closeMenu,
  findBreaks,
  findExceptions,
  findMeals,
  findShifts,
  findTimeOffs,
  openErrorPopUp,
  openWarningPopUp,
  setBreaks,
  setExceptions,
  setMeals,
  setShifts,
  setTimeOffs,
} from '../../../../redux/actions/timeLineAction';
import { useAppDispatch } from '../../../../redux/hooks';
import { getActiveDateSelector, getSelectedTzSelector } from '../../../../redux/selectors/controlPanelSelector';
import { getFilterData } from '../../../../redux/selectors/filterSelector';
import {
  getBreaks,
  getDataSelector,
  getExceptions,
  getMeals,
  getSelectedActivitySelector,
  getSelectedAgentSelector,
  getShifts,
  getTimeFormat,
  getTimeOff,
  getIsUseCustomColors,
} from '../../../../redux/selectors/timeLineSelector';
import { getColorByID } from '../../../../redux/selectors/colorsSelector';
import { store } from '../../../../redux/store';
import {
  IBreakMeal,
  IErrorPopUpParam,
  IException,
  ISelectedActivity,
  IShifts,
  ITimeOff,
} from '../../../../redux/ts/intrefaces/timeLine';
import { Cross } from '../../../../static/svg';
import Button from '../../../ReusableComponents/button';
import CheckboxBig from '../../../ReusableComponents/Checkbox';
import Checkbox from '../../../ReusableComponents/CheckboxStyled';
import InputTime, { ITimeLimit } from '../../../ReusableComponents/InputTime';
import Spiner from '../../../ReusableComponents/spiner';
import AgentInfo from '../common/AgentInfo';
import AgentTime from '../common/AgentTime';
import { ItemTypesColumns, ShiftItemsToColumns } from './constants';
import styles from './menu.module.scss';

export const getIsFormChanged = ({
  selectedActivities,
  timeStart,
  timeEnd,
  initialItem,
  currentItem,
  initialMemoValue,
  memo,
  initialIsNextDay,
  isNextDay,
  initialIsPreviousStartDay,
  isPreviousStartDay,
  isMoveComponent,
}: {
  selectedActivities: ISelectedActivity[];
  timeEnd: string;
  timeStart: string;
  selectedTypeItem: number;
  initialItem: any;
  currentItem: any;
  initialMemoValue: string;
  memo: string;
  initialIsNextDay: boolean;
  isNextDay: boolean;
  initialIsPreviousStartDay: boolean;
  isPreviousStartDay: boolean;
  isMoveComponent: boolean;
}) => {
  const selectedActivity = selectedActivities[0];
  const { start, end } = selectedActivity;
  const startTime = DateUtils.getTimeFromDate(start);
  const endTime = DateUtils.getTimeFromDate(end);

  return (
    startTime !== timeStart ||
    endTime !== timeEnd ||
    currentItem?.id !== initialItem?.id ||
    memo !== initialMemoValue ||
    isNextDay !== initialIsNextDay ||
    isPreviousStartDay !== initialIsPreviousStartDay ||
    isMoveComponent
  );
};

const EditShift: FC = () => {
  const dispatch = useAppDispatch();
  const selectedActivities = useSelector(getSelectedActivitySelector);
  const [, setSelectedTypeItem, selectedTypeItemRef] = useStateRef<number>(-1);
  const [, setAllItem, allItemsRef] = useStateRef<IBreakMeal[] | IException[] | IShifts[] | ITimeOff[]>([]);
  const [, setItem, itemsRef] = useStateRef<IBreakMeal[] | IException[] | IShifts[] | ITimeOff[]>([]);
  const activeDate = useSelector(getActiveDateSelector);
  const filterData = useSelector(getFilterData);
  const selectedAgent = useSelector(getSelectedAgentSelector);
  const colorsFromApi = useSelector(getColorByID(selectedAgent[0].buId));
  const customColorsTriger = useSelector(getIsUseCustomColors);

  const selectedTzSelector = useSelector(getSelectedTzSelector);
  const currentDate = useSelector(getActiveDateSelector);
  const timeFormat = useSelector(getTimeFormat);
  const [timeStart, setTimeStart, timeStartRef] = useStateRef(DateUtils.getTimeFromDate(selectedActivities[0].start));
  const [isMoveComponent, setIsMoveComponent, isMoveComponentRef] = useStateRef(false);
  const [timeEnd, setTimeEnd, timeEndRef] = useStateRef(DateUtils.getTimeFromDate(selectedActivities[0].end));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initialIsNextDay = DateUtils.getDay(currentDate) !== DateUtils.getDay(selectedActivities[0].end);
  const [isNextDay, setIsNextDay, isNextDayRef] = useStateRef(() => initialIsNextDay);

  const initialIsPreviousStartDay = DateUtils.getDay(currentDate) !== DateUtils.getDay(selectedActivities[0].start);
  const [isPreviousStartDay, setIsPreviousStartDay, isPreviousStartDayRef] = useStateRef(
    () => initialIsPreviousStartDay,
  );
  const [isValid, setIsValid] = useState<boolean>(true);
  const [limits, setLimits] = useStateRef<ITimeLimit>({});

  const [, setTimeForMove, timeForMoveRef] = useStateRef(0);
  const [meetName, setMeetName] = useState<string>('');

  const isShowMemo =
    selectedActivities[0].type === SCH_STATE_TYPE[SchStateType.TIME_OFF] ||
    selectedActivities[0].type === SCH_STATE_TYPE[SchStateType.EXCEPTION];

  const [, setIsShowAll, isShowAllRef] = useStateRef<boolean>(
    selectedActivities[0].type === SCH_STATE_TYPE[SchStateType.TIME_OFF],
  );

  const isShowChangeType = !(
    (
      selectedActivities[0].type === SCH_STATE_TYPE[SchStateType.ACTIVITY_SET] ||
      selectedActivities[0].type === SCH_STATE_TYPE[SchStateType.DAY_OFF] ||
      selectedActivities[0].type === SCH_STATE_TYPE[SchStateType.MARKED_TIME] ||
      (selectedActivities[0]._type === SchStateType.ACTIVITY_SET && selectedActivities[0].stateId === WORK_ID)
    ) //TODO remove last condition
  );

  const getItemsList = () => {
    if (selectedActivities[0].type === SCH_STATE_TYPE[SchStateType.TIME_OFF]) {
      return useSelector(getTimeOff);
    } else if (selectedActivities[0].type === SCH_STATE_TYPE[SchStateType.BREAK]) {
      return useSelector(getBreaks);
    } else if (selectedActivities[0].type === SCH_STATE_TYPE[SchStateType.MEAL]) {
      return useSelector(getMeals);
    } else if (
      selectedActivities[0].type === SCH_STATE_TYPE[SchStateType.SHIFT] ||
      (selectedActivities[0]._type === SchStateType.ACTIVITY_SET && selectedActivities[0].stateId === WORK_ID)
    ) {
      return useSelector(getShifts);
    } else if (selectedActivities[0].type === SCH_STATE_TYPE[SchStateType.EXCEPTION]) {
      return useSelector(getExceptions);
    }
  };

  const itemsList = getItemsList();

  const getShiftTime = useCallback(
    (el: any) => {
      if (timeFormat === '12hours') {
        return el.shiftTitle;
      }
      const [start, end] = el.shiftTitle.split('-');
      const startIn24 = DateUtils.convertTimeTo24h(start);
      const endIn24 = DateUtils.convertTimeTo24h(end);
      const res = `${startIn24} - ${endIn24}`;
      return res;
    },
    [timeFormat],
  );

  let initialMemoValue = '';
  if (isShowMemo) {
    if (selectedActivities[0].stateIndex === undefined) {
      initialMemoValue = selectedAgent[0]?.days[selectedActivities[0]?.dayIndex].dayState?.memo || '';
    } else {
      initialMemoValue =
        selectedAgent[0]?.days[selectedActivities[0]?.dayIndex].states.find(
          state =>
            state.startDateTime === selectedActivities[0].start && state.endDateTime === selectedActivities[0].end,
        )?.memo || '';
    }
  }

  const [memo, setMemo, memoRef] = useStateRef<string>(initialMemoValue || '');

  const getFilteredShifts = (shifts: IShifts[], contracts: IContract[]): IShifts[] =>
    shifts.filter(
      shift =>
        !contracts.length || contracts.find(item => item.id === shift.shiftContracts.find(el => el.id === item.id)?.id),
    );

  useEffect(() => {
    if (Array.isArray(itemsList)) {
      if (itemsList.length) {
        if (isShowAllRef.current) setAllItem(itemsList);
        else {
          if (selectedActivities[0]._type === SchStateType.EXCEPTION)
            setItem(itemsList.filter(item => item.isFullDay === selectedActivities[0]?.isFullDay));
          if (
            selectedActivities[0].type === SCH_STATE_TYPE[SchStateType.SHIFT] ||
            (selectedActivities[0]._type === SchStateType.ACTIVITY_SET && selectedActivities[0].stateId === WORK_ID)
          ) {
            const currentAgent = store
              .getState()
              .TimeLine.history.past[0]?.data.find(x => x.agentId === selectedAgent[0]?.agentId);
            setItem(
              getFilteredShifts(itemsList, currentAgent ? currentAgent?.contracts : selectedAgent[0]?.contracts ?? []),
            );
          }
        }
      }
      if (isLoading) setIsLoading(false);
    }
  }, [itemsList, isShowAllRef.current]);

  // set time for move
  useEffect(() => {
    const startTimestamp = DateUtils.setDayTime(
      selectedActivities[0]?.date,
      DateUtils.convertTo24h(String(timeStartRef.current)),
      false,
      isPreviousStartDayRef.current,
    );
    const timeForMove = isMoveComponentRef.current ? startTimestamp - selectedActivities[0].shiftStart : 0;
    setTimeForMove(timeForMove);
  }, [isMoveComponentRef.current, timeStartRef.current, isPreviousStartDayRef.current]);

  useEffect(() => {
    if (
      selectedActivities[0].type !== 'shift' &&
      selectedActivities[0].type !== 'activity' &&
      selectedActivities[0].type !== 'activity_set' &&
      !(selectedActivities[0].type === 'time_off' && selectedActivities[0].stateIndex === undefined) &&
      !(selectedActivities[0].type === 'exception' && selectedActivities[0].stateIndex === undefined)
    ) {
      setLimits({
        start: DateUtils.getTimeFromDate(selectedActivities[0]?.shiftStart),
        end: DateUtils.getTimeFromDate(selectedActivities[0]?.shiftEnd),
        isNextEndDay: isNextDay,
        isPreviousStartDay: isPreviousStartDay,
      });
    } else {
      setLimits({ ...limits, isNextEndDay: isNextDay, isPreviousStartDay: isPreviousStartDay });
    }
  }, [isValid]);

  const timeLineData = useSelector(getDataSelector);
  const [, setItemsPayload, itemsPayloadRef] = useStateRef<any>({
    buId: 0,
    siteId: 0,
    shiftId: 0,
  });

  const selectItems = (index: number) => {
    setSelectedTypeItem(selectedTypeItemRef.current !== index ? index : -1);
  };

  const onClickShowAll = () => {
    const isShowAllState = !isShowAllRef.current;
    if (!itemsRef.current.length || !allItemsRef.current.length) {
      setIsLoading(true);
      initItemsList(isShowAllState);
      setIsLoading(false);
    }
    setIsShowAll(isShowAllState);
  };

  const initItemsList = (showAll: boolean) => {
    const payload = { ...itemsPayloadRef.current };

    if (showAll) payload.shiftId = undefined;
    if (selectedActivities[0].type === SCH_STATE_TYPE[SchStateType.TIME_OFF]) {
      dispatch(findTimeOffs(payload));
    } else if (selectedActivities[0].type === SCH_STATE_TYPE[SchStateType.BREAK]) {
      dispatch(findBreaks(payload));
    } else if (selectedActivities[0].type === SCH_STATE_TYPE[SchStateType.MEAL]) {
      dispatch(findMeals(payload));
    } else if (selectedActivities[0].type === SCH_STATE_TYPE[SchStateType.EXCEPTION]) {
      dispatch(findExceptions(payload));
    } else if (
      selectedActivities[0].type === SCH_STATE_TYPE[SchStateType.SHIFT] ||
      (selectedActivities[0]._type === SchStateType.ACTIVITY_SET && selectedActivities[0].stateId === WORK_ID)
    ) {
      dispatch(
        findShifts({
          siteId: selectedAgent[0].siteId,
          date: activeDate,
        }),
      );
    }
  };

  const getSites = (item: any): string => {
    const sites: ISites = filterData[item.buId].sites;
    const filteredSites: [string | number, ISite][] = Object.entries(
      item.siteId.reduce((acc: ISites, sid: number) => ({ ...acc, [sid]: sites[sid] }), {}),
    );
    return filteredSites.map(([, v]) => v.name).join(', ');
  };

  useEffect(() => {
    if (isLoading) {
      if (!selectedActivities.length) return;
      const shiftStartTime = selectedActivities[0].start;
      const shiftEndTime = selectedActivities[0].end;

      const payload: IFindShiftItemsPayload = {
        buId: 0,
        siteId: 0,
        shiftId: 0,
      };
      const agentId = selectedActivities[0].agentId;
      const timeLines = timeLineData.filter((t: any) => t.agentId === agentId);
      timeLines.forEach(data => {
        const activities = data.activities || [];
        const activity = activities.find((a: any) => a.start === shiftStartTime && a.end === shiftEndTime);
        if (activity) {
          payload.buId = data.buId;
          payload.siteId = data.siteId;
        }
        const day = data.days.find((d: any) => d.startDateTime === shiftStartTime && d.endDateTime === shiftEndTime);
        if (day) {
          //@ts-ignore
          payload.shiftId = day.dayState.id;
        }
      });
      setItemsPayload(payload);
      initItemsList(false);
    }
  }, [selectedActivities]);

  const [initialItem, setInitialItem] = useState<any>(null);

  // set selected item
  useEffect(() => {
    if (selectedTypeItemRef.current === -1) {
      const items = isShowAllRef.current ? allItemsRef.current : itemsRef.current;
      const [el, index] = Utils.findItemAndIndex<any>(items, el => selectedActivities[0].stateId === el.id);
      if (el && !isNil(index)) {
        setSelectedTypeItem(index);
        setInitialItem(el);
      }
    }
  }, [itemsRef.current, allItemsRef.current, isShowAllRef.current, selectedTypeItemRef.current]);

  const isFormChanged = getIsFormChanged({
    selectedActivities,
    timeStart: timeStartRef.current,
    timeEnd: timeEndRef.current,
    selectedTypeItem: selectedTypeItemRef.current,
    initialItem,
    currentItem: itemsList ? itemsList[selectedTypeItemRef.current] : null,
    initialMemoValue,
    memo,
    initialIsNextDay,
    isNextDay,
    initialIsPreviousStartDay,
    isPreviousStartDay,
    isMoveComponent,
  });

  const onChangeMemo = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setMemo(e.currentTarget.value.slice(0, 255));
  };

  const isContainerComponent = () => {
    return selectedActivities && selectedActivities.length && selectedActivities[0].type === 'shift';
  };

  const onValidate = (msg: string | null): void => {
    setIsValid(!msg);
  };

  const onNextDay = () => {
    if (isMoveComponentRef.current) return;
    setLimits({ ...limits, isNextEndDay: !isNextDay, isPreviousStartDay: !isNextDay ? false : isPreviousStartDay });
    setIsNextDay(!isNextDay);
    setIsPreviousStartDay(false);
  };

  const onPreviousStartDay = () => {
    setLimits({
      ...limits,
      isPreviousStartDay: !isPreviousStartDay,
      isNextEndDay: !isPreviousStartDay ? false : isNextDay,
    });
    setIsPreviousStartDay(!isPreviousStartDay);
    setIsNextDay(false);
  };

  const handleClickSave = (e: React.MouseEvent | KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // setIsLoading(true);
    // if (!checkCorrectShiftTime()) return;
    setIsLoading(true);

    let newActivitiesWithUpdatedTime = SchSelectedActivity.updateActivityTime(selectedActivities, {
      start: DateUtils.setDayTime(
        selectedActivities[0].date,
        DateUtils.convertTo24h(String(timeStartRef.current)),
        false,
        isPreviousStartDayRef.current,
      ),
      end: DateUtils.setDayTime(
        selectedActivities[0].date,
        DateUtils.convertTo24h(String(timeEndRef.current)),
        isNextDayRef.current,
      ),
    });

    if (isShowMemo) {
      newActivitiesWithUpdatedTime = SchSelectedActivity.updateActivityMemo(newActivitiesWithUpdatedTime, {
        memo: memoRef.current,
      });
    }
    const item = { ...(isShowAllRef.current ? allItemsRef.current : itemsRef.current)[selectedTypeItemRef.current] };
    if (!isEmpty(item)) {
      newActivitiesWithUpdatedTime = SchSelectedActivity.updateActivityType(newActivitiesWithUpdatedTime, {
        item: item,
      });
    }

    try {
      const timeForMove = isMoveComponentRef.current
        ? +newActivitiesWithUpdatedTime[0].start - +selectedActivities[0].start
        : null;

      const { agents, warnings } = SchAgent.updateAgentDay({
        agents: selectedAgent,
        updatedActivities: newActivitiesWithUpdatedTime,
        timeForMove,
        isChangeType: !isEmpty(item),
        cleanMeetingRef: true,
      });
      const _newAgent = agents.find(a => a.agentId === selectedActivities[0].agentId);
      if (_newAgent) {
        SchAgent.isDaysOverlappingConflict(_newAgent);
        if (warnings.length) {
          handleClickCloseBtn();
          return dispatch(
            openWarningPopUp({
              isOpen: true,
              data: warnings.map(m => `${m}`).join('\n'),
              agents,
            }),
          );
        } else {
          dispatch(buildAgentDayInSnapshot({ modifiedAgentDays: agents }, false));
          handleClickCloseBtn();
        }
      }
    } catch (err: any) {
      const exceptionParams: IErrorPopUpParam = {
        isOpen: true,
        data: '',
      };
      setIsLoading(false);

      exceptionParams.data = err.message;
      dispatch(openErrorPopUp(exceptionParams));
    }
  };

  const handleClickCloseBtn = () => {
    setIsLoading(true);
    if (selectedActivities[0].type === SCH_STATE_TYPE[SchStateType.TIME_OFF]) {
      dispatch(setTimeOffs(null));
    } else if (selectedActivities[0].type === SCH_STATE_TYPE[SchStateType.BREAK]) {
      dispatch(setBreaks(null));
    } else if (selectedActivities[0].type === SCH_STATE_TYPE[SchStateType.MEAL]) {
      dispatch(setMeals(null));
    } else if (selectedActivities[0].type === SCH_STATE_TYPE[SchStateType.SHIFT]) {
      dispatch(setShifts(null));
    } else if (selectedActivities[0].type === SCH_STATE_TYPE[SchStateType.EXCEPTION]) {
      dispatch(setExceptions(null));
    }
    dispatch(closeMenu());
    // dispatch(setSelectedActivity([]));
  };

  usePopUpHotkeys({
    onSubmit: [handleClickSave, { enabled: isValid && isFormChanged }],
    onCancel: [handleClickCloseBtn],
  });

  const getDuration = (start?: any, end?: any) => {
    const startDate = start
      ? start
      : DateUtils.setDayTime(
          selectedActivities[0].date,
          DateUtils.convertTo24h(String(timeStartRef.current)),
          false,
          isPreviousStartDayRef.current,
        );

    const timeForMove = isMoveComponentRef.current ? startDate - selectedActivities[0].start : 0;
    const endDate = end
      ? end + timeForMove
      : DateUtils.setDayTime(
          selectedActivities[0].date,
          DateUtils.convertTo24h(String(timeEndRef.current)),
          isNextDayRef.current,
        ) + timeForMove;

    const diffMs = endDate - startDate;
    if (diffMs < 0) return 0;
    const diffDays = Math.floor(diffMs / 86400000);
    const diffHrs = Math.floor((diffMs % 86400000) / 3600000);
    const diffMins = parseInt(String(((diffMs % 86400000) % 3600000) / 60000), 10);
    const hours = diffDays * 24 + diffHrs;
    return DateUtils.addLeadingZero(hours) + ':' + DateUtils.addLeadingZero(diffMins);
  };

  const isShift = isNil(selectedActivities[0].stateIndex);

  const getHours = () => {
    let hours = ['12 AM', '2 AM', '4 AM', '6 AM', '8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM'];
    if (timeFormat === '24hours') {
      hours = [...Array(24).keys()].filter(key => key % 2 == 0).map(key => ('0' + key).slice(-2));
    }
    return hours.map((v: string, idx) => <div key={idx}>{v}</div>);
  };

  const getTime = (timestamp: number | string): string => {
    return DateUtils.timeConverter(typeof timestamp === 'string' ? parseInt(timestamp) : timestamp).split('T')[1];
  };

  const getTimeLineCoordinates = (timestamp: number | string, timelineWidth = 528, isTime = false): number => {
    const timestampCurrentDate = DateUtils.setUTCDate(currentDate);
    const timestampDate = typeof timestamp === 'number' ? timestamp : DateUtils.setUTCDate(timestamp);

    const dayDiff = Math.floor((timestampDate - timestampCurrentDate) / (1000 * 60 * 60 * 24));

    const hhmm = isTime && typeof timestamp !== 'number' ? timestamp.split(':') : getTime(timestamp).split(':');
    const timeCoordinates = (timelineWidth / (24 * 60)) * (parseInt(hhmm[0]) * 60 + parseInt(hhmm[1]));

    if (dayDiff !== 0 && !isTime) {
      return dayDiff * timelineWidth + timeCoordinates;
    }

    return dayDiff * timelineWidth + timeCoordinates;
  };

  // const getVisibleState = (states: ISchState[] = []): ISchState[] => {
  //   return states?.filter(s => s.type !== SchStateType.ACTIVITY_SET || s.id);
  // };

  const getTimelines = () => {
    const day = selectedAgent[0]?.days[selectedActivities[0]?.dayIndex];
    const isNextDay = isShift
      ? DateUtils.getDay(selectedActivities[0].start) < DateUtils.getDay(currentDate) &&
        DateUtils.getDay(currentDate) !== 1
      : DateUtils.getDay(day?.dayState?.startDateTime || 0) < DateUtils.getDay(currentDate) &&
        DateUtils.getDay(currentDate) !== 1;

    const startTimestamp = DateUtils.setDayTime(
      selectedActivities[0]?.date,
      DateUtils.convertTo24h(String(timeStartRef.current)),
      false,
      isPreviousStartDayRef.current,
    );
    const timeForMove = isMoveComponentRef.current ? startTimestamp - selectedActivities[0].shiftStart : 0;

    const start = isShift
      ? getTimeLineCoordinates(startTimestamp, 528)
      : getTimeLineCoordinates(day?.dayState?.startDateTime ?? 0, 528);
    const endTimestamp =
      DateUtils.setDayTime(
        selectedActivities[0]?.date,
        DateUtils.convertTo24h(String(timeEndRef.current)),
        isNextDay || isNextDayRef.current,
        false,
      ) + timeForMove;

    const end = isShift
      ? getTimeLineCoordinates(endTimestamp, 528)
      : getTimeLineCoordinates(day?.dayState?.endDateTime ?? 0, 528);

    const hours = Array.from({ length: 12 });
    const dayStateInfo = {
      isDayState: day?.dayState !== null,
      type: day?.dayState?.type || SchStateType.NONE,
      name: day?.dayState?.name || '',
      start: start,
      end: end,
      duration: 0,
      paid: day?.dayState?.paidMinutes ?? 0,
    };

    dayStateInfo.duration = Math.abs(end - start);

    let states: ISchState[] = clone(day.states);
    if (!isShift) {
      states = states.map((state, index) => {
        if (index === selectedActivities[0].stateIndex) {
          state.endDateTime = isValid
            ? DateUtils.setDayTime(
                selectedActivities[0].date,
                DateUtils.convertTo24h(String(timeEndRef.current)),
                false,
              )
            : 0;
          state.startDateTime = isValid
            ? DateUtils.setDayTime(
                selectedActivities[0].date,
                DateUtils.convertTo24h(String(timeStartRef.current)),
                false,
              )
            : 0;
        }
        return state;
      });
    }
    const shiftStyles = catalog[SCH_STATE_TYPE[dayStateInfo.type]];
    const isWorkExist = day.states.find(state => SchState.isWork(state));
    const catalogKey = SCH_STATE_TYPE[dayStateInfo.type];
    const itemColor = day?.dayState?.color;
    let externalColor: string | undefined = undefined;
    if (colorsFromApi !== undefined && Object.keys(colorsFromApi).length > 0) {
      const realKey = CatalogKeyReverted[catalogKey as keyof typeof CatalogKeyReverted];
      externalColor = colorsFromApi[realKey as keyof typeof colorsFromApi]?.color;
    }
    let color = 'rgba(0,0,0,0)';

    color = externalColor && customColorsTriger ? itemColor || externalColor : catalog[catalogKey].color;

    return (
      <>
        {hours.map((_, idx) => (
          <div key={idx} className={`${styles.stepBlock} ${idx === hours.length - 1 ? styles.last : ''}`}>
            <div className={styles.linePart}></div>
          </div>
        ))}
        <div className={styles.shiftWrapper}>
          {dayStateInfo?.isDayState && (
            <div
              className={styles.shiftBlock}
              datatype={SchStateType[dayStateInfo.type]}
              style={{
                left: `${dayStateInfo.start}px`,
                width:
                  dayStateInfo.type === SchStateType.SHIFT
                    ? `${dayStateInfo.duration - 2}px`
                    : `${dayStateInfo.duration}px`,
                height: shiftStyles.height,
                background:
                  dayStateInfo.type === SchStateType.SHIFT && isWorkExist
                    ? colorsFromApi['ACTIVITY']?.color || catalog[CatalogKey.ACTIVITY].color
                    : color,
                border: dayStateInfo.type === SchStateType.SHIFT ? shiftStyles.border : 'none',
                top: 0,
              }}
            >
              {states.map((s, idx) => {
                const cantBeMoved = itemsThatCantBeMovedWithShift.includes(s?.type);
                const timeForMoveIfException = cantBeMoved ? 0 : timeForMove;
                const start = getTimeLineCoordinates(+s.startDateTime + timeForMoveIfException, 528);
                const end = getTimeLineCoordinates(+s.endDateTime + timeForMoveIfException, 528);
                let type = SchState.isWorkSet(s) ? SchStateType.WORK_SET : s.type;
                type = SchState.isActivitySet(s) ? SchStateType.ACTIVITY_SET : type;
                type = SchState.isWork(s) ? SchStateType.ACTIVITY : type;

                const shiftItemStyles = catalog[SCH_STATE_TYPE[type]];
                let top = shiftItemStyles.top;
                if (type === SchStateType.MARKED_TIME) {
                  top = '0';
                }

                const catalogKey = SCH_STATE_TYPE[type];
                let externalColor: string | undefined = undefined;
                                if (colorsFromApi !== undefined && Object.keys(colorsFromApi).length > 0) {
                  const realKey = CatalogKeyReverted[catalogKey as keyof typeof CatalogKeyReverted];
                  externalColor = colorsFromApi[realKey as keyof typeof colorsFromApi]?.color;
                }
                let color = 'rgba(0,0,0,0)';

                color = externalColor && customColorsTriger ? s.color || externalColor : catalog[catalogKey].color;

                return (
                  <div
                    key={idx}
                    datatype={SchStateType[s.type]}
                    style={{
                      left: `${start - dayStateInfo.start}px`,
                      width: `${end - start}px`,
                      top: s.type === SchStateType.MARKED_TIME ? top : 0,
                      height: shiftItemStyles.height,
                      background: color,
                      zIndex: shiftItemStyles.zindex,
                    }}
                  ></div>
                );
              })}
            </div>
          )}
        </div>
      </>
    );
  };

  const getMeeting = () => {
    const payloadSnapshot = SchMeetingScheduler.prepareDataForOpenAgentSnapshot(
      {
        buId: [selectedAgent[0].buId],
        siteId: [selectedAgent[0].siteId],
        teamId: [selectedAgent[0].teamId],
        activities: [selectedActivities[0].id],
        agentId: [selectedActivities[0].agentId],
      },
      activeDate,
    );

    return restApi
      .openAgentSnapshot(payloadSnapshot)
      .then(resp => {
        if (resp.data && resp.data.snapshotId) {
          return resp.data;
        } else {
          return Promise.reject('Can not get agent snapshotId');
        }
      })
      .then(agentSnapshot => {
        const payloadMeetingSnapshot = SchMeetingScheduler.prepareDataForOpenMeetingSnapshot(agentSnapshot.snapshotId);
        return restApi.openMeetingSnapshot(payloadMeetingSnapshot);
      })
      .then(resp => {
        if (resp.data && resp.data.snapshotId) {
          return { snapshotId: resp.data.snapshotId, totalCount: resp.data.totalCount };
        } else {
          return Promise.reject('Can not get snapshotId');
        }
      })
      .then(meetingSnapshot => {
        const payloadMeetingFromSnapshot = SchMeetingScheduler.prepareDataForGetMeetingFromSnapshot(
          meetingSnapshot.snapshotId,
          meetingSnapshot.totalCount,
        );
        return restApi.getMeetingFromSnapshot(payloadMeetingFromSnapshot);
      });
  };

  useEffect(() => {
    if (selectedActivities[0].refType === RefType.MEETING) {
      getMeeting().then(resp => {
        const meetingName = resp.data?.find(
          (meeting: any) => meeting.id === selectedActivities[0].refId && meeting.name,
        )?.name;

        meetingName !== undefined && setMeetName(`, ${meetingName}`);
      });
    }
  }, []);

  const getItemName = () => {
    const name = Utils.capitalizeFirstLetter(selectedActivities[0]?.name);
    return `${name}${meetName}`;
  };
  return (
    <div className={styles.container}>
      <div
        className={
          isShowMemo ? styles.formWrapperWithMemo : isShowChangeType ? styles.formWrapper : styles.formWrapperSmall
        }
      >
        <div className={styles.header}>
          <span>Edit Item</span>
          <Cross onClick={handleClickCloseBtn} data-test={'modal-edit-cancel-button'} />
        </div>
        <div>
          <div className={styles.type}>
            <div className={styles.typeWrapper1}>
              <AgentInfo agentInfo={selectedAgent[0]} style={{ padding: 0 }} />
            </div>
            <div className={styles.delimeterVertical} />
            <div className={styles.typeWrapper1}>
              <div className={styles.header2}>Item</div>
              <div>
                <span>Type: </span>
                <span data-test={'edit-item-type'} className={styles.typeWrapper1Content}>
                  {Utils.capitalizeFirstLetter(selectedActivities[0]?.type)}
                </span>
              </div>
              <div>
                <span>Name: </span>
                <span data-test={'edit-item-name'} className={styles.typeWrapper1Content}>
                  {getItemName()}
                </span>
              </div>
              <div>
                <span>Duration: </span>
                <span data-test={'edit-item-duration'} className={styles.typeWrapper1Content}>
                  {getDuration()}
                </span>
              </div>
              {isShift ? (
                <div>
                  <span>Activities: </span>
                  <span data-test={'edit-item-activities'} className={styles.typeWrapper1Content}>
                    {selectedActivities[0].activities
                      ? Utils.capitalizeFirstLetter(selectedActivities[0].activities?.map(a => a.name).join(', '))
                      : null}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
          {isShowChangeType ? (
            <div className={styles.tableWrapper2}>
              {isLoading ? (
                <Spiner />
              ) : (
                <>
                  <div className={styles.tableSubWrapper2}>
                    <table>
                      <thead>
                        <tr>
                          {ShiftItemsToColumns[selectedActivities[0].type as keyof typeof ShiftItemsToColumns].map(
                            col => {
                              const name =
                                col.key === 'name'
                                  ? Utils.capitalizeFirstLetter(selectedActivities[0]?.type).replace('_', ' ')
                                  : col.name;
                              return (
                                <td key={col.name + '_name'}>
                                  <span>{name}</span>
                                </td>
                              );
                            },
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {(isShowAllRef.current ? allItemsRef.current : itemsRef.current).map((el, index) => {
                          // @ts-ignore
                          return (
                            <tr
                              key={index}
                              onClick={() => {
                                selectItems(index);
                              }}
                              className={`${selectedTypeItemRef.current === index ? styles.selected : ''}`}
                            >
                              {ShiftItemsToColumns[selectedActivities[0].type as keyof typeof ShiftItemsToColumns].map(
                                col => {
                                  const spanText =
                                    col.key === 'duration'
                                      ? DateUtils.convertMinutesToTime(Number(el[col.key as keyof typeof el]))
                                      : col.key === 'site'
                                      ? getSites(el)
                                      : col.key === ItemTypesColumns.SHIFT_TITLE.key
                                      ? getShiftTime(el)
                                      : el[col.key as keyof typeof el];
                                  return (
                                    <td key={col.name + '_el'}>
                                      {col.type === 'checkbox' ? (
                                        <span className={styles[col.className]}>
                                          <CheckboxBig
                                            icon={'mark'}
                                            checked={Boolean(el[col.key as keyof typeof el])}
                                          />
                                        </span>
                                      ) : (
                                        <span title={spanText as string} className={styles[col.className]}>
                                          {spanText}
                                        </span>
                                      )}
                                    </td>
                                  );
                                },
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {selectedActivities[0].type !== SCH_STATE_TYPE[SchStateType.EXCEPTION] ? (
                    <div className={`${styles.checkBoxWrap2}`}>
                      <Checkbox
                        checked={isShowAllRef.current}
                        onClick={onClickShowAll}
                        style={{ width: '10px', height: '10px', border: '#BCC4C8 solid 1px' }}
                      />
                      <span>Show all</span>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          ) : null}

          <div className={styles.tableWrapper}>
            <table>
              <thead>
                <tr>
                  <td>{getHours()}</td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{getTimelines()}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className={styles.data}>
            <AgentTime
              classNames={[styles.agentTime]}
              date={selectedActivities[0].date}
              agent={selectedAgent[0]}
              timeStart={timeStartRef.current}
              timeEnd={
                isMoveComponentRef.current
                  ? DateUtils.getTimeFromDate(selectedActivities[0].shiftEnd + timeForMoveRef.current)
                  : timeEndRef.current
              }
            />
            <div className={styles.dataStart}>
              <div className={timeFormat === '12hours' ? styles.dataStartTMWrapperBigger : styles.dataStartTMWrapper}>
                <InputTime
                  onChangeStartTime={setTimeStart}
                  onChangeEndTime={setTimeEnd}
                  startTime={timeStart}
                  endTime={timeEnd}
                  format={timeFormat}
                  limits={limits}
                  onValidate={onValidate}
                  disabledEndTime={
                    isMoveComponentRef.current ? DateUtils.getTimeFromDate(selectedActivities[0].end) : ''
                  }
                />
              </div>
              <span className={styles.localTimeZone}>
                {selectedTzSelector.timezoneId === 0
                  ? ''
                  : `${selectedTzSelector.name} (GMT ${selectedTzSelector.value > 0 ? '+' : ''}${
                      selectedTzSelector.value / 60
                    })`}
              </span>
            </div>
            <div className={styles.checkBoxes}>
              <div className={styles.checkBoxWrap} data-test={'next-day-end-checkbox'}>
                <Checkbox
                  disabled={isMoveComponentRef.current}
                  checked={isNextDay}
                  onClick={onNextDay}
                  style={{ height: '10px', width: '10px' }}
                />
                <span onClick={onNextDay}>End next day</span>
              </div>
              <div className={styles.checkBoxWrap} data-test={'previous-day-start-checkbox'}>
                <Checkbox
                  checked={isPreviousStartDay}
                  onClick={onPreviousStartDay}
                  style={{ height: '10px', width: '10px' }}
                />
                <span onClick={onPreviousStartDay}>Start on previous day</span>
              </div>
              {isContainerComponent() ? (
                <div
                  onClick={() => {
                    setIsNextDay(false);
                    setTimeEnd(DateUtils.getTimeFromDate(selectedActivities[0].end));
                    setIsMoveComponent(!isMoveComponentRef.current);
                  }}
                  className={styles.checkBoxWrap}
                  data-test={'move-schedule-items-checkbox'}
                >
                  <Checkbox checked={isMoveComponentRef.current} style={{ height: '10px', width: '10px' }} />
                  <span>Move schedule items with shift</span>
                </div>
              ) : null}
            </div>
          </div>
          {isShowMemo ? (
            <div className={styles.memoWrap}>
              <div className={styles.subHeader}>
                <span>Memo:</span>
              </div>
              <div className={styles.memoContainer}>
                <textarea name="memo" placeholder="Text here" value={memo ? memo : ''} onChange={onChangeMemo} />
              </div>
            </div>
          ) : null}
        </div>
        <div className={styles.footer}>
          <div className={styles.buttonWrap1}>
            <Button
              innerText={'Cancel'}
              click={() => handleClickCloseBtn()}
              style={{ background: '#FFFFFF', color: '#006FCF', border: '0.5px solid #0183F5', borderRadius: '5px' }}
            />
          </div>

          <div className={styles.buttonWrap2}>
            <Button
              innerText={'Apply'}
              click={handleClickSave}
              disable={!isValid || !isFormChanged}
              style={{ background: '#006FCF', color: '#FFFFFF', borderRadius: '5px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditShift;
