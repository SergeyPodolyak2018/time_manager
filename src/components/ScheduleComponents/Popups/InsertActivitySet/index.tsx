import React, { FC, useEffect } from 'react';
import { useSelector } from 'react-redux';
import useStateRef from 'react-usestateref';

import { SCH_STATE_TYPE } from '../../../../common/constants';
import { ActivitySetType } from '../../../../common/constants/schedule';
import { ISchWorkState } from '../../../../common/interfaces/schedule/IAgentSchedule';
import DateUtils from '../../../../helper/dateUtils';
import SchAgent from '../../../../helper/schedule/SchAgent';
import SchUtils from '../../../../helper/schedule/SchUtils';
import SchWorkState from '../../../../helper/schedule/SchWorkState';
import { buildAgentDayInSnapshot, toggleInsertActivitySetPopup } from '../../../../redux/actions/timeLineAction';
import { useAppDispatch } from '../../../../redux/hooks';
import { getActiveDateSelector } from '../../../../redux/selectors/controlPanelSelector';
import { getSelectedActivitySelector, getSelectedAgents } from '../../../../redux/selectors/timeLineSelector';
import AgentInfo from '../common/AgentInfo';
import InsertPopupLayout from '../common/InsertPopupLayout';
import SelectActivities, { ISelectActivitiesState } from '../common/SelectActivities';
import SelectTime, { ISelectTimeState, SelectTimeType } from '../common/SelectTime';
import { ISelectedActivity } from '../../../../redux/ts/intrefaces/timeLine';

const InsertActivitySet: FC = () => {
  const dispatch = useAppDispatch();
  const selectedAgents = useSelector(getSelectedAgents);
  const shift = selectedAgents[0]?.activities?.find(activity => activity.type === SCH_STATE_TYPE[8]);
  const selectedActivities = shift ? [shift] : useSelector(getSelectedActivitySelector);
  const currentDate = useSelector(getActiveDateSelector);

  const [, setSelectTime, selectTimeRef] = useStateRef<ISelectTimeState>({
    isNextDayEnd: DateUtils.getDay(currentDate) !== DateUtils.getDay(selectedActivities[0]?.end || Date.now()),
    isPrevDayStart: DateUtils.getDay(currentDate) !== DateUtils.getDay(selectedActivities[0]?.start || Date.now()),
    isNextDayStart: false,
    isValid: true,
    timeStart: DateUtils.getTimeFromDate(selectedActivities[0]?.start),
    timeEnd: DateUtils.getTimeFromDate(selectedActivities[0]?.end),
  });
  const [, setSelectActivities, selectActivitiesRef] = useStateRef<ISelectActivitiesState>({
    checkedActivitiesSets: [],
    isValid: false,
    searchData: [],
    allActivities: [],
    groupedActivities: [],
  });

  const onClose = () => {
    dispatch(toggleInsertActivitySetPopup());
  };

  const [limits, setLimits] = useStateRef({});

  const start =
    'shiftStart' in selectedActivities[0] ? selectedActivities[0]?.shiftStart : selectedActivities[0]?.start;
  const end = 'shiftEnd' in selectedActivities[0] ? selectedActivities[0]?.shiftEnd : selectedActivities[0]?.end;
  useEffect(() => {
    setLimits({
      start: DateUtils.getTimeFromDate(start),
      end: DateUtils.getTimeFromDate(end),
      isNextEndDay: selectTimeRef.current.isNextDayEnd,
      isPreviousStartDay: selectTimeRef.current.isPrevDayStart,
      isNextStartDay: selectTimeRef.current.isNextDayStart,
    });
  }, [selectTimeRef.current.isNextDayEnd, selectTimeRef.current.isPrevDayStart, selectTimeRef.current.isNextDayStart]);

  const handleSave = () => {
    if (isDisableSave()) return;

    const ids = SchUtils.getElementsByID(
      selectActivitiesRef.current.checkedActivitiesSets,
      selectActivitiesRef.current.allActivities,
    ).map(el => el.id);

    const agent = selectedAgents[0];
    const date = DateUtils.getMidnight(DateUtils.convertToIsoWithoutTz(selectedActivities[0].start));

    const workState: ISchWorkState = {
      agentId: agent.agentId,
      siteId: agent.siteId,
      date: date,
      activities: ids,
      startDateTime: selectTimeRef.current.timeStart,
      endDateTime: selectTimeRef.current.timeEnd,
    };
    workState.startDateTime = DateUtils.setDayTime(
      currentDate,
      DateUtils.convertTo24h(String(selectTimeRef.current.timeStart)),
      selectTimeRef.current.isNextDayStart,
      selectTimeRef.current.isPrevDayStart,
    );
    workState.endDateTime = DateUtils.setDayTime(
      currentDate,
      DateUtils.convertTo24h(String(selectTimeRef.current.timeEnd)),
      selectTimeRef.current.isNextDayEnd,
    );

    const agents = SchAgent.insertWorkSet(selectedAgents, selectedActivities[0].start);
    const states = SchWorkState.convertWithoutTz([workState]);

    dispatch(buildAgentDayInSnapshot({ agentDays: agents, states: states }, false));
    onClose();
  };

  const isDisableSave = (): boolean => {
    return !selectActivitiesRef.current.checkedActivitiesSets.length || !selectTimeRef.current.isValid;
  };

  return (
    <InsertPopupLayout
      onClose={onClose}
      handleSave={handleSave}
      disableSave={isDisableSave()}
      isApply={true}
      title={'Insert Activity Set'}
    >
      <AgentInfo agentInfo={selectedAgents[0]} />
      <SelectActivities
        state={selectActivitiesRef.current}
        setState={setSelectActivities}
        type={ActivitySetType.ACTIVITY_SET}
      />
      <SelectTime
        selectedActivity={selectedActivities[0] as ISelectedActivity}
        agent={selectedAgents[0]}
        type={[SelectTimeType.NEXT_DAY_END, SelectTimeType.NEXT_DAY_START]}
        state={selectTimeRef.current}
        setState={setSelectTime}
        limits={limits}
      />
    </InsertPopupLayout>
  );
};

export default InsertActivitySet;
