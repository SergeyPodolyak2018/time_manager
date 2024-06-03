import React, { FC, memo, MutableRefObject, useEffect, useLayoutEffect, useState } from 'react';
import styles from './editTime.module.scss';
import { TimePickerValue } from 'react-time-picker';
import useStateRef from 'react-usestateref';
import { ISelectedActivity } from '../../../../../../../redux/ts/intrefaces/timeLine';
import { getTimeFormat } from '../../../../../../../redux/selectors/timeLineSelector';
import { useSelector } from 'react-redux';
import InputTime, { ITimeLimit } from '../../../../../../ReusableComponents/InputTime';
import Checkbox from '../../../../../../ReusableComponents/CheckboxStyled';
import { getActiveDateSelector } from '../../../../../../../redux/selectors/controlPanelSelector';
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
  hide,
  useDismiss,
  useInteractions,
  useMergeRefs,
} from '@floating-ui/react';
import { WarningsSubmenuOptions } from '../../../../../../../common/constants/schedule/submenu/common';
import DateUtils from '../../../../../../../helper/dateUtils';
import AgentTime from '../../../../common/AgentTime';
import { IAgentTimeline } from '../../../../../../../redux/ts/intrefaces/timeLine/IAgentTimeline';

export interface IEditTimeProps {
  selectedActivities: ISelectedActivity[];
  editTimeRef: MutableRefObject<any>;
  onSubmit: (
    startTime: TimePickerValue,
    endTime: TimePickerValue,
    isNextDay: boolean,
    isPreviousDay: boolean,
    isMoveComponentRef: boolean,
  ) => void;
  openedMenuItem: WarningsSubmenuOptions | null;
  agent: IAgentTimeline;
}

