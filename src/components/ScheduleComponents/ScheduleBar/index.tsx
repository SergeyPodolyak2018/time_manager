import styles from './schedule.module.scss';
import IconButton from '../../ReusableComponents/IconButton';
import ColumnsMenu from '../ColumnMenu';
import MultipleWizardActions from '../MultipleWizardActions';
import ViewMenu from '../ViewMenu';
import {
  isColumnsMenuShow,
  isViewMenuShow,
  isMultipleMenuShow,
  isRebuildScheduleOpenSelector,
  isMultipleCleanupOpen,
  scheduleCalculatedSelector,
  isMeetingSchedulerOpen,
  isBuildScheduleOpenSelector,
  getDataSelector,
} from '../../../redux/selectors/timeLineSelector';
import {
  actionChangeColumnMenuState,
  actionChangeViewMenuState,
  closeAllMenu,
  getCalculatedScheduleShifts,
  setOpenMultipleCleanupPopUp,
  setOpenMultipleWizardMenuAction,
  setOpenRebuildSchedule,
  setOpenMeetingSchedulerAction,
  setOpenBuildSchedule,
} from '../../../redux/actions/timeLineAction';
import { connect, useSelector } from 'react-redux';
import TimeZoneList from '../TimeZoneList';
import Calendar from '../../ReusableComponents/Calendar';
import ChartTarget from '../ChartTargetDropdown';
import Switch from '../../ReusableComponents/Switch';
import { togleBindingAction } from '../../../redux/actions/ChartActions';
import { getChartBinding } from '../../../redux/selectors/chartSelector';
import { useAppDispatch } from '../../../redux/hooks';
import { ICalculatedSchedule } from '../../../redux/ts/intrefaces/timeLine';
import { getCheckedItems } from '../../../redux/selectors/filterSelector';
import { IBusinessUnits } from '../../../common/interfaces/config';
import utils from '../../../helper/utils';
import { Tooltip } from '../../ReusableComponents/Tooltip/Tooltip';

export interface IScheduleBar {
  columnsMenu: boolean;
  viewMenu: boolean;
  scheduleCalculated: ICalculatedSchedule;
  isMeetingSchedulerOpenSelector: boolean;
  isRebuildOpenSelector: { isOpen: boolean };
  setOpenRebuild: (show: boolean) => void;
  calculatedScheduleShifts: () => void;
  changeColumnMenuView: (show: boolean) => void;
  changeViewnMenuView: (show: boolean) => void;
  openMultipleMenu: (show: boolean) => void;
  openMeetingScheduler: (show: boolean) => void;
  multipleMenu: boolean;
  bind: boolean;
  togleBind: () => void;
  multipleCleanupOpen: boolean;
  openMultipleCleanup: (show: boolean) => void;
  checkedItems: IBusinessUnits;
  isBuildScheduleOpenSelector: { isOpen: boolean };
  setOpenBuildSchedule: (show: boolean) => void;
}

