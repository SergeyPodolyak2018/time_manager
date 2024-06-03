import '../NewShiftMenu/TimePicker.css';

import React, { FC, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { TimePickerValue } from 'react-time-picker';
import useStateRef from 'react-usestateref';

import { SCH_STATE_TYPE } from '../../../../common/constants';
import { DayType, OverlappingWarning, SchStateType } from '../../../../common/constants/schedule';
import { ISite, ISites } from '../../../../common/interfaces/config';
import { ISchDayState, ISchState } from '../../../../common/interfaces/schedule/IAgentSchedule';
import DateUtils from '../../../../helper/dateUtils';
import SchAgent from '../../../../helper/schedule/SchAgent';
import { usePopUpHotkeys } from '../../../../hooks';
import {
  buildAgentDayInSnapshot,
  findExceptions,
  openErrorPopUp,
  openWarningPopUp,
  setExceptions,
  setOpenInsertExceptionMenu,
  setSelectedActivity,
} from '../../../../redux/actions/timeLineAction';
import { useAppDispatch } from '../../../../redux/hooks';
import { getActiveDateSelector, getSelectedTzSelector } from '../../../../redux/selectors/controlPanelSelector';
import { getFilterData } from '../../../../redux/selectors/filterSelector';
import {
  getClickedDay,
  getDataSelector,
  getExceptions,
  getSelectedActivitySelector,
  getSelectedAgentSelector,
  getSubMenuDataSelector,
  getTimeFormat,
} from '../../../../redux/selectors/timeLineSelector';
import {
  IErrorPopUpParam,
  IException,
  ISelectedActivity,
  IWarningPopUpParam,
} from '../../../../redux/ts/intrefaces/timeLine';
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
import DateUtilsTimeZone from '../../../../helper/DateUtilsTimeZone';

export interface IInsertExceptionMenuProps {
  isFullDay: boolean;
}

const InsertExceptionMenu: FC<IInsertExceptionMenuProps> = ({ isFullDay }) => {
  const dispatch = useAppDispatch();

  const exceptionList = useSelector(getExceptions);
  const selectedActivity = useSelector(getSelectedActivitySelector);
  const selectedAgent = useSelector(getSelectedAgentSelector);
  const timeLineData = useSelector(getDataSelector);
  const currentDate = useSelector(getActiveDateSelector);
  const timeFormat = useSelector(getTimeFormat);
  const filterData = useSelector(getFilterData);
  const clickedDay = useSelector(getClickedDay);
  const selectedTz = useSelector(getSelectedTzSelector);
  const subMenuData = useSelector(getSubMenuDataSelector);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [items, setItem] = useState<IException[]>([]);
  const [selectedItem, setSelectedItem] = useState<number>(-1);
  const [, setMemo, memoRef] = useStateRef<string>('');
  const [, setIsSpecifyPaid, isSpecifyPaidRef] = useStateRef<boolean>(false);
  const [, setIsSpecifyStartEnd, isSpecifyStartEndRef] = useStateRef<boolean>(true);
  const [isNextStartDay, setIsNextStartDay, isNextStartDayRef] = useStateRef<boolean>(false);
  const [isNextEndDay, setIsNextEndDay, isNextEndDayRef] = useStateRef(false);
  const [isPreviousStartDay, setIsPreviousStartDay, isPreviousStartDayRef] = useStateRef<boolean>(false);

  const All_DAY_OURS_MS = 24 * 60 * 60 * 1000;

  const getShift = () => {
    return selectedAgent[0].activities.filter(
      el =>
        el.type === SCH_STATE_TYPE[SchStateType.SHIFT] &&
        Number(el.start) < selectedActivity[0].start &&
        Number(el.end) > selectedActivity[0].end,
    ) as unknown as ISelectedActivity[];
  };

  const selectedActivities =
    selectedActivity[0]?.type === SCH_STATE_TYPE[SchStateType.EXCEPTION] ? getShift() : selectedActivity;
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
  const agentName = (selectedActivities[0] || selectedAgent[0])?.agentName ?? '';

  useEffect(() => {
    if (Array.isArray(exceptionList)) {
      setIsLoading(false);
      if (exceptionList.length) {
        const exception = exceptionList
          .filter((e: IException) => e.isFullDay === isFullDay)
          .map((e: IException) => {
            const _e: IException = { ...e };
            const sites: ISites = filterData[e.buId].sites;
            _e.sites = _e.siteId.reduce((acc: ISites, sid: number) => ({ ...acc, [sid]: sites[sid] }), {});
            return _e;
          });
        setItem(exception);
      }
    }
  }, [exceptionList]);

  useEffect(() => {
    if (isLoading) {
      const payload = {
        buId: 0,
        siteId: 0,
        shiftId: 0,
      };
      if (!isFullDay) {
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
          }
          const day = data.days.find((d: any) => d.startDateTime === shiftStartTime && d.endDateTime === shiftEndTime);
          if (day) {
            //@ts-ignore
            payload.shiftId = day.dayState.id;
          }
        });
      } else {
        if (!selectedAgent.length) return;
        setIsSpecifyStartEnd(false);
        payload.buId = selectedAgent[0].buId;
        payload.siteId = selectedAgent[0].siteId;
      }
      dispatch(findExceptions(payload));
    }
  }, [selectedActivities]);

  const selectItems = (index: number) => {
    setSelectedItem(selectedItem !== index ? index : -1);
  };

  const onClickSpecifyStartEnd = () => {
    if (!isFullDay) return;
    setIsSpecifyStartEnd(!isSpecifyStartEndRef.current);
  };

  const onClickedSpecifyPaid = () => {
    if (isSpecifyPaidDisabled()) return;
    setIsSpecifyPaid(!isSpecifyPaidRef.current);
  };

  const isSpecifyPaidDisabled = (): boolean => {
    return selectedItem === -1 || !(items.length && items[selectedItem].isPaid) || !isFullDay;
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
    setLimits({ ...limits, isNextEndDay: !isNextEndDayRef.current, isPreviousStartDay: false });
    setIsNextEndDay(!isNextEndDayRef.current);
    setIsPreviousStartDay(false);
  };

  const onClickPreviousStartDay = () => {
    if (!isSpecifyStartEndRef.current) return;
    setLimits({
      ...limits,
      isPreviousStartDay: !isPreviousStartDayRef.current,
      isNextEndDay: false,
      isNextStartDay: false,
    });
    setIsPreviousStartDay(!isPreviousStartDayRef.current);
    setIsNextEndDay(false);
    setIsNextStartDay(false);
  };

  const onChangePaidHours = (value: TimePickerValue) => {
    setPaidHours(value.toString());
  };

  const onChangeStartTime = (value: TimePickerValue) => {
    setStartTime(value.toString());
  };

  const onChangeEndTime = (value: TimePickerValue) => {
    setEndTime(value.toString());
  };

  const onChangeMemo = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setMemo(e.currentTarget.value);
  };

  const getSites = (item: IException): string => {
    const sites: [string | number, ISite][] = item.sites ? Object.entries(item.sites) : [];
    return sites.map(([, v]) => v.name).join(', ');
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

    const overlappingParams: IWarningPopUpParam = {
      isOpen: true,
      data: '',
      agents: [],
    };

    setIsLoading(true);
    const item = items[selectedItem];

    try {
      if (!isFullDay) {
        const state: ISchState = {
          id: item.id,
          isPaid: item.isPaid,
          name: item.name,
          endDateTime: 0,
          paidMinutes: 0,
          memo: memoRef.current,
          isFullDay: item.isFullDay,
          shortName: item.shortName,
          startDateTime: 0,
          type: SchStateType.EXCEPTION,
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
          const newAgents = SchAgent.insertState(timeLineData, selectedActivities[0], state, false);
          dispatch(buildAgentDayInSnapshot({ modifiedAgentDays: newAgents })).then(() => onClose());
        } catch (err: any) {
          setIsLoading(false);
          if (err instanceof OverlappingWarning) {
            overlappingParams.data = err.message;
            overlappingParams.agents = SchAgent.insertState(timeLineData, selectedActivities[0], state);
            onClose();
            dispatch(openWarningPopUp(overlappingParams));
          } else {
            exceptionParams.data = err.message;
            dispatch(openErrorPopUp(exceptionParams));
          }
        }
      } else {
        if (!clickedDay) return;
        const agent = selectedAgent[0];
        const [day] = DateUtils.convertDayStartDelimiter(
          DateUtils.getMidnight(clickedDay),
          agent._TZ_INTERNAL_USAGE.tzSite,
          agent._TZ_INTERNAL_USAGE.tzSelected,
        ).split('T');
        //const [day] = clickedDay.split('T');
        const startDateTimstamp = DateUtilsTimeZone.getUTCTime(DateUtils.getMidnight(clickedDay));
        let endDateTimstamp = startDateTimstamp + All_DAY_OURS_MS;
        if (
          DateUtilsTimeZone.getTimeDST(
            startDateTimstamp,
            endDateTimstamp,
            agent._TZ_INTERNAL_USAGE.tzSite,
            agent._TZ_INTERNAL_USAGE.tzSelected,
          ) !== 0
        ) {
          endDateTimstamp =
            startDateTimstamp +
            All_DAY_OURS_MS +
            DateUtilsTimeZone.getCompensativeTimeDST(
              startDateTimstamp,
              startDateTimstamp + All_DAY_OURS_MS,
              agent._TZ_INTERNAL_USAGE.tzSite,
              agent._TZ_INTERNAL_USAGE.tzSelected,
            );
        }

        const clickedDayTimestamp = new Date(
          selectedTz.timezoneId === 0 || isSpecifyStartEndRef.current ? currentDate : day,
        ).getTime();

        const dayState: ISchDayState = {
          id: item.id,
          type: SchStateType.EXCEPTION,
          name: item.name,
          shortName: item.shortName,
          memo: memoRef.current,
          startDateTime: isSpecifyStartEndRef.current
            ? DateUtils.setDayTime(
                clickedDayTimestamp,
                DateUtils.convertTo24h(String(startTimeRef.current)),
                isNextStartDayRef.current,
                isPreviousStartDayRef.current,
              )
            : selectedTz.timezoneId === 0
            ? DateUtils.setDayTime(clickedDayTimestamp, '00:00', false)
            : startDateTimstamp,
          endDateTime: isSpecifyStartEndRef.current
            ? DateUtils.setDayTime(
                clickedDayTimestamp,
                DateUtils.convertTo24h(String(endTimeRef.current)),
                isNextEndDayRef.current,
              )
            : selectedTz.timezoneId === 0
            ? DateUtils.setDayTime(clickedDayTimestamp, '00:00', true)
            : endDateTimstamp,
          isPaid: item.isPaid,
          isFullDay: item.isFullDay,
          paidMinutes: isSpecifyPaidRef.current ? DateUtils.convertTimeToMinutes(String(paidHoursRef.current)) : 0,
          color:item.color,
          fontColor:item.fontColor,
        };

        const idx = timeLineData.findIndex(a => a.agentId === agent.agentId && a.siteId === agent.siteId);
        if (idx === -1) return;
        const newAgents = SchAgent.insertDay(
          selectedAgent[0],
          DateUtils.getMidnight(clickedDayTimestamp),
          dayState,
          isSpecifyStartEndRef.current ? DayType.SHIFT_EXCEPTION : DayType.EXCEPTION,
        );
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
    dispatch(setExceptions(null));
    dispatch(setOpenInsertExceptionMenu({ isOpen: false, isFullDay: false }));
  };

  const getView = () => {
    return (
      <div>
        <div className={styles.type}>
          <AgentInfo agentInfo={selectedAgent[0]} />
        </div>
        <div className={styles.subHeader}>
          <span>Agent: {agentName || ''}</span>
        </div>
        <div className={styles.tableWrapper}>
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
                {items.map((el, index) => {
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
                        <span className={styles.vthTd}>
                          <CheckboxBig icon={'mark'} checked={el.isConvertable2dayOff} />
                        </span>
                      </td>
                      <td>
                        <span className={styles.sthTd}>
                          <CheckboxBig icon={'mark'} checked={el.isUsedAsVacation} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {isFullDay ? (
          <div className={styles.options_1st}>
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
        ) : (
          ''
        )}
        {!isFullDay && isSpecifyStartEndRef.current ? (
          ''
        ) : (
          <div className={styles.options_1st}>
            <div
              className={`${styles.checkBoxWrap} ${!isFullDay && !isSpecifyStartEndRef.current ? styles.disabled : ''}`}
              data-test={'specify-start-end-checkbox'}
            >
              <Checkbox
                onClick={onClickSpecifyStartEnd}
                checked={isSpecifyStartEndRef.current}
                style={{
                  width: '10px',
                  height: '10px',
                  cursor: isFullDay ? 'pointer' : 'default',
                }}
              />
              <span onClick={onClickSpecifyStartEnd}>Specify start/end</span>
            </div>
          </div>
        )}
        <div className={styles.data}>
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
              disabled={!isSpecifyStartEndRef.current}
              checked={isPreviousStartDay}
              onClick={() => onClickPreviousStartDay()}
              style={{ height: '10px', width: '10px' }}
            />
            <span onClick={() => onClickPreviousStartDay()}>Start on previous day</span>
          </div>
          <div className={styles.checkBoxWrap3} data-test={'next-day-start-checkbox'}>
            <Checkbox
              checked={isNextStartDay}
              disabled={!isSpecifyStartEndRef.current}
              onClick={() => onClickNextStartDay()}
              style={{ height: '10px', width: '10px' }}
            />
            <span onClick={() => onClickNextStartDay()}>Start next day</span>
          </div>
          <div className={styles.checkBoxWrap3} data-test={'next-day-end-checkbox'}>
            <Checkbox
              checked={isNextEndDay}
              disabled={!isSpecifyStartEndRef.current}
              onClick={() => onClickNextEndDay()}
              style={{ height: '10px', width: '10px' }}
            />
            <span onClick={() => onClickNextEndDay()}>End next day</span>
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
      </div>
    );
  };

  const applyDisabled = !isValid || selectedItem === -1;

  usePopUpHotkeys({ onSubmit: [applyChanges, { enabled: !applyDisabled }], onCancel: [() => onClose(true)] });

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <div className={styles.header}>
          <span>{`Insert ${isFullDay ? 'Full-Day ' : ''}Exception`}</span>
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

export default InsertExceptionMenu;
