import React, { useEffect, useMemo, useRef } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { connect, useSelector } from 'react-redux';
import useStateRef from 'react-usestateref';

import { SCH_STATE_TYPE } from '../../common/constants';
import { SchStateType } from '../../common/constants/schedule';
import { TimelineHotKeys } from '../../common/constants/schedule/hotkeys/timeline';
import ConfirmChangesPopup from '../../components/ConfirmChangesPopup';
import ConfirmPopup from '../../components/ReusableComponents/ConfirmPopup';
import ResizableContainer from '../../components/ReusableComponents/ResizableContainer';
import Chart from '../../components/ScheduleComponents/Chart';
import BuildSchedulePopup from '../../components/ScheduleComponents/Popups/BuildSchedulePopup';
import EditCommentMenu from '../../components/ScheduleComponents/Popups/CommentPopup';
import ConfirmDeletePopup from '../../components/ScheduleComponents/Popups/ConfirmDeletePopup';
import CopyToPopup from '../../components/ScheduleComponents/Popups/CopyToPopup';
import EditFullDayItem from '../../components/ScheduleComponents/Popups/EditFullDayItemPopup';
import EditMultipleMenu from '../../components/ScheduleComponents/Popups/EditMultipleMenu';
import EditShiftPopup from '../../components/ScheduleComponents/Popups/EditPopup';
import ErrorPopup from '../../components/ScheduleComponents/Popups/ErrorPopup';
import InsertActivitySet from '../../components/ScheduleComponents/Popups/InsertActivitySet';
import InsertBreakMealMenu from '../../components/ScheduleComponents/Popups/InsertBreakMealMenu';
import InsertExceptionMenu from '../../components/ScheduleComponents/Popups/InsertExceptionMenu';
import InsertMarkedTime from '../../components/ScheduleComponents/Popups/InsertMarkedTime';
import InsertTimeOffMenu from '../../components/ScheduleComponents/Popups/InsertTimeOffMenu';
import InsertWorkSet from '../../components/ScheduleComponents/Popups/InsertWorkSet';
import IntraDayScheduleRebuildWizardPopup from '../../components/ScheduleComponents/Popups/IntraDayScheduleRebuildWizardPopup';
import MeetingScheduler from '../../components/ScheduleComponents/Popups/MeetingScheduler';
import MultipleCleanupPopUp from '../../components/ScheduleComponents/Popups/MultipleCleanupPopUp';
import MultipleWizard from '../../components/ScheduleComponents/Popups/NewMultipleWizardMenu';
import NewShiftMenu from '../../components/ScheduleComponents/Popups/NewShiftMenu';
import RestoreScheduleMenu from '../../components/ScheduleComponents/Popups/RestoreSchedule';
import ReviewWarningsPopup from '../../components/ScheduleComponents/Popups/ReviewWarningsPopup/ReviewWarningsPopup';
import ScheduleModifiedPopup from '../../components/ScheduleComponents/Popups/ScheduleModifiedPopup';
import SetActivitiesFor from '../../components/ScheduleComponents/Popups/SetActivitiesFor';
import SuccessPopup from '../../components/ScheduleComponents/Popups/SuccessPopup';
import WarningPopup from '../../components/ScheduleComponents/Popups/WarningPopup';
import ScheduleBar from '../../components/ScheduleComponents/ScheduleBar';
import TimeLine from '../../components/ScheduleComponents/TimeLine/TimeLine';
import TimeLineFooterInfoBar from '../../components/ScheduleComponents/TimeLine/TimeLineFooterInfoBar';
import TimeLineMemoInfo from '../../components/ScheduleComponents/TimeLine/TimeLineMemoInfo';
import SchAgent from '../../helper/schedule/SchAgent';
import SchSelectedActivity from '../../helper/schedule/SchSelectedActivity';
import SchUtils from '../../helper/schedule/SchUtils';
import {
  buildAgentDayInSnapshot,
  cleanupAgentDay,
  closeAllMenu,
  closeAllPopups,
  closeCleanupMenu,
  closeDeleteMenu,
  closeEditCommentMenu,
  multiSelectedCleanupAgentDay,
  openCleanupMenu,
  openDeleteMenu,
  openEditFullDayItem,
  openErrorPopUp,
  openMenu,
  setOpenEditMultiple,
  setOpenScheduleRestore,
  setSelectedActivity,
} from '../../redux/actions/timeLineAction';
import { useAppDispatch } from '../../redux/hooks';
import { confirmPopupSelector } from '../../redux/selectors/confirmPopupSelector';
import { getActiveDateSelector } from '../../redux/selectors/controlPanelSelector';
import { getSidebar } from '../../redux/selectors/filterSelector';
import {
  getConfirmPopUp,
  getDataSelector,
  getEditCommentMenuDataSelector,
  getErrorPopUpOpen,
  getInsertActivitySet,
  getInsertMarkedTimeOpen,
  getInsertWorkSetOpen,
  getIsAnyMenuOpen,
  getIsAnyPopupOpen,
  getIsOpenSomeModal,
  getMemoInfoSelector,
  getReviewWarningsType,
  getSaveWarnings,
  getScheduleModifiedPopUp,
  getSelectedActivitySelector,
  getSelectedAgentSelector,
  getSetActivitiesFor,
  getSubMenuDataSelector,
  isBuildScheduleOpenSelector,
  isCleanupMenuOpenSelector,
  isCopyToOpenSelector,
  isDeleteShiftMenuOpenSelector,
  isEditCommentMenuOpenSelector,
  isEditFullDayItemOpenSelector,
  isEditMultipleOpenSelector,
  isErrorPopUpOpenSelector,
  isInsertBreakOpenSelector,
  isInsertExceptionOpenSelector,
  isInsertMealOpenSelector,
  isInsertTimeOffOpenSelector,
  isLoadingSelector,
  isMeetingSchedulerOpen,
  isMemoOpenSelector,
  isMultipleCleanupOpen,
  isMultipleWizardOpen,
  isNewShiftOpenSelector,
  isPopUoOpenSelector,
  isRebuildScheduleOpenSelector,
  isRestoreScheduleOpenSelector,
  isSuccessPopUpOpenSelector,
  isWarningPopUpOpenSelector,
} from '../../redux/selectors/timeLineSelector';
import { IFilterSidebarState } from '../../redux/ts/intrefaces/filter';
import {
  IBuildScheduleParam,
  ICopyToMenuParam,
  IErrorPopUpParam,
  IInsertMenuParam,
  IRebuildScheduleParam,
  ISuccessPopUpParam,
  IWarningPopUpParam,
} from '../../redux/ts/intrefaces/timeLine';
import styles from './Schedule.module.scss';
import { getChartBinding } from '../../redux/selectors/chartSelector';

