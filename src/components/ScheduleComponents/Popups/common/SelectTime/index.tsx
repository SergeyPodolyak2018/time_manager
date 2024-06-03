import React, { Dispatch, FC, SetStateAction } from 'react';
import styles from './selectTime.module.scss';
import InputTime, { ITimeLimit } from '../../../../ReusableComponents/InputTime';
import Checkbox from '../../../../ReusableComponents/CheckboxStyled';
import { useSelector } from 'react-redux';
import { getTimeFormat } from '../../../../../redux/selectors/timeLineSelector';
import classnames from 'classnames';
import AgentTime from '../AgentTime';
import { IAgentTimeline } from '../../../../../redux/ts/intrefaces/timeLine/IAgentTimeline';
import { ISelectedActivity } from '../../../../../redux/ts/intrefaces/timeLine';
import { getActiveDateSelector } from '../../../../../redux/selectors/controlPanelSelector';
import DateUtils from '../../../../../helper/dateUtils';

export interface ISelectTimeState {
  timeStart: string;
  timeEnd: string;
  isPrevDayStart: boolean;
  isNextDayEnd: boolean;
  isNextDayStart: boolean;
  isValid: boolean;
}
export enum SelectTimeType {
  PREV_DAY_START,
  NEXT_DAY_START,
  NEXT_DAY_END,
}

export interface ISelectTimeProps {
  setState: Dispatch<SetStateAction<ISelectTimeState>>;
  state: ISelectTimeState;
  limits?: ITimeLimit;
  type: SelectTimeType[];
  onValidate?: (msg: string | null) => void;
  classNames?: string[];
  agent?: IAgentTimeline;
  selectedActivity?: ISelectedActivity;
}

const SelectTime: FC<ISelectTimeProps> = ({
  setState,
  state,
  onValidate,
  limits,
  classNames,
  type,
  agent,
  selectedActivity,
}) => {
  const timeFormat = useSelector(getTimeFormat);
  const date = useSelector(getActiveDateSelector);

  return (
    <div className={classnames([styles.selectTime, ...(classNames || [])])}>
      {agent && (selectedActivity || date) && (
        <AgentTime
          date={selectedActivity?.date || DateUtils.convertStringToTimestamp(`${date}`)}
          agent={agent}
          timeStart={state.timeStart}
          timeEnd={state.timeEnd}
        />
      )}
      <div className={styles.selectTime__columnItem}>
        <div
          className={
            timeFormat === '24hours'
              ? styles.selectTime__timepickerContainer
              : styles.selectTime__timepickerContainerBigger
          }
        >
          <InputTime
            onChangeStartTime={val => setState({ ...state, timeStart: val })}
            onChangeEndTime={val => setState({ ...state, timeEnd: val })}
            startTime={state.timeStart}
            endTime={state.timeEnd}
            format={timeFormat}
            limits={limits}
            onValidate={onValidate}
          />
        </div>
      </div>
      {type.includes(SelectTimeType.PREV_DAY_START) && (
        <div className={styles.selectTime__checkboxContainer}>
          <Checkbox
            id={'prevDay'}
            onClick={() =>
              setState({ ...state, isPrevDayStart: !state.isPrevDayStart, isNextDayEnd: false, isNextDayStart: false })
            }
            checked={state.isPrevDayStart}
          />
          <label
            htmlFor={'prevDay'}
            onClick={() =>
              setState({ ...state, isPrevDayStart: !state.isPrevDayStart, isNextDayEnd: false, isNextDayStart: false })
            }
          >
            Start on previous day
          </label>
        </div>
      )}
      {type.includes(SelectTimeType.NEXT_DAY_START) && (
        <div className={styles.selectTime__checkboxContainer}>
          <Checkbox
            id={'nextStartTime'}
            onClick={() =>
              setState({
                ...state,
                isNextDayStart: !state.isNextDayStart,
                isNextDayEnd: !state.isNextDayStart ? !state.isNextDayStart : state.isNextDayEnd,
                isPrevDayStart: false,
              })
            }
            checked={state.isNextDayStart}
          />
          <label
            htmlFor={'nextStartTime'}
            onClick={() =>
              setState({
                ...state,
                isNextDayStart: !state.isNextDayStart,
                isNextDayEnd: !state.isNextDayStart ? !state.isNextDayStart : state.isNextDayEnd,
                isPrevDayStart: false,
              })
            }
          >
            Start next day
          </label>
        </div>
      )}
      {type.includes(SelectTimeType.NEXT_DAY_END) && (
        <div className={styles.selectTime__checkboxContainer}>
          <Checkbox
            id={'nextDay'}
            onClick={() => setState({ ...state, isNextDayEnd: !state.isNextDayEnd, isPrevDayStart: false })}
            checked={state.isNextDayEnd}
          />
          <label
            htmlFor={'nextDay'}
            onClick={() => setState({ ...state, isNextDayEnd: !state.isNextDayEnd, isPrevDayStart: false })}
          >
            End next day
          </label>
        </div>
      )}
    </div>
  );
};

export default SelectTime;
