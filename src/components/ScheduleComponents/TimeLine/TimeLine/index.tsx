import _ from 'lodash';
import { isEmpty } from 'ramda';
import React, { FC, Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useSelector } from 'react-redux';
import useStateRef from 'react-usestateref';
import { ScrollSync } from 'react-virtualized';
import { Key } from 'ts-key-enum';

import { SCH_STATE_TYPE } from '../../../../common/constants';
import { SchStateType } from '../../../../common/constants/schedule';
import { TimelineHotKeys } from '../../../../common/constants/schedule/hotkeys/timeline';
import DateUtils from '../../../../helper/dateUtils';
import SchAgent from '../../../../helper/schedule/SchAgent';
import SchSelectedActivity from '../../../../helper/schedule/SchSelectedActivity';
import SchUtils from '../../../../helper/schedule/SchUtils';
import { changeChartStoreByHistory } from '../../../../redux/actions/ChartActions';
import { setResultConfirmPopup } from '../../../../redux/actions/confirmPopupActions';
import {
  buildAgentDayInSnapshot,
  changeStoreByHistory,
  changeTimeDiscretness,
  cleanSelectActivities,
  cleanSelectAgentsAction,
  clearBuffer,
  closeMemoInfo,
  closeSubMenu,
  copyActivities,
  initCloseMemoInfo,
  initOpenMemoInfo,
  openErrorPopUp,
  openWarningPopUp,
  pasteShiftActivity,
  pasteStateActivity,
  scrollToIndex,
  selectActivitySingle,
  selectShiftBySelectedActivity,
  setIsTimeLineDisabled,
} from '../../../../redux/actions/timeLineAction';
import { useAppDispatch } from '../../../../redux/hooks';
import { ConfirmPopupResult } from '../../../../redux/reducers/confirmPopupReducer';
import { chartSelector } from '../../../../redux/selectors/chartSelector';
import { confirmPopupSelector, getConfirmPopupOpen } from '../../../../redux/selectors/confirmPopupSelector';
import { getActiveDateSelector } from '../../../../redux/selectors/controlPanelSelector';
import { getLastParams } from '../../../../redux/selectors/snapShotsSelector';
import {
  getBuffer,
  getColumns,
  getDataSelector,
  getIsAnyMenuOpen,
  getIsAnyPopupOpen,
  getIsOpenSomeModal,
  getSaveWarnings,
  getSelectedActivitySelector,
  getSelectedAgents,
  getSubMenuDataSelector,
  getTextCoefficient,
  getTimelineOptions,
  isLoadingSelector,
  isMemoOpenSelector,
  isSubMenuOpenSelector,
  isTimeLineDisabled,
  isWarningPopUpOpenSelector,
} from '../../../../redux/selectors/timeLineSelector';
import { BufferElementsType, IErrorPopUpParam, ISelectedActivity } from '../../../../redux/ts/intrefaces/timeLine';
import { IAgentTimeline } from '../../../../redux/ts/intrefaces/timeLine/IAgentTimeline';
import Spiner from '../../../ReusableComponents/spiner';
import AgentInfoVirtualScroller from './AgentInfoVirtualScroller/AgentInfoVirtualScroller';
import { ReactComponent as AgentsSchedule } from './AgentsSchedule.svg';
import styles from './lineBarContainer.module.scss';
import TimeLineHeader from './TimelineHeader';
import TimeLineItem from './TimeLineItem';
import AgentInfoColumns from './TimeLineItem/AgentInfoColumns';
import VirtualScroller from './VirtualScroller/VirtualScroller';
import { IDragNDrop } from './TimeLineItem/dragNdrop';

export interface ITimeLineContainerProps extends React.HTMLProps<HTMLElement> {
  scrollHandler?: any;
  refHandler?: any;
  scrollLeft: number;
  setScrollLeft: any;
}
const FIVE_MINUTES_STEP = 5;
const FIFTEEN_MINUTES_STEP = 15;