export interface IScheduleProps {
  isPopUpOpen: boolean;
  isEditFullDayItemOpen: boolean;
  confirmPopUp: { isOpen: boolean };
  modifiedPopUp: { isOpen: boolean };
  isDeleteShiftOpen: boolean;
  isCleanUpDayOpen: boolean;
  isNewShiftOpen: boolean;
  isInsertBreakOpen: boolean;
  isInsertExceptionOpen: IInsertMenuParam;
  isInsertTimeOffOpen: IInsertMenuParam;
  isInsertMealOpen: boolean;
  isRestoreScheduleOpen: boolean;
  isCopyToOpen: ICopyToMenuParam;
  isRebuildScheduleOpen: IRebuildScheduleParam;
  isBuildScheduleOpen: IBuildScheduleParam;
  isEditMultipleOpenSelector: IInsertMenuParam;
  isEditCommentMenuOpen: boolean;
  isErrorPopUpOpen: IErrorPopUpParam;
  isWarningPopUpOpen: IWarningPopUpParam;
  isSuccessPopUpOpen: ISuccessPopUpParam;
  getSubMenuData: any;
  filterSidebarState: IFilterSidebarState;
  currentDate: string;
  multipleWizardOpen: boolean;
  isOpenSomeModal: boolean;
  multipleCleanupOpen: boolean;
  meetingScheduleOpen: boolean;
}

