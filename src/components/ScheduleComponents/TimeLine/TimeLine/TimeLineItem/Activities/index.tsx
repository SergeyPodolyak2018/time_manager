import React, { Dispatch, FC, Fragment, SetStateAction, useMemo } from 'react';
import { useSelector } from 'react-redux';

import SchSelectedActivity from '../../../../../../helper/schedule/SchSelectedActivity';
import { itemsThatCantBeMovedWithShift } from '../../../../../../helper/schedule/SchState';
import { getIsFullDay } from '../../../../../../redux/selectors/timeLineSelector';
import { ISelectedActivity } from '../../../../../../redux/ts/intrefaces/timeLine';
import { IAgentTimeline } from '../../../../../../redux/ts/intrefaces/timeLine/IAgentTimeline';
import { IDragNDrop } from '../dragNdrop';
import Shift from './Shift';
import ShiftItem from './ShiftItem';
import { SchStateType } from '../../../../../../common/constants/schedule';

interface IActivitiesProps {
  agent: IAgentTimeline;
  selectedActivities: ISelectedActivity[];
  rightClick: (e: React.MouseEvent, element: ISelectedActivity, type: number) => void;
  leftClick: (e: React.MouseEvent, element: ISelectedActivity, type: number) => void;
  leftMouseDown: (...args: any) => void;
  isFullDay: boolean;
  discretness: number;
  dragNDrop: IDragNDrop;
  setDragNDrop: Dispatch<SetStateAction<IDragNDrop>>;
  rerender?: string;
  isVisible: boolean;
  setRerender: (msg: string) => void;
}

export enum ITimelineActivityType {
  SHIFT = 'shift',
  SHIFT_ITEM = 'shiftItem',
  SHIFT_ITEM_AS_SHIFT = 'shiftItemAsShift',
}

const Activities: FC<IActivitiesProps> = ({
  agent,
  discretness,
  selectedActivities,
  leftClick,
  leftMouseDown,
  rightClick,
  setDragNDrop,
  dragNDrop,
  rerender,
  setRerender,
  isVisible,
}) => {
  const isFullDay = useSelector(getIsFullDay);

  const groupedActivities = useMemo(
    () => SchSelectedActivity.groupActivities(agent.activities),
    [agent.activities, rerender],
  );
  return (
    <>
      {rerender
        ? ''
        : groupedActivities.map((shift, index) => {
            return (
              <Fragment key={`${shift.agentId} ${shift._id} ${shift.id}`}>
                <Shift
                  isVisible={isVisible}
                  setRerender={setRerender}
                  key={`${shift.uniqueId}${index}`}
                  shift={shift}
                  index={index}
                  agent={agent}
                  selectedActivities={selectedActivities}
                  rightClick={rightClick}
                  leftClick={leftClick}
                  leftMouseDown={leftMouseDown}
                  isFullDay={isFullDay}
                  discretness={discretness}
                  dragNDrop={dragNDrop}
                  setDragNDrop={setDragNDrop}
                />
                {shift.states
                  // @ts-ignore
                  ?.filter(state => itemsThatCantBeMovedWithShift.includes(state._type))
                  ?.map((shiftItem, i) => {
                    return (
                      <ShiftItem
                        isVisible={isVisible}
                        setRerender={setRerender}
                        key={agent.agentId + ITimelineActivityType.SHIFT_ITEM_AS_SHIFT + i}
                        isMarkedTimeExist={shift.states?.find(el => el._type === SchStateType.MARKED_TIME)}
                        index={i}
                        agent={agent}
                        selectedActivities={selectedActivities}
                        rightClick={rightClick}
                        leftClick={leftClick}
                        leftMouseDown={leftMouseDown}
                        shiftItem={shiftItem}
                        isFullDay={isFullDay}
                        discretness={discretness}
                        dragNDrop={dragNDrop}
                        setDragNDrop={setDragNDrop}
                        shift={shift}
                        type={ITimelineActivityType.SHIFT_ITEM_AS_SHIFT}
                      />
                    );
                  })}
              </Fragment>
            );
          })}
    </>
  );
};
export default Activities;
