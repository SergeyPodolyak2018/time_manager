import React, { Dispatch, FC, SetStateAction, useEffect } from 'react';
import styles from './View1SetTime.module.scss';
import classnames from 'classnames';
import Checkbox from '../../../../ReusableComponents/CheckboxStyled';
import InputRadio from '../../../../ReusableComponents/InputRadio';
import AgentInfo from '../../common/AgentInfo';
import SelectTime, { ISelectTimeState, SelectTimeType } from '../../common/SelectTime';
import { useSelector } from 'react-redux';
import { getSelectedActivitySelector, getSelectedAgentSelector } from '../../../../../redux/selectors/timeLineSelector';
import { IInsertWorkSetState } from '../index';
import { ITimeLimit } from '../../../../ReusableComponents/InputTime';
import useStateRef from 'react-usestateref';

interface IView2SetTime {
  setState: Dispatch<SetStateAction<IInsertWorkSetState>>;
  state: IInsertWorkSetState;
  setSelectTime: Dispatch<SetStateAction<ISelectTimeState>>;
  selectTime: ISelectTimeState;
}

const View1SetTime: FC<IView2SetTime> = ({ state, setState, setSelectTime, selectTime }) => {
  const selectedAgents = useSelector(getSelectedAgentSelector);
  const selectedActivities = useSelector(getSelectedActivitySelector);

  const [limits, setLimits] = useStateRef<ITimeLimit>({});

  useEffect(() => {
    setLimits({
      ...limits,
      isNextEndDay: selectTime.isNextDayEnd,
      isPreviousStartDay: selectTime.isPrevDayStart,
      isNextStartDay: selectTime.isNextDayStart,
    });
  }, [state.isValid, selectTime]);

  const onValidate = (msg: string | null): void => {
    setSelectTime({ ...selectTime, isValid: !msg });
  };

  return (
    <div className={classnames([styles.insertWorkSetView1])}>
      <AgentInfo classNames={[styles.insertWorkSetView1__column]} agentInfo={selectedAgents[0]} />
      <div className={styles.insertWorkSetView1__column}>
        <div className={styles.insertWorkSetView1__columnItem}>
          <h4 className={styles.insertWorkSetView1__titleH4}>Specify work set parameters</h4>
        </div>
        <SelectTime
          agent={selectedAgents[0]}
          selectedActivity={selectedActivities[0]}
          type={[SelectTimeType.NEXT_DAY_START, SelectTimeType.NEXT_DAY_END]}
          limits={limits}
          classNames={[styles.insertWorkSetView1__selectTime]}
          setState={setSelectTime}
          state={selectTime}
          onValidate={onValidate}
        />
      </div>
      <div className={styles.insertWorkSetView1__column}>
        <div className={styles.insertWorkSetView1__checkboxContainer}>
          <InputRadio
            id={'newActivities'}
            onClick={() => setState({ ...state, useExistingActivities: false })}
            checked={!state.useExistingActivities}
          />
          <label htmlFor={'newActivities'} onClick={() => setState({ ...state, useExistingActivities: false })}>
            Select new activities for the Work Set
          </label>
        </div>
        <div className={styles.insertWorkSetView1__checkboxContainer}>
          <InputRadio
            id={'existingActivities'}
            onClick={() => setState({ ...state, useExistingActivities: true })}
            checked={state.useExistingActivities}
          />
          <label htmlFor={'existingActivities'} onClick={() => setState({ ...state, useExistingActivities: true })}>
            Use existing shift activities
          </label>
        </div>
      </div>
      <div className={styles.insertWorkSetView1__column}>
        <div className={styles.insertWorkSetView1__checkboxContainer}>
          <Checkbox
            id={'markedTime'}
            onClick={() => setState({ ...state, useMarkedTime: !state.useMarkedTime })}
            checked={state.useMarkedTime}
          />
          <label htmlFor={'markedTime'} onClick={() => setState({ ...state, useMarkedTime: !state.useMarkedTime })}>
            Mark as overtime with marked time
          </label>
        </div>
      </div>
    </div>
  );
};

export default View1SetTime;
