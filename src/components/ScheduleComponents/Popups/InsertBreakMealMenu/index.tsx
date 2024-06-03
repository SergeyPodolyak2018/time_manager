import '../NewShiftMenu/TimePicker.css';

import React, { FC, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import useStateRef from 'react-usestateref';

import { IFindShiftItemsPayload } from '../../../../api/ts/interfaces/config.payload';
import { SchStateType } from '../../../../common/constants/schedule';
import { ISchState } from '../../../../common/interfaces/schedule/IAgentSchedule';
import DateUtils from '../../../../helper/dateUtils';
import SchAgent from '../../../../helper/schedule/SchAgent';
import {
  buildAgentDayInSnapshot,
  closeInsertBreakMenu,
  closeInsertMealMenu,
  findBreaks,
  findMeals,
  openErrorPopUp,
  setBreaks,
  setMeals,
  setSelectedActivity,
} from '../../../../redux/actions/timeLineAction';
import { useAppDispatch } from '../../../../redux/hooks';
import { getActiveDateSelector } from '../../../../redux/selectors/controlPanelSelector';
import {
  getBreaks,
  getDataSelector,
  getMeals,
  getSelectedActivitySelector,
  getSelectedAgentSelector,
  getSubMenuDataSelector,
  getTimeFormat,
} from '../../../../redux/selectors/timeLineSelector';
import { IBreakMeal, IErrorPopUpParam } from '../../../../redux/ts/intrefaces/timeLine';
import CheckboxBig from '../../../ReusableComponents/Checkbox';
import Checkbox from '../../../ReusableComponents/CheckboxStyled';
import InputTime, { ITimeLimit } from '../../../ReusableComponents/InputTime';
import Spiner from '../../../ReusableComponents/spiner';
import AgentInfo from '../common/AgentInfo';
import InsertPopupLayout from '../common/InsertPopupLayout';
import styles from './menu.module.scss';
import AgentTime from '../common/AgentTime';

export interface IScheduleMenuProps {
  type: 'INSERT_BREAK' | 'INSERT_MEAL';
}

const InsertBreakMealMenu: FC<IScheduleMenuProps> = props => {
  const title = props.type === 'INSERT_BREAK' ? 'Break' : 'Meal';
  const dispatch = useAppDispatch();

  const breakMealList = useSelector(props.type === 'INSERT_BREAK' ? getBreaks : getMeals);
  const selectedActivities = useSelector(getSelectedActivitySelector);
  const selectedAgent = useSelector(getSelectedAgentSelector);
  const subMenuData = useSelector(getSubMenuDataSelector);
  const timeLineData = useSelector(getDataSelector);
  const currentDate = useSelector(getActiveDateSelector);
  const timeFormat = useSelector(getTimeFormat);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [items, setItem] = useState<IBreakMeal[]>([]);
  const [allItems, setAllItem] = useState<IBreakMeal[]>([]);
  const [selectedItem, setSelectedItem] = useState<number>(-1);
  const [isShowAll, setIsShowAll] = useState<boolean>(false);
  const [isNextStartDay, setIsNextStartDay, isNextStartDayRef] = useStateRef<boolean>(false);
  const [isPreviousStartDay, setIsPreviousStartDay, isPreviousStartDayRef] = useStateRef<boolean>(false);
  const [isNextEndDay, setIsNextEndDay, isNextEndDayRef] = useStateRef<boolean>(false);
  const [, setStartTime, startTimeRef] = useStateRef<string>(
    DateUtils.getTimeFromDate(
      subMenuData ? DateUtils.roundToNearest15Minutes(subMenuData.dateTime) : selectedActivities[0].start,
    ),
  );
  const [, setEndTime, endTimeRef] = useStateRef<string>(
    DateUtils.getTimeFromDate(
      30 * 60000 +
        (subMenuData ? DateUtils.roundToNearest15Minutes(subMenuData.dateTime) : selectedActivities[0].start),
    ),
  );

  const [, setItemsPayload, itemsPayloadRef] = useStateRef<any>({
    buId: 0,
    siteId: 0,
    shiftId: 0,
  });
  const [isValid, setIsValid] = useState<boolean>(true);
  const [limits, setLimits] = useStateRef<ITimeLimit>({});

  const initBreakMealList = (showAll: boolean) => {
    const payload = { ...itemsPayloadRef.current };
    if (showAll) payload.shiftId = undefined;
    if (props.type === 'INSERT_BREAK') dispatch(findBreaks(payload));
    else dispatch(findMeals(payload));
  };

  useEffect(() => {
    if (Array.isArray(breakMealList)) {
      if (breakMealList.length) {
        if (isShowAll) setAllItem(breakMealList);
        else setItem(breakMealList);
      }
      if (isLoading) setIsLoading(false);
    }
  }, [breakMealList]);

  useEffect(() => {
    if (isLoading) {
      if (!selectedActivities.length) return;
      const shiftStartTime = selectedActivities[0].start;
      const shiftEndTime = selectedActivities[0].end;
      setLimits({
        start: DateUtils.getTimeFromDate(shiftStartTime),
        end: DateUtils.getTimeFromDate(shiftEndTime),
        isNextStartDay,
        isNextEndDay,
      });
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
        const day = data.days.find(
          (d: any) =>
            (d.startDateTime === shiftStartTime && d.endDateTime === shiftEndTime) ||
            (selectedActivities[0]._type === SchStateType.ACTIVITY_SET &&
              d.startDateTime === selectedActivities[0].shiftStart &&
              d.endDateTime === selectedActivities[0].shiftEnd),
        );
        if (day) {
          //@ts-ignore
          payload.shiftId = day.dayState.id;
        }
      });
      setItemsPayload(payload);
      initBreakMealList(false);
    }
  }, [selectedActivities]);

  const selectItems = (index: number) => {
    setSelectedItem(selectedItem !== index ? index : -1);
    // if (selectedItem !== index) setEndTime(getEndTime(startTimeRef.current, items[index].duration));
  };

  const onClickShowAll = () => {
    const isShowAllState = !isShowAll;
    if (!items.length || !allItems.length) {
      setIsLoading(true);
      initBreakMealList(isShowAllState);
    }
    setIsShowAll(isShowAllState);
  };

  const onClickNextStartDay = () => {
    setLimits({ ...limits, isNextStartDay: !isNextStartDay, isNextEndDay: !isNextStartDay, isPreviousStartDay: false });
    setIsNextStartDay(!isNextStartDay);
    !isNextStartDay ? setIsNextEndDay(!isNextStartDay) : null;
    setIsPreviousStartDay(false);
  };

  const onClickNextEndDay = () => {
    setLimits({ ...limits, isNextEndDay: !isNextEndDay, isPreviousStartDay: false });
    setIsNextEndDay(!isNextEndDay);
    setIsPreviousStartDay(false);
  };

  const onClickPreviousStartDay = () => {
    setLimits({ ...limits, isPreviousStartDay: !isPreviousStartDay, isNextEndDay: false, isNextStartDay: false });
    setIsPreviousStartDay(!isPreviousStartDay);
    setIsNextEndDay(false);
    setIsNextStartDay(false);
  };

  const onChangeStartTime = (value: string) => {
    setStartTime(value.toString());
  };

  const onChangeEndTime = (value: string) => {
    setEndTime(value.toString());
  };

  const onValidate = (msg: string | null): void => {
    setIsValid(!msg);
  };

  const applyChanges = (e: React.MouseEvent | KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isValid || selectedItem === -1) return;

    const exceptionParams: IErrorPopUpParam = {
      isOpen: true,
      data: '',
    };

    setIsLoading(true);
    const item = { ...(isShowAll ? allItems : items)[selectedItem] };
    const state: ISchState = {
      id: item.id,
      isPaid: item.isPaid,
      name: item.name,
      shortName: item.shortName,
      type: props.type === 'INSERT_BREAK' ? SchStateType.BREAK : SchStateType.MEAL,
      startDateTime: 0,
      endDateTime: 0,
      paidMinutes: 0,
      memo: item.memo,
      isFullDay: false,
      color:item.color,
      fontColor:item.fontColor,
    };
    state.startDateTime = DateUtils.setDayTime(
      currentDate,
      DateUtils.convertTo24h(String(startTimeRef.current)),
      isNextStartDayRef.current,
      isPreviousStartDayRef.current,
    );
    state.endDateTime = DateUtils.setDayTime(
      currentDate,
      DateUtils.convertTo24h(String(endTimeRef.current)),
      isNextEndDayRef.current,
    );

    try {
      // SchUtils.validateStates(timeLineData, selectedActivities[0], state);
      const newAgents = SchAgent.insertState(timeLineData, selectedActivities[0], state);
      dispatch(buildAgentDayInSnapshot({ modifiedAgentDays: newAgents })).then(() => onClose());
    } catch (err: any) {
      setIsLoading(false);
      exceptionParams.data = err.message;
      dispatch(openErrorPopUp(exceptionParams));
    }
  };

  const onClose = (saveSelectedActivities = false) => {
    setIsLoading(true);
    !saveSelectedActivities && dispatch(setSelectedActivity([]));
    if (props.type === 'INSERT_BREAK') {
      dispatch(setBreaks(null));
      dispatch(closeInsertBreakMenu());
    } else {
      dispatch(setMeals(null));
      dispatch(closeInsertMealMenu());
    }
  };

  const getView = () => {
    return (
      <div>
        <div className={styles.subHeader}>
          <span>Choose item to insert</span>
        </div>
        <div className={styles.tableWrapper}>
          {isLoading ? (
            <Spiner />
          ) : (
            <>
              <div className={styles.tableSubWrapper}>
                <table>
                  <thead>
                    <tr>
                      <td>
                        <span>{title}</span>
                      </td>
                      <td>
                        <span>Short</span>
                      </td>
                      <td>
                        <span>Hours</span>
                      </td>
                      <td>
                        <span>Paid</span>
                      </td>
                    </tr>
                  </thead>
                  <tbody>
                    {(isShowAll ? allItems : items).map((el, index) => {
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
                            <span
                              title={`${DateUtils.convertMinutesToTime(el.duration)}`}
                              className={styles.secTd}
                            >{`${DateUtils.convertMinutesToTime(el.duration)}`}</span>
                          </td>
                          <td>
                            <span className={styles.fthTd}>
                              <CheckboxBig icon={'mark'} checked={el.isPaid} />
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className={`${styles.checkBoxWrap} ${styles.showAll}`}>
                <Checkbox
                  checked={isShowAll}
                  onClick={onClickShowAll}
                  style={{ width: '10px', height: '10px', border: '#BCC4C8 solid 1px' }}
                />
                <span>Show all</span>
              </div>
            </>
          )}
        </div>
        <div className={styles.data}>
          {selectedAgent[0] && selectedActivities[0]?.date && (
            <AgentTime
              style={{ marginLeft: '20px' }}
              timeStart={startTimeRef.current}
              timeEnd={endTimeRef.current}
              agent={selectedAgent[0]}
              date={selectedActivities[0].date}
            />
          )}
          <div className={styles.dataStart}>
            <div className={timeFormat === '24hours' ? styles.dataStartTMWrapper : styles.dataStartTMWrapperBigger}>
              <InputTime
                onChangeStartTime={onChangeStartTime}
                onChangeEndTime={onChangeEndTime}
                startTime={startTimeRef.current}
                endTime={endTimeRef.current}
                format={timeFormat}
                limits={limits}
                onValidate={onValidate}
              />
            </div>
          </div>
          <div className={styles.checkBoxWrap3} data-test={'previous-day-start-checkbox'}>
            <Checkbox
              checked={isPreviousStartDay}
              onClick={() => onClickPreviousStartDay()}
              style={{ height: '10px', width: '10px' }}
            />
            <span onClick={() => onClickPreviousStartDay()}>Start on previous day</span>
          </div>
          <div className={styles.checkBoxWrap3} data-test={'next-day-start-checkbox'}>
            <Checkbox
              checked={isNextStartDay}
              onClick={() => onClickNextStartDay()}
              style={{ height: '10px', width: '10px' }}
            />
            <span onClick={() => onClickNextStartDay()}>Start next day</span>
          </div>
          <div className={styles.checkBoxWrap3} data-test={'next-day-end-checkbox'}>
            <Checkbox
              checked={isNextEndDay}
              onClick={() => onClickNextEndDay()}
              style={{ height: '10px', width: '10px' }}
            />
            <span onClick={() => onClickNextEndDay()}>End next day</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <InsertPopupLayout
      onClose={() => onClose(true)}
      handleSave={applyChanges}
      disableSave={!isValid || selectedItem === -1}
      isApply={true}
      title={`Insert ${title}`}
    >
      <div>
        <div className={styles.type}>
          <div className={styles.typeWrapper1}>
            <AgentInfo agentInfo={selectedAgent[0]} />
          </div>
        </div>
        {getView()}
      </div>
    </InsertPopupLayout>
  );
};

export default InsertBreakMealMenu;
