import '../NewShiftMenu/TimePicker.css';

import React, { FC, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { TimePickerValue } from 'react-time-picker';
import useStateRef from 'react-usestateref';

import { DayType, SchStateType } from '../../../../common/constants/schedule';
import { ISchDayState, ISchState } from '../../../../common/interfaces/schedule/IAgentSchedule';
import DateUtils from '../../../../helper/dateUtils';
import SchAgent from '../../../../helper/schedule/SchAgent';
import { usePopUpHotkeys } from '../../../../hooks';
import {
  buildAgentDayInSnapshot,
  findTimeOffs,
  openErrorPopUp,
  setOpenTimeOffMenu,
  setSelectedActivity,
  setTimeOffs,
} from '../../../../redux/actions/timeLineAction';
import { useAppDispatch } from '../../../../redux/hooks';
import { getActiveDateSelector, getSelectedTzSelector } from '../../../../redux/selectors/controlPanelSelector';
import {
  getClickedDay,
  getDataSelector,
  getSelectedActivitySelector,
  getSelectedAgentSelector,
  getSubMenuDataSelector,
  getTimeFormat,
  getTimeOff,
} from '../../../../redux/selectors/timeLineSelector';
import { IErrorPopUpParam, ITimeOff } from '../../../../redux/ts/intrefaces/timeLine';
import Button from '../../../ReusableComponents/button';
import CheckboxBig from '../../../ReusableComponents/Checkbox';
import Checkbox from '../../../ReusableComponents/CheckboxStyled';
import InputTime, { ITimeLimit } from '../../../ReusableComponents/InputTime';
import InputTimeShort from '../../../ReusableComponents/InputTimeChort';
import Spiner from '../../../ReusableComponents/spiner';
import AgentInfo from '../common/AgentInfo';
import styles from './menu.module.scss';
import { Cross } from '../../../../static/svg';
import AgentTime from '../common/AgentTime';
import { ZERO_TIME_FOR_OLE_DATE_IN_TIMESTAMP } from '../../../../common/constants';

export interface IInsertTimeOffMenuProps {
  isFullDay: boolean;
}

const InsertTimeOffMenu: FC<IInsertTimeOffMenuProps> = ({ isFullDay }) => {
  const dispatch = useAppDispatch();
  const timeOffsetList = useSelector(getTimeOff);
  const timeFormat = useSelector(getTimeFormat);
  const selectedActivities = useSelector(getSelectedActivitySelector);
  const selectedAgent = useSelector(getSelectedAgentSelector);
  const timeLineData = useSelector(getDataSelector);
  const currentDate = useSelector(getActiveDateSelector);
  const clickedDay = useSelector(getClickedDay);
  const selectedTz = useSelector(getSelectedTzSelector);
  const subMenuData = useSelector(getSubMenuDataSelector);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [items, setItem] = useState<ITimeOff[]>([]);
  const [allItems, setAllItem] = useState<ITimeOff[]>([]);
  const [selectedItem, setSelectedItem, selectedItemRef] = useStateRef<number>(-1);
  const [isShowAll, setIsShowAll] = useStateRef<boolean>(true);
  const [, setIsSpecifyStartEnd, isSpecifyStartEndRef] = useStateRef<boolean>(true);
  const [, setIsSpecifyPaid, isSpecifyPaidRef] = useStateRef<boolean>(false);
  const [, setIsFullDay] = useStateRef<boolean>(isFullDay);
  const [isNextStartDay, setIsNextStartDay, isNextStartDayRef] = useStateRef<boolean>(false);
  const [isNextEndDay, setIsNextEndDay, isNextEndDayRef] = useStateRef<boolean>(false);
  const [isPreviousStartDay, setIsPreviousStartDay, isPreviousStartDayRef] = useStateRef<boolean>(false);
  const [, setMemo, memoRef] = useStateRef<string>('');
  const [, setPaidHours, paidHoursRef] = useStateRef<string>('00:00');
  const [, setStartTime, startTimeRef] = useStateRef<string>(
    isFullDay
      ? '12:00'
      : DateUtils.getTimeFromDate(
          subMenuData ? DateUtils.roundToNearest15Minutes(subMenuData.dateTime) : selectedActivities[0].start,
        ),
  );
  const [, setEndTime, endTimeRef] = useStateRef<string>(
    isFullDay
      ? '12:30'
      : DateUtils.getTimeFromDate(
          30 * 60000 +
            (subMenuData ? DateUtils.roundToNearest15Minutes(subMenuData.dateTime) : selectedActivities[0].start),
        ),
  );
  const [isValid, setIsValid] = useState<boolean>(true);
  const [limits, setLimits] = useStateRef<ITimeLimit>({});
  const [, setItemsPayload, itemsPayloadRef] = useStateRef<any>({
    buId: 0,
    siteId: 0,
    shiftId: 0,
    teamId: 0,
    agentId: 0,
  });

  const agentName = (selectedActivities[0] || selectedAgent[0])?.agentName ?? '';

  const initTimeOffList = (showAll: boolean) => {
    const payload = { ...itemsPayloadRef.current };
    if (showAll) {
      payload.agentId = undefined;
      payload.teamId = undefined;
      payload.shiftId = undefined;
    }
    dispatch(findTimeOffs(payload));
  };

  useEffect(() => {
    if (Array.isArray(timeOffsetList)) {
      setIsLoading(false);
      if (timeOffsetList.length) {
        // const timeOffItems = timeOffsetList.map((e: ITimeOff) => {
        //   const _e: ITimeOff = { ...e };
        //   const sites: ISites = filterData[e.buId]?.sites;
        //   if (!sites) return _e;
        //   // _e.sites = _e.siteId.reduce((acc: ISites, sid: number) => ({ ...acc, [sid]: sites[sid] }), {});
        //   return _e;
        // });
        // console.log(timeOffItems);
        if (isShowAll) setAllItem(timeOffsetList);
        else setItem(timeOffsetList);
      }
      // if (isLoading) setIsLoading(false);
    }
  }, [timeOffsetList]);

  useEffect(() => {
    if (isLoading) {
      const payload = {
        buId: 0,
        siteId: 0,
        shiftId: 0,
        teamId: 0,
        agentId: 0,
      };
      if (!isFullDay) {
        setIsSpecifyStartEnd(true);
        if (!selectedActivities.length) return;
        const agentId = selectedActivities[0].agentId;
        const shiftStartTime = selectedActivities[0].start;
        const shiftEndTime = selectedActivities[0].end;
        setLimits({
          start: DateUtils.getTimeFromDate(shiftStartTime),
          end: DateUtils.getTimeFromDate(shiftEndTime),
          isNextStartDay: isNextStartDayRef.current,
          isNextEndDay: isNextEndDayRef.current,
        });
        const timeLines = timeLineData.filter((t: any) => t.agentId === agentId);
        timeLines.forEach(data => {
          const activities = data.activities || [];
          const activity = activities.find((a: any) => a.start === shiftStartTime && a.end === shiftEndTime);
          if (activity) {
            payload.buId = data.buId;
            payload.siteId = data.siteId;
            payload.agentId = data.agentId;
            payload.teamId = data.teamId;
          }
          const day = data.days.find((d: any) => d.startDateTime === shiftStartTime && d.endDateTime === shiftEndTime);
          if (day) {
            //@ts-ignore
            payload.shiftId = day.dayState.id;
          }
        });
      } else {
        setIsSpecifyStartEnd(false);
        if (!selectedAgent.length) return;
        payload.buId = selectedAgent[0].buId;
        payload.siteId = selectedAgent[0].siteId;
        payload.agentId = selectedAgent[0].agentId;
        payload.teamId = selectedAgent[0].teamId;
      }
      setItemsPayload(payload);
      // initTimeOffList(false);
    }
  }, [selectedActivities]);

  const selectItems = (index: number) => {
    const selectedItemIndex = selectedItem !== index ? index : -1;
    setSelectedItem(selectedItemIndex);
    const currentItemList = isShowAll ? allItems : items;
    if ('isPaid' in currentItemList[selectedItemIndex] && !currentItemList[selectedItemIndex].isPaid) {
      setIsSpecifyPaid(false);
    }
  };

  const onClickShowAll = () => {
    const isShowAllState = !isShowAll;
    if (!items.length || !allItems.length) {
      setIsLoading(true);
      // initTimeOffList(isShowAllState);
    }
    setIsShowAll(isShowAllState);
    setSelectedItem(-1);
  };

  useEffect(() => {
    setIsLoading(true);
    initTimeOffList(isShowAll);
    setSelectedItem(-1);
  }, [isShowAll]);

  const onClickedSpecifyPaid = () => {
    if (isSpecifyPaidDisabled()) return;
    setIsSpecifyPaid(!isSpecifyPaidRef.current);
  };

  const onClickNextStartDay = () => {
    if (!isSpecifyStartEndRef.current) return;
    setLimits({
      ...limits,
      isNextStartDay: !isNextStartDayRef.current,
      isNextEndDay: !isNextStartDayRef.current ? !isNextStartDayRef.current : isNextEndDayRef.current,
      isPreviousStartDay: false,
    });
    !isNextStartDayRef.current ? setIsNextEndDay(!isNextStartDayRef.current) : null;
    setIsNextStartDay(!isNextStartDayRef.current);
    setIsPreviousStartDay(false);
  };

  const onClickNextEndDay = () => {
    if (!isSpecifyStartEndRef.current) return;
    setLimits({ ...limits, isNextEndDay: !isNextEndDay, isPreviousStartDay: false });
    setIsNextEndDay(!isNextEndDay);
    setIsPreviousStartDay(false);
  };

  const onClickPreviousStartDay = () => {
    if (!isSpecifyStartEndRef.current) return;
    setLimits({ ...limits, isPreviousStartDay: !isPreviousStartDay, isNextEndDay: false, isNextStartDay: false });
    setIsPreviousStartDay(!isPreviousStartDay);
    setIsNextEndDay(false);
    setIsNextStartDay(false);
  };

  const onChangePaidHours = (value: TimePickerValue) => {
    setPaidHours(value.toString());
  };

  const onChangeStartTime = (value: TimePickerValue) => {
    setStartTime(value.toString());
  };

  const onClickSpecifyStartEnd = () => {
    if (!isFullDay) return;
    setIsFullDay(isSpecifyStartEndRef.current);
    setIsSpecifyStartEnd(!isSpecifyStartEndRef.current);
  };

  const onChangeEndTime = (value: TimePickerValue) => {
    setEndTime(value.toString());
  };

  const onChangeMemo = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setMemo(e.currentTarget.value);
  };

  const getSites = (item: ITimeOff): string => {
    return item.siteInfo.map(info => info?.name ?? '').join(', ');
  };

  const isSpecifyPaidDisabled = (): boolean => {
    const list = isShowAll ? allItems : items;
    return selectedItem === -1 || !(list.length && list[selectedItem].isPaid) || !isFullDay;
  };

  const onValidate = (msg: string | null) => {
    setIsValid(!msg);
  };

  const applyChanges = (e: React.MouseEvent | KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectedItem == -1) return;

    const exceptionParams: IErrorPopUpParam = {
      isOpen: true,
      data: '',
    };

    setIsLoading(true);
    const item = isShowAll ? allItems[selectedItemRef.current] : items[selectedItemRef.current];
    try {
      if (!isFullDay) {
        const state: ISchState = {
          id: item.id,
          isPaid: item.isPaid,
          name: item?.name ?? '',
          endDateTime: DateUtils.setDayTime(
            currentDate,
            DateUtils.convertTo24h(String(endTimeRef.current)),
            isNextEndDayRef.current,
          ),
          paidMinutes: isSpecifyPaidRef.current ? DateUtils.convertTimeToMinutes(String(paidHoursRef.current)) : 0,
          memo: memoRef.current,
          isFullDay: false,
          shortName: item?.shortName ?? '',
          startDateTime: DateUtils.setDayTime(
            currentDate,
            DateUtils.convertTo24h(String(startTimeRef.current)),
            isNextStartDayRef.current,
            isPreviousStartDayRef.current,
          ),
          type: SchStateType.TIME_OFF,
          color:item.color,
          fontColor:item.fontColor,
        };
        const newAgents = SchAgent.insertState(timeLineData, selectedActivities[0], state);
        dispatch(buildAgentDayInSnapshot({ modifiedAgentDays: newAgents })).then(() => onClose());
      } else {
        const agent = selectedAgent[0];

        if (!clickedDay) return;

        const clickedDayTimestamp = new Date(
          selectedTz.timezoneId === 0 || isSpecifyStartEndRef.current ? currentDate : clickedDay,
        ).getTime();

        const shift = SchAgent.findShiftInSelectedDate(agent, clickedDayTimestamp);

        let startDateTimestamp: number;
        let endDateTimestamp: number;

        if (!isSpecifyStartEndRef.current && shift && shift.startDateTime && shift.endDateTime) {
          startDateTimestamp = +shift.startDateTime;
          endDateTimestamp = +shift.endDateTime;
        } else if (isSpecifyStartEndRef.current) {
          startDateTimestamp = DateUtils.setDayTime(
            clickedDayTimestamp,
            DateUtils.convertTo24h(String(startTimeRef.current)),
            isNextStartDayRef.current,
            isPreviousStartDayRef.current,
          );
          endDateTimestamp = DateUtils.setDayTime(
            clickedDayTimestamp,
            DateUtils.convertTo24h(String(endTimeRef.current)),
            isNextEndDayRef.current,
          );
        } else {
          startDateTimestamp = ZERO_TIME_FOR_OLE_DATE_IN_TIMESTAMP;
          endDateTimestamp = ZERO_TIME_FOR_OLE_DATE_IN_TIMESTAMP;
        }

        const date = isSpecifyStartEndRef.current
          ? startDateTimestamp
          : DateUtils.setDayTime(
              clickedDayTimestamp,
              DateUtils.convertTo24h(String(startTimeRef.current)),
              isNextStartDayRef.current,
              isPreviousStartDayRef.current,
            );
        const dayState: ISchDayState = {
          id: item.id,
          type: SchStateType.TIME_OFF,
          name: item?.name ?? '',
          shortName: item?.shortName ?? '',
          memo: memoRef.current,
          startDateTime: startDateTimestamp,
          endDateTime: endDateTimestamp,
          isPaid: item.isPaid,
          isFullDay: !isSpecifyStartEndRef.current,
          paidMinutes: isSpecifyPaidRef.current ? DateUtils.convertTimeToMinutes(String(paidHoursRef.current)) : 0,
          color:item.color,
          fontColor:item.fontColor,
        };
        const idx = timeLineData.findIndex(a => a.agentId === agent.agentId && a.siteId === agent.siteId);
        if (idx === -1) return;
        const newAgents = SchAgent.insertDay(selectedAgent[0], date, dayState, DayType.SHIFT_EXCEPTION);
        dispatch(buildAgentDayInSnapshot({ agentDays: newAgents })).then(() => onClose());
      }
    } catch (err: any) {
      setIsLoading(false);
      exceptionParams.data = err.message;
      dispatch(openErrorPopUp(exceptionParams));
    }
  };

  const onClose = (saveSelectedActivities = false) => {
    setIsLoading(true);
    !saveSelectedActivities && dispatch(setSelectedActivity([]));
    dispatch(setTimeOffs(null));
    dispatch(setOpenTimeOffMenu({ isOpen: false, isFullDay: false }));
  };

  const applyDisabled = !isValid || selectedItem === -1;

  usePopUpHotkeys({ onSubmit: [applyChanges, { enabled: !applyDisabled }], onCancel: [() => onClose(true)] });

  const getView = () => {
    return (
      <div>
        <div className={styles.type}>
          <div className={styles.typeWrapper1}>
            <AgentInfo classNames={[styles.agentInfo]} agentInfo={selectedAgent[0]} />
          </div>
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
                    {(isShowAll ? allItems : items).map((el, index) => {
                      return (
                        <tr
                          key={index}
                          onClick={() => selectItems(index)}
                          className={`${selectedItem === index ? styles.selected : ''}`}
                        >
                          <td>
                            <span title={el?.name ?? ''} className={styles.firstTd}>
                              {el?.name ?? ''}
                            </span>
                          </td>
                          <td>
                            <span title={el?.shortName ?? ''} className={styles.secTd}>
                              {el?.shortName ?? ''}
                            </span>
                          </td>
                          <td>
                            <span title={getSites(el)} className={styles.thrTd}>
                              {getSites(el)}
                            </span>
                          </td>
                          <td>
                            <span className={styles.fthTd}>
                              <CheckboxBig icon={'mark'} checked={el.isPaid} />
                            </span>
                          </td>
                          <td>
                            <span className={styles.sthTd}>
                              <CheckboxBig icon={'mark'} checked={el.isHasLimit} />
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div data-test={'time-off-show-all'} className={`${styles.checkBoxWrap2} ${styles.showAll}`}>
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
        <div className={styles.options_1st}>
          <div className={`${styles.checkBoxWrap} ${styles.disabled}`}>
            <Checkbox
              checked={isFullDay}
              // onClick={() => {
              //   if (isFullDay) {
              //     setIsSpecifyStartEnd(isFullDayRef.current);
              //     setIsFullDay(!isFullDayRef.current);
              //   }
              // }}
              disabled={true}
              style={{ width: '10px', height: '10px' }}
            />
            <span>Full day</span>
          </div>
          <div
            className={`${styles.checkBoxWrap}  ${isSpecifyPaidDisabled() ? styles.disabled : ''}`}
            data-test={'specify-paid-hours-checkbox'}
          >
            <Checkbox
              checked={isSpecifyPaidRef.current}
              onClick={onClickedSpecifyPaid}
              style={{
                width: '10px',
                height: '10px',
                border: isSpecifyPaidDisabled() ? '#BCC4C8 solid 1px' : null,
                cursor: !isSpecifyPaidDisabled() ? 'point' : 'default',
              }}
              disabled={isSpecifyPaidDisabled()}
            />
            <span onClick={onClickedSpecifyPaid}>Specify paid hours</span>
            {/*</div>*/}
            {/*<div className={styles.dataStart}>*/}
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
        <div className={styles.options_1st}>
          <div
            className={`${styles.checkBoxWrap} ${!isFullDay && isSpecifyStartEndRef.current ? styles.disabled : ''}`}
            data-test={'specify-start-end-checkbox'}
          >
            <Checkbox
              onClick={onClickSpecifyStartEnd}
              checked={isSpecifyStartEndRef.current}
              disabled={isSpecifyStartEndRef.current && !isFullDay}
              style={{
                width: '10px',
                height: '10px',
                cursor: isFullDay ? 'point' : 'default',
              }}
            />
            <span onClick={onClickSpecifyStartEnd}>Specify start/end</span>
          </div>
        </div>
        <div className={styles.options_2nd}>
          <AgentTime
            style={{ marginLeft: '20px' }}
            agent={selectedAgent[0]}
            date={selectedActivities[0] ? selectedActivities[0].date : new Date(clickedDay || currentDate).getTime()}
            timeStart={startTimeRef.current}
            timeEnd={endTimeRef.current}
          />
          <div className={styles.dataStart}>
            <div className={timeFormat === '24hours' ? styles.dataStartTMWrapper : styles.dataStartTMWrapperBigger}>
              <InputTime
                onChangeStartTime={onChangeStartTime}
                onChangeEndTime={onChangeEndTime}
                startTime={startTimeRef.current}
                endTime={endTimeRef.current}
                format={timeFormat}
                disabled={!isSpecifyStartEndRef.current}
                limits={limits}
                onValidate={onValidate}
              />
            </div>
          </div>
          <div className={styles.checkBoxWrap3} data-test={'previous-day-start-checkbox'}>
            <Checkbox
              checked={isPreviousStartDay}
              onClick={() => onClickPreviousStartDay()}
              style={{
                height: '10px',
                width: '10px',
                border: !isSpecifyStartEndRef.current ? '#BCC4C8 solid 1px' : null,
                cursor: isSpecifyStartEndRef.current ? 'point' : 'default',
              }}
              disabled={!isSpecifyStartEndRef.current}
            />
            <span
              className={!isSpecifyStartEndRef.current ? styles.disabled : ''}
              onClick={() => onClickPreviousStartDay()}
            >
              Start on previous day
            </span>
          </div>
          <div className={styles.checkBoxWrap3} data-test={'next-day-start-checkbox'}>
            <Checkbox
              checked={isNextStartDay}
              onClick={() => onClickNextStartDay()}
              style={{
                height: '10px',
                width: '10px',
                border: !isSpecifyStartEndRef.current ? '#BCC4C8 solid 1px' : null,
                cursor: isSpecifyStartEndRef.current ? 'point' : 'default',
              }}
              disabled={!isSpecifyStartEndRef.current}
            />
            <span
              className={!isSpecifyStartEndRef.current ? styles.disabled : ''}
              onClick={() => onClickNextStartDay()}
            >
              Start next day
            </span>
          </div>
          <div className={styles.checkBoxWrap3} data-test={'next-day-end-checkbox'}>
            <Checkbox
              checked={isNextEndDay}
              onClick={() => onClickNextEndDay()}
              style={{
                height: '10px',
                width: '10px',
                border: !isSpecifyStartEndRef.current ? '#BCC4C8 solid 1px' : null,
                cursor: isSpecifyStartEndRef.current ? 'point' : 'default',
              }}
              disabled={!isSpecifyStartEndRef.current}
            />
            <span className={!isSpecifyStartEndRef.current ? styles.disabled : ''} onClick={() => onClickNextEndDay()}>
              End next day
            </span>
          </div>
        </div>
        <div className={styles.memoWrap}>
          <div className={styles.subHeader}>
            <span>Memo:</span>
          </div>
          <div className={styles.memoContainer}>
            <textarea name="memo" placeholder="Text here" onChange={onChangeMemo} />
          </div>
        </div>
        <div className={styles.memoWrap}>
          <div className={styles.subHeader}>
            <span>Agent: {agentName}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <div className={styles.header}>
          <span>{`Insert ${isFullDay ? 'Full-Day ' : ''}Time Off`}</span>
          <Cross onClick={() => onClose(true)} />
        </div>
        <div className={styles.body}>{getView()}</div>

        <div className={styles.footer}>
          <div className={styles.buttonWrap1}>
            <Button
              innerText={'Cancel'}
              click={() => onClose(true)}
              style={{ background: '#FFFFFF', color: '#0183F5', border: '0.5px solid #0183F5', borderRadius: '5px' }}
            />
          </div>

          <div className={styles.buttonWrap3}>
            <Button
              innerText={'Apply'}
              click={applyChanges}
              disable={applyDisabled}
              style={{ background: '#0183F5', color: '#FFFFFF', borderRadius: '5px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsertTimeOffMenu;
