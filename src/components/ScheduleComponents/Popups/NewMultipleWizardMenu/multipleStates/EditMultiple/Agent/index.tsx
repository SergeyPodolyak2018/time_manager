import React, { FC } from 'react';
import styles from './agent.module.scss';
import { useSelector } from 'react-redux';
import { getTimeFormat } from '../../../../../../../redux/selectors/timeLineSelector';
import DateUtils from '../../../../../../../helper/dateUtils';
import DateUtilsTimeZone from '../../../../../../../helper/DateUtilsTimeZone';
import { IAgentTimeline } from '../../../../../../../redux/ts/intrefaces/timeLine/IAgentTimeline';
import classnames from 'classnames';
import { IEditMultipleSchState, MoveTo } from '../EditMultipleWizard';
import { ISchDay, ISchState } from '../../../../../../../common/interfaces/schedule/IAgentSchedule';
import CheckboxStyled from '../../../../../../ReusableComponents/CheckboxStyled';

interface IAgentProps {
  agent: IAgentTimeline;
  updatedAgent: IAgentTimeline;
  moveTimeMs: number;
  moveTo: MoveTo;
  checkedStates: ISchState[];
  duration: number;
  selectedDate: string;
  handleClickAgentCheckbox: (agent: IAgentTimeline, dayIndex: number, stateIndex: number) => void;
}

const Agent: FC<IAgentProps> = ({
  agent,
  moveTimeMs,
  moveTo,
  handleClickAgentCheckbox,
  updatedAgent,
  duration,
  checkedStates,
  selectedDate,
}) => {
  const timeFormat = useSelector(getTimeFormat);

  return (
    <>
      {agent.days.map((day: ISchDay, index: number) => {
        //if (DateUtils.getDay(day.date) !== new Date(selectedDate).getDay()) return;

        const updatedDay = updatedAgent.days[index];
        return day?.states.map((state: IEditMultipleSchState, stateIndex: number) => {
          if (!checkedStates.find(checkedState => checkedState.type === state.type)) return;
          if(!DateUtilsTimeZone.dayTzComparator(state.startDateTime, selectedDate)) return ;
          // DateUtilsTimeZone.dayTzComparator(state.startDateTime, selectedDate);
          // if (DateUtils.getDay(state.startDateTime) !== new Date(selectedDate).getDay()) return;
          // const updatedState = updatedDay.states[stateIndex] as IEditMultipleSchState;

          return (
            <tr key={stateIndex} className={styles.agent}>
              <td>
                <CheckboxStyled
                  id={`${agent.agentId}_${stateIndex}`}
                  checked={state?.checked === undefined || state?.checked}
                  onClick={() => handleClickAgentCheckbox(agent, index, stateIndex)}
                />
              </td>
              <td>{agent.agentName}</td>
              <td>{state.name}</td>
              <td>{DateUtils.timeFormatting(state.startDateTime, timeFormat)}</td>
              <td>{DateUtils.timeFormatting(state.endDateTime, timeFormat)}</td>
              {/*duration*/}
              <td>{DateUtils.getDifference(+state.endDateTime + 1, +state.startDateTime)}</td>
              {/*new start time*/}
              {moveTo === 'forward' && (
                <td
                  className={classnames({
                    [styles.agent__error]: updatedDay.errors,
                  })}
                >
                  {DateUtils.timeFormatting(+state.startDateTime + moveTimeMs, timeFormat)}
                </td>
              )}
              {moveTo === 'backward' && (
                <td
                  className={classnames({
                    [styles.agent__error]: updatedDay.errors,
                  })}
                >
                  {DateUtils.timeFormatting(+state.startDateTime - moveTimeMs, timeFormat)}
                </td>
              )}
              {moveTo === 'set' && (
                <td
                  className={classnames({
                    [styles.agent__error]: updatedDay.errors,
                  })}
                >
                  {DateUtils.timeFormatting(moveTimeMs, timeFormat)}
                </td>
              )}
              {moveTo === 'set' && (
                <td
                  className={classnames({
                    [styles.agent__error]: updatedDay.errors,
                  })}
                >
                  {DateUtils.timeFormatting(+state.endDateTime + 1 + (moveTimeMs - +state.startDateTime), timeFormat)}
                </td>
              )}
              {/*new end time*/}
              {moveTo === 'forward' && (
                <td
                  className={classnames({
                    [styles.agent__error]: updatedDay.errors,
                  })}
                >
                  {duration > 0
                    ? DateUtils.timeFormatting(+state.startDateTime + 1 + moveTimeMs + duration, timeFormat)
                    : DateUtils.timeFormatting(+state.endDateTime + 1 + moveTimeMs, timeFormat)}
                </td>
              )}
              {moveTo === 'backward' && (
                <td
                  className={classnames({
                    [styles.agent__error]: updatedDay.errors,
                  })}
                >
                  {duration > 0
                    ? DateUtils.timeFormatting(+state.startDateTime + 1 - moveTimeMs + duration, timeFormat)
                    : DateUtils.timeFormatting(+state.endDateTime + 1 - moveTimeMs, timeFormat)}
                </td>
              )}
              {/*new duration*/}
              <td>
                {duration > 0
                  ? DateUtils.getDuration(+state.startDateTime, +state.startDateTime + duration + 1)
                  : DateUtils.getDuration(+state.startDateTime, +state.endDateTime + 1)}
              </td>
            </tr>
          );
        });
      })}
    </>
  );
};

export default Agent;
