import React, {FC, useEffect, useState} from 'react';
import styles from './menu.module.scss';
import {
    getCalculatedScheduleShifts,
    setOpenBuildSchedule,
    setChartControlData, changeTimeDiscretness, toggleLoader,
} from '../../../../redux/actions/timeLineAction';
import Spiner from '../../../ReusableComponents/spiner';
import { useAppDispatch } from '../../../../redux/hooks';
import { ReactComponent as Cross } from '../../../../static/svg/cross.svg';
import Button from '../../../ReusableComponents/button';
import { useSelector } from 'react-redux';
import {
  getDataSelector, getTimeDiscetness,
  isLoadingSelector,
  scheduleCalculatedSelector
} from '../../../../redux/selectors/timeLineSelector';
import Checkbox from '../../../ReusableComponents/CheckboxStyled';
import classnames from 'classnames';
import InputNumber from '../../../ReusableComponents/inputNumber';
import useStateRef from 'react-usestateref';
import restApi from '../../../../api/rest';
import {IAgentTimeline} from '../../../../redux/ts/intrefaces/timeLine/IAgentTimeline';
import {getActiveDateSelector, getSelectedTzSelector} from '../../../../redux/selectors/controlPanelSelector';
import { ICfgBreak, ICfgMeal, IShifts} from '../../../../redux/ts/intrefaces/timeLine';
import { setTimeZonesAction } from '../../../../redux/actions/controlPanelActions';

