import '../NewShiftMenu/TimePicker.css';

import { clone } from 'ramda';
import React, { FC, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { TimePickerValue } from 'react-time-picker';
import useStateRef from 'react-usestateref';

import Api from '../../../../api/rest';
import { IFindShiftItemsPayload } from '../../../../api/ts/interfaces/config.payload';
import { ISchState } from '../../../../common/interfaces/schedule/IAgentSchedule';
import DateUtils from '../../../../helper/dateUtils';
import SchDay from '../../../../helper/schedule/SchDay';
import Utils from '../../../../helper/utils';
import { usePopUpHotkeys } from '../../../../hooks';
import {
  buildAgentDayInSnapshot,
  findBreaks,
  findExceptions,
  findMeals,
  findTimeOffs,
  openErrorPopUp,
  setOpenEditMultiple,
} from '../../../../redux/actions/timeLineAction';
import { useAppDispatch } from '../../../../redux/hooks';
import {
  getBreaks,
  getDataSelector,
  getExceptions,
  getMeals,
  getSelectedActivitySelector,
  getTimeFormat,
  getTimeOff,
} from '../../../../redux/selectors/timeLineSelector';
import { IAgentTimeline } from '../../../../redux/ts/intrefaces/timeLine/IAgentTimeline';
import Button from '../../../ReusableComponents/button';
import Checkbox from '../../../ReusableComponents/CheckboxStyled';
import InputTimeShort from '../../../ReusableComponents/InputTimeChort';
import Spiner from '../../../ReusableComponents/spiner';
import styles from './menu.module.scss';
import logger from '../../../../helper/logger';
import { Cross } from '../../../../static/svg';
import RegularTable from './view/regularTable';
import ShiftTable from './view/shiftTable';
import BreakTable from './view/breakTable';
import ExceptionTable from './view/exceptionTable';
import SchState from '../../../../helper/schedule/SchState';
import SchAgent from '../../../../helper/schedule/SchAgent';
import SchSelectedActivity from '../../../../helper/schedule/SchSelectedActivity';
import { SchStateType } from '../../../../common/constants/schedule';

export interface IEditMultipleMenuMenuProps {
  isFullDay?: boolean;
}

const EditMultipleMenu: FC<IEditMultipleMenuMenuProps> = () => {
  const dispatch = useAppDispatch();

  const breakList = useSelector(getBreaks);
  const mealList = useSelector(getMeals);
  const exceptionList = useSelector(getExceptions);
  const timeOffList = useSelector(getTimeOff);
  const [shiftList, setShiftList] = useState<any | null>(null);

  const timeFormat = useSelector(getTimeFormat);
  const selectedActivities = useSelector(getSelectedActivitySelector);
  const timeLineData = useSelector(getDataSelector);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [, setActivitiesType, activitiesTypeRef] = useStateRef<string>('None');
  const [, setItems, itemsRef] = useStateRef<any[]>([]);
  const [, setSelectedItem, selectedItemRef] = useStateRef<number>(-1);
  const [, setInitSelectedIds, initSelectedIdsRef] = useStateRef<number[]>([]);
  const [, setTargetAgentTimeLine, targetAgentTimeLineRef] = useStateRef<IAgentTimeline[]>([]);

  const [, setMoveStartTime, moveStartTimeRef] = useStateRef<string>('00:00');
  const [, setStartTime, startTimeRef] = useStateRef<string>('00:00');
  const [, setDuration, durationRef] = useStateRef<string>('00:00');

  const [, setIsCheckedMoveToStart, isCheckedMoveToStartRef] = useStateRef<boolean>(true);
  const [, setIsCheckedForward, isCheckedForwardRef] = useStateRef<boolean>(true);
  const [, setIsCheckedBackward, isCheckedBackwardRef] = useStateRef<boolean>(false);
  const [, setIsCheckedSetStartTime, isCheckedSetStartTimeRef] = useStateRef<boolean>(false);
  const [, setIsCheckedNextStartDay, isCheckedNextStartDayRef] = useStateRef<boolean>(false);
  const [, setIsCheckedChangeDuration, isCheckedChangeDurationRef] = useStateRef<boolean>(false);
  const [, setIsDisableChangeType, isDisableChangeTypeRef] = useStateRef<boolean>(false);

  const isChanged = () => {
    const isItemChanged =
      selectedItemRef.current !== -1 && initSelectedIdsRef.current[0] !== itemsRef.current[selectedItemRef.current]?.id;

    const startTimeChanged = startTimeRef.current !== DateUtils.getTimeFromDate(selectedActivities[0]?.start);

    const durationChanged =
      durationRef.current !==
      DateUtils.getTimeFromDate(
        DateUtils.getRound1mTimestamp(selectedActivities[0]?.end - selectedActivities[0]?.start),
      );

    const moveStartTimeChanged = moveStartTimeRef.current !== '00:00';
    const booleansChanged =
      isCheckedMoveToStartRef.current !== true ||
      isCheckedSetStartTimeRef.current !== false ||
      isCheckedChangeDurationRef.current !== false ||
      isDisableChangeTypeRef.current !== false;

    return isItemChanged || startTimeChanged || durationChanged || moveStartTimeChanged || booleansChanged;
  };

  const getFindShifts = (payload: IFindShiftItemsPayload) => {
    Api.getAgentShifts(payload)
      .then(resp => {
        if (resp.status.code === 0) {
          setShiftList(resp.data);
        }
      })
      .catch(err => {
        logger.error(err);
      });
  };

  const getActivityType = () => {
    const type = selectedActivities[0].type;

    return String(selectedActivities.every(a => a.type === type) ? type : 'Different')
      .split('_')
      .map(t => t[0].toUpperCase().concat(t.slice(1, t.length).toLowerCase()))
      .join(' ');
  };

  useEffect(() => {
    if (isLoading) setIsLoading(false);
    switch (activitiesTypeRef.current) {
      case 'None':
        return;
      case 'Break':
        breakList === null || setItems(breakList);
        break;
      case 'Meal':
        mealList === null || setItems(mealList);
        break;
      case 'Exception':
        exceptionList === null || setItems(exceptionList);
        break;
      case 'Time Off':
        timeOffList === null || setItems(timeOffList);
        break;
      case 'Shift':
        shiftList === null || setItems(shiftList);
        break;
      case 'Activity Set':
        shiftList === null || setItems(shiftList);
        break;
      default:
        onClose();
    }
  }, [breakList, mealList, exceptionList, timeOffList, shiftList]);

  useEffect(() => {
    if (isLoading) {
      const activityType = getActivityType();
      if (!selectedActivities.length) return;
      const itemIds = selectedActivities.reduce((acc: number[], s) => {
        const stateId = activityType === 'Shift' ? s._id : s.stateId;
        return acc.includes(stateId) ? [...acc] : [...acc, stateId];
      }, []);
      const payload: IFindShiftItemsPayload = timeLineData
        .filter(({ agentId }) => selectedActivities.some(a => agentId === a.agentId))
        .reduce(
          (acc: { siteId: number[] }, { siteId }) => ({
            siteId: acc.siteId.includes(siteId) ? [...acc.siteId] : [...acc.siteId, siteId],
          }),
          { siteId: [] },
        );
      setIsDisableChangeType(Array.isArray(payload.siteId) && payload.siteId.length > 1);

      const targetTimelines = timeLineData
        .filter(({ agentId }) => selectedActivities.some(a => agentId === a.agentId))
        .map(timeLine => {
          const agentSelectedActivities = selectedActivities.filter(s => s.agentId === timeLine.agentId);
          const days = timeLine.days
            .filter((_, idx) => agentSelectedActivities.some(s => s.dayIndex === idx))
            .map(day => {
              const daySelectedActivities = agentSelectedActivities.filter(s => s.dayDate === day.date);
              const states = day.states.reduce(
                (acc: ISchState[], state, idx) =>
                  activityType === 'Shift' || daySelectedActivities.some(({ stateIndex }) => Number(stateIndex) === idx)
                    ? [...acc, { ...state, isSelected: true }]
                    : [...acc, { ...state, isSelected: false }],
                [],
              );

              return { ...day, isSelected: activityType === 'Shift', states };
            });
          return { ...timeLine, days };
        });

      switch (activityType) {
        case 'Break':
          dispatch(findBreaks(payload));
          break;
        case 'Meal':
          dispatch(findMeals(payload));
          break;
        case 'Exception':
          dispatch(findExceptions(payload));
          break;
        case 'Time Off':
          dispatch(findTimeOffs(payload));
          break;
        case 'Shift':
          getFindShifts(payload);
          break;
        case 'Activity Set':
          getFindShifts(payload);
          break;
        default:
          onClose();
      }
      setStartTime(DateUtils.getTimeFromDate(selectedActivities[0].start));
      setDuration(
        DateUtils.getTimeFromDate(
          DateUtils.getRound1mTimestamp(selectedActivities[0].end - selectedActivities[0].start),
        ),
      );
      setInitSelectedIds(itemIds);
      setTargetAgentTimeLine(targetTimelines);
      setActivitiesType(activityType);
    }
  }, [selectedActivities]);

  const getTable = () => {
    if (activitiesTypeRef.current === 'Shift' || activitiesTypeRef.current === 'Activity Set') {
      return (
        <ShiftTable
          type={activitiesTypeRef.current}
          items={itemsRef.current}
          selectItems={selectItems}
          isSelectedItem={isSelectedItem}
          timeFormat={timeFormat}
        />
      );
    }
    if (activitiesTypeRef.current === 'Break') {
      return (
        <BreakTable
          type={activitiesTypeRef.current}
          items={itemsRef.current}
          selectItems={selectItems}
          isSelectedItem={isSelectedItem}
        />
      );
    }
    if (activitiesTypeRef.current === 'Exception') {
      return (
        <ExceptionTable
          type={activitiesTypeRef.current}
          items={itemsRef.current}
          selectItems={selectItems}
          isSelectedItem={isSelectedItem}
        />
      );
    }
    return (
      <RegularTable
        type={activitiesTypeRef.current}
        items={itemsRef.current}
        selectItems={selectItems}
        isSelectedItem={isSelectedItem}
      />
    );
  };

  const selectItems = (index: number) => {
    setSelectedItem(selectedItemRef.current !== index ? index : -1);
    // if (selectedItemRef.current !== index) setEndTime(getEndTime(startTimeRef.current, itemsRef.current[index].duration));
  };

  const getMoveToTime = (dateTime: number | string): number => {
    if (!isCheckedMoveToStartRef.current) return Utils.getParsedNum(dateTime);

    return DateUtils.getRound1mTimestamp(
      Utils.getParsedNum(dateTime) +
        DateUtils.convertTimeToMinutes(moveStartTimeRef.current) * (isCheckedBackwardRef.current ? -60000 : 60000),
    );
  };

  const getDeltaDuration = (startDateTime: number | string, endDateTime: number | string): number => {
    return isCheckedChangeDurationRef.current
      ? DateUtils.getDeltaDuration(startDateTime, endDateTime, durationRef.current)
      : 0;
  };

  const getChangedStateSettings = () => {
    if (
      activitiesTypeRef.current === 'Shift' ||
      selectedItemRef.current === -1 ||
      activitiesTypeRef.current === 'Activity Set'
    )
      return {};
    const result: any = {};
    const stateItem = itemsRef.current[selectedItemRef.current];

    result.id = stateItem.id || 0;
    result.isPaid = !!stateItem.isPaid;
    result.name = stateItem.name || '';
    result.shortName = stateItem.shortName || '';

    return result;
  };

  const getStartOffset = (startTime: number | string | null) => {
    if (!isCheckedSetStartTimeRef.current || startTime === null) return 0;
    return DateUtils.getStartOffset(startTime, startTimeRef.current, isCheckedNextStartDayRef.current);
  };

  const applyChanges = (e: React.MouseEvent | KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const isShift = activitiesTypeRef.current === 'Shift';
    const isActivitySetAsShift =
      activitiesTypeRef.current === 'Activity Set' && SchSelectedActivity.isFullShiftActivity(selectedActivities[0]);

    const timeLines = targetAgentTimeLineRef.current.map(timeLine => {
      const days = timeLine.days.map(day => {
        const d = clone(day);
        const dayState = d.dayState;
        const startOffsetShift = isShift || isActivitySetAsShift ? getStartOffset(dayState?.startDateTime ?? null) : 0;

        if (isShift || isActivitySetAsShift) {
          if (selectedItemRef.current !== -1) {
            const shiftItem = itemsRef.current[selectedItemRef.current];
            d.id = shiftItem.id;
            d.name = shiftItem.name;
          }
          const start = getMoveToTime(dayState?.startDateTime ?? d.startDateTime) + startOffsetShift;
          const end = getMoveToTime(dayState?.endDateTime ?? d.endDateTime) + startOffsetShift;
          d.startDateTime = start;
          d.endDateTime = end + getDeltaDuration(start, end);
          d.nextStartDateTime = start;
          d.prevEndDateTime = end + getDeltaDuration(start, end);

          if (dayState) {
            if (selectedItemRef.current !== -1) dayState.name = itemsRef.current[selectedItemRef.current].name;
            dayState.startDateTime = start;
            dayState.endDateTime = end + getDeltaDuration(start, end);
          }
        }
        if (dayState && activitiesTypeRef.current === 'Activity Set' && selectedItemRef.current !== -1) {
          const shiftItem = itemsRef.current[selectedItemRef.current];
          dayState.name = itemsRef.current[selectedItemRef.current].name;
          d.id = shiftItem.id;
          d.name = shiftItem.name;
        }
        let states = d.states;
        if (activitiesTypeRef.current === 'Activity Set' && !isActivitySetAsShift) {
          states = SchState.editWorkSetActivity(states, undefined, {
            moveTime: isCheckedMoveToStartRef.current
              ? {
                  time: moveStartTimeRef.current,
                  direction: {
                    forward: isCheckedForwardRef.current,
                    backward: isCheckedBackwardRef.current,
                  },
                }
              : undefined,
            setTime: isCheckedSetStartTimeRef.current
              ? {
                  time: startTimeRef.current,
                  isNextDay: isCheckedNextStartDayRef.current,
                }
              : undefined,
            duration: isCheckedChangeDurationRef.current ? durationRef.current : undefined,
          });
        } else {
          states = d.states.map(s => {
            const startOffsetState = !isShift && !isActivitySetAsShift ? getStartOffset(s.startDateTime || null) : 0;
            const start = getMoveToTime(s.startDateTime) + startOffsetShift + startOffsetState;
            const end = getMoveToTime(s.endDateTime) + startOffsetShift + startOffsetState;

            let updatedState = s;
            if (updatedState.isSelected || isActivitySetAsShift) {
              updatedState = {
                ...s,
                ...getChangedStateSettings(),
                startDateTime: start,
                endDateTime:
                  end +
                  ((activitiesTypeRef.current !== 'Shift' && !isActivitySetAsShift) ||
                  (s.type === SchStateType.ACTIVITY_SET &&
                    s.startDateTime === day.dayState?.startDateTime &&
                    s.endDateTime === day.dayState?.endDateTime)
                    ? getDeltaDuration(start, end)
                    : 0),
              };
            }

            return updatedState;
          });
        }

        const date = new Date(
          SchDay.getAgentDayDateFromTimestamp(
            timeLine._TZ_INTERNAL_USAGE.tzSelected,
            timeLine._TZ_INTERNAL_USAGE.tzSite,
            dayState?.startDateTime ?? d.startDateTime,
          ),
        ).getTime();

        return { ...d, date, dayState, states, isModified: true, isBuild: true };
      });
      return { ...timeLine, days, isModified: true, isBuild: true };
    });

    const { isValid, messages } = SchAgent.validateAgents(timeLines);
    if (!isValid) {
      dispatch(
        openErrorPopUp({
          data: messages.join('\n'),
          isOpen: true,
        }),
      );
      onClose();
      return;
    }
    dispatch(buildAgentDayInSnapshot({ modifiedAgentDays: timeLines }, false, false, true, true, [])).then(() =>
      onClose(),
    );
  };

  const onClose = () => {
    setIsLoading(true);
    //dispatch(setSelectedActivity([]));
    dispatch(setOpenEditMultiple({ isOpen: false, isFullDay: false }));
  };

  usePopUpHotkeys({ onSubmit: [applyChanges], onCancel: [onClose] });
  // todo: Change
  const onClickCheckedMoveToStart = () => {
    setIsCheckedMoveToStart(true);
    setIsCheckedSetStartTime(false);
  };

  const onClickCheckedForward = () => {
    if (!isCheckedMoveToStartRef.current) return;
    setIsCheckedForward(true);
    setIsCheckedBackward(false);
  };

  const onClickCheckedBackward = () => {
    if (!isCheckedMoveToStartRef.current) return;
    setIsCheckedForward(false);
    setIsCheckedBackward(true);
  };

  const onClickCheckedSetStartTime = () => {
    setIsCheckedMoveToStart(false);
    setIsCheckedSetStartTime(true);
  };

  const onClickCheckedNextStartDay = () => {
    if (!isCheckedSetStartTimeRef.current) return;
    setIsCheckedNextStartDay(!isCheckedNextStartDayRef.current);
  };

  const onClickCheckedChangeDuration = () => {
    setIsCheckedChangeDuration(!isCheckedChangeDurationRef.current);
  };

  // todo: Inputs
  const onChangeMoveStartTime = (value: TimePickerValue) => {
    setMoveStartTime(value.toString());
  };

  const onChangeStartTime = (value: TimePickerValue) => {
    setStartTime(value.toString());
  };

  const onChangeDuration = (value: TimePickerValue) => {
    setDuration(value.toString());
  };

  const isSelectedItem = (element: any, index: number) =>
    selectedItemRef.current === -1
      ? initSelectedIdsRef.current.some(id => id === element.id)
      : selectedItemRef.current === index;

  const getView = () => {
    return (
      <div>
        {!isDisableChangeTypeRef.current && (
          <div className={styles.subHeader}>
            <span>Choose item name to change</span>
          </div>
        )}
        {!isDisableChangeTypeRef.current && (
          <div className={styles.tableWrapper}>
            {isLoading ? (
              <Spiner />
            ) : (
              <>
                <div className={styles.tableSubWrapper}>{getTable()}</div>
              </>
            )}
          </div>
        )}

        <div className={styles.optionsWrapper}>
          <div className={styles.subHeader}>
            <span>Options</span>
          </div>
          <div className={styles.options_1st}>
            <div className={styles.checkBoxWrap}>
              <Checkbox onClick={onClickCheckedMoveToStart} checked={isCheckedMoveToStartRef.current} />
              <span
                onClick={onClickCheckedMoveToStart}
                data-test={'move-start-time-checkbox'}
                className={styles.regular}
              >
                Move start time
              </span>
            </div>
            <div className={styles.dataSpecifyTMWrapper}>
              <InputTimeShort
                onChange={onChangeMoveStartTime}
                defaultTime={moveStartTimeRef.current}
                isEndTime={true}
                disabled={!isCheckedMoveToStartRef.current}
              />
            </div>
            <div
              className={`${styles.checkBoxWrap} ${
                !isCheckedMoveToStartRef.current ? styles.disabled : styles.regular
              }`}
            >
              <Checkbox
                onClick={onClickCheckedForward}
                checked={isCheckedForwardRef.current}
                disabled={!isCheckedMoveToStartRef.current}
              />
              <span
                onClick={onClickCheckedForward}
                data-test={'forward-checkbox'}
                className={`${!isCheckedMoveToStartRef.current ? styles.disabled : styles.regular}`}
              >
                Forward
              </span>
            </div>
            <div className={`${styles.checkBoxWrap}`}>
              <Checkbox
                onClick={onClickCheckedBackward}
                checked={isCheckedBackwardRef.current}
                disabled={!isCheckedMoveToStartRef.current}
              />
              <span
                onClick={onClickCheckedBackward}
                data-test={'backward-checkbox'}
                className={`${!isCheckedMoveToStartRef.current ? styles.disabled : styles.regular}`}
              >
                Backward
              </span>
            </div>
          </div>
          <div className={styles.options_1st}>
            <div className={styles.checkBoxWrap}>
              <Checkbox onClick={onClickCheckedSetStartTime} checked={isCheckedSetStartTimeRef.current} />
              <span
                onClick={onClickCheckedSetStartTime}
                data-test={'set-start-time-checkbox'}
                className={styles.regular}
              >
                Set start time
              </span>
            </div>
            <div className={styles.dataSpecifyTMWrapper}>
              <InputTimeShort
                onChange={onChangeStartTime}
                defaultTime={startTimeRef.current}
                format={timeFormat}
                isEndTime={true}
                disabled={!isCheckedSetStartTimeRef.current}
              />
            </div>
            <div className={styles.checkBoxWrap}>
              <Checkbox
                onClick={onClickCheckedNextStartDay}
                checked={isCheckedNextStartDayRef.current}
                disabled={!isCheckedSetStartTimeRef.current}
              />
              <span
                onClick={onClickCheckedNextStartDay}
                data-test={'next-day-checkbox'}
                className={`${!isCheckedSetStartTimeRef.current ? styles.disabled : styles.regular}`}
              >
                Next Day
              </span>
            </div>
          </div>
        </div>

        <div className={styles.optionsWrapper}>
          <div className={styles.options_1st}>
            <div className={styles.checkBoxWrap}>
              <Checkbox onClick={onClickCheckedChangeDuration} checked={isCheckedChangeDurationRef.current} />
              <span
                onClick={onClickCheckedChangeDuration}
                data-test={'change-duration-checkbox'}
                className={styles.regular}
              >
                Change duration
              </span>
            </div>
            <div className={styles.dataSpecifyTMWrapper}>
              <InputTimeShort
                onChange={onChangeDuration}
                defaultTime={durationRef.current}
                isEndTime={true}
                disabled={!isCheckedChangeDurationRef.current}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <div className={styles.header}>
          <span>{`Edit Multiple - ${activitiesTypeRef.current}s`}</span>
          <Cross onClick={onClose} />
        </div>
        {<div className={styles.body}>{getView()}</div>}

        <div className={styles.footer}>
          <div className={styles.buttonWrap1}>
            <Button
              innerText={'Cancel'}
              click={onClose}
              style={{ background: '#FFFFFF', color: '#0183F5', border: '0.5px solid #0183F5', borderRadius: '5px' }}
            />
          </div>

          <div className={styles.buttonWrap3}>
            <Button
              innerText={'Apply'}
              click={applyChanges}
              disable={!isChanged()}
              style={{ background: '#0183F5', color: '#FFFFFF', borderRadius: '5px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditMultipleMenu;
