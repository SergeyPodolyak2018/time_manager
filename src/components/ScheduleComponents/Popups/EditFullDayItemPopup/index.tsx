import './TimePicker.scss';

import classnames from 'classnames';
import { isEmpty, omit } from 'ramda';
import React, { FC, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { TimePickerValue } from 'react-time-picker';
import useStateRef from 'react-usestateref';

import { SCH_STATE_TYPE } from '../../../../common/constants';
import { SchStateType } from '../../../../common/constants/schedule';
import { ISites } from '../../../../common/interfaces/config';
import { ISchState } from '../../../../common/interfaces/schedule/IAgentSchedule';
import DateUtils from '../../../../helper/dateUtils';
import SchAgent from '../../../../helper/schedule/SchAgent';
import SchSelectedActivity from '../../../../helper/schedule/SchSelectedActivity';
import SchUtils from '../../../../helper/schedule/SchUtils';
import Utils from '../../../../helper/utils';
import { usePopUpHotkeys } from '../../../../hooks';
import {
  buildAgentDayInSnapshot,
  closeEditFullDayItem,
  findExceptions,
  findTimeOffs,
  openErrorPopUp,
  setExceptions,
  setTimeOffs,
} from '../../../../redux/actions/timeLineAction';
import { useAppDispatch } from '../../../../redux/hooks';
import { getActiveDateSelector, getSelectedTzSelector } from '../../../../redux/selectors/controlPanelSelector';
import { getFilterData } from '../../../../redux/selectors/filterSelector';
import {
  getExceptions,
  getSelectedActivitySelector,
  getSelectedAgentSelector,
  getTimeFormat,
  getTimeOff,
  getIsUseCustomColors
} from '../../../../redux/selectors/timeLineSelector';
import { getColorByID } from '../../../../redux/selectors/colorsSelector';

import { IErrorPopUpParam, IException, ITimeOff } from '../../../../redux/ts/intrefaces/timeLine';
import { Cross } from '../../../../static/svg';
import Button from '../../../ReusableComponents/button';
import CheckboxBig from '../../../ReusableComponents/Checkbox';
import Checkbox from '../../../ReusableComponents/CheckboxStyled';
import InputTime, { ITimeLimit } from '../../../ReusableComponents/InputTime';
import InputTimeShort from '../../../ReusableComponents/InputTimeChort';
import Spiner from '../../../ReusableComponents/spiner';
import AgentInfo from '../common/AgentInfo';
import AgentTime from '../common/AgentTime';
import styles from './menu.module.scss';

type TGetFormChanged = {
  isNextDayInitial: boolean;
  isNextDay: boolean;
  isPreviousDayInitial: boolean;
  isPreviousStartDay: boolean;
  paidHoursInitial: string;
  paidHours: string;
  memo: string;
  memoInitialValue: string;
  timeStartInitial: string;
  timeStart: string;
  timeEndInitial: string;
  timeEnd: string;
  initialSelectedItem: number;
  selectedItem: number;
};
const getIsFormChanged = ({
  isNextDayInitial,
  isNextDay,
  isPreviousDayInitial,
  isPreviousStartDay,
  paidHoursInitial,
  paidHours,
  memo,
  memoInitialValue,
  timeStartInitial,
  timeStart,
  timeEndInitial,
  timeEnd,
  initialSelectedItem,
  selectedItem,
}: TGetFormChanged) => {
  return (
    isNextDayInitial !== isNextDay ||
    isPreviousDayInitial !== isPreviousStartDay ||
    paidHoursInitial !== paidHours ||
    memoInitialValue !== memo ||
    timeStartInitial !== timeStart ||
    timeEndInitial !== timeEnd ||
    initialSelectedItem !== selectedItem
  );
};

const EditFullDayItem: FC = () => {
  const dispatch = useAppDispatch();

  const selectedActivities = useSelector(getSelectedActivitySelector);
  const selectedAgent = useSelector(getSelectedAgentSelector);
  const isTimeOff = selectedActivities[0].type === SCH_STATE_TYPE[SchStateType.TIME_OFF];
  const selectedTzSelector = useSelector(getSelectedTzSelector);
  const currentDate = useSelector(getActiveDateSelector);
  const timeFormat = useSelector(getTimeFormat);
  const colorsFromApi= useSelector(getColorByID(selectedAgent[0].buId));
  const customColorsTriger = useSelector(getIsUseCustomColors)

  // const timeZoneSelector = useSelector(getTimezonesSelector);
  const timeStartInitial = DateUtils.getTimeFromDate(selectedActivities[0].start);
  const [timeStart, setTimeStart, timeStartRef] = useStateRef(timeStartInitial);
  const timeEndInitial = DateUtils.getTimeFromDate(selectedActivities[0].end);
  const [timeEnd, setTimeEnd, timeEndRef] = useStateRef(timeEndInitial);

  const isNextDayInitial = DateUtils.getDay(currentDate) !== DateUtils.getDay(selectedActivities[0].end);
  const [isNextDay, setIsNextDay, isNextDayRef] = useStateRef(() => isNextDayInitial);
  const isPreviousDayInitial = DateUtils.getDay(currentDate) !== DateUtils.getDay(selectedActivities[0].start);
  const [isPreviousStartDay, setIsPreviousStartDay, isPreviousStartDayRef] = useStateRef(() => isPreviousDayInitial);
  const [isValid, setIsValid] = useState<boolean>(true);
  const [limits, setLimits] = useStateRef<ITimeLimit>({});

  const timeOffsList = useSelector(getTimeOff);
  const exceptionsList = useSelector(getExceptions);
  const filterData = useSelector(getFilterData);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isShowAll, setIsShowAll, isShowAllRef] = useStateRef<boolean>(false);
  const customTimeRange =
    DateUtils.getTimeFromDate(selectedActivities[0].start) !== DateUtils.getTimeFromDate(selectedActivities[0].end); // TODO
  const [, setIsSpecifyStartEnd, isSpecifyStartEndRef] = useStateRef<boolean>(customTimeRange);
  const [, setIsSpecifyPaid, isSpecifyPaidRef] = useStateRef<boolean>(selectedActivities[0].isPaid || false);
  const [items, setItem, itemsRef] = useStateRef<ITimeOff[] | IException[] | null>(null);
  const [allItems, setAllItem, allItemsRef] = useStateRef<ITimeOff[] | IException[] | null>(null);
  const [selectedItem, setSelectedItem, selectedItemRef] = useStateRef<number>(-1);
  const paidHoursInitial = DateUtils.convertMinutesToTime(selectedActivities[0].paidMinutes || 0);
  const [paidHours, setPaidHours, paidHoursRef] = useStateRef<string>(paidHoursInitial);
  const [initialSelectedItem, setInitialSelectedItem] = useState<number>(-1);
  const [, setItemsPayload, itemsPayloadRef] = useStateRef<any>({
    buId: 0,
    siteId: 0,
    shiftId: 0,
    teamId: 0,
    agentId: 0,
  });
  const isShowMemo =
    selectedActivities[0].type === SCH_STATE_TYPE[SchStateType.TIME_OFF] ||
    selectedActivities[0].type === SCH_STATE_TYPE[SchStateType.EXCEPTION];

  const currentItemList = isShowAll ? allItems ?? [] : items ?? [];

  let memoInitialValue = '';
  if (isShowMemo) {
    if (selectedActivities[0].stateIndex === undefined) {
      memoInitialValue = selectedAgent[0]?.days[selectedActivities[0]?.dayIndex].dayState?.memo || '';
    } else {
      memoInitialValue =
        selectedAgent[0]?.days[selectedActivities[0]?.dayIndex].states.find(
          state =>
            state.startDateTime === selectedActivities[0].start && state.endDateTime === selectedActivities[0].end,
        )?.memo || '';
    }
  }

  const [memo, setMemo, memoRef] = useStateRef<string>(memoInitialValue || '');

  const selectItems = (index: number) => {
    const selectedItemIndex = selectedItemRef.current !== index ? index : -1;
    setSelectedItem(selectedItemIndex);

    if (
      currentItemList[selectedItemIndex] &&
      'isPaid' in currentItemList[selectedItemIndex] &&
      !currentItemList[selectedItemIndex].isPaid
    ) {
      setIsSpecifyPaid(false);
    }
  };

  const getSites = (item: ITimeOff | IException): string => {
    return item.siteInfo.map(info => info?.name ?? '').join(', ');
  };

  const onClickShowAll = () => {
    if (!isTimeOff) return;

    const isShowAllState = !isShowAllRef.current;
    if (isShowAllState && allItems === null) {
      setIsLoading(true);
      initTimeOffList(isShowAllState);
    }

    setIsShowAll(isShowAllState);
    setSelectedItem(-1);
  };

  const initTimeOffList = (showAll: boolean) => {
    let payload = { ...itemsPayloadRef.current };
    if (showAll) {
      payload = omit(['agentId', 'teamId', 'shiftId'], payload);
    }
    dispatch(findTimeOffs(payload));
  };

  const initExceptionsList = () => {
    if (!selectedAgent.length) return;

    const payload = { ...itemsPayloadRef.current };
    payload.shiftId = 0;
    payload.buId = selectedAgent[0].buId;
    payload.siteId = selectedAgent[0].siteId;

    dispatch(findExceptions(payload));
  };

  const isSpecifyPaidDisabled = (): boolean => {
    return selectedItem === -1 || !(currentItemList?.length && currentItemList[selectedItem].isPaid);
  };

  const onClickedSpecifyPaid = () => {
    if (isSpecifyPaidDisabled()) return;
    setIsSpecifyPaid(!isSpecifyPaidRef.current);
  };

  const onChangePaidHours = (value: TimePickerValue) => {
    setPaidHours(value.toString());
  };

  const onClickSpecifyStartEnd = () => {
    setIsSpecifyStartEnd(!isSpecifyStartEndRef.current);
  };

  useEffect(() => {
    if (
      selectedActivities[0].type !== SCH_STATE_TYPE[SchStateType.SHIFT] &&
      selectedActivities[0].type !== SCH_STATE_TYPE[SchStateType.ACTIVITY] &&
      selectedActivities[0].type !== SCH_STATE_TYPE[SchStateType.ACTIVITY_SET] &&
      !(
        selectedActivities[0].type === SCH_STATE_TYPE[SchStateType.TIME_OFF] &&
        selectedActivities[0].stateIndex === undefined
      ) &&
      !(
        selectedActivities[0].type === SCH_STATE_TYPE[SchStateType.EXCEPTION] &&
        selectedActivities[0].stateIndex === undefined
      )
    ) {
      setLimits({
        start: selectedActivities[0].shiftStart
          ? DateUtils.getTimeFromDate(selectedActivities[0]?.shiftStart ?? 0)
          : undefined,
        end: selectedActivities[0]?.shiftEnd
          ? DateUtils.getTimeFromDate(selectedActivities[0]?.shiftEnd ?? 0)
          : undefined,
        isNextEndDay: isNextDay,
        isPreviousStartDay: isPreviousStartDay,
      });
    } else {
      setLimits({ ...limits, isNextEndDay: isNextDay, isPreviousStartDay: isPreviousStartDay });
    }
  }, [isValid]);

  useEffect(() => {
    if (!isTimeOff) return;
    if (!Array.isArray(timeOffsList)) return;
    // if (timeOffsList.length) {

    if (isShowAll) setAllItem(timeOffsList);
    else setItem(timeOffsList);

    const selectedItem = timeOffsList.findIndex(e => e.id === selectedActivities[0]._id);
    if (selectedItem === -1 && !isShowAll) {
      onClickShowAll();
    } else {
      setIsLoading(false);
      setSelectedItem(selectedItem);
      setInitialSelectedItem(selectedItem);
    }
  }, [timeOffsList]);

  useEffect(() => {
    if (isTimeOff) return;
    if (Array.isArray(exceptionsList)) {
      setIsLoading(false);
      if (exceptionsList.length) {
        const exceptions = exceptionsList
          .filter((e: IException) => e.isFullDay)
          .map((e: IException) => {
            const _e: IException = { ...e };
            const sites: ISites = filterData[e.buId].sites;
            _e.sites = _e.siteId.reduce((acc: ISites, sid: number) => ({ ...acc, [sid]: sites[sid] }), {});
            return _e;
          });

        if (itemsRef.current === null) setItem(exceptions);
        const selectedItem = exceptions.findIndex(e => e.id === selectedActivities[0]._id);
        setSelectedItem(selectedItem);
        setInitialSelectedItem(selectedItem);
      }
      // if (isLoading) setIsLoading(false);
    }
  }, [exceptionsList]);

  useEffect(() => {
    if (isLoading) {
      const payload = {
        buId: 0,
        siteId: 0,
        shiftId: 0,
        teamId: 0,
        agentId: 0,
      };
      // setIsSpecifyStartEnd(false);
      if (!selectedAgent.length) return;
      payload.buId = selectedAgent[0].buId;
      payload.siteId = selectedAgent[0].siteId;
      payload.agentId = selectedAgent[0].agentId;
      payload.teamId = selectedAgent[0].teamId;
      setItemsPayload(payload);
      if (isTimeOff) {
        initTimeOffList(false);
      } else {
        initExceptionsList();
      }
    }
  }, [selectedActivities]);

  useEffect(() => {
    if (!isSpecifyStartEndRef.current) {
      const { tzSite, tzSelected } = selectedAgent[0]._TZ_INTERNAL_USAGE;
      const start = SchUtils.convertTimeToSelectedTz(
        '00:00',
        selectedActivities[0].dayDate,
        timeFormat,
        tzSite,
        tzSelected,
      );
      const end = SchUtils.convertTimeToSelectedTz(
        '00:00',
        selectedActivities[0].dayDate,
        timeFormat,
        tzSite,
        tzSelected,
      );
      setTimeStart(start);
      setTimeEnd(end);
      setIsNextDay(isNextDayInitial);
    } else {
      setTimeStart(timeStartInitial);
      setTimeEnd(timeEndInitial);
      setIsNextDay(isNextDayInitial);
    }
  }, [isSpecifyStartEndRef.current]);

  const onChangeMemo = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setMemo(e.currentTarget.value);
  };

  const onValidate = (msg: string | null): void => {
    setIsValid(!msg);
  };

  const onNextDay = () => {
    if (!isSpecifyStartEndRef.current) return;
    setLimits({ ...limits, isNextEndDay: !isNextDay, isPreviousStartDay: !isNextDay ? false : isPreviousStartDay });
    setIsNextDay(!isNextDay);
    setIsPreviousStartDay(false);
  };

  const onPreviousStartDay = () => {
    if (!isSpecifyStartEndRef.current) return;
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
    let updatedActivity = selectedActivities;
    const item = isShowAllRef.current
      ? (allItemsRef.current ?? [])[selectedItemRef.current]
      : (itemsRef.current ?? [])[selectedItemRef.current];
    if (!item) return;

    updatedActivity = SchSelectedActivity.updateActivityTime(updatedActivity, {
      start: DateUtils.setDayTime(
        updatedActivity[0].date,
        DateUtils.convertTo24h(String(timeStartRef.current)),
        false,
        isPreviousStartDayRef.current,
      ),
      end: DateUtils.setDayTime(
        updatedActivity[0].date,
        DateUtils.convertTo24h(String(timeEndRef.current)),
        isNextDayRef.current,
      ),
    });

    updatedActivity = SchSelectedActivity.updateActivityMemo(updatedActivity, {
      memo: memoRef.current,
    });
    updatedActivity = updatedActivity.map(activity => {
      activity.id = activity._id; // TODO ...
      return activity;
    });
    updatedActivity = updatedActivity.map(activity => {
      activity.isPaid = item.isPaid;
      activity.paidMinutes =
        item.isPaid && isSpecifyPaidRef.current ? DateUtils.convertTimeToMinutes(String(paidHoursRef.current)) : 0;
      activity.isFullDay = !isSpecifyStartEndRef.current;
      return activity;
    });
    try {
      const newAgents = SchAgent.updateAgentDay({
        agents: selectedAgent,
        updatedActivities: updatedActivity,
        timeForMove: null,
        isChangeType: false,
        item: item as ITimeOff,
      }).agents;
      const _newAgent = newAgents.find(a => a.agentId === selectedActivities[0].agentId);
      if (_newAgent) {
        SchAgent.isDaysOverlappingConflict(_newAgent);
        dispatch(buildAgentDayInSnapshot({ modifiedAgentDays: newAgents }, false, true));
        handleClickCloseBtn();
      }
    } catch (err: any) {
      const exceptionParams: IErrorPopUpParam = {
        isOpen: true,
        data: '',
      };

      exceptionParams.data = err.message;
      dispatch(openErrorPopUp(exceptionParams));
    }
  };

  const handleClickCloseBtn = () => {
    dispatch(setTimeOffs(null));
    dispatch(setExceptions(null));
    dispatch(closeEditFullDayItem());
    // dispatch(setSelectedActivity([]));
  };

  const getDuration = (start?: any, end?: any) => {
    const endDate = end
      ? end
      : DateUtils.setDayTime(
          selectedActivities[0].date,
          DateUtils.convertTo24h(String(timeEndRef.current)),
          isNextDayRef.current,
        );
    const startDate = start
      ? start
      : DateUtils.setDayTime(
          selectedActivities[0].date,
          DateUtils.convertTo24h(String(timeStartRef.current)),
          false,
          isPreviousStartDayRef.current,
        );
    const diffMs = endDate - startDate;
    if (diffMs < 0) return 0;
    const diffDays = Math.floor(diffMs / 86400000);
    const diffHrs = Math.floor((diffMs % 86400000) / 3600000);
    const diffMins = parseInt(String(((diffMs % 86400000) % 3600000) / 60000), 10);
    const hours = diffDays * 24 + diffHrs;
    return DateUtils.addLeadingZero(hours) + ':' + DateUtils.addLeadingZero(diffMins);
  };

  const isShift = selectedActivities[0].type === SCH_STATE_TYPE[SchStateType.SHIFT];

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

  const getTimeLineCoordinates = (timestamp: number | string, endLimit = 1, isTime = false): number => {
    const hhmm = isTime && typeof timestamp !== 'number' ? timestamp.split(':') : getTime(timestamp).split(':');
    return (endLimit / (24 * 60)) * (parseInt(hhmm[0]) * 60 + parseInt(hhmm[1]));
  };

  const getVisibleState = (states: ISchState[] = []): ISchState[] => {
    return (states ?? []).filter(s => s.type !== SchStateType.ACTIVITY_SET || s.id);
  };

  const getTimelines = () => {
    const day = selectedAgent[0]?.days[selectedActivities[0]?.dayIndex];
    const isNextDay = isShift
      ? DateUtils.getDay(selectedActivities[0].start) < DateUtils.getDay(currentDate) &&
        DateUtils.getDay(currentDate) !== 1
      : DateUtils.getDay(day?.dayState?.startDateTime || 0) < DateUtils.getDay(currentDate) &&
        DateUtils.getDay(currentDate) !== 1;
    const hours = Array.from({ length: 12 });
    const dayStateInfo = {
      isDayState: day?.dayState !== null,
      type: day?.dayState?.type || SchStateType.NONE,
      name: day?.dayState?.name || '',
      start:
        isShift || selectedActivities[0].stateIndex === undefined
          ? getTimeLineCoordinates(
              DateUtils.setDayTime(
                selectedActivities[0]?.date ?? 0,
                DateUtils.convertTo24h(String(timeStartRef.current)),
                false,
              ) ?? 0,
              528,
            )
          : getTimeLineCoordinates(day?.dayState?.startDateTime ?? 0, 528),
      end:
        isShift || selectedActivities[0].stateIndex === undefined
          ? getTimeLineCoordinates(
              DateUtils.setDayTime(
                selectedActivities[0]?.date ?? 0,
                DateUtils.convertTo24h(String(timeEndRef.current)),
                isNextDay,
              ) ?? 0,
              528,
            )
          : getTimeLineCoordinates(day?.dayState?.endDateTime ?? 0, 528),
      duration: 0,
      paid: day?.dayState?.paidMinutes ?? 0,
      color:day?.dayState?.color,
    };

    dayStateInfo.duration =
      isShift || selectedActivities[0].stateIndex === undefined
        ? getTimeLineCoordinates(getDuration(), 528, true)
        : getTimeLineCoordinates(getDuration(day?.dayState?.startDateTime, day?.dayState?.endDateTime), 528, true);
    if (isPreviousStartDayRef.current) {
      dayStateInfo.duration = dayStateInfo.duration - (528 - dayStateInfo.start);
      dayStateInfo.start = 0;
    } else {
      dayStateInfo.duration =
        528 - dayStateInfo.start < dayStateInfo.duration ? 528 - dayStateInfo.start : dayStateInfo.duration;
    }

    let states = day?.states.map(a => ({ ...a }));
    if (!isShift) {
      states = (states ?? []).map(state => {
        if (state.startDateTime === selectedActivities[0].start && state.endDateTime === selectedActivities[0].end) {
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
              datatype={`${customColorsTriger?SchStateType[dayStateInfo.type]+'-block':SchStateType[dayStateInfo.type]}`}
              style={{ left: `${dayStateInfo.start}px`, width: `${dayStateInfo.duration}px`, backgroundColor: `${customColorsTriger?dayStateInfo.color || colorsFromApi[SchStateType[dayStateInfo.type] as keyof typeof colorsFromApi]?.color:''}` }}
            >
              {getVisibleState(states).map((s, idx) => {
                const start = getTimeLineCoordinates(s.startDateTime, 528);
                const end = getTimeLineCoordinates(s.endDateTime, 528);

                return (
                  <div
                    key={idx}
                    datatype={`${customColorsTriger?SchStateType[s.type]+'-block':SchStateType[s.type]}`}
                    style={{ left: `${start - dayStateInfo.start}px`, width: `${end - start}px`, backgroundColor: `${customColorsTriger?dayStateInfo.color || colorsFromApi[SchStateType[s.type] as keyof typeof colorsFromApi]?.color:''}`}}
                  ></div>
                );
              })}
            </div>
          )}
        </div>
      </>
    );
  };

  const renderItemsTable = () => {
    if (isTimeOff) {
      return (
        <div className={styles.tableTimeOffs}>
          {isLoading ? (
            <Spiner />
          ) : (
            <>
              <div className={styles.tableSubWrapper}>
                <table>
                  <thead>
                    <tr>
                      <td>
                        <span>Time-Off Types</span>
                      </td>
                      <td>
                        <span>Short</span>
                      </td>
                      <td>
                        <span>Site</span>
                      </td>
                      <td>
                        <span>Paid</span>
                      </td>
                      <td>
                        <span>Counts</span>
                      </td>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItemList.map((el, index) => {
                      return (
                        <tr
                          key={index}
                          onClick={() => {
                            selectItems(index);
                          }}
                          className={`${selectedItem === index ? styles.selected : ''}`}
                        >
                          <td>
                            <span title={el.name} className={styles.firstTd}>
                              {el.name}
                            </span>
                          </td>
                          <td>
                            <span title={el.shortName} className={styles.secTd}>
                              {el.shortName}
                            </span>
                          </td>
                          <td>
                            <span title={getSites(el as ITimeOff)} className={styles.thrTd}>
                              {getSites(el as ITimeOff)}
                            </span>
                          </td>
                          <td>
                            <span className={styles.fthTd}>
                              <CheckboxBig icon={'mark'} checked={el.isPaid} />
                            </span>
                          </td>
                          <td>
                            <span className={styles.sthTd}>
                              <CheckboxBig icon={'mark'} checked={(el as ITimeOff).isHasLimit} />
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div data-test={'time-off-show-all'} className={styles.checkBoxWrap2}>
                <Checkbox checked={isShowAll} onClick={onClickShowAll} style={{ border: '#BCC4C8 solid 1px' }} />
                <span>Show all</span>
              </div>
            </>
          )}
        </div>
      );
    } else {
      return (
        <div className={styles.tableExceptions}>
          {isLoading ? (
            <Spiner />
          ) : (
            <table>
              <thead>
                <tr>
                  <td>
                    <span>Exception</span>
                  </td>
                  <td>
                    <span>Short</span>
                  </td>
                  <td>
                    <span>Site</span>
                  </td>
                  <td>
                    <span>Paid</span>
                  </td>
                  <td>
                    <span>Convertible</span>
                  </td>
                  <td>
                    <span>Time off</span>
                  </td>
                </tr>
              </thead>
              <tbody>
                {(items ?? []).map((el, index) => {
                  return (
                    <tr
                      key={index}
                      onClick={() => selectItems(index)}
                      className={`${selectedItem === index ? styles.selected : ''}`}
                    >
                      <td>
                        <span title={el.name} className={styles.firstTd}>
                          {el.name}
                        </span>
                      </td>
                      <td>
                        <span title={el.shortName} className={styles.secTd}>
                          {el.shortName}
                        </span>
                      </td>
                      <td>
                        <span title={getSites(el as IException)} className={styles.thrTd}>
                          {getSites(el as IException)}
                        </span>
                      </td>
                      <td>
                        <span className={styles.fthTd}>
                          <CheckboxBig icon={'mark'} checked={el.isPaid} />
                        </span>
                      </td>
                      <td>
                        <span className={styles.vthTd}>
                          <CheckboxBig
                            icon={'mark'}
                            checked={(el as IException).isConvertable2dayOff ?? (el as IException).isFullDay}
                          />
                        </span>
                      </td>
                      <td>
                        <span className={styles.sthTd}>
                          <CheckboxBig icon={'mark'} checked={(el as IException).isUsedAsVacation} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      );
    }
  };

  const isFormDataChanged = getIsFormChanged({
    isNextDayInitial,
    isNextDay,
    isPreviousDayInitial,
    isPreviousStartDay,
    paidHoursInitial,
    paidHours,
    memo,
    memoInitialValue,
    timeStartInitial,
    timeStart,
    timeEndInitial,
    timeEnd,
    initialSelectedItem,
    selectedItem,
  });

  const isSaveDisabled = (!isEmpty(allItems) && selectedItem < 0) || !isValid || !isFormDataChanged;
  usePopUpHotkeys({ onSubmit: [handleClickSave, { enabled: !isSaveDisabled }], onCancel: [handleClickCloseBtn] });

  return (
    <div className={styles.container}>
      <div className={isShowMemo ? styles.formWrapperWithMemo : styles.formWrapper}>
        <div className={styles.header}>
          <span>{isTimeOff ? 'Edit Full-Day Time Off' : 'Edit Full-Day Exception'}</span>
          <Cross onClick={handleClickCloseBtn} data-test={'modal-edit-cancel-button'} />
        </div>
        <div className={styles.body}>
          <div className={styles.type}>
            <div className={classnames([styles.typeWrapper1, styles.typeWrapper1__pd0])}>
              <AgentInfo agentInfo={selectedAgent[0]} />
            </div>
            <div className={styles.delimeterVertical} />
            <div className={styles.typeWrapper1}>
              <div className={styles.header2}>Item</div>
              <div>
                <span>Type: </span>
                <span data-test={'edit-item-type'} className={styles.typeWrapper1Content}>
                  {Utils.capitalizeFirstLetter(selectedActivities[0]?.type ?? '')}
                </span>
              </div>
              <div>
                <span>Name: </span>
                <span data-test={'edit-item-name'} className={styles.typeWrapper1Content}>
                  {Utils.capitalizeFirstLetter(selectedActivities[0]?.name ?? '')}
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
                    {Utils.capitalizeFirstLetter(selectedActivities[0].activities.map(a => a.name).join(', '))}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {renderItemsTable()}
          <AgentTime
            style={{ paddingLeft: '25px' }}
            agent={selectedAgent[0]}
            timeStart={timeStart}
            timeEnd={timeEnd}
            date={selectedActivities[0].date}
          />
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
            {isTimeOff ? (
              <div className={styles.fullDay}>
                <Checkbox
                  checked={true}
                  style={{
                    width: '10px',
                    height: '10px',
                    cursor: 'point',
                  }}
                  disabled={true}
                />
                <span>Full Day</span>
              </div>
            ) : null}
            <div className={styles.dataFlex}>
              <div className={styles.dataStart}>
                <div className={`${styles.checkBoxWrap}`} data-test={'specify-start-end-checkbox'}>
                  <Checkbox
                    onClick={onClickSpecifyStartEnd}
                    checked={isSpecifyStartEndRef.current}
                    style={{
                      width: '10px',
                      height: '10px',
                      cursor: 'point',
                    }}
                  />
                  <span onClick={onClickSpecifyStartEnd}>Specify start/end</span>
                </div>
                <div className={styles.dateStartContent}>
                  <div
                    className={timeFormat === '12hours' ? styles.dataStartTMWrapperBigger : styles.dataStartTMWrapper}
                  >
                    <InputTime
                      onChangeStartTime={setTimeStart}
                      onChangeEndTime={setTimeEnd}
                      startTime={timeStart}
                      endTime={timeEnd}
                      format={timeFormat}
                      limits={limits}
                      onValidate={onValidate}
                      disabled={!isSpecifyStartEndRef.current}
                      onChange={() => {}}
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
              </div>
              <div className={styles.paidHours}>
                <div
                  onClick={onClickedSpecifyPaid}
                  className={`${styles.checkBoxWrap}  ${isSpecifyPaidDisabled() ? styles.disabled : ''}`}
                  data-test={'specify-paid-hours-checkbox'}
                  style={{
                    cursor: !isSpecifyPaidDisabled() ? 'pointer' : 'default',
                  }}
                >
                  <Checkbox
                    checked={isSpecifyPaidRef.current}
                    style={{
                      width: '10px',
                      height: '10px',
                      border: isSpecifyPaidDisabled() ? '#BCC4C8 solid 1px' : null,
                    }}
                    disabled={isSpecifyPaidDisabled()}
                  />
                  <span>Specify paid hours</span>
                </div>
                <div className={styles.dataSpecifyTMWrapper}>
                  <InputTimeShort
                    onChange={onChangePaidHours}
                    defaultTime={paidHoursRef.current}
                    isEndTime={true}
                    disabled={!isSpecifyPaidRef.current}
                    onValidate={onValidate}
                    is0Forbidden={true}
                  />
                </div>
              </div>
            </div>
            <div className={styles.checkBoxes}>
              <div className={styles.checkBoxWrap} data-test={'next-day-end-checkbox'}>
                <Checkbox
                  checked={isNextDay}
                  onClick={onNextDay}
                  style={{
                    height: '10px',
                    width: '10px',
                    border: isSpecifyStartEndRef.current ? null : '#BCC4C8 solid 1px',
                    filter: isSpecifyStartEndRef.current
                      ? null
                      : 'invert(50%) sepia(67%) saturate(0%) hue-rotate(155deg) contrast(400%)',
                    cursor: isSpecifyStartEndRef.current ? 'point' : 'default',
                  }}
                  disabled={!isSpecifyStartEndRef.current}
                />
                <span onClick={onNextDay}>End next day</span>
              </div>
              <div className={styles.checkBoxWrap} data-test={'previous-day-start-checkbox'}>
                <Checkbox
                  checked={isPreviousStartDay}
                  onClick={onPreviousStartDay}
                  style={{
                    height: '10px',
                    width: '10px',
                    border: isSpecifyStartEndRef.current ? null : '#BCC4C8 solid 1px',
                    filter: isSpecifyStartEndRef.current
                      ? null
                      : 'invert(50%) sepia(67%) saturate(0%) hue-rotate(155deg) contrast(400%)',
                    cursor: isSpecifyStartEndRef.current ? 'point' : 'default',
                  }}
                  disabled={!isSpecifyStartEndRef.current}
                />
                <span onClick={onPreviousStartDay}>Start on previous day</span>
              </div>
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
              disable={isSaveDisabled}
              style={{ background: '#006FCF', color: '#FFFFFF', borderRadius: '5px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditFullDayItem;