const BuildSchedulePopup: FC = () => {
  const dispatch = useAppDispatch();
  const agents = useSelector(getDataSelector);
  const scheduleBuilder = useSelector(scheduleCalculatedSelector);
  const agentTimeLines: IAgentTimeline[] = useSelector(getDataSelector);
  const currentDate = useSelector(getActiveDateSelector);
  const isTimelineLoading = useSelector(isLoadingSelector);
  const timeDiscetness = useSelector(getTimeDiscetness);
  const scheduleCalculatedPrev = useSelector(scheduleCalculatedSelector);
  const selectedTimeZones = useSelector(getSelectedTzSelector);

  const [agentsCount, setAgentsCount] = useState<number>(scheduleBuilder.control.agents.length);

  const [, setShiftItems, ] = useStateRef<IShifts[]>([]);
  const [selectedShift, setSelectedShift, selectedShiftRef] = useStateRef<IShifts|null>(null);
  const [, setMealItems, ] = useStateRef<ICfgMeal[]>([]);
  const [selectedMeal, setSelectedMeal, selectedMealRef] = useStateRef<ICfgMeal|null>(null);
  const [, setBreakItems, ] = useStateRef<ICfgBreak[]>([]);
  const [selectedBreak, setSelectedBreak, selectedBreakRef] = useStateRef<ICfgBreak|null>(null);

  const [isGranularity, setIsGranularity] = useStateRef<boolean>(false);
  const [overtimeWeekly, setOvertimeWeekly] = useState<number>(12);
  const [overtimeMonthly, setOvertimeMonthly] = useState<number>(48);

  const [isLoading, setIsLoading, isLoadingRef] = useStateRef<boolean>(false);


  useEffect(() => {
    setIsGranularity(true);
    const siteTz = {
        gswTimezoneId: 0,
        description: '',
        name: 'Site',
        timezoneId: 0,
        value: 0,
        currentOffset: 0,
    };
    if (timeDiscetness == 15 && selectedTimeZones.timezoneId === siteTz.timezoneId) return;
    dispatch(toggleLoader(true));
    if (timeDiscetness !== 15) dispatch(changeTimeDiscretness(15));
    if (selectedTimeZones.timezoneId !== siteTz.timezoneId) dispatch(setTimeZonesAction(siteTz));
  }, []);

  useEffect(() => {
    if (!isGranularity || isTimelineLoading || !agentTimeLines.length) return;

    const targetId = agentTimeLines[0].siteId;
    const findShiftsPayload = {
      siteId: [targetId],
      date: currentDate,
      provideMeals: true,
      provideBreaks: true,
    };

    restApi.getAgentShifts(findShiftsPayload).then(({data}) => {
      setShiftItems(data);
      if (data && Array.isArray(data) && data.length > 0) {
          const minDuration = Math.min(...data.map(s => s.minDuration ?? 1))
          const findShift = data.filter(s => s.minDuration === minDuration).sort((s0, s1) => (s1.maxDuration ?? 0) - (s0.maxDuration ?? 0))[0];
          if (findShift) {
              setSelectedShift(findShift)
          } else {
              setSelectedShift(null);
          }
      } else {
          setSelectedShift(null);
      }
    });

  }, [isTimelineLoading, isGranularity, selectedTimeZones]);

    useEffect(() => {
        if (selectedShiftRef.current === null) return;
        setMealItems(selectedShiftRef.current.meals);
        if (selectedShiftRef.current.meals.length) {
            setSelectedMeal(selectedShiftRef.current.meals[0]);
        } else {
            setSelectedMeal(null);
        }
        setBreakItems(selectedShiftRef.current.breaks);
        if (selectedShiftRef.current.breaks.length) {
            setSelectedBreak(selectedShiftRef.current.breaks[0]);
        } else {
            setSelectedBreak(null);
        }

    }, [selectedShift])


  const selectAgent = (agentId: number) => {
    if (scheduleBuilder.control.agents.includes(agentId)) {
      dispatch(
        setChartControlData({ name: 'agents', value: scheduleBuilder.control.agents.filter(id => id !== agentId) }),
      );
      setAgentsCount(agentsCount - 1);
    } else {
      dispatch(setChartControlData({ name: 'agents', value: [...scheduleBuilder.control.agents, agentId] }));
      setAgentsCount(agentsCount + 1);
    }
  };

  const applyChanges = (e: React.MouseEvent | KeyboardEvent) => {
    if (isTimelineLoading || isLoadingRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);
    try {
      dispatch(getCalculatedScheduleShifts({
          ...scheduleCalculatedPrev,
          shifts: selectedShiftRef.current ? [selectedShiftRef.current] : [],
          meals: selectedMealRef.current ? [selectedMealRef.current] : [],
          breaks: selectedBreakRef.current ? [selectedBreakRef.current]: [],
      })).then(() => {
        setIsLoading(false);
        onClose();
      });
    } catch (err: any) {
      setIsLoading(false);
    }
  };

  const onClose = () => {
    setIsLoading(false);
    dispatch(setOpenBuildSchedule({ isOpen: false }));
  };

  const isApplyDisabled = (): boolean => {
      return isLoading || !selectedShift;
  }


  const onSetAgentsCount = (v: string) => {
    setAgentsCount(Number(v));
    dispatch(setChartControlData({ name: 'agents', value: agents.slice(0, Number(v)).map(a => a.agentId) }));
  };

  const durationString = (minDuration?: number, maxDuration?: number): string => {
      const minToStrTime = (m: number): string => {
          const mm = m % 60;
          const hh = Math.round((m - mm) / 60);

          return `${hh}:${mm.toString().padStart(2, '0')}`;
      }

      const minPaid = minDuration ?? null;
      const maxPaid = maxDuration ?? null;
      const result = [];
      if (minPaid !== null) result.push(minToStrTime(minPaid));
      if (maxPaid !== null) result.push(minToStrTime(maxPaid));

      return result.join(' - ');
    }

  const componentShiftItems = (
    <>
      <div style={{ width: '212px' }}>
        <div className={styles.infoTitle}>
            <span>Shifts:</span>
        </div>
        <div className={styles.infoWrapper}>
          {selectedShift === null ? (
            <Spiner className={styles.customSpinner}/>
          ) : (
              <>
                  <p className={styles.infoParagraph}><b>Name: </b>{selectedShift.name}</p>
                  <p className={styles.infoParagraph}><b>Hours: </b>{selectedShift.shiftTitle}</p>
                  <p className={styles.infoParagraph}><b>Duration: </b>{durationString(selectedShift.minDuration, selectedShift.maxDuration)}</p>
              </>
          )}
        </div>
      </div>
      <div style={{ width: '148px' }}>
        <div className={styles.infoTitle}>
            <span>Meals:</span>
        </div>
        <div className={styles.infoWrapper}>
          {selectedMeal === null ? (
              <Spiner className={styles.customSpinner}/>
          ) : (
              <>
                  <p className={styles.infoParagraph}><b>Name: </b>{selectedMeal.name}</p>
                  <p className={styles.infoParagraph}><b>Short name: </b>{selectedMeal.shortName}</p>
                  <p className={styles.infoParagraph}><b>Duration: </b>{durationString(selectedMeal.duration)}</p>
              </>
          )}
        </div>
      </div>
      <div
          style={{ width: '148px' }}
      >
        <div className={styles.infoTitle}>
            <span>Breaks:</span>
        </div>
        <div className={styles.infoWrapper}>
          {selectedBreak === null ? (
              <Spiner className={styles.customSpinner}/>
          ) : (
              <>
                  <p className={styles.infoParagraph}><b>Name: </b>{selectedBreak.name}</p>
                  <p className={styles.infoParagraph}><b>Short name: </b>{selectedBreak.shortName}</p>
                  <p className={styles.infoParagraph}><b>Duration: </b>{durationString(selectedBreak.duration)}</p>
              </>
          )}
        </div>
      </div>
    </>
  )

  const getView = () => {
    return (
      <div style={{paddingBottom: '30px'}}>
        <div style={{display: 'flex', justifyContent: 'start', margin: '0 30px', gap: '10px', paddingTop: '10px'}}>
          {componentShiftItems}
        </div>
        <div className={styles.data}>
          <div className={styles.checkBoxWrap} data-test={'next-day-end-checkbox'}>
            <Checkbox
              checked={scheduleBuilder.control.overtimeEnabled}
              onClick={() => {
                dispatch(
                  setChartControlData({ name: 'overtimeEnabled', value: !scheduleBuilder.control.overtimeEnabled }),
                );
              }}
              style={{ height: '10px', width: '10px' }}
            />
            <span
              onClick={() => {
                dispatch(
                  setChartControlData({ name: 'overtimeEnabled', value: !scheduleBuilder.control.overtimeEnabled }),
                );
              }}
            >
              Allow overtime and preferences
            </span>
          </div>
          <div
            className={classnames({
              [styles.insertScheduleView1__text]: true,
              [styles.insertScheduleView1__checkboxContainer]: true,
            })}
          >
            <label htmlFor={'minNumberGroups'}>Agents:</label>
            <InputNumber
              id={'minNumberGroups'}
              change={onSetAgentsCount}
              value={agentsCount}
              removeSpecialCharacters={true}
              style={{ width: '41px', marginLeft: '12px' }}
              disabled={!scheduleBuilder.control.overtimeEnabled}
              min={0}
              max={agents.length}
              valid={true}
            />
          </div>
        </div>
        <div
          className={`${!scheduleBuilder.control.overtimeEnabled ? styles.tableWrapper_enabled : ''} ${
            styles.tableWrapper
          }`}
          style={{ marginTop: '5px' }}
        >
          {isLoading ? (
            <Spiner />
          ) : (
            <>
              <div>
                <table>
                  <thead>
                    <tr>
                        <td>
                            <span>Agent</span>
                        </td>
                        <td>
                            <span>Shorter</span>
                        </td>
                        <td>
                            <span>Longer</span>
                        </td>
                        <td>
                            <span>Finish earlier</span>
                        </td>
                        <td>
                            <span>Start later</span>
                        </td>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map((el, index) => {
                      return (
                        <tr
                          key={index}
                          title={el.agentName}
                        >
                            <td
                              onClick={() => scheduleBuilder.control.overtimeEnabled && selectAgent(el.agentId)}
                              className={`${scheduleBuilder.control.agents.includes(el.agentId) ? styles.selected : ''}`}
                            >
                            <span title={el.agentName}>{el.agentName}</span>
                            </td>
                            <td>
                                <Checkbox
                                    checked={scheduleBuilder.control.agentIdsSmaller.includes(el.agentId)}
                                    disabled={!scheduleBuilder.control.overtimeEnabled || scheduleBuilder.control.agents.includes(el.agentId)}
                                    onClick={() => {
                                        if (!scheduleBuilder.control.overtimeEnabled || scheduleBuilder.control.agents.includes(el.agentId)) return;
                                        if (scheduleBuilder.control.agentIdsSmaller.includes(el.agentId)) {
                                            dispatch(setChartControlData({
                                                name: 'agentIdsSmaller', value: scheduleBuilder.control.agentIdsSmaller
                                                    .filter(agentId => agentId !== el.agentId)
                                                }),
                                            );
                                        } else {
                                            dispatch(
                                                setChartControlData({ name: 'agentIdsSmaller',
                                                    value: [...scheduleBuilder.control.agentIdsSmaller, el.agentId] }),
                                            );
                                            dispatch(
                                                setChartControlData({
                                                    name: 'agentIdsLarger', value: scheduleBuilder.control.agentIdsLarger
                                                        .filter(agentId => agentId !== el.agentId)
                                                }),
                                            );
                                            dispatch(
                                                setChartControlData({
                                                    name: 'agentIdsEarlier', value: scheduleBuilder.control.agentIdsEarlier
                                                        .filter(agentId => agentId !== el.agentId)
                                                }),
                                            );
                                            dispatch(
                                                setChartControlData({
                                                    name: 'agentIdsLater', value: scheduleBuilder.control.agentIdsLater
                                                        .filter(agentId => agentId !== el.agentId)
                                                }),
                                            );
                                        }
                                    }}
                                    style={{ height: '14px', width: '14px', margin: '0 auto' }}
                                />
                            </td>
                            <td>
                                <Checkbox
                                    checked={scheduleBuilder.control.agentIdsLarger.includes(el.agentId)}
                                    disabled={!scheduleBuilder.control.overtimeEnabled || scheduleBuilder.control.agents.includes(el.agentId)}
                                    onClick={() => {
                                        if (!scheduleBuilder.control.overtimeEnabled || scheduleBuilder.control.agents.includes(el.agentId)) return;
                                        if (scheduleBuilder.control.agentIdsLarger.includes(el.agentId)) {
                                            dispatch(
                                                setChartControlData({
                                                    name: 'agentIdsLarger', value: scheduleBuilder.control.agentIdsLarger
                                                        .filter(agentId => agentId !== el.agentId)
                                                }),
                                            );
                                        } else {
                                            dispatch(
                                                setChartControlData({ name: 'agentIdsLarger', value: [...scheduleBuilder.control.agentIdsLarger, el.agentId] }),
                                            );
                                            dispatch(
                                                setChartControlData({
                                                    name: 'agentIdsSmaller', value: scheduleBuilder.control.agentIdsSmaller
                                                        .filter(agentId => agentId !== el.agentId)
                                                }),
                                            );
                                            dispatch(
                                                setChartControlData({
                                                    name: 'agentIdsEarlier', value: scheduleBuilder.control.agentIdsEarlier
                                                        .filter(agentId => agentId !== el.agentId)
                                                }),
                                            );
                                            dispatch(
                                                setChartControlData({
                                                    name: 'agentIdsLater', value: scheduleBuilder.control.agentIdsLater
                                                        .filter(agentId => agentId !== el.agentId)
                                                }),
                                            );
                                        }
                                    }}
                                    style={{ height: '14px', width: '14px', margin: '0 auto' }}
                                />
                            </td>
                            <td>
                                <Checkbox
                                    checked={scheduleBuilder.control.agentIdsEarlier.includes(el.agentId)}
                                    disabled={!scheduleBuilder.control.overtimeEnabled || scheduleBuilder.control.agents.includes(el.agentId)}
                                    onClick={() => {
                                        if (!scheduleBuilder.control.overtimeEnabled || scheduleBuilder.control.agents.includes(el.agentId)) return;
                                        if (scheduleBuilder.control.agentIdsEarlier.includes(el.agentId)) {
                                            dispatch(setChartControlData({
                                                    name: 'agentIdsEarlier', value: scheduleBuilder.control.agentIdsEarlier
                                                        .filter(agentId => agentId !== el.agentId)
                                                }),
                                            );
                                        } else {
                                            dispatch(
                                                setChartControlData({ name: 'agentIdsEarlier',
                                                    value: [...scheduleBuilder.control.agentIdsEarlier, el.agentId] }),
                                            );
                                            dispatch(
                                                setChartControlData({
                                                    name: 'agentIdsSmaller', value: scheduleBuilder.control.agentIdsSmaller
                                                        .filter(agentId => agentId !== el.agentId)
                                                }),
                                            );
                                            dispatch(
                                                setChartControlData({
                                                    name: 'agentIdsLarger', value: scheduleBuilder.control.agentIdsLarger
                                                        .filter(agentId => agentId !== el.agentId)
                                                }),
                                            );
                                            dispatch(
                                                setChartControlData({
                                                    name: 'agentIdsLater', value: scheduleBuilder.control.agentIdsLater
                                                        .filter(agentId => agentId !== el.agentId)
                                                }),
                                            );
                                        }
                                    }}
                                    style={{ height: '14px', width: '14px', margin: '0 auto' }}
                                />
                            </td>
                            <td>
                                <Checkbox
                                    checked={scheduleBuilder.control.agentIdsLater.includes(el.agentId)}
                                    disabled={!scheduleBuilder.control.overtimeEnabled || scheduleBuilder.control.agents.includes(el.agentId)}
                                    onClick={() => {
                                        if (!scheduleBuilder.control.overtimeEnabled || scheduleBuilder.control.agents.includes(el.agentId)) return;
                                        if (scheduleBuilder.control.agentIdsLater.includes(el.agentId)) {
                                            dispatch(
                                                setChartControlData({
                                                    name: 'agentIdsLater', value: scheduleBuilder.control.agentIdsLater
                                                        .filter(agentId => agentId !== el.agentId)
                                                }),
                                            );
                                        } else {
                                            dispatch(
                                                setChartControlData({ name: 'agentIdsLater', value: [...scheduleBuilder.control.agentIdsLater, el.agentId] }),
                                            );
                                            dispatch(
                                                setChartControlData({
                                                    name: 'agentIdsSmaller', value: scheduleBuilder.control.agentIdsSmaller
                                                        .filter(agentId => agentId !== el.agentId)
                                                }),
                                            );
                                            dispatch(
                                                setChartControlData({
                                                    name: 'agentIdsLarger', value: scheduleBuilder.control.agentIdsLarger
                                                        .filter(agentId => agentId !== el.agentId)
                                                }),
                                            );
                                            dispatch(
                                                setChartControlData({
                                                    name: 'agentIdsEarlier', value: scheduleBuilder.control.agentIdsEarlier
                                                        .filter(agentId => agentId !== el.agentId)
                                                }),
                                            );
                                        }
                                    }}
                                    style={{ height: '14px', width: '14px', margin: '0 auto' }}
                                />
                            </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
        <div className={styles.data}>
          <div
            className={classnames({
              [styles.insertScheduleView1__text]: true,
              [styles.insertScheduleView1__checkboxContainer]: true,
            })}
          >
            <label htmlFor={'overtimeDaily'}>Max overtime daily hours:</label>
            <InputNumber
              id={'overtimeDaily'}
              change={val => {
                dispatch(setChartControlData({ name: 'overtimeDaily', value: val }));
              }}
              value={scheduleBuilder.control.overtimeDaily}
              removeSpecialCharacters={true}
              style={{ width: '41px', marginLeft: '12px' }}
              disabled={!scheduleBuilder.control.overtimeEnabled}
              min={0}
              max={24}
              valid={true}
            />
          </div>
          <div
            className={classnames({
              [styles.insertScheduleView1__text]: true,
              [styles.insertScheduleView1__checkboxContainer]: true,
            })}
          >
            <label htmlFor={'overtimeWeekly'}>Max overtime weekly hours:</label>
            <InputNumber
              id={'overtimeWeekly'}
              change={setOvertimeWeekly}
              value={overtimeWeekly}
              removeSpecialCharacters={true}
              style={{ width: '41px', marginLeft: '12px' }}
              disabled={true}
              min={0}
              max={24}
              valid={true}
            />
          </div>
          <div
            className={classnames({
              [styles.insertScheduleView1__text]: true,
              [styles.insertScheduleView1__checkboxContainer]: true,
            })}
          >
            <label htmlFor={'overtimeMonthly'}>Max overtime monthly hours:</label>
            <InputNumber
              id={'overtimeMonthly'}
              change={setOvertimeMonthly}
              value={overtimeMonthly}
              removeSpecialCharacters={true}
              style={{ width: '41px', marginLeft: '12px' }}
              disabled={true}
              min={0}
              max={24}
              valid={true}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <div className={styles.header}>
          <span>Build Schedule</span>
          <Cross onClick={onClose} data-test={'modal-edit-cancel-button'} />
        </div>
        <div> {getView()}</div>
        <div className={styles.footer}>
          <div className={styles.buttonWrap1}>
            <Button
              innerText={'Cancel'}
              click={() => onClose()}
              style={{ background: '#FFFFFF', color: '#006FCF', border: '0.5px solid #0183F5', borderRadius: '5px' }}
            />
          </div>

          <div className={styles.buttonWrap2}>
            <Button
              innerText={'Apply'}
              click={applyChanges}
              disable={isApplyDisabled()}
              style={{ background: '#006FCF', color: '#FFFFFF', borderRadius: '5px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuildSchedulePopup;
