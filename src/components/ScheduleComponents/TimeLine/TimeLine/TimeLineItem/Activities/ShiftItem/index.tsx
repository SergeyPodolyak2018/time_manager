import classnames from 'classnames';
import React, { Dispatch, FC, SetStateAction } from 'react';
import { useSelector } from 'react-redux';

import { SCH_STATE_TYPE } from '../../../../../../../common/constants';
import { SchStateType } from '../../../../../../../common/constants/schedule';
import { catalog, CatalogKey, CatalogKeyReverted } from '../../../../../../../common/constants/schedule/timelineColors';
import SchSelectedActivity from '../../../../../../../helper/schedule/SchSelectedActivity';
import SchUtils from '../../../../../../../helper/schedule/SchUtils';
import {
  buildAgentDayInSnapshot,
  openEditFullDayItem,
  openErrorPopUp,
  openMenu,
  openWarningPopUp,
  selectAgentAction,
  selectShiftBySelectedActivity,
} from '../../../../../../../redux/actions/timeLineAction';
import { useAppDispatch } from '../../../../../../../redux/hooks';
import { getActiveDateSelector } from '../../../../../../../redux/selectors/controlPanelSelector';
import { getColorByID } from '../../../../../../../redux/selectors/colorsSelector';
import {
  getBuffer,
  getIsFullDay,
  getSelectedAgents,
  getTextCoefficient,
  isLoadingSelector,
  isPopUoOpenSelector,
  getIsUseCustomColors,
} from '../../../../../../../redux/selectors/timeLineSelector';
import { IBuffer, IErrorPopUpParam, ISelectedActivity } from '../../../../../../../redux/ts/intrefaces/timeLine';
import {
  IAgentTimeline,
  ITimelineAgentActivity,
} from '../../../../../../../redux/ts/intrefaces/timeLine/IAgentTimeline';
import { handleDragEnd, handleDragStart, IDragNDrop } from '../../dragNdrop';
import styles from '../../lineBar.module.scss';
import ShiftUtils from '../../../../../../../helper/schedule/ShiftUtils';
import { ITimelineActivityType } from '../index';

interface IActivitiesProps {
  agent: IAgentTimeline;
  selectedActivities: ISelectedActivity[];
  rightClick: (e: React.MouseEvent, element: ISelectedActivity, type: number) => void;
  leftClick: (e: React.MouseEvent, element: ISelectedActivity, type: number) => void;
  leftMouseDown: (...args: any) => void;
  shiftItem: ITimelineAgentActivity;
  isFullDay: boolean;
  discretness: number;
  index: number;
  dragNDrop: IDragNDrop;
  setDragNDrop: Dispatch<SetStateAction<IDragNDrop>>;
  parentRec?: { left: number; width: number };
  setRerender: (err: any) => void;
  shift: ITimelineAgentActivity;
  isVisible: boolean;
  type?: ITimelineActivityType;
  isMarkedTimeExist?: ITimelineAgentActivity | undefined;
}

