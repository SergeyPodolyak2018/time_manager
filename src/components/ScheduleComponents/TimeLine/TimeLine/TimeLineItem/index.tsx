import React, { CSSProperties, FC, memo, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import styles from './lineBar.module.scss';
import {
  getIsFullDay,
  getSelectedActivitySelector,
  getSubMenuDataSelector,
  getTextCoefficient,
  getTimeDiscetness,
  isSubMenuOpenSelector,
  getIsShowDelimiter,
  getMemoInfoSelector,
  isMemoOpenSelector,
  getIsAnyMenuOpen,
  getIsAnyPopupOpen,
  getBuffer,
  getTargetInfo,
  getTimelineOptions,
  isLoadingSelector,
} from '../../../../../redux/selectors/timeLineSelector';
import { getActiveDateSelector } from '../../../../../redux/selectors/controlPanelSelector';
import {
  initOpenSubMenu,
  selectActivity,
  selectActivitySingle,
  selectAgentAction,
  setSelectedActivity,
  initCloseMemoInfo,
  addSelectAgentAction,
  addSubMenuInfo,
  setTargetInfo,
  closeAllPopups,
  closeAllMenu,
  setSelectedActivities,
} from '../../../../../redux/actions/timeLineAction';
import { ISelectedActivity } from '../../../../../redux/ts/intrefaces/timeLine';
import TimeLineActionsMenu from '../../TimeLineActionsMenu';
import { useAppDispatch } from '../../../../../redux/hooks';
import { IAgentTimeline } from '../../../../../redux/ts/intrefaces/timeLine/IAgentTimeline';
import DayDelimiters from './DayDelimiters';
import TimelineHoursDividers from './TimelineHoursDividers';
import AgentInfoColumns from './AgentInfoColumns';
import { handleDragOver } from './dragNdrop';
import DateUtils from '../../../../../helper/dateUtils';
import Activities from './Activities';
import {
  arrow,
  autoUpdate,
  flip,
  FloatingArrow,
  offset,
  shift,
  useFloating,
  useInteractions,
  useMergeRefs,
  useTransitionStyles,
} from '@floating-ui/react';

export interface ITimeLineItemProps {
  agent: IAgentTimeline;
  style?: CSSProperties;
  parent: RefObject<any>;
  rerender?: string;
  setRerender: (msg: string) => void;
  isVisible: boolean;
  scrollLeft: number;
  dragNDrop: any;
  setDragNDrop: any;
}

const TimeLineItem: FC<ITimeLineItemProps> = ({
  agent,
  parent,
  style,
  rerender,
  setRerender,
  isVisible,
  scrollLeft,
  dragNDrop,
  setDragNDrop,
}) => {
  const dispatch = useAppDispatch();

  const [, setInitialized] = useState(false);
  const [initialHeight, setInitialHeight] = useState(0);
  const [isMultiSelect] = useState<boolean>(false);
  const timeLineRef = useRef<HTMLElement | null>(null);
  const selectedActivities = useSelector(getSelectedActivitySelector);
  const subMenuData = useSelector(getSubMenuDataSelector);
  const submenuOpen = useSelector(isSubMenuOpenSelector);
  const memoOpen = useSelector(isMemoOpenSelector);
  const memoData = useSelector(getMemoInfoSelector);
  const scale = useSelector(getTextCoefficient);
  const discretness = useSelector(getTimeDiscetness);
  const isFullDay = useSelector(getIsFullDay);
  const showDelimiter = useSelector(getIsShowDelimiter);
  const subMenuInfo = useSelector(getSubMenuDataSelector);
  const isAnyMenuOpen = useSelector(getIsAnyMenuOpen);
  const isAnyPopupOpen = useSelector(getIsAnyPopupOpen);
  const targetInfo = useSelector(getTargetInfo);
  const options = useSelector(getTimelineOptions);
  const loading = useSelector(isLoadingSelector);
  const buffer = useSelector(getBuffer);

  const isMemoInfoOpen = useMemo(() => memoOpen && memoData, [memoOpen, memoData]);
  const isSubMenuOpen = useMemo(
    () => submenuOpen && !isAnyPopupOpen && subMenuData && subMenuData.agentId === agent.agentId,
    [submenuOpen, subMenuData, agent.agentId, isAnyPopupOpen],
  );

  const closeAll = useCallback(() => {
    if (isMemoInfoOpen) {
      dispatch(initCloseMemoInfo());
    }
    if (isAnyPopupOpen) {
      dispatch(closeAllPopups());
    }
    if (isAnyMenuOpen) {
      dispatch(closeAllMenu());
    }
  }, [isMemoInfoOpen, isAnyPopupOpen, isAnyMenuOpen, dispatch]);

  useEffect(() => {
    setInitialHeight(window.innerHeight);
    setInitialized(true);
  }, []);

  const currentDateSelector = useSelector(getActiveDateSelector);
  const currentDate = useMemo(() => new Date(new Date(currentDateSelector).toUTCString()), [currentDateSelector]);

  const multipleMenuItems = [
    { id: 0, constYPos: -360 },
    { id: 1, constYPos: -300 },
    { id: 2, constYPos: -170 },
    { id: 3, constYPos: -160 },
    { id: 4, constYPos: -200 },
    { id: 5, constYPos: -160 },
    { id: 6, constYPos: -230 },
    { id: 7, constYPos: -230 },
    { id: 8, constYPos: -200 },
    { id: 9, constYPos: -370 },
    { id: 10, constYPos: -180 },
    { id: 11, constYPos: -190 },
  ];

  const selectedActivity = useSelector(getSelectedActivitySelector);

  const genTargetInf = (dateTime: number) => {
    if (!buffer || !buffer.elements) return;
    // const targetGapDefaultX = 35.5;
    const timeLineRefElement = timeLineRef.current as unknown as HTMLDivElement;

    const time = subMenuInfo ? DateUtils.getTimeFromDate(DateUtils.roundToNearest15Minutes(dateTime)) : '00:00';
    const minutes = DateUtils.convertTimeToMinutes(time);

    if (timeLineRef && timeLineRef.current) {
      dispatch(
        setTargetInfo({
          left: (timeLineRefElement.offsetWidth / (24 * 60)) * minutes,
          top: 2,
          time,
          agentId: agent.agentId,
        }),
      );
    }
  };

  const getInfoOnActivity = (e: React.MouseEvent, element: any, type: number): any => {
    const parent = document.getElementById('lineBarContainer');
    if (!parent) return;
    // const target = e.target as HTMLElement;
    const timeline = timeLineRef.current;
    if (!timeline) return;
    const defaultGap = 80;
    const subMenuSize = 790;
    const subMenuWidth = 156;
    let defaultOffset = 0;
    const children = document.getElementById(agent.agentName)?.children[0];
    if (children instanceof HTMLElement && !options.pinColumn) {
      defaultOffset = children.offsetWidth;
    }

    const rect = options.pinColumn ? children?.getBoundingClientRect() : parent?.getBoundingClientRect();
    if (!rect) return;
    const _scrollLeft = options.pinColumn ? 0 : scrollLeft;
    const xPosition = e.clientX - rect.left + _scrollLeft - defaultOffset;

    const isRightSubmenu = window.innerWidth - e.pageX < subMenuWidth;
    const value = initialHeight - window.innerHeight <= 0 ? window.innerHeight : initialHeight - window.innerHeight;
    const menuItem = multipleMenuItems.find(x => x.id === type);
    const yOffset = menuItem ? menuItem.constYPos : 0;
    const yPosition = e.pageY > subMenuSize - value ? yOffset : -12;

    const offsetMs = ((24 * 3600 * 1000) / timeline.offsetWidth) * xPosition;
    const { tzSite, tzSelected } = agent._TZ_INTERNAL_USAGE;
    const dateTime = +new Date(currentDate) + offsetMs;
    const dateTimeSite = DateUtils.convertAccordingToTz(dateTime, tzSite, tzSelected);

    const rectParent = (timeline as HTMLElement).getBoundingClientRect();
    const targetOffsetMs = ((24 * 3600 * 1000) / rectParent.width) * xPosition;
    const targetDateTime = +new Date(currentDate) + targetOffsetMs;
    genTargetInf(targetDateTime);

    return {
      type: element.type,
      activityId: element.id,
      agentId: agent.agentId,
      left: xPosition + defaultGap,
      top: yPosition,
      isRight: isRightSubmenu,
      menuType: type,
      dateTime: dateTime,
      dateTimeSite,
    };
  };

  const getInfoOnAgent = (e: any): any => {
    if (!parent.current) return;
    const children = document.getElementById(agent.agentName)?.children[0];
    let defaultOffset = 0;
    if (children instanceof HTMLElement && !options.pinColumn) {
      defaultOffset = children.offsetWidth;
    }

    const rect = options.pinColumn ? children?.getBoundingClientRect() : parent.current.getBoundingClientRect();
    const _scrollLeft = options.pinColumn ? 0 : scrollLeft;
    const xPosition = e.clientX - rect.left + _scrollLeft - window.pageXOffset - defaultOffset;

    const yPosition = -230;
    const defaultGap = 80;
    const dayElement = document.getElementById('timeline');
    if (!dayElement) return;
    const offsetMs = ((24 * 3600 * 1000) / dayElement.offsetWidth) * xPosition;
    const { tzSite, tzSelected } = agent._TZ_INTERNAL_USAGE;
    const dateTime = +new Date(currentDate) + offsetMs;
    const dateTimeSite = DateUtils.convertAccordingToTz(dateTime, tzSite, tzSelected);
    genTargetInf(dateTime);

    return {
      type: 'day',
      activityId: 0,
      agentId: agent.agentId,
      left: xPosition + defaultGap,
      top: yPosition,
      menuType: 1,
      dateTime,
      dateTimeSite,
    };
  };

  const leftClick = (e: React.MouseEvent, element: ISelectedActivity | null, type: number | null) => {
    e.preventDefault();
    e.stopPropagation();

    closeAll();
    if (loading) return;

    if (element === null) {
      dispatch(setSelectedActivity([]));
      return;
    }
    if (type !== null) {
      dispatch(addSubMenuInfo(getInfoOnActivity(e, element, type)));
    }
    if (e.ctrlKey || e.shiftKey) {
      if (selectedActivities.length === 1 && selectedActivities[0].id === element.id) {
        dispatch(setSelectedActivity([]));
        return;
      }

      if (element.type === 'activity') {
        const dataForClick = {
          ...agent.activities.find(x => x.dayIndex === element.dayIndex && x.type === 'shift'),
        } as unknown as ISelectedActivity;
        dispatch(selectActivity(dataForClick));
        return;
      }
      dispatch(selectActivity(element));
    } else {
      dispatch(selectActivitySingle(element));
    }
  };

  const rightClick = (e: React.MouseEvent, element: ISelectedActivity, type: number) => {
    e.preventDefault();
    e.stopPropagation();
    closeAll();
    if (loading) return;

    const tempElement = element;
    if (selectedActivities.length > 1) {
      const selectedType = selectedActivities[0].type === 'activity' ? 'shift' : selectedActivities[0].type;
      const elementType = element.type === 'activity' ? 'shift' : element.type;
      if (selectedType !== elementType || selectedActivities[0].stateId !== element.stateId) {
        leftClick(e, element, type);
      } else {
        const sortedActivitiesByLastClick = [...selectedActivities];
        const index = sortedActivitiesByLastClick.findIndex(
          (pelement: ISelectedActivity) => pelement.type === tempElement.type && pelement.id === tempElement.id,
        );
        sortedActivitiesByLastClick.splice(index, 1);
        sortedActivitiesByLastClick.unshift(tempElement);
        dispatch(setSelectedActivities(sortedActivitiesByLastClick));
      }
    } else {
      leftClick(e, element, type);
    }

    const typeindex = [tempElement, ...selectedActivities].findIndex(
      (pelement: ISelectedActivity) => pelement.type === tempElement.type && pelement.id === tempElement.id,
    );

    if (typeindex !== -1 || type === 2) {
      dispatch(initOpenSubMenu(getInfoOnActivity(e, tempElement, type)));
    }
  };

  const leftMouseDown = (e: React.MouseEvent, element: ISelectedActivity | null) => {
    e.stopPropagation();
    closeAll();
    if (loading) return;

    if (element === null) {
      dispatch(setSelectedActivity([]));
      return;
    }

    if (e.ctrlKey || e.shiftKey) {
      dispatch(selectActivity(element));
    } else {
      dispatch(selectActivitySingle(element));
    }
  };

  const rightClickOnAgent = (e: any, agentId: any) => {
    e.preventDefault();
    e.stopPropagation();
    closeAll();
    dispatch(selectAgentAction(agentId));
    dispatch(setSelectedActivity([]));
    dispatch(initOpenSubMenu(getInfoOnAgent(e)));
  };

  const onSelectAgent = (id: number) => {
    if (isAnyPopupOpen) {
      dispatch(closeAllPopups());
    }
    if (isAnyMenuOpen) {
      dispatch(closeAllMenu());
    }
    if (isMultiSelect) {
      dispatch(addSelectAgentAction(id));
    } else {
      dispatch(selectAgentAction(id));
    }
  };

  // region Line with time for paste item
  //cursor time if copy mode enabled

  const arrowRef = useRef(null);
  const ARROW_HEIGHT = 5;
  const GAP = 6;
  const ARROW_WIDTH = 7;
  const STROKE_WIDTH = 1;
  const { y, strategy, refs, context, x } = useFloating({
    placement: 'top',
    strategy: 'fixed',
    open: true,
    onOpenChange: () => {},
    whileElementsMounted: autoUpdate,
    middleware: [
      shift({ padding: 0 }),
      arrow({
        element: arrowRef,
      }),
      offset(ARROW_HEIGHT + GAP),
      flip({
        mainAxis: true,
        crossAxis: false,
      }),
    ],
  });
  const { styles: transitionStyles } = useTransitionStyles(context, {
    //configure open and close durations separately:
    duration: {
      open: 200,
      close: 1000,
    },
    initial: {
      opacity: 0,
    },
  });
  const targetTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [isTimeVisible, setIsTimeVisible] = useState(true);
  useEffect(() => {
    setIsTimeVisible(true);
    if (!targetInfo) return;
    targetTimeoutRef.current = setTimeout(() => {
      setIsTimeVisible(false);
    }, 2000);

    return () => {
      clearTimeout(targetTimeoutRef.current);
    };
  }, [targetInfo]);

  const { getReferenceProps, getFloatingProps } = useInteractions();

  const targetTimeCursor = () => {
    if (targetInfo === null || !buffer || !buffer.elements) return null;
    const isAnyOpen = isAnyMenuOpen || isAnyPopupOpen;

    return (
      <div
        className={styles.targetTimeContainerWrapper}
        style={{
          left: `${targetInfo?.left ?? 0}px`,
          height: `calc(${0.21 * scale}px)`,
          bottom: '0',
        }}
        ref={refs.setReference}
        {...getReferenceProps()}
      >
        {isTimeVisible && (
          <div
            style={{
              ...transitionStyles,
              display: isAnyOpen ? 'none' : 'flex',
              position: strategy,
              top: y ? y : 0,
              left: x === null ? undefined : x,
            }}
            ref={refs.setFloating}
            {...getFloatingProps()}
            className={styles.targetTimeContainer}
          >
            <FloatingArrow
              tipRadius={0}
              fill={'#fff'}
              stroke={'#bcc4c8'}
              width={ARROW_WIDTH}
              height={ARROW_HEIGHT}
              ref={arrowRef}
              context={context}
              strokeWidth={STROKE_WIDTH}
            />
            <span>{targetInfo?.time ?? 0}</span>
          </div>
        )}
        <div
          className={styles.lineCursor}
          style={{
            height: `calc(${0.21 * scale}px)`,
            top: 0,
          }}
        ></div>
      </div>
    );
  };
  // endregion

  return (
    <div id={agent.agentName} className={styles.container} style={{ ...style }}>
      {!options.pinColumn && <AgentInfoColumns agent={agent} />}
      <div className={styles.lineBarContainer} style={{ minWidth: `${!isFullDay ? 4000 : 600}px` }}>
        {targetInfo?.agentId === agent.agentId && targetTimeCursor()}
        <div
          id={'timeline'}
          ref={useMergeRefs([timeLineRef])}
          data-dragndrop={agent.agentId}
          className={styles.timeContainer}
          onDragOver={e => handleDragOver(e, dragNDrop)}
          onClick={e => {
            dispatch(addSubMenuInfo(getInfoOnAgent(e)));
            if (selectedActivity.length) {
              leftClick(e, null, null);
            }
            onSelectAgent(agent.agentId);
          }}
          onContextMenu={e => {
            rightClickOnAgent(e, agent.agentId);
          }}
        >
          <Activities
            isVisible={isVisible}
            setRerender={setRerender}
            rerender={rerender}
            dragNDrop={dragNDrop}
            setDragNDrop={setDragNDrop}
            agent={agent}
            isFullDay={isFullDay}
            discretness={discretness}
            rightClick={rightClick}
            leftMouseDown={(e: React.MouseEvent, element: ISelectedActivity | null) => {
              leftMouseDown(e, element);
            }}
            leftClick={(e: React.MouseEvent, element: ISelectedActivity | null, type: number) => {
              leftClick(e, element, type);
            }}
            selectedActivities={selectedActivities}
          />
          <TimelineHoursDividers elements={styles.timeContainerLines} isFullDay={isFullDay} discretness={discretness} />
          {showDelimiter ? <DayDelimiters agent={agent} /> : ''}
        </div>
        {isSubMenuOpen ? (
          <TimeLineActionsMenu
            top={subMenuData?.top}
            left={subMenuData?.left}
            type={subMenuData?.menuType}
            isRight={subMenuData?.isRight}
          />
        ) : (
          ''
        )}
      </div>
    </div>
  );
};

export default memo(TimeLineItem);