const Schedule = ({
  isPopUpOpen,
  isEditFullDayItemOpen,
  confirmPopUp,
  modifiedPopUp,
  isDeleteShiftOpen,
  isCleanUpDayOpen,
  isNewShiftOpen,
  isInsertBreakOpen,
  isInsertMealOpen,
  isInsertExceptionOpen,
  isInsertTimeOffOpen,
  isRestoreScheduleOpen,
  isCopyToOpen,
  isRebuildScheduleOpen,
  isBuildScheduleOpen,
  isEditMultipleOpenSelector,
  isEditCommentMenuOpen,
  isErrorPopUpOpen,
  isWarningPopUpOpen,
  isSuccessPopUpOpen,
  getSubMenuData,
  multipleWizardOpen,
  isOpenSomeModal,
  multipleCleanupOpen,
  meetingScheduleOpen,
  ...props
}: IScheduleProps) => {
  const firstDivRef = useRef<HTMLDivElement | null>(null);
  const secondDivRef = useRef<HTMLDivElement | null>(null);
  const dispatch = useAppDispatch();
  const timeLineData = useSelector(getDataSelector);
  const selectedActivity = useSelector(getSelectedActivitySelector);
  const selectedAgent = useSelector(getSelectedAgentSelector);
  const currentDateSelector = useSelector(getActiveDateSelector);
  const currentAgentDate = new Date(new Date(currentDateSelector).toUTCString());
  const saveWarnings = useSelector(getSaveWarnings);
  const warningsType = useSelector(getReviewWarningsType);
  const isInsertWorkSetOpen = useSelector(getInsertWorkSetOpen);
  const isInsertMarkedTimeOpen = useSelector(getInsertMarkedTimeOpen);
  const isInsertActivitySetOpen = useSelector(getInsertActivitySet);
  const isSetActivitiesForOpen = useSelector(getSetActivitiesFor);
  const loading = useSelector(isLoadingSelector);
  const { isOpen: isConfirmPopupOpen } = useSelector(confirmPopupSelector);

  const scheduleModifiedPopup = useSelector(getScheduleModifiedPopUp);
  const memoData = useSelector(getMemoInfoSelector);
  const isMemoOpen = useSelector(isMemoOpenSelector);
  const isMemoInfoOpen = () => isMemoOpen && memoData;

  const isAnyMenuOpen = useSelector(getIsAnyMenuOpen);
  const isAnyPopupOpen = useSelector(getIsAnyPopupOpen);

  const editCommentMenuData = useSelector(getEditCommentMenuDataSelector);

  const errorPopUpIsOpen = useSelector(getErrorPopUpOpen);

  const disableAnyAction = isAnyMenuOpen || isAnyPopupOpen || loading;

  const handleScrollFirst = (scroll: React.UIEvent<HTMLElement>) => {
    setScrollLeft(scroll.currentTarget.scrollLeft);
    // if (secondDivRef.current) {
    //   (secondDivRef.current as HTMLDivElement).scrollLeft = scroll.currentTarget.scrollLeft;
    // }
  };

  const handleScrollSecond = (scroll: React.UIEvent<HTMLElement>) => {
    setScrollLeft(scroll.currentTarget.scrollLeft);
    // if (firstDivRef.current) {
    //   (firstDivRef.current as HTMLDivElement).scrollLeft = scroll.currentTarget.scrollLeft;
    // }
  };

  useHotkeys(
    TimelineHotKeys.OPEN_HISTORY_MODAL,
    () => {
      if (selectedActivity.length === 0 || isCanNotBeProcessed || disableAnyAction) return;
      dispatch(setOpenScheduleRestore(true));
    },
    { preventDefault: true },
  );

  useHotkeys(
    TimelineHotKeys.OPEN_DELETE_MODAL,
    () => {
      if (
        selectedActivity.length === 0 ||
        isCanNotBeProcessed ||
        SchSelectedActivity.isWork(selectedActivity[0]) ||
        disableAnyAction
      )
        return;
      if (
        ['day_off', 'shift'].includes(selectedActivity[0].type) ||
        SchUtils.isFullDayTimeOff(selectedActivity) ||
        SchUtils.isFullDayException(selectedActivity)
      ) {
        dispatch(openCleanupMenu());
      } else {
        dispatch(openDeleteMenu());
      }
    },
    { preventDefault: true },
  );

  useHotkeys(
    TimelineHotKeys.OPEN_EDIT_SHIFT_MODAL,
    () => {
      if (selectedActivity.length === 0 || isCanNotBeProcessed || disableAnyAction) return;
      if (selectedActivity[0].type === SCH_STATE_TYPE[SchStateType.DAY_OFF]) return;
      if (
        selectedActivity[0].isFullDay ||
        SchUtils.isFullDayTimeOff(selectedActivity) ||
        SchUtils.isFullDayException(selectedActivity)
      ) {
        dispatch(openEditFullDayItem());
      } else {
        if (selectedActivity.length > 1) {
          dispatch(setOpenEditMultiple({ isOpen: true, isFullDay: false }));
        } else {
          dispatch(openMenu());
        }
      }
    },
    { preventDefault: true, enabled: !isAnyPopupOpen },
  );

  useHotkeys(
    TimelineHotKeys.CLOSE_ALL_MENU,
    () => {
      if (selectedActivity.length !== 0 && !isAnyMenuOpen && !isAnyPopupOpen) {
        dispatch(setSelectedActivity([]));
      }
      if (isAnyPopupOpen) {
        dispatch(closeAllPopups());
      }
      if (isAnyMenuOpen) {
        dispatch(closeAllMenu());
      }
    },
    { preventDefault: true, enabled: !errorPopUpIsOpen },
  );

  const ableToShowCommentMemu = () => {
    if (!isEditCommentMenuOpen) {
      return false;
    }

    const canShow = SchAgent.agentHasActivity(selectedAgent[0], currentAgentDate);
    if (!canShow) {
      dispatch(closeEditCommentMenu());
    }

    return canShow;
  };

  const isCanNotBeProcessed = useMemo(() => {
    return [isPopUpOpen, isDeleteShiftOpen, isCleanUpDayOpen, isOpenSomeModal].some(p => p);
  }, [isPopUpOpen, isDeleteShiftOpen, isCleanUpDayOpen, isOpenSomeModal]);

  // region Scroll
  const [scrollLeft, setScrollLeft] = useStateRef(0);
  const bindChart = useSelector(getChartBinding);
  useEffect(() => {
    if (bindChart && firstDivRef.current) {
      firstDivRef.current.scrollLeft = scrollLeft;
    }
  }, [bindChart, firstDivRef.current]);

  // endregion
  return (
    <div
      className={styles.container}
      style={
        props.filterSidebarState.isCollapsed
          ? { width: `100%` }
          : { width: `calc(100% - ${props.filterSidebarState.width}px)` }
      }
    >
      <div
        className={styles.containerChild}
        onClick={(e: React.MouseEvent<HTMLDivElement>) => {
          e.preventDefault();
          e.stopPropagation();
          const target = e.target as HTMLElement;
          !e.ctrlKey &&
            target?.getAttribute('datatype') !== 'shift' &&
            selectedActivity.length &&
            dispatch(setSelectedActivity([]));
          if (isAnyMenuOpen) {
            dispatch(closeAllMenu());
          }
        }}
      >
        <ScheduleBar />

        <div className={styles.containerChildFlex}>
          <ResizableContainer initialHeight={268}>
            <Chart scrolHandler={handleScrollFirst} refHandler={firstDivRef} />
            <TimeLine
              setScrollLeft={setScrollLeft}
              scrollLeft={scrollLeft}
              scrollHandler={handleScrollSecond}
              refHandler={secondDivRef}
            />
          </ResizableContainer>
          <TimeLineFooterInfoBar />
        </div>
      </div>
      {isConfirmPopupOpen && <ConfirmPopup />}
      {isInsertWorkSetOpen && <InsertWorkSet />}
      {isMemoInfoOpen() ? <TimeLineMemoInfo referenceElement={memoData?.referenceElement} memo={memoData?.memo} /> : ''}
      {isInsertActivitySetOpen && <InsertActivitySet />}
      {isPopUpOpen ? <EditShiftPopup /> : ''}
      {isEditFullDayItemOpen ? <EditFullDayItem /> : ''}
      {confirmPopUp.isOpen ? <ConfirmChangesPopup /> : ''}
      {modifiedPopUp.isOpen ? <ScheduleModifiedPopup /> : ''}
      {isSetActivitiesForOpen && <SetActivitiesFor />}
      {isDeleteShiftOpen && (
        <ConfirmDeletePopup
          onClickSubmit={() => {
            dispatch(closeDeleteMenu());
            let newAgents;
            try {
              newAgents = SchAgent.deleteAgentActivities(timeLineData, selectedActivity);
            } catch (e: any) {
              const params: IErrorPopUpParam = {
                isOpen: true,
                data: e.message,
              };
              dispatch(openErrorPopUp(params));
              return;
            }
            dispatch(buildAgentDayInSnapshot({ modifiedAgentDays: newAgents }));
          }}
          onClickClose={() => {
            dispatch(closeDeleteMenu());
            dispatch(setSelectedActivity([]));
          }}
          activitiesToDelete={selectedActivity}
        />
      )}
      {isCleanUpDayOpen && (
        <ConfirmDeletePopup
          onClickSubmit={() => {
            dispatch(closeCleanupMenu());
            if (selectedActivity.length) {
              dispatch(multiSelectedCleanupAgentDay(selectedActivity));
            } else {
              dispatch(cleanupAgentDay({ [getSubMenuData.dateTimeSite]: [getSubMenuData.agentId] }));
            }
          }}
          onClickClose={() => {
            dispatch(closeCleanupMenu());
            dispatch(setSelectedActivity([]));
          }}
          activitiesToDelete={selectedActivity}
        />
      )}
      {ableToShowCommentMemu() ? <EditCommentMenu agent={editCommentMenuData.agent} /> : ''}
      {isNewShiftOpen ? <NewShiftMenu /> : ''}
      {isInsertMarkedTimeOpen ? <InsertMarkedTime /> : ''}
      {isInsertBreakOpen ? <InsertBreakMealMenu type={'INSERT_BREAK'} /> : ''}
      {isInsertMealOpen ? <InsertBreakMealMenu type={'INSERT_MEAL'} /> : ''}
      {isInsertExceptionOpen.isOpen ? <InsertExceptionMenu isFullDay={isInsertExceptionOpen.isFullDay} /> : ''}
      {isInsertTimeOffOpen.isOpen ? <InsertTimeOffMenu isFullDay={isInsertTimeOffOpen.isFullDay} /> : ''}
      {isRestoreScheduleOpen ? <RestoreScheduleMenu /> : ''}
      {isEditMultipleOpenSelector.isOpen ? <EditMultipleMenu /> : ''}
      {isCopyToOpen.isOpen ? <CopyToPopup /> : ''}
      {multipleCleanupOpen ? <MultipleCleanupPopUp /> : ''}
      {isRebuildScheduleOpen.isOpen ? <IntraDayScheduleRebuildWizardPopup /> : ''}
      {isBuildScheduleOpen.isOpen ? <BuildSchedulePopup /> : ''}
      {saveWarnings?.length > 0 && !scheduleModifiedPopup.isOpen && <ReviewWarningsPopup warningsType={warningsType} />}
      {multipleWizardOpen ? <MultipleWizard /> : ''}
      {isErrorPopUpOpen.isOpen ? <ErrorPopup isOpen={isErrorPopUpOpen.isOpen} data={isErrorPopUpOpen.data} /> : ''}
      {isWarningPopUpOpen.isOpen ? (
        <WarningPopup
          isOpen={isWarningPopUpOpen.isOpen}
          data={isWarningPopUpOpen.data}
          agents={isWarningPopUpOpen.agents}
          onApplyAction={isWarningPopUpOpen.onApplyAction}
          rerender={isWarningPopUpOpen.rerender}
        />
      ) : (
        ''
      )}
      {isSuccessPopUpOpen.isOpen ? (
        <SuccessPopup isOpen={isSuccessPopUpOpen.isOpen} data={isSuccessPopUpOpen.data} />
      ) : (
        ''
      )}
      {meetingScheduleOpen ? <MeetingScheduler /> : ''}
    </div>
  );
};