const EditTime: FC<IEditTimeProps> = ({ selectedActivities, onSubmit, editTimeRef, agent }) => {
  const [isOpen, setIsOpen] = useState(true);
  const referenceElement = document.querySelector('[data-selected="true"]');

  const timeFormat = useSelector(getTimeFormat);
  const currentDate = useSelector(getActiveDateSelector);
  const [timeStart, setTimeStart, timeStartRef] = useStateRef(DateUtils.getTimeFromDate(selectedActivities[0].start));
  const [timeEnd, setTimeEnd, timeEndRef] = useStateRef(DateUtils.getTimeFromDate(selectedActivities[0].end));
  const [isNextDay, setIsNextDay, isNextDayRef] = useStateRef(
    () => DateUtils.getDay(currentDate) !== DateUtils.getDay(selectedActivities[0].end),
  );
  const [limits, setLimits] = useStateRef<ITimeLimit>({});
  const [isPreviousStartDay, setIsPreviousStartDay, isPreviousStartDayRef] = useStateRef(
    () => DateUtils.getDay(currentDate) !== DateUtils.getDay(selectedActivities[0].start),
  );
  const isContainerComponent = () => {
    return selectedActivities && selectedActivities.length && selectedActivities[0].type === 'shift';
  };

  const [, setIsMoveComponent, isMoveComponentRef] = useStateRef(false);
  const [isValid, setIsValid] = useState<boolean>(true);

  const onNextDay = () => {
    if (isMoveComponentRef.current) return;
    setLimits({ ...limits, isNextEndDay: !isNextDay, isPreviousStartDay: !isNextDay ? false : isPreviousStartDay });
    setIsNextDay(!isNextDay);
    setIsPreviousStartDay(false);
  };

  const { x, y, strategy, refs, context } = useFloating({
    placement: isPreviousStartDayRef ? 'bottom-end' : 'bottom',
    middleware: [offset(10), flip(), shift({ padding: 5 }), hide({ strategy: 'escaped' })],
    whileElementsMounted: autoUpdate,
    open: isOpen,
    onOpenChange: setIsOpen,
  });

  const dismiss = useDismiss(context);

  useLayoutEffect(() => {
    refs.setReference(referenceElement);
  }, [refs, referenceElement]);

  const { getFloatingProps } = useInteractions([dismiss]);

  useEffect(() => {
    if (
      selectedActivities[0].type !== 'shift' &&
      selectedActivities[0].type !== 'activity' &&
      selectedActivities[0].type !== 'activity_set' &&
      !(selectedActivities[0].type === 'time_off' && selectedActivities[0].stateIndex === undefined) &&
      !(selectedActivities[0].type === 'exception' && selectedActivities[0].stateIndex === undefined)
    ) {
      setLimits({
        start: DateUtils.getTimeFromDate(selectedActivities[0]?.shiftStart),
        end: DateUtils.getTimeFromDate(selectedActivities[0]?.shiftEnd),
        isNextEndDay: isNextDay,
        isPreviousStartDay: isPreviousStartDay,
      });
    } else {
      setLimits({ ...limits, isNextEndDay: isNextDay, isPreviousStartDay: isPreviousStartDay });
    }
  }, [isValid]);

  const onPreviousStartDay = () => {
    setLimits({
      ...limits,
      isPreviousStartDay: !isPreviousStartDay,
      isNextEndDay: !isPreviousStartDay ? false : isNextDay,
    });
    setIsPreviousStartDay(!isPreviousStartDay);
    setIsNextDay(false);
  };

  const onValidate = (msg: string | null): void => {
    setIsValid(!msg);
  };

  return (
    <div
      ref={useMergeRefs([editTimeRef, refs.setFloating])}
      style={{
        position: strategy,
        top: y ?? 0,
        left: x ?? 0,
      }}
      className={isContainerComponent() ? styles.editTime__bigger : styles.editTime}
      {...getFloatingProps()}
    >
      <AgentTime agent={agent} timeStart={timeStart} timeEnd={timeEnd} date={selectedActivities[0].date} />
      <div className={timeFormat === '12hours' ? styles.dataStartTMWrapperBigger : styles.dataStartTMWrapper}>
        <InputTime
          onChangeStartTime={setTimeStart}
          onChangeEndTime={setTimeEnd}
          startTime={timeStart}
          endTime={timeEnd}
          format={timeFormat}
          limits={limits}
          disabledEndTime={isMoveComponentRef.current ? DateUtils.getTimeFromDate(selectedActivities[0].end) : ''}
          onValidate={onValidate}
        />
      </div>
      <div className={styles.checkBoxes}>
        <div className={styles.checkBoxWrap} data-test={'next-day-end-checkbox'}>
          <Checkbox
            disabled={isMoveComponentRef.current}
            checked={isNextDay}
            onClick={onNextDay}
            style={{ height: '10px', width: '10px' }}
          />
          <span onClick={onNextDay}>End next day</span>
        </div>
        <div className={styles.checkBoxWrap} data-test={'previous-day-start-checkbox'}>
          <Checkbox
            checked={isPreviousStartDay}
            onClick={onPreviousStartDay}
            style={{ height: '10px', width: '10px' }}
          />
          <span onClick={onPreviousStartDay}>Start on previous day</span>
        </div>
        {isContainerComponent() ? (
          <div className={styles.checkBoxWrap} data-test={'move-schedule-items-checkbox'}>
            <Checkbox
              checked={isMoveComponentRef.current}
              onClick={() => {
                setIsNextDay(false);
                setTimeEnd(DateUtils.getTimeFromDate(selectedActivities[0].end));
                setIsMoveComponent(!isMoveComponentRef.current);
              }}
              style={{ height: '10px', width: '10px' }}
            />
            <span
              onClick={() => {
                setIsNextDay(false);
                setTimeEnd(DateUtils.getTimeFromDate(selectedActivities[0].end));
                setIsMoveComponent(!isMoveComponentRef.current);
              }}
            >
              Move schedule items with shift
            </span>
          </div>
        ) : null}
      </div>
      <div className={styles.footer}>
        <div className={styles.buttonWrap2}>
          <button
            className={styles.button}
            onClick={() =>
              onSubmit(
                timeStartRef.current,
                timeEndRef.current,
                isNextDayRef.current,
                isPreviousStartDayRef.current,
                isMoveComponentRef.current,
              )
            }
            disabled={!isValid}
            style={
              isValid
                ? { background: '#006FCF', color: '#FFFFFF', borderRadius: '5px' }
                : { background: 'none', border: '1px solid #BCC4C8', color: '#BCC4C8', cursor: 'default' }
            }
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(EditTime);
