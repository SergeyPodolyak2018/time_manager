import '../NewShiftMenu/TimePicker.css';

import { clone } from 'ramda';
import React, { FC, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { IAuditLog } from '../../../../api/ts/interfaces/schedulePayload';
import { SCH_STATE_TYPE } from '../../../../common/constants';
import { DayType, SchStateType } from '../../../../common/constants/schedule';
import { catalog, CatalogKey, CatalogKeyReverted } from '../../../../common/constants/schedule/timelineColors';
import { ISchDay, ISchState } from '../../../../common/interfaces/schedule/IAgentSchedule';
import { ActionType, ICfgAuditLog, SchTransaction } from '../../../../common/models/cfg.auditLog';
import DateUtils, { formatTime } from '../../../../helper/dateUtils';
import SchState from '../../../../helper/schedule/SchState';
import { usePopUpHotkeys } from '../../../../hooks';
import {
  buildAgentDayInSnapshot,
  findAuditLog,
  rollbackSchedule,
  setAuditLog,
  setOpenScheduleRestore,
  setSelectedActivity,
} from '../../../../redux/actions/timeLineAction';
import { getColorByID } from '../../../../redux/selectors/colorsSelector';
import { useAppDispatch } from '../../../../redux/hooks';
import { getActiveDateSelector, getSelectedTzSelector } from '../../../../redux/selectors/controlPanelSelector';
import {
  getAuditLog,
  getDataSelector,
  getInitDataSelector,
  getSelectedActivitySelector,
  getSelectedAgentSelector,
  getSubMenuDataSelector,
  getTimeFormat,
  getIsUseCustomColors
} from '../../../../redux/selectors/timeLineSelector';
import { ISelectedActivity } from '../../../../redux/ts/intrefaces/timeLine';
import { IAgentDayTimeline, IAgentTimeline } from '../../../../redux/ts/intrefaces/timeLine/IAgentTimeline';
import Button from '../../../ReusableComponents/button';
import Spiner from '../../../ReusableComponents/spiner';
import styles from './menu.module.scss';
import { Cross } from '../../../../static/svg';

export interface IRestorePoint {
  transaction: SchTransaction | null;
  day: ISchDay;
}

const RestoreScheduleMenu: FC = () => {
  const dispatch = useAppDispatch();

  const auditLog: ICfgAuditLog | null = useSelector(getAuditLog);
  const selectedActivities: ISelectedActivity[] = useSelector(getSelectedActivitySelector);
  const selectedAgent: IAgentTimeline[] = useSelector(getSelectedAgentSelector);
  const subMenuData = useSelector(getSubMenuDataSelector);
  const timeFormat = useSelector(getTimeFormat);
  const timeLineData = useSelector(getDataSelector);
  const timeLineInitData = useSelector(getInitDataSelector);
  const currentDate = useSelector(getActiveDateSelector);
  const colorsFromApi= useSelector(getColorByID(selectedAgent[0].buId));
  const customColorsTriger = useSelector(getIsUseCustomColors);


  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [items, setItem] = useState<IRestorePoint[]>([]);
  const [selectedItem, setSelectedItem] = useState<number>(0);
  const [currentShift, setCurrentShift] = useState<IAgentDayTimeline | null>(null);
  const timezonesSelector = useSelector(getSelectedTzSelector);
  const [shiftStartCurrentDate, setShiftStartCurrentDate] = useState<string | null>(null);

  const getAgentId = () => selectedActivities[0]?.agentId || selectedAgent[0]?.agentId;

  const getCurrentDate = () => subMenuData?.dateTimeSite.split('T')[0] ?? currentDate;

  const getShiftInLocalTZ = (currentShift: IAgentDayTimeline): IAgentDayTimeline => {
    const _currentShift = clone(currentShift);
    if (!_currentShift.dayState || !_currentShift.states) return currentShift;

    const tzOffset =
      DateUtils.getTimezoneOffsetFromSelected(
        _currentShift.timeZoneSelected,
        _currentShift.timeZoneSite,
        _currentShift.dayState?.startDateTime ?? 0,
      ) * 60000;

    _currentShift.dayState.startDateTime = msToNum(_currentShift.dayState.startDateTime) - tzOffset;
    _currentShift.dayState.endDateTime = msToNum(_currentShift.dayState.endDateTime) - tzOffset;
    _currentShift.states = (_currentShift.states ?? []).map(s => ({
      ...s,
      startDateTime: msToNum(s.startDateTime) - tzOffset,
      endDateTime: msToNum(s.endDateTime) - tzOffset,
    }));

    return _currentShift;
  };

  const isRealModify = (dayTimeLine: IAgentDayTimeline) => {
    const result = dayTimeLine.isModified;
    // const agentId = getAgentId();
    // const siteId = getSiteId();
    //
    // const initTimeLine = timeLineInitData.find(t => t.agentId === agentId && t.siteId === siteId);
    // if (!initTimeLine) return result;
    //
    // const initDay = initTimeLine.days.find(d => d.date === new Date(getCurrentDate()).getTime());
    // if (!initDay) return result;
    //
    // const isSimilarDayStates = dayTimeLine.states.every(s =>
    //   initDay.states.some(
    //     _s => _s.type === s.type && _s.startDateTime === s.startDateTime && _s.endDateTime === s.endDateTime,
    //   ),
    // );

    return !!result; //!(isSimilarDayStates && dayTimeLine.states.length === initDay.states.length);
  };

  useEffect(() => {
    if (auditLog !== null) {
      setIsLoading(false);
      let restorePoints: IRestorePoint[] = [];

      if (auditLog.transactions?.length) {
        const transactions = auditLog.transactions || [];
        restorePoints = transactions.map(
          (t: SchTransaction, i): IRestorePoint => ({
            transaction: t,
            day: auditLog.schedules[0].days[i],
          }),
        );
      }
      if (currentShift) {
        restorePoints.unshift({
          day: getShiftInLocalTZ(currentShift),
          transaction: null,
        });
      }
      setItem(restorePoints);
    }
  }, [auditLog]);

  useEffect(() => {
    if (isLoading) {
      const payload: IAuditLog = {
        siteId: 0,
        agentIds: 0,
        date: DateUtils.getDateFromString<string>(getCurrentDate()),
      };
      let currentShift: IAgentDayTimeline | undefined;
      payload.agentIds = getAgentId();
      const timeLines = timeLineData.find((t: IAgentTimeline) => t.agentId === payload.agentIds) as IAgentTimeline;
      if (!timeLines) return;
      if (selectedActivities[0]) {
        const day = timeLines.days[selectedActivities[0].dayIndex];
        payload.siteId = timeLines.siteId;
        payload.date = new Date(day.date).toISOString().split('T')[0];
        currentShift = day;
      } else {
        payload.siteId = selectedAgent[0].siteId;
        currentShift = timeLines.days.find(
          d => d.date === new Date(DateUtils.getDateFromString(getCurrentDate())).getTime(),
        );
      }

      if (currentShift && isRealModify(currentShift)) {
        setCurrentShift(currentShift ?? null);
      }
      dispatch(findAuditLog(payload));
      setShiftStartCurrentDate(payload.date);
    }
  }, [selectedActivities]);

  const selectItems = (index: number) => {
    setSelectedItem(index);
  };

  const getDataTime = (transaction: SchTransaction | null): string => {
    if (transaction === null) return '<Unpublished>';
    const tzOffset = DateUtils.getTimezoneOffset(timezonesSelector, transaction.timestamp);

    const [date, t] = DateUtils.timeConverter(transaction.timestamp + tzOffset * 60000).split('T');
    const [y, m, d] = date.split('-');
    const tFormated = timeToTimeFormat(t);

    return `${m}/${d}/${y} ${tFormated}`;
  };

  const getTimeFromDate = (timestamp: number | string, isDuration = false): string => {
    const dateTime = DateUtils.timeConverter(typeof timestamp === 'string' ? parseInt(timestamp) : timestamp).split(
      'T',
    );
    const time24h = dateTime[1].split(':');
    let hh = time24h[0];
    const mm = time24h[1];

    if (isDuration && shiftStartCurrentDate && shiftStartCurrentDate !== dateTime[0]) {
      hh = String(parseInt(hh) + 24);
    }

    return `${hh}:${mm}`;
  };

  const getTimeLineCoordinates = (timestamp: number | string, endLimit = 1): number => {
    const hhmm = getTimeFromDate(timestamp, true).split(':');

    return (endLimit / (24 * 60)) * (parseInt(hhmm[0]) * 60 + parseInt(hhmm[1]));
  };

  const timeToTimeFormat = (time: string) => {
    return formatTime[timeFormat](time);
  };

  const getHours = () => {
    let hours = ['12 AM', '2 AM', '4 AM', '6 AM', '8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM'];
    if (timeFormat === '24hours') {
      hours = [...Array(24).keys()].filter(key => key % 2 == 0).map(key => ('0' + key).slice(-2));
    }
    return hours.map((v: string, idx) => <div key={idx}>{v}</div>);
  };

  const getUserName = (transaction: SchTransaction | null): string => {
    if (transaction === null) return '<Unpublished>';
    const userName = transaction.userName || `User <id: ${transaction.userId}>`;

    if (transaction.userFirstName && transaction.userLastName) {
      const userFirstName = transaction.userFirstName;
      const userLastName = transaction.userLastName;

      return userFirstName !== userName || userLastName !== userName ? `${userFirstName} ${userLastName}` : userName;
    }

    return userName;
  };

  const getPaidTime = (paidMinutes: number | string): string => {
    const minutes = typeof paidMinutes === 'string' ? parseInt(paidMinutes) : paidMinutes;

    return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
  };

  const getAction = (transaction: SchTransaction | null): string => {
    if (transaction === null) return '<Unpublished>';

    return (
      ActionType[transaction.action].charAt(0).toUpperCase() + ActionType[transaction.action].substring(1).toLowerCase()
    );
  };

  const getVisibleState = (states: ISchState[]): ISchState[] => {
    return states.filter(s => s.type !== SchStateType.ACTIVITY_SET || s.id);
  };

  const getHighlightStyleState = (stateOrDay: ISchState | ISchDay, prefix: string, isDay = false): string => {
    const isEqualState = (s: ISchState) =>
      s.type === stateOrDay.type &&
      s.startDateTime === stateOrDay.startDateTime &&
      s.endDateTime === stateOrDay.endDateTime;
    const isEqualDayState = (s: ISchDay) =>
      s.dayState?.type === (stateOrDay as ISchDay).dayState?.type &&
      s.dayState?.startDateTime === stateOrDay.startDateTime &&
      s.endDateTime === stateOrDay.endDateTime &&
      s.paidMinutes === stateOrDay.paidMinutes;

    const idxSource = prefix === 'Current' ? selectedItem : 0;
    const isUniq = isDay
      ? !isEqualDayState(items[idxSource].day)
      : getVisibleState(items[idxSource]?.day?.states ?? []).findIndex(s => isEqualState(s)) === -1;

    return isUniq && items.length > 1 ? styles[`highlight${prefix}`] : '';
  };

  const getDayStateTitle = (day: ISchDay | null): string => {
    if (!day) return '';
    const name = day.dayState?.name ?? '';
    let activityNames = (day?.activities ?? [])
      .filter(a => a.name)
      .map(a => a.name)
      .join(', ');
    if (name && activityNames) activityNames = `(${activityNames})`;
    if (
      day.dayState?.memo &&
      (day.dayState.type === SchStateType.TIME_OFF || day.dayState.type === SchStateType.EXCEPTION)
    )
      activityNames = `(${day.dayState.memo})`;

    return activityNames ? `${name} ${activityNames}` : name;
  };

  const getStateName = (state: ISchState) =>
    state.memo && (state.type === SchStateType.TIME_OFF || state.type === SchStateType.EXCEPTION)
      ? `${state.name} (${state.memo})`
      : state.name;

  const msToNum = (ms: string | number | null | undefined): number => {
    if (!ms) return 0;

    return typeof ms === 'string' ? parseInt(ms) : ms;
  };

  const isFullDay = (startTime?: string | number | null, endTime?: string | number | null): boolean =>
    (!startTime && !endTime) || getTimeFromDate(msToNum(startTime), false) === getTimeFromDate(msToNum(endTime), false);

  const restoreCurrentInitDay = () => {
    if (currentShift === null) return;

    const agentId = selectedActivities[0]?.agentId || selectedAgent[0]?.agentId;
    let initDay: IAgentDayTimeline | null;

    timeLineInitData.forEach(t => {
      if (t.agentId !== agentId) return;

      initDay = t.days.find(d => d.date === currentShift.date) ?? null;
    });

    let timeLine: IAgentTimeline | null = null;
    timeLineData.forEach((t: IAgentTimeline) => {
      if (t.agentId !== agentId) return;

      const _days = t.days
        .filter(d => d.date === currentShift.date)
        .map((d: IAgentDayTimeline) => (initDay !== null ? { ...initDay, isBuild: true } : d));

      timeLine = clone(t);
      timeLine.days = _days;
      timeLine.isBuild = true;
    });

    if (timeLine) {
      const defaultParams = [];
      defaultParams[5] = true;
      // @ts-ignore
      dispatch(buildAgentDayInSnapshot({ modifiedAgentDays: [timeLine] }, ...defaultParams));
    }
  };

  const onRestore = (e: React.MouseEvent | KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectedItem < 1) return;
    if (currentShift !== null) {
      restoreCurrentInitDay();
      if (selectedItem === 1) return onClose();
    }

    const transaction = items[selectedItem].transaction;
    if (transaction === null) return;

    const payload = {
      auditId: transaction.auditId,
      siteId: transaction.siteId,
      date: DateUtils.getDateFromString(selectedActivities[0]?.dayDate ?? getCurrentDate()),
      agentIds: [selectedAgent[0].agentId]
    };
    dispatch(rollbackSchedule(payload));

    onClose();
  };

  const onClose = () => {
    setIsLoading(true);
    dispatch(setAuditLog(null));
    dispatch(setSelectedActivity([]));
    dispatch(setOpenScheduleRestore(false));
  };

  const getTimelines = (day: ISchDay, isVisibleDayState = true) => {
    const hours = Array.from({ length: 12 });
    const start = day.type === DayType.DAY_OFF ? 0 : getTimeLineCoordinates(day.dayState?.startDateTime ?? 0, 528);
    const dayStateInfo = {
      isDayState: day.dayState !== null && day.dayState.type && day.dayState.type && isVisibleDayState,
      type: day.dayState?.type || SchStateType.NONE,
      name: day.dayState?.name || '',
      start,
      end: getTimeLineCoordinates(day.dayState?.endDateTime ?? 0, 528),
      duration: 0,
      paid: day.dayState?.paidMinutes ?? 0,
    };
    dayStateInfo.duration =
      day.dayState?.startDateTime && day.dayState?.endDateTime && dayStateInfo.end - dayStateInfo.start !== 0
        ? dayStateInfo.end - dayStateInfo.start
        : 528;

    const states = day.states;

    const shiftStyles = catalog[SCH_STATE_TYPE[dayStateInfo.type]];
    const isWorkExist = day.states.find(state => SchState.isWork(state));

    const catalogKey = SCH_STATE_TYPE[dayStateInfo.type];
    let externalColor:string | undefined = undefined;
    const itemColor = day?.dayState?.color
    if(colorsFromApi !== undefined && Object.keys(colorsFromApi).length>0 ){
      const realKey = CatalogKeyReverted[catalogKey as keyof typeof CatalogKeyReverted];
      externalColor = colorsFromApi[realKey as keyof typeof colorsFromApi]?.color
    }
    let color = 'rgba(0,0,0,0)';
  
    color = externalColor && customColorsTriger ? itemColor || externalColor : catalog[catalogKey]?.color;
  
    return (
      <>
        {hours.map((_, idx) => (
          <div key={idx} className={`${styles.stepBlock} ${idx === hours.length - 1 ? styles.last : ''}`}>
            <div className={styles.linePart}></div>
          </div>
        ))}
        <div className={styles.shiftWrapper}>
          {dayStateInfo.isDayState ? (
            <div
              className={styles.shiftBlock}
              datatype={SchStateType[dayStateInfo.type]}
              style={{
                left: `${dayStateInfo.start}px`,
                top: 0,
                width: dayStateInfo.duration,
                background:
                  dayStateInfo.type === SchStateType.SHIFT && isWorkExist
                  ? customColorsTriger ? colorsFromApi['ACTIVITY']?.color : catalog[CatalogKey.ACTIVITY]?.color
                  : color,
                outline: dayStateInfo.type === SchStateType.SHIFT ? shiftStyles.border : 'none',
              }}
            >
              {states.map((s, idx) => {
                const start = getTimeLineCoordinates(s.startDateTime, 528);
                const end = getTimeLineCoordinates(s.endDateTime, 528);

                let type = SchState.isWorkSet(s) ? SchStateType.WORK_SET : s.type;
                type = SchState.isActivitySet(s) ? SchStateType.ACTIVITY_SET : type;
                type = SchState.isWork(s) ? SchStateType.ACTIVITY : type;

                const shiftItemStyles = catalog[SCH_STATE_TYPE[type]];
                const catalogKey = SCH_STATE_TYPE[type];
                let externalColor:string | undefined = undefined;
                if(colorsFromApi !== undefined && Object.keys(colorsFromApi).length>0 ){
                  const realKey = CatalogKeyReverted[catalogKey as keyof typeof CatalogKeyReverted];
                  externalColor = colorsFromApi[realKey as keyof typeof colorsFromApi]?.color
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
                      top: s.type === SchStateType.MARKED_TIME ? shiftItemStyles.top : 0,
                      height: shiftItemStyles.height,
                      background: color,
                      zIndex: shiftItemStyles.zindex,
                    }}
                  />
                );
              })}
            </div>
          ) : null}
        </div>
      </>
    );
  };

  const getView = () => {
    return (
      <>
        <div className={styles.subHeader}>
          <span>Schedule history:</span>
        </div>
        <div className={styles.tableWrapper}>
          {isLoading ? (
            <Spiner />
          ) : (
            <table>
              <thead>
                <tr>
                  <td>
                    <span>Date Of Change</span>
                  </td>
                  <td>
                    <span>User</span>
                  </td>
                  <td>
                    <span>Action</span>
                  </td>
                  <td>{getHours()}</td>
                </tr>
              </thead>
              <tbody>
                {items.map(({ transaction, day }, index) => {
                  const userName = getUserName(transaction);
                  const action = getAction(transaction);
                  return (
                    <tr
                      key={index}
                      onClick={() => selectItems(index)}
                      className={`${selectedItem === index ? styles.selected : ''}`}
                    >
                      <td data-test={'history-column-date-of-change'}>
                        <span>{getDataTime(transaction)}</span>
                      </td>
                      <td data-test={'history-column-user'}>
                        <span title={userName}>{userName}</span>
                      </td>
                      <td data-test={'history-column-action'}>
                        <span title={action}>{action}</span>
                      </td>
                      <td>{getTimelines(day, transaction === null || transaction.action !== ActionType.CLEANUP)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </>
    );
  };

  const getSchedule = (prefix = 'Historical', idx = selectedItem) => {
    return (
      <>
        <div className={styles.subHeader}>
          <span>{prefix === 'Historical' ? 'Historical schedule' : 'Current schedule'}:</span>
        </div>
        <div className={styles.tableWrapper2}>
          {!isLoading && (
            <table>
              <thead>
                <tr>
                  <td>
                    <span>Item</span>
                  </td>
                  <td>
                    <span>Start</span>
                  </td>
                  <td>
                    <span>End</span>
                  </td>
                  <td>
                    <span>Paid</span>
                  </td>
                </tr>
              </thead>
              <tbody>
                {!!items.length && items[idx].day.dayState && (
                  <tr>
                    <td data-test={prefix === 'Historical' ? 'historical-column-item' : 'current-history-column-item'}>
                      <span>{getDayStateTitle(items[idx].day)}</span>
                    </td>
                    <td
                      data-test={prefix === 'Historical' ? 'historical-column-start' : 'current-history-column-start'}
                    >
                      <span className={getHighlightStyleState(items[idx].day, prefix, true)}>
                        {!isFullDay(items[idx].day.dayState?.startDateTime, items[idx].day.dayState?.endDateTime)
                          ? timeToTimeFormat(getTimeFromDate(items[idx].day.dayState?.startDateTime ?? 0, false))
                          : ''}
                      </span>
                    </td>
                    <td data-test={prefix === 'Historical' ? 'historical-column-end' : 'current-history-column-end'}>
                      <span className={getHighlightStyleState(items[idx].day, prefix, true)}>
                        {!isFullDay(items[idx].day.dayState?.startDateTime, items[idx].day.dayState?.endDateTime)
                          ? timeToTimeFormat(getTimeFromDate(items[idx].day.dayState?.endDateTime ?? 0, false))
                          : 'Full Day'}
                      </span>
                    </td>
                    <td data-test={prefix === 'Historical' ? 'historical-column-paid' : 'current-history-column-paid'}>
                      <span className={getHighlightStyleState(items[idx].day, prefix, true)}>
                        {!isFullDay(items[idx].day.dayState?.startDateTime, items[idx].day.dayState?.endDateTime)
                          ? getPaidTime(items[idx].day.paidMinutes ?? 0)
                          : ''}
                      </span>
                    </td>
                  </tr>
                )}
                {!!items.length &&
                  getVisibleState(items[idx].day.states).map((s, index) => {
                    return (
                      <tr key={index}>
                        <td>
                          <span>{getStateName(s)}</span>
                        </td>
                        <td>
                          <span className={getHighlightStyleState(s, prefix)}>
                            {!isFullDay(s.startDateTime, s.endDateTime)
                              ? timeToTimeFormat(getTimeFromDate(s.startDateTime, false))
                              : ''}
                          </span>
                        </td>
                        <td>
                          <span className={getHighlightStyleState(s, prefix)}>
                            {!isFullDay(s.startDateTime, s.endDateTime)
                              ? timeToTimeFormat(getTimeFromDate(s.endDateTime, false))
                              : 'Full Day'}
                          </span>
                        </td>
                        <td>
                          <span></span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}
        </div>
      </>
    );
  };
  const isRestoreDisabled = selectedItem === 0;
  const isCleanUpAction = items.length !== 0 ? items[selectedItem]?.transaction?.action === ActionType.CLEANUP : false;

  usePopUpHotkeys({ onSubmit: [onRestore, { enabled: !isRestoreDisabled }], onCancel: [onClose] });

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <div className={styles.header}>
          <span>{`Schedule Restore Dialog`}</span>
          <Cross onClick={onClose} />
        </div>
        <div className={styles.body}>
          <div>{getView()}</div>
          <div className={styles.twiceTablesWrapper}>
            <div>{getSchedule('Current', 0)}</div>
            <div>{getSchedule()}</div>
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.buttonWrap1}>
            <Button
              innerText={'Cancel'}
              click={onClose}
              style={{ background: '#FFFFFF', color: '#0183F5', border: '0.5px solid #0183F5', borderRadius: '5px' }}
            />
          </div>

          <div className={styles.buttonWrap}>
            <Button
              innerText={'Restore'}
              click={onRestore}
              disable={isRestoreDisabled || isCleanUpAction}
              style={{ background: '#0183F5', color: '#FFFFFF', borderRadius: '5px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestoreScheduleMenu;
