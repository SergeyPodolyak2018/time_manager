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
  setSelectedActivity,
} from '../../../../../../../redux/actions/timeLineAction';
import { useAppDispatch } from '../../../../../../../redux/hooks';
import { getActiveDateSelector } from '../../../../../../../redux/selectors/controlPanelSelector';
import { getColorByID } from '../../../../../../../redux/selectors/colorsSelector';
import {
  getBuffer,
  getDataSelector,
  getIsFullDay,
  getSelectedAgents,
  getTextCoefficient,
  isLoadingSelector,
  isPopUoOpenSelector,
  getIsUseCustomColors
} from '../../../../../../../redux/selectors/timeLineSelector';
import { IBuffer, IErrorPopUpParam, ISelectedActivity } from '../../../../../../../redux/ts/intrefaces/timeLine';
import {
  IAgentTimeline,
  ITimelineAgentActivity,
} from '../../../../../../../redux/ts/intrefaces/timeLine/IAgentTimeline';
import { handleDragEnd, handleDragStart, IDragNDrop } from '../../dragNdrop';
import styles from '../../lineBar.module.scss';
import ShiftItem from '../ShiftItem';
import ShiftUtils from '../../../../../../../helper/schedule/ShiftUtils';
import { itemsThatCantBeMovedWithShift } from '../../../../../../../helper/schedule/SchState';
import { ITimelineActivityType } from '../index';

interface IShiftProps {
  shift: ITimelineAgentActivity;
  index: number;
  agent: IAgentTimeline;
  selectedActivities: ISelectedActivity[];
  rightClick: (e: React.MouseEvent, shift: ISelectedActivity, type: number) => void;
  leftClick: (e: React.MouseEvent, shift: ISelectedActivity, type: number) => void;
  leftMouseDown: (...args: any) => void;
  isFullDay: boolean;
  discretness: number;
  dragNDrop: IDragNDrop;
  setDragNDrop: Dispatch<SetStateAction<IDragNDrop>>;
  setRerender: (msg: string) => void;
  isVisible: boolean;
}