const ScheduleBar = (props: IScheduleBar) => {
  const dispatch = useAppDispatch();
  const changeBind = () => {
    props.togleBind();
  };

  const data = useSelector(getDataSelector);

  const clickOnIconButton = (type: string) => {
    dispatch(closeAllMenu());
    if (type === 'setup') {
      props.changeColumnMenuView(!props.columnsMenu);
    } else if (type === 'view') {
      props.changeViewnMenuView(!props.viewMenu);
    } else if (type === 'multiple') {
      props.openMultipleMenu(!props.multipleMenu);
    } else if (type === 'rebuild') {
      props.setOpenRebuild(!props.isRebuildOpenSelector.isOpen);
    } else if (type === 'buildSchedule') {
      props.setOpenBuildSchedule(!props.isBuildScheduleOpenSelector.isOpen);
    } else if (type === 'scheduleCalculated') {
      props.calculatedScheduleShifts();
    } else if (type === 'cleanup') {
      props.openMultipleCleanup(!props.multipleCleanupOpen);
    } else if (type === 'meetingScheduler') {
      props.openMeetingScheduler(!props.isMeetingSchedulerOpenSelector);
    }
  };
  return (
    <>
      <div className={styles.container}>
        <div className={styles.headerContainer}>
          <div>Schedule intraday</div>
          <div className={styles.timeZoneContainer}>
            <TimeZoneList />
          </div>
        </div>
        <div className={styles.buttonContainer}>
          {utils.scheduleBuilderEnabled ? (
            <Tooltip text="Schedule Rebuild">
              <IconButton
                type={'buildSchedule'}
                active={props.isBuildScheduleOpenSelector.isOpen}
                disable={data.length === 0}
                click={() => {
                  clickOnIconButton('buildSchedule');
                }}
              />
            </Tooltip>
          ) : (
            ''
          )}
          <Tooltip text="Meeting Planner">
            <IconButton
              type={'meetingScheduler'}
              active={props.isMeetingSchedulerOpenSelector}
              click={() => {
                clickOnIconButton('meetingScheduler');
              }}
              disable={Object.keys(props.checkedItems).length === 0}
            />
          </Tooltip>

          <Tooltip text="Rebuild intra-day Schedule">
            <IconButton
              type={'rebuild'}
              active={props.isRebuildOpenSelector.isOpen}
              disable={data.length === 0}
              click={() => {
                clickOnIconButton('rebuild');
              }}
            />
          </Tooltip>
          <Tooltip text="Cleanup">
            <IconButton
              type={'cleanup'}
              active={props.multipleCleanupOpen}
              disable={data.length === 0}
              click={() => {
                clickOnIconButton('cleanup');
              }}
            />
          </Tooltip>
          <Tooltip text="Multiple Operations">
            <IconButton
              type={'multiple'}
              active={props.multipleMenu}
              disable={data.length === 0}
              click={() => {
                clickOnIconButton('multiple');
              }}
            />
          </Tooltip>
          <Tooltip text="Graph Settings">
            <IconButton
              type={'settings'}
              active={props.viewMenu}
              click={() => {
                clickOnIconButton('view');
              }}
            />
          </Tooltip>
          <Tooltip text="Schedule Display Options">
            <IconButton
              type={'setup'}
              active={props.columnsMenu}
              click={() => {
                clickOnIconButton('setup');
              }}
            />
          </Tooltip>
          {props.columnsMenu ? <ColumnsMenu /> : ''}
          {props.viewMenu ? <ViewMenu /> : ''}
          {props.multipleMenu ? <MultipleWizardActions /> : ''}
        </div>
      </div>
      <div className={`${styles.container} ${styles.containerSecond}`}>
        <span className={styles.chartTargetTitle}>Target:</span>
        <div className={styles.chartTargetContainer}>
          <ChartTarget />
        </div>
        <Calendar />
        <div className={styles.bindHolder}>
          <span className={styles.bindSpan}>Bind chart</span>
          <Switch
            checked={props.bind}
            onClick={e => {
              changeBind();
              e.preventDefault();
              e.stopPropagation();
            }}
          />
        </div>
      </div>
    </>
  );
};

const mapStateToProps = (state: any) => {
  return {
    bind: getChartBinding(state),
    scheduleCalculated: scheduleCalculatedSelector(state),
    isMeetingSchedulerOpenSelector: isMeetingSchedulerOpen(state),
    isRebuildOpenSelector: isRebuildScheduleOpenSelector(state),
    isBuildScheduleOpenSelector: isBuildScheduleOpenSelector(state),
    columnsMenu: isColumnsMenuShow(state),
    viewMenu: isViewMenuShow(state),
    multipleMenu: isMultipleMenuShow(state),
    multipleCleanupOpen: isMultipleCleanupOpen(state),
    checkedItems: getCheckedItems(state),
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    setOpenRebuild: (show: boolean) => dispatch(setOpenRebuildSchedule({ isOpen: show })),
    setOpenBuildSchedule: (show: boolean) => dispatch(setOpenBuildSchedule({ isOpen: show })),
    changeColumnMenuView: (show: boolean) => dispatch(actionChangeColumnMenuState(show)),
    changeViewnMenuView: (show: boolean) => dispatch(actionChangeViewMenuState(show)),
    openMultipleMenu: (show: boolean) => dispatch(setOpenMultipleWizardMenuAction(show)),
    openMultipleCleanup: (show: boolean) => dispatch(setOpenMultipleCleanupPopUp(show)),
    calculatedScheduleShifts: () => dispatch(getCalculatedScheduleShifts()),
    togleBind: () => dispatch(togleBindingAction()),
    openMeetingScheduler: (show: boolean) => dispatch(setOpenMeetingSchedulerAction(show)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ScheduleBar);