const ShiftItem: FC<IActivitiesProps> = ({
  shiftItem,
  agent,
  discretness,
  selectedActivities,
  leftClick,
  leftMouseDown,
  rightClick,
  setDragNDrop,
  dragNDrop,
  parentRec,
  setRerender,
  shift,
  isVisible,
  type,
  isMarkedTimeExist,
}) => {
  const dispatch = useAppDispatch();
  const editMenuIsOpen = useSelector(isPopUoOpenSelector);
  const isFullDay = useSelector(getIsFullDay);
  const currentDateSelector = useSelector(getActiveDateSelector);
  const buffer: IBuffer = useSelector(getBuffer);
  const selectedAgent = useSelector(getSelectedAgents);
  const scale = useSelector(getTextCoefficient);
  const loading = useSelector(isLoadingSelector);
  const colorsFromApi = useSelector(getColorByID(agent.buId));
  const customColorsTriger = useSelector(getIsUseCustomColors);

  const onDragError = (message: string) => {
    const exceptionParams: IErrorPopUpParam = {
      isOpen: true,
      data: message,
    };
    setRerender(message);
    dispatch(openErrorPopUp(exceptionParams));
  };

  const key = shiftItem.type;
  if (!catalog[key]) return <></>;
  const dataForClick = {
    ...shiftItem,
    type: key,
  } as unknown as ISelectedActivity;
  const left = Number(
    (
      (SchUtils.getLeft(+shiftItem.start, String(shiftItem.date)) - (parentRec?.left ?? 0)) /
      ((parentRec?.width ?? 100) * 0.01)
    ).toFixed(2),
  );
  const width = Number(
    (SchUtils.getWidth(+shiftItem.start, +shiftItem.end) / ((parentRec?.width ?? 100) * 0.01)).toFixed(2),
  );
  // const left = SchUtils.getLeft(+shiftItem.start, String(shiftItem.date)) / (100 * 0.01);
  // const width = SchUtils.getWidth(+shiftItem.start, +shiftItem.end) / (100 * 0.01);

  const catalogKey = SchSelectedActivity.isWorkSet(dataForClick) ? CatalogKey.WORK_SET : key;

  const { zindex: zIndex, boxShadow, border } = catalog[catalogKey];
  
  let externalColor: string | undefined = undefined;
  if (colorsFromApi !== undefined && Object.keys(colorsFromApi).length > 0) {
    const realKey = CatalogKeyReverted[catalogKey as keyof typeof CatalogKeyReverted];
    externalColor = colorsFromApi[realKey as keyof typeof colorsFromApi]?.color;
  }
  let color = 'rgba(0,0,0,0)';
  color = externalColor && customColorsTriger ? shiftItem.color || externalColor : catalog[catalogKey].color;
  const selected = ShiftUtils.isSelected(shiftItem, selectedActivities);

  let { height, top } = catalog[catalogKey];
  if (type === ITimelineActivityType.SHIFT_ITEM_AS_SHIFT && shiftItem.type !== 'marked_time') {
    if (isMarkedTimeExist) {
      height = '80%';
      top = '60%';
    }
  }

  //disable drag full day items
  // if you need to disable dragndrop any item
  const isDragNDropOff =
    shiftItem.type === SCH_STATE_TYPE[SchStateType.MARKED_TIME] ||
    shiftItem.type === SCH_STATE_TYPE[SchStateType.ACTIVITY] ||
    loading;
  const isRenderShotcode =
    shiftItem?.type !== SCH_STATE_TYPE[SchStateType.WORK_SET] &&
    shiftItem?.type !== SCH_STATE_TYPE[SchStateType.MARKED_TIME];
  const dndMinMax =
    type === ITimelineActivityType.SHIFT_ITEM_AS_SHIFT ? SchUtils.getMinMaxDnDForShiftItem(shift, width) : null;

  return (
    <>
      <div
        data-visible={isVisible}
        data-test={`${shiftItem.type}`}
        datatype={type || ITimelineActivityType.SHIFT_ITEM}
        data-min={dndMinMax?.min}
        data-max={dndMinMax?.max}
        style={{
          ...ShiftUtils.getStyle(left, width, zIndex, color, height, top, boxShadow, border),
          position: 'absolute',
        }}
        id={String(shiftItem.agentId)}
        onDragStart={e => {
          e.stopPropagation();
          if (loading) return;

          if (selectedAgent[0]?.agentId !== agent.agentId) {
            dispatch(selectAgentAction(agent.agentId));
          }
          if (selectedActivities.length <= 1) {
            leftMouseDown(e, dataForClick, ShiftUtils.getType(dataForClick));
          }

          const activity = selectedActivities[0] ? selectedActivities[0] : dataForClick;

          const isFullShiftActivity = {
            ...shift,
            type: 'shift',
          } as unknown as ISelectedActivity;

          handleDragStart(
            e,
            setDragNDrop,
            activity.isFullShiftActivity ? isFullShiftActivity : activity,
            dataForClick.isFullShiftActivity,
          );
        }}
        onDragEnd={e => {
          e.stopPropagation();
          e.preventDefault();
          handleDragEnd(
            e,
            dragNDrop,
            selectedActivities,
            selectedAgent,
            data => dispatch(buildAgentDayInSnapshot({ modifiedAgentDays: data }, false, true)),
            onDragError,
            shiftItem.isFullShiftActivity,
            value => dispatch(openWarningPopUp(value)),
          );
        }}
        draggable={!isDragNDropOff}
        data-dragndrop={`${shiftItem.stateIndex}${key}${shiftItem.id}`}
        data-shiftitem={`${shiftItem.stateIndex}${key}${agent.agentId}${dataForClick.dayDate}`}
        data-shiftitem-id={shiftItem?.id}
        data-isfullshiftitem={shiftItem.isFullShiftActivity}
        data-selected={selected}
        className={classnames({
          [styles.lineAction]: true,
          [styles.hasMemo]: ShiftUtils.hasMemo(shiftItem, agent),
          [styles.startsPreviousDay]: ShiftUtils.isStateFromPreviousDay(shiftItem, agent, currentDateSelector),
          [styles.disablePointerEvents]: dataForClick.isFullShiftActivity && SchSelectedActivity.isWork(dataForClick),
        })}
        onClick={e => {
          leftClick(e, dataForClick, ShiftUtils.getType(dataForClick));
        }}
        onDoubleClick={e => {
          if (e.shiftKey) return;
          if (editMenuIsOpen) return;

          if (
            dataForClick.isFullDay ||
            SchUtils.isFullDayTimeOff([dataForClick]) ||
            SchUtils.isFullDayException([dataForClick])
          ) {
            dispatch(openEditFullDayItem());
          } else {
            SchSelectedActivity.isWork(dataForClick) && dispatch(selectShiftBySelectedActivity());
            dispatch(openMenu());
          }
        }}
        onContextMenu={e => {
          rightClick(e, dataForClick, ShiftUtils.getType(dataForClick));
        }}
      >
        <div className={styles.outline} style={{ display: selected ? 'inherit' : 'none' }}></div>
        <div className={styles.decorator} style={ShiftUtils.getDecoratorStyle(shiftItem, buffer)}></div>
        {!isFullDay ? (
          <div className={styles.internalWrapper}>
            {isRenderShotcode &&
              ShiftUtils.nameElements(
                discretness,
                +shiftItem.start,
                +shiftItem.end,
                styles.internalContainer,
                scale,
                shiftItem?.shortName,
              ).map(el => el)}
          </div>
        ) : (
          ''
        )}
      </div>
    </>
  );
};
export default ShiftItem;