const Shift: FC<IShiftProps> = ({
  shift,
  index,
  agent,
  discretness,
  selectedActivities,
  leftClick,
  leftMouseDown,
  rightClick,
  setDragNDrop,
  dragNDrop,
  setRerender,
  isVisible,
}) => {
  // const listOfBGids: string[] = [];
  const dispatch = useAppDispatch();
  const editMenuIsOpen = useSelector(isPopUoOpenSelector);
  const isFullDay = useSelector(getIsFullDay);
  const currentDateSelector = useSelector(getActiveDateSelector);
  const buffer: IBuffer = useSelector(getBuffer);
  const selectedAgent = useSelector(getSelectedAgents);
  const data = useSelector(getDataSelector);
  const loading = useSelector(isLoadingSelector);
  const scale = useSelector(getTextCoefficient);
  const colorsFromApi= useSelector(getColorByID(agent.buId));
  const customColorsTriger = useSelector(getIsUseCustomColors)

  const onDragError = (message: string) => {
    const exceptionParams: IErrorPopUpParam = {
      isOpen: true,
      data: message,
    };
    setRerender(message);
    dispatch(openErrorPopUp(exceptionParams));
  };

  const renderEmptyBackGround = (zIndex: number, boxShadow: string, index: string, width: number, left: number) => {
    const emptyActivityColor = 'linear-gradient(360deg, #0434B0 -18.95%, #058EFF 116.2%)';
    return (
      <div
        key={`${index}${left}`}
        id={index.toString()}
        className={classnames({
          [styles.lineAction]: true,
          [styles.disablePointerEvents]: true,
        })}
        style={ShiftUtils.getEmptyBGStyle(left, width, zIndex, emptyActivityColor, '100', '50', boxShadow, '0')}
      />
    );
  };

  const key = shift.type;
  if (!catalog[key]) return <></>;
  const dataForClick = {
    ...shift,
    type: key,
  } as unknown as ISelectedActivity;

  const left = SchUtils.getLeft(+shift.start, String(shift.date)) / (100 * 0.01);
  const width = SchUtils.getWidth(+shift.start, +shift.end) / (100 * 0.01);

  const catalogKey = SchSelectedActivity.isWorkSet(dataForClick) ? CatalogKey.WORK_SET : key;

  let externalColor:string | undefined = undefined;
  if(colorsFromApi !== undefined && Object.keys(colorsFromApi).length>0 ){
    const realKey = CatalogKeyReverted[catalogKey as keyof typeof CatalogKeyReverted];
    externalColor = colorsFromApi[realKey as keyof typeof colorsFromApi]?.color
  }
  let color = 'rgba(0,0,0,0)';

  color = externalColor && customColorsTriger ? shift.color || externalColor : catalog[catalogKey].color;

  const { zindex: zIndex, boxShadow, border } = catalog[catalogKey];
  let { height, top } = catalog[catalogKey];
  const isMarkedTimeExist = shift.states?.find(el => el._type === SchStateType.MARKED_TIME);
  const activitySets = shift.states?.filter(el => el.type === 'activity_set');
  if (isMarkedTimeExist) {
    height = '80%';
    top = '60%';
  }

  const selected = ShiftUtils.isSelected(shift, selectedActivities);

  const isShift = true;
  const durationMore24H = +shift.end - shift.start >= 24 * 60 * 60000;

  //disable drag full day items
  // disable the drag action set internally in shift
  const isDragNDropOff =
    ((shift.type === SCH_STATE_TYPE[SchStateType.TIME_OFF] || shift.type === SCH_STATE_TYPE[SchStateType.EXCEPTION]) &&
      shift.stateIndex === undefined &&
      durationMore24H) ||
    shift.type === SCH_STATE_TYPE[SchStateType.DAY_OFF] ||
    shift.type === SCH_STATE_TYPE[SchStateType.MARKED_TIME] ||
    loading;
  const localIndex = index + key + agent.agentId;

  const selectShiftActivityIfNeed = async () => {
    const _selectedActivities = selectedActivities.some(
      s => s._type === SchStateType.MARKED_TIME || s._type === SchStateType.WORK_SET,
    )
      ? selectedActivities.map(s => {
          const _agent = data.find(a => a.agentId === s.agentId) as IAgentTimeline;
          const _activities = _agent ? _agent?.activities ?? [] : [];

          return _activities.find(x => x.dayIndex === s.dayIndex && x.type === 'shift');
        })
      : selectedActivities;

    return dispatch(setSelectedActivity(_selectedActivities));
  };

  const onStartDrag = async (e: any) => {
    e.stopPropagation();
    if (loading) return;

    await selectShiftActivityIfNeed();

    if (selectedAgent[0]?.agentId !== agent.agentId) {
      await dispatch(selectAgentAction(agent.agentId));
    }
    if (selectedActivities.length <= 1) {
      leftMouseDown(e, dataForClick, ShiftUtils.getType(dataForClick));
    }
    const activity = selectedActivities[0] ? selectedActivities[0] : dataForClick;
    handleDragStart(e, setDragNDrop, activity, false);
  };
  const leftMinMax = SchUtils.getMinMaxDnDForShift(shift, width);

  return (
    <>
      <div
        data-visible={isVisible}
        data-test={`${shift.type}`}
        datatype={ITimelineActivityType.SHIFT}
        data-min={leftMinMax?.min}
        data-max={leftMinMax?.max}
        style={{
          ...ShiftUtils.getStyle(left, width, zIndex, color, height, top, boxShadow, border),
        }}
        id={String(shift.agentId)}
        onDragStart={onStartDrag}
        onDragEnd={e => {
          handleDragEnd(
            e,
            dragNDrop,
            selectedActivities,
            selectedAgent,
            data => dispatch(buildAgentDayInSnapshot({ modifiedAgentDays: data }, false, true, true, false)),
            onDragError,
            false,
            value => dispatch(openWarningPopUp(value)),
          );
        }}
        draggable={!isDragNDropOff}
        data-dragndrop={`${index}${key}${shift.id}`}
        data-shiftitem={`${dataForClick.dayIndex}${key}${agent.agentId}${dataForClick.dayDate}`}
        data-shiftitem-id={shift?.id}
        data-selected={selected}
        className={classnames({
          [styles.lineAction]: true,
          [styles.hasMemo]: ShiftUtils.hasMemo(shift, agent),
          [styles.startsPreviousDay]: ShiftUtils.isStateFromPreviousDay(shift, agent, currentDateSelector),
          [styles.disablePointerEvents]: dataForClick.isFullShiftActivity && SchSelectedActivity.isWork(dataForClick),
        })}
        onClick={e => {
          leftClick(e, dataForClick, ShiftUtils.getType(dataForClick));
        }}
        onDoubleClick={e => {
          if (loading) return;
          if (e.shiftKey) return;
          if (editMenuIsOpen) return;
          if (selectedActivities[0].type === SCH_STATE_TYPE[SchStateType.DAY_OFF]) return;
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
        {
          activitySets &&
            shift.activities &&
            activitySets.map(state =>
              renderEmptyBackGround(
                1,
                boxShadow,
                localIndex,
                SchUtils.getWidth(+state.start, +state.end) / ((width ?? 100) * 0.01),
                (SchUtils.getLeft(+state.start, String(state.date)) - (left ?? 0)) / ((width ?? 100) * 0.01),
              ),
            ) // render empty shifts with shift color for transparent areas under activity_sets and work_sets
        }
        <div className={styles.outline} style={{ display: selected ? 'inherit' : 'none' }} />
        <div className={styles.decorator} style={ShiftUtils.getDecoratorStyle(shift, buffer)} />
        {isShift
          ? shift.states
              //@ts-ignore
              ?.filter(shiftItem => !itemsThatCantBeMovedWithShift.includes(shiftItem._type))
              .map((shiftItem, i) => {
                // agent, state, i + 100, state.type, { left, width };
                return (
                  <ShiftItem
                    isVisible={isVisible}
                    setRerender={setRerender}
                    parentRec={{ left, width }}
                    key={agent.agentId + 'shiftItem' + i}
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
                    type={ITimelineActivityType.SHIFT_ITEM}
                    isMarkedTimeExist={isMarkedTimeExist}
                  />
                );
              })
          : ''}
        {!isFullDay ? (
          <div className={styles.internalWrapper}>
            {ShiftUtils.nameElements(
              discretness,
              +shift.start,
              +shift.end,
              styles.internalContainer,
              scale,
              shift?.shortName,
            ).map(el => el)}
          </div>
        ) : (
          ''
        )}
      </div>
    </>
  );
};
export default Shift;
