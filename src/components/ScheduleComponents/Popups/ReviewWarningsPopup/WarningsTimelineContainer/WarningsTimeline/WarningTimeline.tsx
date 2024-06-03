import { isEmpty } from 'ramda';
import React, { Dispatch, FC, MutableRefObject, SetStateAction, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { TimePickerValue } from 'react-time-picker';

import { SCH_STATE_VALUES } from '../../../../../../common/constants';
import { SchStateType } from '../../../../../../common/constants/schedule';
import { MenuType, WarningsSubmenuOptions } from '../../../../../../common/constants/schedule/submenu/common';
import { CatalogKey, reviewWarningCatalog , CatalogKeyReverted} from '../../../../../../common/constants/schedule/timelineColors';
import DateUtils from '../../../../../../helper/dateUtils';
import SchAgent from '../../../../../../helper/schedule/SchAgent';
import SchSelectedActivity from '../../../../../../helper/schedule/SchSelectedActivity';
import SchUtils from '../../../../../../helper/schedule/SchUtils';
import {
  buildAgentDayInSnapshot,
  openErrorPopUp,
  setSaveWarnings,
} from '../../../../../../redux/actions/timeLineAction';
import { useAppDispatch } from '../../../../../../redux/hooks';
import {
  getDataSelector,
  getIsFullDay,
  getSaveWarnings,
  getTimeDiscetness,
  getIsUseCustomColors
} from '../../../../../../redux/selectors/timeLineSelector';
import { IErrorPopUpParam, ISelectedActivity, ISubMenuType } from '../../../../../../redux/ts/intrefaces/timeLine';
import { IAgentTimeline, ITimelineAgentActivity } from '../../../../../../redux/ts/intrefaces/timeLine/IAgentTimeline';
import ConfirmDeletePopup from '../../../ConfirmDeletePopup';
import EditTime from './EditTime/EditTime';
import Submenu from './Submenu/Submenu';
import styles from './warningsTimeline.module.scss';
import { getColorByID } from '../../../../../../redux/selectors/colorsSelector';

export interface ITimeLineContainerProps {
  agent: IAgentTimeline;
  parent: any;
  openedMenuItem: WarningsSubmenuOptions | null;
  setOpenedMenuItem: (value: WarningsSubmenuOptions | null) => void;
  setSelectedActivities: Dispatch<SetStateAction<ISelectedActivity[]>>;
  selectedActivities: ISelectedActivity[];
  editTimeRef: MutableRefObject<any>;
}

const WarningsTimeLine: FC<ITimeLineContainerProps> = ({
  agent,
  parent,
  openedMenuItem,
  setOpenedMenuItem,
  selectedActivities,
  setSelectedActivities,
  editTimeRef,
}) => {
  const dispatch = useAppDispatch();

  const [subMenuData, setSubMenuData] = useState<ISubMenuType | null>(null);

  const timeLineData = useSelector(getDataSelector);
  const warnings = useSelector(getSaveWarnings);
  const isFullDay = useSelector(getIsFullDay);
  const discreteness = useSelector(getTimeDiscetness);
  const colorsFromApi= useSelector(getColorByID(agent.buId));
  const customColorsTriger = useSelector(getIsUseCustomColors)


  const exceptionParams: IErrorPopUpParam = {
    isOpen: true,
    data: '',
  };

  const leftClick = (e: React.MouseEvent, element: ISelectedActivity) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenedMenuItem(null);

    const item = SchSelectedActivity.isWork(element)
      ? SchSelectedActivity.selectShiftsBySelectedActivities([element], warnings)[0]
      : element;
    setSelectedActivities([item]);
  };

  const rightClick = (e: React.MouseEvent, element: ISelectedActivity, type: MenuType) => {
    e.preventDefault();
    e.stopPropagation();

    leftClick(e, element);
    const disableEdit = element._type === SchStateType.DAY_OFF;
    if (disableEdit) return;

    const typeindex = [...selectedActivities, element].findIndex(
      (pelement: ISelectedActivity) => pelement.type === element.type && pelement.id === element.id,
    );
    if (typeindex !== -1 || (type === 2 && !agentErrors)) {
      if (parent) {
        setSubMenuData({
          type: element.type,
          activityId: element.id,
          agentId: agent.agentId,
          left: e.clientX,
          top: e.clientY,
          menuType: type,
          dateTime: 0,
          dateTimeSite: '',
        });
      }
    }
  };

  const isSelected = (element: any) => {
    const typeindex = selectedActivities.findIndex(
      (pelement: ISelectedActivity) => pelement.type === element.type && pelement.id === element.id,
    );

    return typeindex !== -1;
  };

  const renderActivities = (
    agent: IAgentTimeline,
    element: ITimelineAgentActivity,
    index: number,
    key: SCH_STATE_VALUES,
    parentRec?: { left: number; width: number },
  ) => {
    if (!reviewWarningCatalog[key]) return <></>;
    const dataForClick = {
      ...element,
      type: key,
      agentId: agent.agentId,
      agentName: agent.agentName,
    } as unknown as ISelectedActivity;
    // const isShift = SchSelectedActivity.isShift(dataForClick);

    const catalogKey = SchSelectedActivity.isWorkSet(dataForClick) ? CatalogKey.WORK_SET : key;
    let externalColor:string | undefined = undefined;
    if(colorsFromApi !== undefined && Object.keys(colorsFromApi).length>0 ){
      const realKey = CatalogKeyReverted[catalogKey as keyof typeof CatalogKeyReverted];
      externalColor = colorsFromApi[realKey as keyof typeof colorsFromApi]?.color
    }
    let color = 'rgba(0,0,0,0)';

    color = externalColor && customColorsTriger ? element.color || externalColor : reviewWarningCatalog[catalogKey].color;
    const {zindex: zIndex, boxShadow, border } = reviewWarningCatalog[catalogKey];
    let { height, top } = reviewWarningCatalog[key];

    const isMarkedTimeExist = element.states?.find(el => el._type === SchStateType.MARKED_TIME);
    if (isMarkedTimeExist) {
      height = reviewWarningCatalog[CatalogKey.SHIFT_WITH_MARKED_TIME].height;
      top = reviewWarningCatalog[CatalogKey.SHIFT_WITH_MARKED_TIME].top;
    }
    const left =
      (SchUtils.getLeft(+element.start, String(element.date)) - (parentRec?.left ?? 0)) /
      ((parentRec?.width ?? 100) * 0.01);
    let width = SchUtils.getWidth(+element.start, +element.end) / ((parentRec?.width ?? 100) * 0.01);
    width = width - 0.5;

    const display = left > 100 ? 'none' : '';

    const selected = isSelected(element as ITimelineAgentActivity);
    const durationMore24H = +element.end - element.start >= 24 * 60 * 60000;
    const disableEdit = element._type === SchStateType.DAY_OFF || durationMore24H;

    return (
      <div
        id={element.type}
        style={{
          left: `${left}%`,
          width: `${width}%`,
          zIndex,
          boxShadow,
          background: color,
          outline: `${selected ? '1px solid #F73232' : '1px solid rgba(0,0,0,0)'}`,
          display: display,
          height: element._type === SchStateType.SHIFT ? `calc(${height} - 20%)` : height,
          top: top,
          border,
        }}
        data-selected={selected}
        className={styles.lineAction}
        key={index + key}
        onClick={(e: React.MouseEvent) => {
          leftClick(e, dataForClick);
        }}
        onDoubleClick={() => {
          if (disableEdit) return;
          setOpenedMenuItem(WarningsSubmenuOptions.EDIT);
        }}
        onContextMenu={e => {
          rightClick(e, dataForClick, MenuType.SHIFT);
        }}
      >
        {element.states?.map((state, i) => renderActivities(agent, state, i + 100, state.type, { left, width }))}
      </div>
    );
  };

  // return dividers => |
  const lineElements = (classname: string) => {
    let adder = 60;
    if (!isFullDay) {
      adder = discreteness;
    }
    const discreet = adder / 60;
    const elements: React.ReactElement[] = [];
    for (let i = 0; i < 25; i = i + discreet) {
      elements.push(
        <div key={i} style={{ right: `calc(${SchUtils.getRightForLineByTime(i)}%` }} className={classname}></div>,
      );
    }
    return elements;
  };

  const handleSubmitEditTime = (
    startTime: TimePickerValue,
    endTime: TimePickerValue,
    isNextDay: boolean,
    isPreviousDay: boolean,
    isMoveComponent: boolean,
  ) => {
    //change shift time
    const newActivitiesWithUpdatedTime = SchSelectedActivity.updateActivityTime(selectedActivities, {
      start: DateUtils.setDayTime(
        selectedActivities[0].date,
        DateUtils.convertTo24h(String(startTime)),
        false,
        isPreviousDay,
      ),
      end: DateUtils.setDayTime(selectedActivities[0].date, DateUtils.convertTo24h(String(endTime)), isNextDay),
    });
    const timeForMove = isMoveComponent ? +newActivitiesWithUpdatedTime[0].start - +selectedActivities[0].start : null;

    try {
      const newAgents = SchAgent.updateAgentDay({
        agents: warnings,
        updatedActivities: newActivitiesWithUpdatedTime,
        timeForMove,
        isChangeType: false,
        item: undefined,
        isEditedInReviewWarning: true,
      }).agents;

      dispatch(buildAgentDayInSnapshot({ modifiedAgentDays: newAgents }, false)).then(res => {
        if (res) {
          const agents = SchAgent.mergeAgents(warnings, res);
          dispatch(setSaveWarnings(agents));
        }
      });
      closeEditTime();
    } catch (err: any) {
      exceptionParams.data = err.message;
      dispatch(openErrorPopUp(exceptionParams));
    }
  };

  const handleDeleteShiftItem = () => {
    try {
      const newAgents = SchAgent.deleteAgentActivities(timeLineData, selectedActivities);
      dispatch(buildAgentDayInSnapshot({ modifiedAgentDays: newAgents })).then(res => {
        res && dispatch(setSaveWarnings(SchAgent.mergeAgents(warnings, res)));
      });
      closeEditTime();
    } catch (err: any) {
      exceptionParams.data = err.message;
      dispatch(openErrorPopUp(exceptionParams));
    }
  };

  const closeEditTime = () => {
    setOpenedMenuItem(null);
  };

  const groupedActivities = useMemo(() => SchSelectedActivity.groupActivities(agent.activities), [agent.activities]);

  const agentErrors = agent.warnings?.errors && !isEmpty(agent.warnings?.errors);
  const isAgentSelected = useMemo(
    () => selectedActivities.find(a => a.agentId === agent.agentId),
    [selectedActivities, agent],
  );
  return (
    <>
      <div id={agent.agentName} className={styles.container}>
        <div className={styles.lineBarContainer}>
          <div className={styles.timeContainer}>
            <>{groupedActivities.map((activity, i) => renderActivities(agent, activity, i, activity.type))}</>
            <div>{lineElements(styles.timeContainerLines).map(el => el)}</div>
          </div>
          {subMenuData && subMenuData.agentId === agent.agentId && !agentErrors && (
            <Submenu
              closeSubMenu={() => setSubMenuData(null)}
              top={subMenuData?.top}
              left={subMenuData?.left}
              setActiveMenuOption={setOpenedMenuItem}
            />
          )}
        </div>
      </div>
      {isAgentSelected && openedMenuItem === WarningsSubmenuOptions.EDIT && !agentErrors && (
        <EditTime
          agent={agent}
          editTimeRef={editTimeRef}
          selectedActivities={selectedActivities}
          onSubmit={handleSubmitEditTime}
          openedMenuItem={openedMenuItem}
        />
      )}
      {isAgentSelected && openedMenuItem === WarningsSubmenuOptions.DELETE && (
        <ConfirmDeletePopup onClickSubmit={handleDeleteShiftItem} onClickClose={() => setOpenedMenuItem(null)} />
      )}
    </>
  );
};

export default WarningsTimeLine;
