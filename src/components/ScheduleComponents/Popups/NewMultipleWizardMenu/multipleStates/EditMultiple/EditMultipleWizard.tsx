import '../../../NewShiftMenu/TimePicker.css';

import classnames from 'classnames';
import React, { Dispatch, FC, SetStateAction, useEffect, useState } from 'react';
import { Value } from 'react-multi-date-picker';
import { useSelector } from 'react-redux';
import useStateRef from 'react-usestateref';

import restApi from '../../../../../../api/rest';
import { SchStateType } from '../../../../../../common/constants/schedule';
import { ISchState } from '../../../../../../common/interfaces/schedule/IAgentSchedule';
import DateUtils from '../../../../../../helper/dateUtils';
import logger from '../../../../../../helper/logger';
import SchAgent from '../../../../../../helper/schedule/SchAgent';
import SchUtils from '../../../../../../helper/schedule/SchUtils';
import Utils from '../../../../../../helper/utils';
import { validateAndSaveAgentDay } from '../../../../../../redux/actions/timeLineAction';
import { useAppDispatch } from '../../../../../../redux/hooks';
import {
  getActiveDateSelector,
  getTimezonesHashSelector,
} from '../../../../../../redux/selectors/controlPanelSelector';
import { getFilterData } from '../../../../../../redux/selectors/filterSelector';
import { getTimeFormat } from '../../../../../../redux/selectors/timeLineSelector';
import { IAgentDayTimeline, IAgentTimeline } from '../../../../../../redux/ts/intrefaces/timeLine/IAgentTimeline';
import DatePickerPopups from '../../../../../ReusableComponents/CalendarAndDatePicker/DatePickerPopups';
import Checkbox from '../../../../../ReusableComponents/CheckboxStyled';
import InputRadio from '../../../../../ReusableComponents/InputRadio';
import InputTimeShort from '../../../../../ReusableComponents/InputTimeChort';
import styles from '../../../InsertBreakMealMenu/menu.module.scss';
import { IDataByType } from '../../dataByType';
import { IMainState } from '../../index';
import WizardLayout from '../../WizardLayout';
import Agent from './Agent';
import datePickerStyles from './datePicker.module.scss';
import editStyles from './editMultiple.module.scss';

interface IEditMultipleProps {
  onClose: () => void;
  onReturn: () => void;
  agents: IAgentTimeline[];
  dataByType: IDataByType;
  mainState: IMainState;
  setMainState: Dispatch<SetStateAction<IMainState>>;
}

export interface IEditMultipleSchState extends ISchState {
  checked?: boolean;
}

export type MoveTo = 'forward' | 'backward' | 'set';

