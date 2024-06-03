import React, { FC } from 'react';
import { useSelector } from 'react-redux';
import useStateRef from 'react-usestateref';

import { SchStateType } from '../../../../common/constants/schedule';
import { IMarkedTime, ISchState } from '../../../../common/interfaces/schedule/IAgentSchedule';
import DateUtils from '../../../../helper/dateUtils';
import SchAgent from '../../../../helper/schedule/SchAgent';
import { buildAgentDayInSnapshot, toggleInsertMarkedTimePopup } from '../../../../redux/actions/timeLineAction';
import { useAppDispatch } from '../../../../redux/hooks';
import { getActiveDateSelector } from '../../../../redux/selectors/controlPanelSelector';
import {
  getSelectedActivitySelector,
  getSelectedAgentSelector,
  getSubMenuDataSelector,
} from '../../../../redux/selectors/timeLineSelector';
import AgentInfo from '../common/AgentInfo';
import InsertPopupLayout from '../common/InsertPopupLayout';
import SelectTime, { ISelectTimeState, SelectTimeType } from '../common/SelectTime';
import styles from './insertMarkedTime.module.scss';
import SelectMarkedTime from './SelectMarkedTime/SelectMarkedTime';
import SchUtils from '../../../../helper/schedule/SchUtils';

export interface IInsertMarkedTimeState {
  markedTimeId: number | null;
  markedTimes: IMarkedTime[];
}

const InsertMarkedTime: FC = () => {
  const dispatch = useAppDispatch();
  const selectedActivities = useSelector(getSelectedActivitySelector);
  const selectedAgents = useSelector(getSelectedAgentSelector);
  const subMenuData = useSelector(getSubMenuDataSelector);
  const currentDate = useSelector(getActiveDateSelector);

  const [, setState, stateRef] = useStateRef<IInsertMarkedTimeState>({
    markedTimes: [],
    markedTimeId: null,
  });

  const [, setSelectTime, selectTimeRef] = useStateRef<ISelectTimeState>({
    isNextDayStart: false,
    isValid: true,
    isNextDayEnd: DateUtils.getDay(currentDate) !== DateUtils.getDay(selectedActivities[0]?.end || Date.now()),
    isPrevDayStart: DateUtils.getDay(currentDate) !== DateUtils.getDay(selectedActivities[0]?.start || Date.now()),
    timeStart: selectedActivities[0]
      ? DateUtils.getTimeFromDate(selectedActivities[0]?.start as number)
      : SchUtils.getStartTimeForTimepicker(subMenuData),
    timeEnd: selectedActivities[0]
      ? DateUtils.getTimeFromDate(selectedActivities[0]?.end as number)
      : SchUtils.getEndTimeForTimepicker(subMenuData),
  });

  const onClose = () => {
    dispatch(toggleInsertMarkedTimePopup());
  };

  const [limits] = useStateRef({});

  // useEffect(() => {
  //   setLimits({
  //     start: DateUtils.getTimeFromDate(selectedActivities[0]?.shiftStart),
  //     end: DateUtils.getTimeFromDate(selectedActivities[0]?.shiftEnd),
  //     isNextEndDay: selectTimeRef.current.isNextDayEnd,
  //     isPreviousStartDay: selectTimeRef.current.isPrevDayStart,
  //     isNextStartDay: selectTimeRef.current.isNextDayStart,
  //   });
  // }, [selectTimeRef.current.isPrevDayStart, selectTimeRef.current.isNextDayStart, selectTimeRef.current.isNextDayEnd]);

  const handleSave = () => {
    if (!stateRef.current.markedTimeId) return;
    const markedTimeSource = stateRef.current.markedTimes.find(item => item.id === stateRef.current.markedTimeId);
    const agent = selectedAgents[0];
    const startDateTime = DateUtils.setDayTime(
      currentDate,
      DateUtils.convertTo24h(String(selectTimeRef.current.timeStart)),
      selectTimeRef.current.isNextDayStart,
      selectTimeRef.current.isPrevDayStart,
    );

    const endDateTime = DateUtils.setDayTime(
      currentDate,
      DateUtils.convertTo24h(String(selectTimeRef.current.timeEnd)),
      selectTimeRef.current.isNextDayEnd,
    );
    const markedTime: ISchState = {
      name: markedTimeSource?.name || '',
      id: stateRef.current.markedTimeId,
      type: SchStateType.MARKED_TIME,
      startDateTime: startDateTime,
      endDateTime: endDateTime,
      color: markedTimeSource?.color,
      fontColor: markedTimeSource?.fontColor,
    };

    const modifiedAgent = SchAgent.insertMarkedTime(agent, markedTime);
    // const states = SchWorkState.convertWithoutTz([markedTime]);
    dispatch(buildAgentDayInSnapshot({ modifiedAgentDays: [modifiedAgent] }));
    onClose();
  };

  return (
    <InsertPopupLayout
      onClose={onClose}
      handleSave={handleSave}
      disableSave={!stateRef.current.markedTimeId || !selectTimeRef.current.isValid}
      isApply={true}
      title={'Insert Marked Time'}
    >
      <AgentInfo agentInfo={selectedAgents[0]} />
      <SelectMarkedTime state={stateRef.current} setState={setState} />
      <SelectTime
        agent={selectedAgents[0]}
        selectedActivity={selectedActivities[0]}
        type={[SelectTimeType.PREV_DAY_START, SelectTimeType.NEXT_DAY_END]}
        classNames={[styles.insertMarkedTime__selectTime]}
        state={selectTimeRef.current}
        setState={setSelectTime}
        limits={limits}
      />
    </InsertPopupLayout>
  );
};

export default InsertMarkedTime;