const mapStateToProps = (state: any) => {
  return {
    isPopUpOpen: isPopUoOpenSelector(state),
    isEditFullDayItemOpen: isEditFullDayItemOpenSelector(state),
    confirmPopUp: getConfirmPopUp(state),
    modifiedPopUp: getScheduleModifiedPopUp(state),
    isDeleteShiftOpen: isDeleteShiftMenuOpenSelector(state),
    isCleanUpDayOpen: isCleanupMenuOpenSelector(state),
    isNewShiftOpen: isNewShiftOpenSelector(state),
    isInsertBreakOpen: isInsertBreakOpenSelector(state),
    isInsertMealOpen: isInsertMealOpenSelector(state),
    isInsertExceptionOpen: isInsertExceptionOpenSelector(state),
    isInsertTimeOffOpen: isInsertTimeOffOpenSelector(state),
    isRestoreScheduleOpen: isRestoreScheduleOpenSelector(state),
    isCopyToOpen: isCopyToOpenSelector(state),
    isRebuildScheduleOpen: isRebuildScheduleOpenSelector(state),
    isBuildScheduleOpen: isBuildScheduleOpenSelector(state),
    isEditMultipleOpenSelector: isEditMultipleOpenSelector(state),
    isEditCommentMenuOpen: isEditCommentMenuOpenSelector(state),
    isErrorPopUpOpen: isErrorPopUpOpenSelector(state),
    isWarningPopUpOpen: isWarningPopUpOpenSelector(state),
    isSuccessPopUpOpen: isSuccessPopUpOpenSelector(state),
    getSubMenuData: getSubMenuDataSelector(state),
    filterSidebarState: getSidebar(state),
    currentDate: getActiveDateSelector(state),
    multipleWizardOpen: isMultipleWizardOpen(state),
    isOpenSomeModal: getIsOpenSomeModal(state),
    multipleCleanupOpen: isMultipleCleanupOpen(state),
    meetingScheduleOpen: isMeetingSchedulerOpen(state),
  };
};

export default connect(mapStateToProps)(Schedule);