const EditMultipleWizard: FC<IEditMultipleProps> = ({
  onClose,
  onReturn,
  agents,
  dataByType,
  mainState,
  setMainState,
}) => {
  const dispatch = useAppDispatch();
  const timeFormat = useSelector(getTimeFormat);
  const allTimezones = useSelector(getTimezonesHashSelector);
  const filterData = useSelector(getFilterData);
  const selectedDate = useSelector(getActiveDateSelector);

  const [actionForTime, setActionForTime] = useState<'move' | 'set'>('move');
  const [isNextDay, setIsNextDay] = useState<boolean>(false);
  const [, setMoveTime, moveTimeRef] = useStateRef<string>('00:00');
  const [, setStartTime, startTimeRef] = useStateRef<string>('12:00');
  const [, setDuration, durationRef] = useStateRef<string | null>(null);
  const [, setDateForMove, dateForMoveRef] = useStateRef<string | null>(null);
  const [checkedStates] = useState<ISchState[]>(
    () => mainState.indicators.filter(state => state.checked) as unknown as ISchState[],
  );
  const [moveTo, setMoveTo] = useState<MoveTo>('forward');
  const [moveToDate, setMoveToDate, moveToDateRef] = useStateRef<Value>(mainState.dateRange[0]);

  const [, setFilteredAgents, filteredAgentsRef] = useStateRef<IAgentTimeline[]>([]);
  const [updatedAgents, setUpdatedAgents, updatedAgentsRef] = useStateRef<IAgentTimeline[]>([]);
  const [isValid, setIsValid] = useState<boolean>(true);

  useEffect(() => {
    const selectedDate = mainState.dateRange[0];
    if (!selectedDate) return;
    // const states = mainState.indicators.filter(state => state.checked) as unknown as ISchState[];
    const stateTypes = mainState.indicators.filter(state => state.checked).map(state => state.type) as SchStateType[];
    setFilteredAgents(SchAgent.filterAgentDaysByDate(agents, selectedDate, stateTypes));
    // setFilteredAgents(agents);
  }, [agents]);

  // validate agents
  useEffect(() => {
    if (agents) {
      const performance = Utils.getFuncPerformance('Edit multiple wizard: func useEffect - validate agents');
      const duration = durationRef.current ? DateUtils.convertTimeToMs(durationRef.current) : 0;

      const timestamp =
        actionForTime === 'set'
          ? DateUtils.setDayTime(mainState.dateRange[0], startTimeRef.current, isNextDay)
          : DateUtils.convertTimeToMs(moveTimeRef.current);

      //update states time for agents
      const { agents: _updatedAgents, isValid } = SchAgent.updateMultipleAgentsStatesTime(
        filteredAgentsRef.current,
        timestamp,
        checkedStates,
        actionForTime === 'set' ? actionForTime : moveTo,
        duration,
      );

      setIsValid(isValid);
      setUpdatedAgents(_updatedAgents);
      performance();
    }
  }, [
    moveTimeRef.current,
    startTimeRef.current,
    actionForTime,
    durationRef.current,
    moveTo,
    filteredAgentsRef.current,
  ]);

  const handleSaveIfMoveToDate = async () => {
    if (!moveToDateRef.current) return;
    const agentId = filteredAgentsRef.current.map(agent => agent.agentId);
    const stateTypes = mainState.indicators.filter(state => state.checked).map(state => state.type) as SchStateType[];
    const date = moveToDateRef.current.toString().replaceAll('.', '-');
    return await restApi
      .getAgentsDay({
        date: date,
        agentId,
        timezoneId: mainState.localTz.timezoneId,
      })
      .then(res => {
        const agents = SchUtils.addTimeZone(
          res.data,
          filterData,
          allTimezones,
          mainState.localTz,
          date,
        ) as IAgentTimeline[];

        if (!moveToDateRef.current) return;

        return SchAgent.moveStatesToDate(
          updatedAgentsRef.current,
          agents,
          DateUtils.setUTCDate(mainState.dateRange[0]),
          DateUtils.setUTCDate(moveToDateRef.current.toString()),
          stateTypes,
        );
      });
  };

  const saveChanges = async () => {
    let agents;
    if (dateForMoveRef.current) {
      agents = await handleSaveIfMoveToDate();
    } else {
      agents = updatedAgentsRef.current;
    }

    if (!agents) return logger.error(`edit error ${agents}`);

    const isErrors = agents.some(agent => agent.errors);

    if (isErrors) return setMainState({ ...mainState, agentsErrors: agents, viewState: mainState.viewState + 1 });

    let refreshSchedule = true;
    if (dateForMoveRef.current && moveToDateRef.current) {
      refreshSchedule = false;
      const dateFrom = new Date(DateUtils.setUTCDate(mainState.dateRange[0])).toISOString();
      const dateTo = new Date(DateUtils.setUTCDate(moveToDateRef.current.toString())).toISOString();
      const selectedDateISO = new Date(selectedDate).toISOString();
      refreshSchedule = dateFrom === selectedDateISO || dateTo === selectedDateISO;
    }

    await dispatch(
      validateAndSaveAgentDay({
        agents: agents as IAgentTimeline[],
        ignoreWarnings: !mainState.showWarnings,
        checkTimestamp: true,
        refreshSchedule,
        reviewWarningsType: 'short',
        allOrNothing: mainState.insertOnlyErrorsOrWarning,
      }),
    ).then(() => {
      onClose();
    });
  };

  const handleClickAgentCheckbox = (agent: IAgentTimeline, dayIndex: number, stateIndex: number): any => {
    setFilteredAgents(
      filteredAgentsRef.current.map(
        (_agent: IAgentTimeline) =>
          (agent.agentId === _agent.agentId
            ? {
                ..._agent,
                days: _agent.days.map((day, index) =>
                  index === dayIndex
                    ? {
                        ...day,
                        states: day.states.map((state: IEditMultipleSchState, _index) => {
                          if (_index === stateIndex) {
                            return {
                              ...state,
                              checked: state?.checked === undefined ? false : !state.checked,
                            };
                          }
                          return state;
                        }),
                      }
                    : { ...day },
                ),
              }
            : { ..._agent }) as IAgentTimeline,
      ),
    );
  };

  const isAnyStateChecked = () =>
    !!filteredAgentsRef.current.find(
      (_agent: IAgentTimeline) =>
        !!_agent.days.find((day: IAgentDayTimeline) =>
          day.states.find(
            (state: IEditMultipleSchState) =>
              state.checked ||
              (checkedStates.find(checkedState => checkedState.type === state.type) && state?.checked === undefined),
          ),
        ),
    );

  const onChangeDatePicker = (date: Value) => {
    setMoveToDate(date);
  };

  const setLoading = (isLoading: boolean) => setMainState({ ...mainState, loading: isLoading });

  return (
    <>
      <WizardLayout
        onClose={onClose}
        onReturn={onReturn}
        onSave={saveChanges}
        isSaveDisable={!isValid || agents.length === 0 || !isAnyStateChecked()}
        dataByType={dataByType}
        setLoading={setLoading}
        loading={mainState.loading}
      >
        <>
          <div className={styles.subHeader}>
            <span>Select states</span>
          </div>
          <table className={editStyles.editWizard__table}>
            <thead>
              <tr
                className={classnames({
                  [editStyles.editWizard__tableRowHeader]: true,
                })}
              >
                <th></th>
                <th>
                  <span>Agent</span>
                </th>
                <th>
                  <span>State</span>
                </th>
                <th>
                  <span>Start time</span>
                </th>
                <th>
                  <span>End time</span>
                </th>
                <th>
                  <span>Duration</span>
                </th>
                <th>
                  <span>New start</span>
                </th>
                <th>
                  <span>New end</span>
                </th>
                <th>
                  <span>New duration</span>
                </th>
              </tr>
            </thead>
            <tbody className={classnames([editStyles.editWizard__body])}>
              {updatedAgents.length > 0 &&
                filteredAgentsRef.current?.map((agent, index) => {
                  const updatedAgent = updatedAgents[index];

                  return (
                    <Agent
                      checkedStates={checkedStates}
                      updatedAgent={updatedAgent}
                      key={agent.agentId}
                      agent={agent}
                      duration={durationRef.current ? DateUtils.convertTimeToMs(durationRef.current) : 0}
                      moveTimeMs={
                        actionForTime === 'set'
                          ? DateUtils.convertTimeToMs(startTimeRef.current)
                          : DateUtils.convertTimeToMs(moveTimeRef.current)
                      }
                      moveTo={actionForTime === 'set' ? actionForTime : moveTo}
                      handleClickAgentCheckbox={handleClickAgentCheckbox}
                      selectedDate={mainState.dateRange[0]}
                    />
                  );
                })}
            </tbody>
          </table>
          <div>
            <h4 className={editStyles.editWizard__subTitle}>Options:</h4>
            <div className={editStyles.editWizard__optionsColumns}>
              <div className={editStyles.editWizard__optionsColumn}>
                <div className={editStyles.editWizard__timeContainer}>
                  <div className={editStyles.editWizard__textContainer}>
                    <InputRadio
                      id={'move'}
                      classNames={[editStyles.editWizard__radio]}
                      checked={actionForTime === 'move'}
                      onClick={() => setActionForTime('move')}
                    />
                    <label onClick={() => setActionForTime('move')}>Move start time</label>
                  </div>
                  <InputTimeShort
                    classNames={[editStyles.editWizard__timePicker]}
                    onChange={val => setMoveTime(val)}
                    defaultTime={moveTimeRef.current}
                    isEndTime={false}
                    disabled={actionForTime !== 'move'}
                  />
                  <div className={editStyles.editWizard__timeContainer}>
                    <div className={editStyles.editWizard__textContainer}>
                      <InputRadio
                        id={'forward'}
                        disabled={actionForTime !== 'move'}
                        checked={moveTo === 'forward'}
                        onClick={() => setMoveTo('forward')}
                        classNames={[editStyles.editWizard__radio]}
                        name={'direction'}
                      />
                      <label htmlFor={'forward'} onClick={() => setMoveTo('forward')}>
                        Forward
                      </label>
                    </div>
                  </div>
                  <div className={editStyles.editWizard__timeContainer}>
                    <div className={editStyles.editWizard__textContainer}>
                      <InputRadio
                        name={'direction'}
                        id={'backward'}
                        disabled={actionForTime !== 'move'}
                        checked={moveTo === 'backward'}
                        onClick={() => setMoveTo('backward')}
                        classNames={[editStyles.editWizard__radio]}
                      />
                      <label htmlFor={'backward'} onClick={() => setMoveTo('backward')}>
                        Backward
                      </label>
                    </div>
                  </div>
                </div>
                <div
                  className={
                    timeFormat === '12hours'
                      ? editStyles.editWizard__timeContainerBigger
                      : editStyles.editWizard__timeContainer
                  }
                >
                  <div className={editStyles.editWizard__textContainer}>
                    <InputRadio
                      id={'set'}
                      classNames={[editStyles.editWizard__radio]}
                      checked={actionForTime === 'set'}
                      onClick={() => setActionForTime('set')}
                    />
                    <label htmlFor={'set'} onClick={() => setActionForTime('set')}>
                      Set start time
                    </label>
                  </div>
                  <InputTimeShort
                    classNames={[
                      timeFormat === '12hours'
                        ? editStyles.editWizard__timePickerBigger
                        : editStyles.editWizard__timePicker,
                    ]}
                    onChange={val => setStartTime(val)}
                    defaultTime={startTimeRef.current}
                    format={timeFormat}
                    isEndTime={false}
                    disabled={actionForTime !== 'set'}
                  />
                  <div className={editStyles.editWizard__timeContainer}>
                    <div className={editStyles.editWizard__textContainer}>
                      <Checkbox
                        checked={isNextDay}
                        id={'nextDay'}
                        onClick={() => {
                          if (actionForTime !== 'move') setIsNextDay(!isNextDay);
                        }}
                        classNames={[editStyles.editWizard__radio]}
                        disabled={actionForTime === 'move'}
                      />
                      <label htmlFor={'nextDay'} onClick={() => setIsNextDay(!isNextDay)}>
                        Next Day
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className={editStyles.editWizard__optionsColumns2}>
              <div className={editStyles.editWizard__optionsColumn2}>
                <div className={editStyles.editWizard__timeContainer}>
                  <div className={editStyles.editWizard__textContainer}>
                    <Checkbox
                      id={'changeDuration'}
                      classNames={[editStyles.editWizard__radio]}
                      onClick={() => setDuration(durationRef.current ? null : '00:00')}
                      checked={!!durationRef.current}
                    />
                    <label onClick={() => setDuration(durationRef.current ? null : '00:00')} htmlFor={'changeDuration'}>
                      Change duration
                    </label>
                  </div>
                  <InputTimeShort
                    classNames={[editStyles.editWizard__timePicker]}
                    onChange={val => setDuration(val)}
                    defaultTime={durationRef.current || '00:00'}
                    isEndTime={false}
                    disabled={!durationRef.current}
                  />
                </div>
              </div>
              <div className={editStyles.editWizard__optionsColumn2}>
                <div className={editStyles.editWizard__timeContainer}>
                  <div className={editStyles.editWizard__textContainer}>
                    <Checkbox
                      id={'moveToDate'}
                      classNames={[editStyles.editWizard__radio]}
                      onClick={() => setDateForMove(dateForMoveRef.current ? null : '01.01.2023')}
                      checked={!!dateForMoveRef.current}
                    />
                    <label
                      htmlFor={'moveToDate'}
                      onClick={() => setDateForMove(dateForMoveRef.current ? null : '01.01.2023')}
                    >
                      Move to date
                    </label>
                  </div>
                  <DatePickerPopups
                    disabled={!dateForMoveRef.current}
                    className={datePickerStyles.datePicker}
                    containerClassName={datePickerStyles.datePicker__container}
                    inputClass={classnames({
                      [datePickerStyles.datePicker__input]: true,
                      [datePickerStyles['datePicker__input--disabled']]: !dateForMoveRef.current,
                    })}
                    value={moveToDate}
                    onChange={onChangeDatePicker}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      </WizardLayout>
    </>
  );
};

export default EditMultipleWizard;
