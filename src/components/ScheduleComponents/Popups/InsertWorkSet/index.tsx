import React, {FC, useEffect, useState} from 'react';
import { useAppDispatch } from '../../../../redux/hooks';
import {
  buildAgentDayInSnapshot,
  openErrorPopUp,
  toggleInsertWorkSetPopup,
} from '../../../../redux/actions/timeLineAction';
import View1SetTime from './View1SetTime';
import useStateRef from 'react-usestateref';
import View3SelectMarkedTime from './View3SelectMarkedTime';
import { useSelector } from 'react-redux';
import {
  getSelectedActivitySelector,
  getSelectedAgentSelector,
  getSubMenuDataSelector,
} from '../../../../redux/selectors/timeLineSelector';
import { IMarkedTime, ISchWorkState } from '../../../../common/interfaces/schedule/IAgentSchedule';
import SchUtils from '../../../../helper/schedule/SchUtils';
import { getActiveDateSelector } from '../../../../redux/selectors/controlPanelSelector';
import SchAgent from '../../../../helper/schedule/SchAgent';
import SchWorkState from '../../../../helper/schedule/SchWorkState';
import InsertPopupLayout from '../common/InsertPopupLayout';
import { ISelectTimeState } from '../common/SelectTime';
import { ISelectActivitiesState } from '../common/SelectActivities';
import styles from './insertWorkSet.module.scss';
import View2SelectActivities from './View2SelectActivities';
import SchDay from '../../../../helper/schedule/SchDay';
import { IErrorPopUpParam } from '../../../../redux/ts/intrefaces/timeLine';
import DateUtils from '../../../../helper/dateUtils';

export interface IInsertWorkSetState {
  isApply: boolean;
  useExistingActivities: boolean;
  useMarkedTime: boolean;
  markedTimeId: number | null;
  isValid: boolean;
  markedTimes: IMarkedTime[];
}

const InsertWorkSet: FC = () => {
  const dispatch = useAppDispatch();
  const selectedActivities = useSelector(getSelectedActivitySelector);
  const selectedAgents = useSelector(getSelectedAgentSelector);
  const subMenuData = useSelector(getSubMenuDataSelector);
  const currentDate = useSelector(getActiveDateSelector);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [state, setState, stateRef] = useStateRef<IInsertWorkSetState>({
    isApply: false,
    isValid: true,
    useExistingActivities: false,
    useMarkedTime: true,
    markedTimes: [],
    markedTimeId: null,
  });
  const [, setSelectTime, selectTimeRef] = useStateRef<ISelectTimeState>({
    isNextDayStart: false,
    isNextDayEnd: false,
    isPrevDayStart: false,
    isValid: true,
    timeStart: selectedActivities[0]
      ? DateUtils.getTimeFromDate(selectedActivities[0]?.start as number)
      : SchUtils.getStartTimeForTimepicker(subMenuData),
    timeEnd: selectedActivities[0]
      ? DateUtils.getTimeFromDate(selectedActivities[0]?.end as number)
      : SchUtils.getEndTimeForTimepicker(subMenuData),
  });
  const [, setSelectActivities, selectActivitiesRef] = useStateRef<ISelectActivitiesState>({
    checkedActivitiesSets: [],
    allActivities: [],
    groupedActivities: [],
    isValid: true,
    searchData: [],
  });

  const [view, setView, viewRef] = useStateRef<number>(1);

  useEffect(() => {
    const isApplyView1 =
      viewRef.current === 1 && stateRef.current.useExistingActivities && !stateRef.current.useMarkedTime;
    const isApplyView2 = viewRef.current === 2 && !stateRef.current.useMarkedTime;
    const isApplyView3 = viewRef.current === 3;

    setState({
      ...stateRef.current,
      isApply: isApplyView1 || isApplyView2 || isApplyView3,
    });
  }, [stateRef.current.useExistingActivities, stateRef.current.useMarkedTime, viewRef.current]);

  useEffect(() => {
    if (viewRef.current === 1) setState({ ...stateRef.current, isValid: true });
    if (viewRef.current === 2) setState({ ...stateRef.current, isValid: selectActivitiesRef.current.isValid });
  }, [selectActivitiesRef.current.isValid, viewRef.current]);

  // useEffect(() => {
  //   viewRef.current === 2 && stateRef.current.markedTimes.length
  //   setIsLoading((viewRef.current === 2) && !!stateRef.current.markedTimes.length)// && selectActivitiesRef.current.allActivities.length);
  // }, [stateRef.current.markedTimes, selectActivitiesRef.current])

  const onClose = () => {
    dispatch(toggleInsertWorkSetPopup());
  };

  const handleClickPrev = () => {
    const prevView = stateRef.current.useExistingActivities ? 1 : viewRef.current - 1;
    if (prevView < 1) return;
    setView(prevView);
    setState({ ...stateRef.current, isValid: true });
  };

  const handleClickNext = () => {
    if (isDisableSave()) return;

    if (state.isApply) return handleSave();
    const nextView = stateRef.current.useExistingActivities ? 3 : viewRef.current + 1;

    if (nextView > 3) return;
    setView(nextView);
  };

  const handleSave = () => {
    const ids = !stateRef.current.useExistingActivities
      ? SchUtils.getElementsByID(
          selectActivitiesRef.current.checkedActivitiesSets,
          selectActivitiesRef.current.allActivities,
        ).map(el => el.id)
      : [];

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

    const date = DateUtils.convertToIsoWithoutTz(startDateTime);
    const workState: ISchWorkState = {
      agentId: agent.agentId,
      siteId: agent.siteId,
      date: DateUtils.getMidnight(date),
      activities: ids,
      markedTimeId: stateRef.current.markedTimeId || undefined,
      startDateTime: startDateTime,
      endDateTime: endDateTime,
    };

    const agents = SchAgent.insertWorkSet(selectedAgents, selectedActivities[0]?.start || startDateTime);
    const states = SchWorkState.convertWithoutTz([workState]);

    const errorMsg: string | null = SchDay.validateWorkSetSync(states[0], selectedAgents[0]);
    if (errorMsg === null) {
      dispatch(buildAgentDayInSnapshot({ agentDays: agents, states: states }, true)).then(() => onClose());
    } else {
      const exceptionParams: IErrorPopUpParam = {
        isOpen: true,
        data: errorMsg,
      };
      dispatch(openErrorPopUp(exceptionParams));
    }
  };

  const isDisableSave = (): boolean => {
    return !stateRef.current.isValid || !selectTimeRef.current.isValid;
  };

  return (
    <InsertPopupLayout
      classNames={[styles.insertWorkSet__popup]}
      handleClickPrev={handleClickPrev}
      onClose={onClose}
      isPrevVisible={view > 1}
      handleSave={handleClickNext}
      disableSave={isDisableSave()}
      isApply={stateRef.current.isApply}
      title={'Insert Work Set'}
      isDisabledButtons={isLoading}
    >
      {view === 1 && (
        <View1SetTime
          state={stateRef.current}
          setState={setState}
          selectTime={selectTimeRef.current}
          setSelectTime={setSelectTime}
        />
      )}
      {view === 2 && <View2SelectActivities state={selectActivitiesRef.current} setState={setSelectActivities} setIsLoadingCallback={setIsLoading}/>}
      {view === 3 && <View3SelectMarkedTime state={stateRef.current} setState={setState} setIsLoadingCallback={setIsLoading}/>}
    </InsertPopupLayout>
  );
};

export default InsertWorkSet;