const TimeLine: FC<ITimeLineContainerProps> = ({ refHandler, scrollLeft, setScrollLeft }) => {
  const timeLineDisableEl = useRef<HTMLDivElement | null>(null);
  const dispatch = useAppDispatch();
  const isMenuOpen = useSelector(isSubMenuOpenSelector);
  const loading = useSelector(isLoadingSelector);
  const isTLDisabled = useSelector(isTimeLineDisabled);
  const lastParams = useSelector(getLastParams);
  const selectedActivities = useSelector(getSelectedActivitySelector);
  const selectedAgents = useSelector(getSelectedAgents);
  const agents = useSelector(getDataSelector);
  const isOpenModal = useSelector(getIsOpenSomeModal);
  const isMemoOpen = useSelector(isMemoOpenSelector);
  const buffer = useSelector(getBuffer);
  const subMenuData = useSelector(getSubMenuDataSelector);
  const isAnyMenuOpen = useSelector(getIsAnyMenuOpen);
  const isConfirmPopup = useSelector(getConfirmPopupOpen);
  const isAnyPopupOpen = useSelector(getIsAnyPopupOpen);
  const scale = useSelector(getTextCoefficient);
  const date = useSelector(getActiveDateSelector);
  const confirmPopup = useSelector(confirmPopupSelector);
  const warningPopup = useSelector(isWarningPopUpOpenSelector);
  const chartData = useSelector(chartSelector);
  const options = useSelector(getTimelineOptions);
  const columns = useSelector(getColumns);
  const saveWarnings = useSelector(getSaveWarnings);

  const disableAnyAction = isConfirmPopup || isAnyMenuOpen || isAnyPopupOpen || loading;
  const [rerender, setRerender] = useState('');

  //rerender
  useEffect(() => {
    rerender && setRerender('');
  }, [rerender]);

  useEffect(() => {
    if (confirmPopup.result === ConfirmPopupResult.CLOSE || confirmPopup.result === ConfirmPopupResult.DISCARD) {
      setRerender(confirmPopup.text);
      dispatch(setResultConfirmPopup(ConfirmPopupResult.NONE));
    }
  }, [confirmPopup.result]);

  useEffect(() => {
    if (warningPopup.discard) {
      setRerender(warningPopup.data);
      dispatch(openWarningPopUp({ isOpen: false, data: '', agents: [], discard: false }));
    }
  }, [warningPopup.discard]);

  const escapeHandle = () => {
    if (isAnyMenuOpen || isAnyPopupOpen) return;
    dispatch(cleanSelectAgentsAction());
    dispatch(clearBuffer());
  };

  const copyShiftOrState = () => {
    if (disableAnyAction) return;
    dispatch(copyActivities(selectedActivities));
    dispatch(cleanSelectAgentsAction());
    dispatch(cleanSelectActivities());
  };

  const pasteShiftOrStateSpecial = (pastTime = false, isOffsetState = true) => {
    if (disableAnyAction) return;

    const dateTime = subMenuData ? DateUtils.roundToNearest15Minutes(subMenuData.dateTime) : null;
    if (SchSelectedActivity.isWork(selectedActivities[0])) dispatch(selectShiftBySelectedActivity());
    switch (buffer.elementsType) {
      case BufferElementsType.STATE:
        if (!selectedActivities.length) {
          break;
        }
        dispatch(setIsTimeLineDisabled(true));
        dispatch(pasteStateActivity(pastTime ? dateTime : null, isOffsetState)).then(() => {
          dispatch(setIsTimeLineDisabled(false));
        });
        break;
      case BufferElementsType.SHIFT_OR_WORK_SET:
        dispatch(setIsTimeLineDisabled(true));
        dispatch(pasteShiftActivity(pastTime ? dateTime : null, isOffsetState)).then(() => {
          dispatch(setIsTimeLineDisabled(false));
        });
        break;
    }
  };

  const undoHistory = () => {
    if (disableAnyAction || saveWarnings.length !== 0) return;

    const prevGranularity = chartData.history.past[chartData.history.past.length - 1]?.granularity;
    prevGranularity && dispatch(changeTimeDiscretness(prevGranularity));
    dispatch(changeStoreByHistory('undo'));
    dispatch(changeChartStoreByHistory('undo'));
  };

  const redoHistory = () => {
    if (disableAnyAction || saveWarnings.length !== 0) return;
    const nextGranularity = chartData.history.future[0]?.granularity;
    nextGranularity && dispatch(changeTimeDiscretness(nextGranularity));
    dispatch(changeStoreByHistory('redo'));
    dispatch(changeChartStoreByHistory('redo'));
  };

  // hotkeys for history
  useHotkeys(TimelineHotKeys.ESCAPE, escapeHandle, { preventDefault: false });
  useHotkeys(TimelineHotKeys.COPY_ACTIVITIES, copyShiftOrState, { preventDefault: true });
  useHotkeys(TimelineHotKeys.PASTE_ACTIVITIES, () => pasteShiftOrStateSpecial(true, true), { preventDefault: true });
  useHotkeys(TimelineHotKeys.UNDO_HISTORY, undoHistory, { preventDefault: true });
  useHotkeys(TimelineHotKeys.REDO_HISTORY, redoHistory, { preventDefault: true });
  // moving timeline
  const requestTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minutesRef = useRef(0);
  useHotkeys(
    [
      TimelineHotKeys.MOVE_RIGHT,
      TimelineHotKeys.MOVE_LEFT,
      TimelineHotKeys.MOVE_RIGHT_MAC,
      TimelineHotKeys.MOVE_LEFT_MAC,
    ],
    e => moveTimeline(e),
    { preventDefault: true },
    [selectedAgents, selectedActivities, requestTimeoutRef, minutesRef.current, disableAnyAction],
  );

  const moveTimeline = (e: KeyboardEvent) => {
    if (disableAnyAction) return;
    const isDisable = selectedActivities[0]?.type === SCH_STATE_TYPE[SchStateType.DAY_OFF] || loading;
    if (isDisable || !selectedActivities.length || SchSelectedActivity.isFullDay(selectedActivities[0])) return;
    const direction = e.key === Key.ArrowRight ? 'right' : 'left';
    let step = FIVE_MINUTES_STEP;
    const activitiesToMove: ISelectedActivity[] = [];

    let isFixShiftActivity = false;
    if (SchSelectedActivity.isActivitySetInside(selectedActivities)) {
      step = FIFTEEN_MINUTES_STEP;
    }
    if (
      selectedActivities[0]?.isFullShiftActivity ||
      (selectedActivities[0]?.type === 'activity' && !selectedActivities[0]?.isFullShiftActivity)
    ) {
      isFixShiftActivity = true;
      selectedActivities.forEach(activity => {
        const currentAgent = selectedAgents.find(x => x.agentId === activity.agentId);
        const isFullShiftActivity = {
          ...currentAgent?.activities.find(
            act => act.agentId === activity.agentId && act.dayIndex === activity.dayIndex && act.type === 'shift',
          ),
          type: 'shift',
        } as unknown as ISelectedActivity;

        activitiesToMove.push(isFullShiftActivity);
      });
    } else {
      selectedActivities.forEach(activity => {
        activitiesToMove.push(activity);
      });
    }

    const isActivitySet =
      selectedActivities[0].type === 'activity_set' && Boolean(selectedActivities[0].isFullShiftActivity);
    const timelines = SchSelectedActivity.getSelectedTimelines(activitiesToMove, isActivitySet, isFixShiftActivity);
    if (!timelines.length) return;
    const currentVal = direction === 'right' ? minutesRef.current + step : minutesRef.current - step;
    minutesRef.current = currentVal;
    if (activitiesToMove[0]?.type === 'marked_time' || activitiesToMove[0]?.type === 'activity') {
      return;
    }
    let updatedAgentsResult: ReturnType<typeof SchAgent.moveAgentsShift>;
    try {
      updatedAgentsResult = SchAgent.moveAgentsShift(agents, activitiesToMove, currentVal * 60000, true);
    } catch (err: any) {
      const exceptionParams: IErrorPopUpParam = {
        isOpen: true,
        data: '',
      };
      exceptionParams.data = err.message;
      minutesRef.current = 0;
      dispatch(openErrorPopUp(exceptionParams));
      return;
    }
    SchSelectedActivity.moveSelectedTimelines(timelines, direction, currentVal, () => {
      if (requestTimeoutRef.current) clearTimeout(requestTimeoutRef.current as NodeJS.Timeout);
      requestTimeoutRef.current = setTimeout(() => {
        const agents: any[] = [];
        activitiesToMove.forEach(x => agents.push(selectedAgents.find(agent => agent.agentId === x.agentId)));
        updatedAgentsResult = SchAgent.moveAgentsShift(agents, activitiesToMove, currentVal * 60000, true);
        if (!isEmpty(updatedAgentsResult.warnings)) {
          const exceptionParams = {
            isOpen: true,
            data: updatedAgentsResult.warnings.map(m => `${m}`).join('\n'),
            agents: updatedAgentsResult.agents,
            scheduleShiftItems: false,
            isSaveSelected: true,
            rerender: true,
          };
          minutesRef.current = 0;
          dispatch(openWarningPopUp(exceptionParams));
        } else {
          dispatch(buildAgentDayInSnapshot({ modifiedAgentDays: updatedAgentsResult.agents }, false, true)).then(
            () => (minutesRef.current = 0),
          );
        }
      }, 800);
    });
  };

  useHotkeys(
    TimelineHotKeys.NEXT_SHIFT_ITEM,
    () => {
      if (!selectedActivities[0] || isOpenModal || disableAnyAction) return;
      if (isMemoOpen) dispatch(initCloseMemoInfo());
      const validList = SchUtils.getValidItemsList(selectedAgents[0].activities);
      const index = validList.findIndex((element: any) => element.id === selectedActivities[0].id);
      const modifiedIndex = index + 1 < validList.length ? index + 1 : 0;
      const activity = validList.filter((element: any) => validList.indexOf(element) === modifiedIndex);
      if (!activity[0]) return;
      dispatch(selectActivitySingle(activity[0]));
    },
    [selectedActivities, isOpenModal, { preventDefault: true }],
  );

  useHotkeys(
    TimelineHotKeys.PREVIOUS_SHIFT_ITEM,
    () => {
      if (!selectedActivities[0] || isOpenModal || disableAnyAction) return;
      if (isMemoOpen) dispatch(initCloseMemoInfo());
      const validList = SchUtils.getValidItemsList(selectedAgents[0].activities);
      const index = validList.findIndex((element: any) => element.id === selectedActivities[0].id);
      const modifiedIndex = index - 1 < 0 ? validList.length - 1 : index - 1;
      const activity = validList.filter((element: any) => validList.indexOf(element) === Math.abs(modifiedIndex));
      if (!activity[0]) return;
      dispatch(selectActivitySingle(activity[0]));
    },
    [selectedActivities, isOpenModal, { preventDefault: true }],
  );

  useHotkeys(
    TimelineHotKeys.NEXT_SHIFT,
    () => {
      if (!selectedActivities[0] || isOpenModal || disableAnyAction) return;
      if (isMemoOpen) dispatch(initCloseMemoInfo());
      const selectedActivity =
        selectedActivities[0].type === SCH_STATE_TYPE[SchStateType.ACTIVITY_SET]
          ? getShiftForActivitySet(selectedActivities[0])
          : selectedActivities[0];
      const validList = SchUtils.getValidShiftsList(agents, date);
      const index = validList.findIndex((element: any) => selectedActivity?.id === element.id);
      const modifiedIndex = index + 1 < validList.length ? index + 1 : 0;
      const activity = validList.filter((element: any) => validList.indexOf(element) === modifiedIndex);
      if (!activity[0]) return;
      const agentIndex = agents.findIndex(agent => agent.agentId === activity[0].agentId);
      dispatch(selectActivitySingle(activity[0]));
      dispatch(scrollToIndex(agentIndex));
    },
    [selectedActivities, isOpenModal, { preventDefault: true }],
  );

  const getShiftForActivitySet = (activitySet: ISelectedActivity) => {
    const agent = agents.find(agent => agent.agentId === activitySet.agentId);
    return agent?.activities.find(
      activity =>
        activity.agentId === activitySet.agentId &&
        activity.dayIndex === activitySet.dayIndex &&
        activity.type === SCH_STATE_TYPE[SchStateType.SHIFT],
    );
  };
  useHotkeys(
    TimelineHotKeys.PREVIOUS_SHIFT,
    () => {
      if (!selectedActivities[0] || isOpenModal || disableAnyAction) return;

      if (isMemoOpen) dispatch(initCloseMemoInfo());

      const selectedActivity =
        selectedActivities[0].type === SCH_STATE_TYPE[SchStateType.ACTIVITY_SET]
          ? getShiftForActivitySet(selectedActivities[0])
          : selectedActivities[0];
      const validList = SchUtils.getValidShiftsList(agents, date);
      const index = validList.findIndex((element: any) => selectedActivity?.id === element.id);

      const modifiedIndex = index - 1 < 0 ? validList.length - 1 : index - 1;
      const activity = validList.filter((element: any) => validList.indexOf(element) === Math.abs(modifiedIndex));
      if (!activity[0]) return;
      const agentIndex = agents.findIndex(agent => agent.agentId === activity[0].agentId);
      dispatch(selectActivitySingle(activity[0]));
      dispatch(scrollToIndex(agentIndex));
    },
    [selectedActivities, isOpenModal, { preventDefault: true }],
  );

  useHotkeys(
    TimelineHotKeys.MEMO_INFO,
    e => {
      if (!selectedActivities[0] || isOpenModal || disableAnyAction) return;
      e.preventDefault();
      if (isMemoOpen) {
        dispatch(initCloseMemoInfo());
        return;
      }
      const memo = selectedActivities[0].memo || '';
      if (!memo) return;
      const referenceElement = document.querySelector('[data-selected="true"]');

      dispatch(
        initOpenMemoInfo({
          memo,
          agentId: selectedAgents[0].agentId,
          activityId: selectedActivities[0].id,
          referenceElement,
        }),
      );
    },
    [selectedActivities, isOpenModal, { preventDefault: true, stopPropagation: true }],
  );

  const _onScroll = _.throttle(() => {
    if (isMenuOpen) dispatch(closeSubMenu());
    if (isMemoOpen) dispatch(closeMemoInfo());
  }, 1000);

  const renderPlaceholder = useMemo(() => {
    return (
      <div className={styles.placeholder}>
        <AgentsSchedule />
        <p>Select agents to see schedule</p>
      </div>
    );
  }, []);

  // region Resize
  const headerTimesRef = useRef<HTMLDivElement>();
  const headerRef = useRef<HTMLDivElement>();
  const [, setScrollBottomVisible, scrollBottomVisibleRef] = useStateRef(false);

  const columnWidth = useMemo(() => {
    return columns.reduce((acc, item) => {
      if (item.visible) acc += item.width;
      return acc;
    }, 0);
  }, [columns]);

  // endregion

  //region DragNDrop
  const [dragNDrop, setDragNDrop] = useStateRef<IDragNDrop>({
    agentId: null,
    clickX: 0,
    type: null,
    shiftItemId: null,
    data: null,
    leftStart: 0,
    leftStartPosition: 0,
  });
  // endregion
  return (
    <div id="lineBarContainer" ref={refHandler} className={styles.mainContainer} style={{ height: '100%' }}>
      <TimeLineHeader
        headerRef={headerRef}
        headerTimesRef={headerTimesRef}
        agents={agents}
        onScroll={(e: any) => setScrollLeft(e.currentTarget.scrollLeft)}
      />
      {!agents.length && !loading && renderPlaceholder}
      {loading && !agents.length ? (
        <Spiner />
      ) : (
        <>
          {isTLDisabled && (
            <div
              ref={timeLineDisableEl}
              className={`${styles.disabledTimeLineSpinner} ${styles.disabledTimeLineSpinner_anim}`}
            >
              <Spiner />
            </div>
          )}

          <ScrollSync>
            {({ onScroll, scrollTop }) => (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  alignItems: 'start',
                  width: '100%',
                  height: 'calc(100% - 42px)',
                }}
              >
                {options.pinColumn && (
                  <div
                    className={styles.agentInfo__pinned}
                    style={{
                      height: scrollBottomVisibleRef.current ? `calc(100% - 16px)` : '100%',
                      minWidth: `${columnWidth - 1}px`,
                      width: `${columnWidth - 1}px`,
                    }}
                  >
                    <AgentInfoVirtualScroller
                      data={agents}
                      scrollTop={scrollTop}
                      columnWidth={columnWidth}
                      onScroll={params => {
                        onScroll(params);
                        _onScroll();
                      }}
                      remoteRowCount={lastParams?.agentCount || 0}
                      renderItem={(index, agent: IAgentTimeline, key, style) => {
                        return agent ? <AgentInfoColumns key={key} agent={agent} style={style} /> : <></>;
                      }}
                      rowHeight={25 * (scale / 100)}
                    />
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    height: '100%',
                    width: options.pinColumn ? `calc(100% - ${columnWidth}px)` : '100%',
                  }}
                >
                  <VirtualScroller
                    setScrollLeft={setScrollLeft}
                    scrollLeft={scrollLeft}
                    headerRef={headerRef}
                    scrollTop={scrollTop}
                    rowHeight={25 * (scale / 100)}
                    remoteRowCount={lastParams?.agentCount || 0}
                    setScrollBottomVisible={setScrollBottomVisible}
                    data={agents}
                    headerTimesRef={headerTimesRef}
                    onScroll={onScroll}
                    renderItem={(i, element: IAgentTimeline, key, style, isVisible) => {
                      return element ? (
                        <TimeLineItem
                          setDragNDrop={setDragNDrop}
                          dragNDrop={dragNDrop}
                          scrollLeft={scrollLeft}
                          style={style}
                          key={key}
                          agent={element}
                          parent={refHandler}
                          rerender={rerender}
                          setRerender={setRerender}
                          isVisible={isVisible}
                        />
                      ) : (
                        <Fragment key={key}></Fragment>
                      );
                    }}
                  />
                </div>
              </div>
            )}
          </ScrollSync>
        </>
      )}
    </div>
  );
};

export default TimeLine;
