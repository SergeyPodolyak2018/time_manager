import React, { useState } from 'react';
import { connect, useSelector } from 'react-redux';
import Popup from 'reactjs-popup';

import { SchStateType } from '../../../../common/constants/schedule';
import { buttonsList } from '../../../../common/constants/schedule/submenu';
import { IMenuItem, ISubmenuItem, MenuType, SubmenuOption } from '../../../../common/constants/schedule/submenu/common';
import { ISchDayState, ISchState } from '../../../../common/interfaces/schedule/IAgentSchedule';
import DateUtils from '../../../../helper/dateUtils';
import SchAgent from '../../../../helper/schedule/SchAgent';
import SchSelectedActivity from '../../../../helper/schedule/SchSelectedActivity';
import Utils from '../../../../helper/utils';
import {
  buildAgentDayInSnapshot,
  cleanSelectActivities,
  cleanSelectAgentsAction,
  closeSubMenu,
  copyActivities,
  initCloseMemoInfo,
  initOpenMemoInfo,
  openCleanupMenu,
  openDeleteMenu,
  openEditFullDayItem,
  openInsertBreakMenu,
  openInsertMealMenu,
  openMenu,
  openNewShiftbMenu,
  pasteShiftActivity,
  pasteStateActivity,
  selectAgentAction,
  selectShiftBySelectedActivity,
  setCopyToPopup, setIsTimeLineDisabled,
  setOpenEditMultiple,
  setOpenInsertExceptionMenu,
  setOpenScheduleRestore,
  setOpenTimeOffMenu,
  setSelectedActivity,
  toggleInsertActivitySetPopup,
  toggleInsertMarkedTimePopup,
  toggleInsertWorkSetPopup,
  toggleSetActivitiesForPopup,
} from '../../../../redux/actions/timeLineAction';
import { useAppDispatch } from '../../../../redux/hooks';
import { getActiveDateSelector } from '../../../../redux/selectors/controlPanelSelector';
import {
  getBuffer,
  getClickedDay,
  getDataSelector,
  getIsOpenSomeModal,
  getSelectedActivitySelector,
  getSelectedAgentSelector,
  getSubMenuDataSelector,
  isMemoOpenSelector,
} from '../../../../redux/selectors/timeLineSelector';
import { ISelectedActivity, SetActivitiesFor } from '../../../../redux/ts/intrefaces/timeLine';
import { IAgentTimeline, ITimelineAgentActivity } from '../../../../redux/ts/intrefaces/timeLine/IAgentTimeline';
import { ReactComponent as Command } from './icons/Command.svg';
import { ReactComponent as Control } from './icons/Control.svg';
import { ReactComponent as Enter } from './icons/Enter.svg';
import { ReactComponent as Space } from './icons/Space.svg';
import styles from './menu.module.scss';

export interface IScheduleMenuProps {
  getActiveDateSelector: string;
  selectedActivities: ISelectedActivity[];
  selectedAgents: IAgentTimeline[];
  agentsData: IAgentTimeline[];
  left: number | undefined;
  top: number | undefined;
  isRight: boolean | undefined;
  type: number | undefined;
}

interface IShortCutInfo {
  buttonName: string;
  existingStyles: IOSStyle[];
  canBeIncluded?: boolean;
}

interface IOSStyle {
  osName: string;
  shortCut?: string;
  shortCutType?: ShortCutType;
}

enum ShortCutType {
  COMMAND,
  ENTER,
  SPACE,
  CONTROL,
}

const buttonStyles: IShortCutInfo[] = [
  {
    buttonName: 'Copy',
    existingStyles: [
      {
        osName: 'Windows',
        shortCut: 'Ctrl+C',
      },
      {
        osName: 'Mac OS',
        shortCut: 'C',
        shortCutType: ShortCutType.COMMAND,
      },
    ],
  },

  {
    buttonName: 'Paste Item',
    existingStyles: [
      {
        osName: 'Windows',
        shortCut: 'Ctrl+V',
      },
      {
        osName: 'Mac OS',
        shortCut: 'V',
        shortCutType: ShortCutType.CONTROL,
      },
    ],
  },

  {
    buttonName: 'Paste Shift',
    existingStyles: [
      {
        osName: 'Windows',
        shortCut: 'Ctrl+V',
      },
      {
        osName: 'Mac OS',
        shortCut: 'V',
        shortCutType: ShortCutType.CONTROL,
      },
    ],
  },
  {
    buttonName: 'Paste',
    existingStyles: [
      {
        osName: 'Windows',
        shortCut: 'Ctrl+V',
      },
      {
        osName: 'Mac OS',
        shortCut: 'V',
        shortCutType: ShortCutType.CONTROL,
      },
    ],
  },

  {
    buttonName: 'Show Memo',
    existingStyles: [
      {
        osName: 'None',
        shortCutType: ShortCutType.SPACE,
      },
    ],
  },
  {
    buttonName: 'Edit',
    canBeIncluded: true,
    existingStyles: [
      {
        osName: 'None',
        shortCutType: ShortCutType.ENTER,
      },
    ],
  },

  {
    buttonName: 'Delete',
    existingStyles: [
      {
        osName: 'Windows',
        shortCut: 'Ctrl+X',
      },
      {
        osName: 'Mac OS',
        shortCut: 'X',
        shortCutType: ShortCutType.CONTROL,
      },
    ],
  },

  {
    buttonName: 'Cleanup Day',
    existingStyles: [
      {
        osName: 'Windows',
        shortCut: 'Ctrl+X',
      },
      {
        osName: 'Mac OS',
        shortCut: 'X',
        shortCutType: ShortCutType.CONTROL,
      },
    ],
  },

  {
    buttonName: 'Schedule History',
    existingStyles: [
      {
        osName: 'Windows',
        shortCut: 'Ctrl+H',
      },
      {
        osName: 'Mac OS',
        shortCut: 'H',
        shortCutType: ShortCutType.CONTROL,
      },
    ],
  },
];

const TimeLineActionsMenu = (props: IScheduleMenuProps) => {
  const { left, top, type, isRight } = props;
  const dispatch = useAppDispatch();
  const [submenuOpenName, setSubmenuOpenName] = useState<string>('');

  const clickedDay = useSelector(getClickedDay);
  const subMenuData = useSelector(getSubMenuDataSelector);
  const buffer = useSelector(getBuffer);
  const selectedActivities = useSelector(getSelectedActivitySelector);

  const selectedAgents = useSelector(getSelectedAgentSelector);

  const currentDate = useSelector(getActiveDateSelector);
  const isOpenModal = useSelector(getIsOpenSomeModal);
  const isMemoOpen = useSelector(isMemoOpenSelector);

  const onHoverItem = (property: IMenuItem | ISubmenuItem) => {
    if ('menuType' in property && property.menuType !== undefined && submenuOpenName !== property.name)
      setSubmenuOpenName(property.name);
  };

  const getButtons = (
    property: IMenuItem | ISubmenuItem,
    index: number,
    menuType: MenuType,
    submenu?: JSX.Element | null,
  ) => {
    const disabled = typeof property.disabled === 'function' ? property.disabled({ buffer }) : property.disabled;
    const name = typeof property.conditionName === 'function' ? property.conditionName({ buffer }) : property.name;
    const visible =
      typeof property.visible === 'function'
        ? property.visible({ selectedActivities, selectedAgents }, subMenuData?.dateTime)
        : typeof property.visible === 'boolean'
        ? property.visible
        : true;
    return (
      <React.Fragment key={index}>
        {visible ? (
          <div
            className={`${styles.popup} ${disabled ? styles.disabled : styles.regular} ${
              name === submenuOpenName ? styles.active : ''
            } ${property.separator ? styles.separator : ''}`}
            onMouseMove={() => onHoverItem(property)}
            onClick={() => {
              if (disabled && !visible) return;

              const activity =
                'getActivity' in property && property.getActivity
                  ? property?.getActivity({ selectedActivities, selectedAgents }, subMenuData?.dateTime)
                  : null;
              onClickMenuOption(name, property.submenuOption, menuType, activity);
              dispatch(closeSubMenu());
            }}
          >
            {
              <div className={styles.buttonDiv}>
                <span>
                  {name}
                  {'submenu' in property && property?.submenu ? <div className={styles.arrow}></div> : null}
                </span>
              </div>
            }
            {getShortCutHint(
              name,
              name === submenuOpenName && !disabled,
              !('submenu' in property && property?.submenu),
            )}
          </div>
        ) : null}
        {submenu ? submenu : null}
      </React.Fragment>
    );
  };

  const getShortCutHint = (buttonName: string, isActive: boolean, hasNoArrow: boolean) => {
    const currentShortCutStyle = getButtonShortCutStyle(buttonName);
    return (
      <React.Fragment>
        {currentShortCutStyle?.osName === 'Windows' && hasNoArrow ? (
          <div className={styles.shortCut}>
            <span className={`${isActive ? styles.active : ''}`}>{currentShortCutStyle?.shortCut}</span>
          </div>
        ) : currentShortCutStyle?.osName === 'Mac OS' && hasNoArrow ? (
          <div className={styles.shortCut}>
            {getShortCutIcon(currentShortCutStyle.shortCutType, isActive)}
            <span className={`${isActive ? styles.active : ''}`}>{currentShortCutStyle?.shortCut}</span>
          </div>
        ) : (
          currentShortCutStyle?.osName === 'None' &&
          hasNoArrow &&
          (buttonName.toLocaleLowerCase().includes(selectedActivities[0]?.type.split('_')[0]) ||
            (buttonName.toLocaleLowerCase().includes('edit multiple') && selectedActivities.length > 1) ||
            buttonName.toLocaleLowerCase().includes('memo')) && (
            <div className={styles.shortCut}>{getShortCutIcon(currentShortCutStyle.shortCutType, isActive)}</div>
          )
        )}
      </React.Fragment>
    );
  };

  const getShortCutIcon = (shortCutType: ShortCutType | undefined, isActive: boolean) => {
    switch (shortCutType) {
      case ShortCutType.COMMAND:
        return <Command className={`${styles.shortCutPlacement} ${isActive ? styles.shortCutSvgActive : ''}`} />;
      case ShortCutType.ENTER:
        return <Enter className={`${isActive ? styles.shortCutSvgActive : ''}`} />;
      case ShortCutType.SPACE:
        return <Space className={`${isActive ? styles.shortCutSvgActive : ''}`} />;
      case ShortCutType.CONTROL:
        return <Control className={`${styles.shortCutPlacement} ${isActive ? styles.shortCutSvgActive : ''}`} />;
    }
  };

  const getButtonShortCutStyle = (buttonName: string) => {
    const currentOS = Utils.getOS();
    const currentButtonStyle = buttonStyles
      .find(x => (x.canBeIncluded ? buttonName.includes(x.buttonName) : x.buttonName === buttonName))
      ?.existingStyles.find(s => s.osName.includes(currentOS));
    if (!currentButtonStyle) {
      return buttonStyles
        .find(x => (x.canBeIncluded ? buttonName.includes(x.buttonName) : x.buttonName === buttonName))
        ?.existingStyles.find(s => s.osName === 'None');
    }
    return currentButtonStyle;
  };

  const selectAllOfType = (selectedActivity: ISelectedActivity) => {
    const type = selectedActivity?.type;

    const name = selectedActivity?.name;

    const activities: ITimelineAgentActivity[] = [];

    const isFullDay = selectedActivity?.stateIndex !== undefined;

    props.agentsData.forEach(agent => {
      agent.activities.forEach(activity => {
        activities.push(activity);
      });
    });

    const filteredActivities = activities.filter(
      a => (isFullDay ? a.stateIndex !== undefined : a.stateIndex === undefined) && a.name === name,
    );

    const typeFilteredActivities = filteredActivities
      .filter(a => a.type === type)
      .filter(
        a => a.end > Number(new Date(currentDate)) && a.start < Number(new Date(DateUtils.getNextDay(currentDate))),
      );
    const filteredAgentId = typeFilteredActivities.find(el => el.agentId)?.agentId;
    dispatch(setSelectedActivity(typeFilteredActivities));
    if (!filteredAgentId) return;
    dispatch(selectAgentAction(filteredAgentId));
  };

  const insertDayOff = () => {
    if (!clickedDay) return;
    const agent = props.selectedAgents[0];

    const midnightDayTime = DateUtils.getMidnight(clickedDay).split('T');
    const day = midnightDayTime[0];

    const time =
      agent._TZ_INTERNAL_USAGE.tzSelected.timezoneId !== 0
        ? DateUtils.convertDayStartDelimiter(
            DateUtils.getMidnight(clickedDay),
            agent._TZ_INTERNAL_USAGE.tzSite,
            agent._TZ_INTERNAL_USAGE.tzSelected,
          ).split('T')[1]
        : midnightDayTime[1];

    const clickedDayTimestamp = new Date(day).getTime();
    const _dayState: ISchDayState = {
      id: 0,
      isFullDay: true,
      isPaid: false,
      name: 'Day off',
      paidMinutes: 0,
      shortName: 'DOF',
      startDateTime: DateUtils.setDayTime(clickedDayTimestamp, time, false),
      endDateTime: DateUtils.setDayTime(clickedDayTimestamp, time, true),
      type: SchStateType.DAY_OFF,
    };

    const newAgent = SchAgent.insertDay(agent, clickedDayTimestamp, _dayState);
    dispatch(buildAgentDayInSnapshot({ agentDays: newAgent }));
  };

  const onClickMenuOption = (
    name: string,
    submenuOption: SubmenuOption,
    menuType: MenuType,
    activity: ISchState | null | undefined,
  ) => {
    const dateTime = subMenuData ? DateUtils.roundToNearest15Minutes(subMenuData.dateTime) : null;
    const isNeedToSelectShift =
      menuType === MenuType.WORK_SET ||
      menuType === MenuType.EDIT_EXCEPTION ||
      menuType === MenuType.EDIT_TIME_OFF ||
      menuType === MenuType.EDIT_BREAK ||
      menuType === MenuType.EDIT_MEAL ||
      menuType === MenuType.ACTIVITY ||
      menuType === MenuType.EDIT_MARKED_TIME ||
      menuType === MenuType.SHIFT;

    switch (name) {
      case 'Copy':
        dispatch(copyActivities(props.selectedActivities));
        dispatch(cleanSelectAgentsAction());
        dispatch(cleanSelectActivities());
        break;
      case 'Copy to ...':
        dispatch(setCopyToPopup({ selectedActivity: props.selectedActivities, isOpen: true, isMultiple: false }));
        break;
      case 'Multiple Copy to ...':
        dispatch(setCopyToPopup({ selectedActivity: props.selectedActivities, isOpen: true, isMultiple: true }));
        break;
      case 'Paste Shift':
        dispatch(setIsTimeLineDisabled(true));
        dispatch(pasteShiftActivity(dateTime, true)).finally(() => {
          dispatch(setIsTimeLineDisabled(false));
        });
        break;
      case 'Paste':
        dispatch(setIsTimeLineDisabled(true));
        dispatch(pasteShiftActivity(dateTime, true)).finally(() => {
          dispatch(setIsTimeLineDisabled(false));
        });
        break;
      case 'Paste Item':
        dispatch(setIsTimeLineDisabled(true));
        dispatch(pasteStateActivity(dateTime, true)).finally(() => {
          dispatch(setIsTimeLineDisabled(false));
        });
        break;
      case 'Edit Shift':
        if (isNeedToSelectShift) {
          dispatch(selectShiftBySelectedActivity());
        }
        dispatch(openMenu());
        break;
      case SetActivitiesFor.WORK:
        if (SchSelectedActivity.isActivitySet(selectedActivities[0]) || isNeedToSelectShift) {
          dispatch(selectShiftBySelectedActivity());
        }
        dispatch(toggleSetActivitiesForPopup(SetActivitiesFor.WORK));
        break;
      case SetActivitiesFor.WORK_SET:
        dispatch(toggleSetActivitiesForPopup(SetActivitiesFor.WORK_SET));
        break;
      case SetActivitiesFor.ACTIVITY_SET:
        dispatch(toggleSetActivitiesForPopup(SetActivitiesFor.ACTIVITY_SET));
        break;
      case 'Edit Activity':
        dispatch(openMenu());
        break;
      case 'Edit Marked Time':
        // in case we selected Edit Marked Time from submenu, which is opened by clicking on Shift
        // we need to select specific marked time activity
        // select activity
        if (activity) {
          dispatch(setSelectedActivity([activity as unknown as ITimelineAgentActivity]));
        }
        dispatch(openMenu());
        break;
      case 'Edit Work Set':
        dispatch(openMenu());
        break;
      case 'Delete':
        dispatch(openDeleteMenu());
        // dispatchHook(deleteShift());
        break;
      case 'Delete Work Set':
        dispatch(openDeleteMenu());
        // dispatchHook(deleteShift());
        break;
      case 'Cleanup Day':
        dispatch(openCleanupMenu());
        break;
      case 'Insert Shift':
        dispatch(openNewShiftbMenu());
        break;
      case 'Insert Marked Time':
        if (isNeedToSelectShift) {
          dispatch(selectShiftBySelectedActivity());
        }
        dispatch(toggleInsertMarkedTimePopup());
        break;
      case 'Insert Activity Set':
        if (isNeedToSelectShift) {
          dispatch(selectShiftBySelectedActivity());
        }
        dispatch(toggleInsertActivitySetPopup());
        break;
      case 'Insert Work Set':
        if (isNeedToSelectShift) {
          dispatch(selectShiftBySelectedActivity());
        }
        dispatch(toggleInsertWorkSetPopup());
        break;
      case 'Insert Break':
        if (isNeedToSelectShift) {
          dispatch(selectShiftBySelectedActivity());
        }
        dispatch(openInsertBreakMenu());
        break;
      case 'Insert Meal':
        if (isNeedToSelectShift) {
          dispatch(selectShiftBySelectedActivity());
        }
        dispatch(openInsertMealMenu());
        break;
      case 'Edit Meal':
        dispatch(openMenu());
        break;
      case 'Edit Break':
        dispatch(openMenu());
        break;
      case 'Edit Time Off':
        dispatch(openMenu());
        break;
      case 'Edit Multiple':
        dispatch(setOpenEditMultiple({ isOpen: true, isFullDay: false }));
        break;
      case 'Edit Full-Day Time Off':
        dispatch(openEditFullDayItem());
        break;
      case 'Edit Full-Day Exception':
        dispatch(openEditFullDayItem());
        break;
      case 'Edit Exception':
        dispatch(openMenu());
        break;
      case 'Insert Exception':
        if (isNeedToSelectShift) {
          dispatch(selectShiftBySelectedActivity());
        }
        dispatch(setOpenInsertExceptionMenu({ isOpen: true, isFullDay: false }));
        break;
      case 'Insert Time Off':
        if (isNeedToSelectShift) {
          dispatch(selectShiftBySelectedActivity());
        }
        dispatch(setOpenTimeOffMenu({ isOpen: true, isFullDay: false }));
        break;
      case 'Insert Work Set Wizard':
        break;
      case 'Schedule History':
        dispatch(selectShiftBySelectedActivity());
        dispatch(setOpenScheduleRestore(true));
        break;
      case 'Insert Day Off':
        insertDayOff();
        break;
      case 'Insert Full-Day Exception':
        dispatch(setOpenInsertExceptionMenu({ isOpen: true, isFullDay: true }));
        break;
      case 'Insert Full-Day Time Off':
        dispatch(setOpenTimeOffMenu({ isOpen: true, isFullDay: true }));
        break;
      case 'Select all of type':
        if (SchSelectedActivity.isWork(selectedActivities[0])) {
          return selectAllOfType(
            SchSelectedActivity.selectShiftsBySelectedActivities(selectedActivities, selectedAgents)[0],
          );
        }

        selectAllOfType(selectedActivities[0]);
        break;
      case 'Show Memo':
        showMemo();
        break;
      default:
        break;
    }
  };

  const showMemo = () => {
    if (!selectedActivities[0] || isOpenModal) return;
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
  };

  const getButtonsCount = () => {
    const buttons = buttonsList.map(element => {
      if (type === element.menuType) {
        return typeof element.visible === 'function'
          ? element.visible({ selectedActivities, selectedAgents }, subMenuData?.dateTime)
          : typeof element.visible === 'boolean'
          ? element.visible
          : true;
      }
      return undefined;
    });

    return buttons.filter(x => x && x === true).length;
  };
  let topPosition = 0;
  if (top) {
    topPosition =
      selectedActivities?.length > 1 && selectedActivities[0].type === 'activity_set'
        ? top + 20 * getButtonsCount()
        : top;
  }
  return (
    <Popup
      trigger={<div className={styles.popUpContainer}></div>}
      contentStyle={{ width: '0px', height: '0px' }}
      arrow={false}
      open
    >
      <div className={styles.container} style={{ left: `${left}px`, top: `${topPosition}px` }}>
        {buttonsList.map((element, mainIdx) => {
          if (element.menuType !== type) return;
          if (element.submenu) {
            const topPosition =
              buttonsList.slice(0, mainIdx).filter(b => {
                const visible =
                  typeof b.visible === 'function'
                    ? b.visible({ selectedActivities, selectedAgents }, subMenuData?.dateTime)
                    : typeof b.visible === 'boolean'
                    ? b.visible
                    : true;

                return b.menuType === type && visible;
              }).length * 31;

            return getButtons(
              element,
              mainIdx,
              element.menuType,
              element.submenu.length && submenuOpenName === element.name ? (
                <div
                  key={buttonsList.length + mainIdx}
                  className={`${styles.submenu} ${isRight ? styles.isRight : ''}`}
                  style={{
                    top: `${topPosition}px`,
                  }}
                >
                  {element.submenu.map((subElement, idx) =>
                    getButtons(subElement, buttonsList.length * 2 + idx, element.menuType),
                  )}
                </div>
              ) : null,
            );
          }

          return getButtons(element, mainIdx, element.menuType);
        })}
      </div>
    </Popup>
  );
};

const mapStateToProps = (state: any) => {
  return {
    getActiveDateSelector: getActiveDateSelector(state),
    selectedActivities: getSelectedActivitySelector(state),
    selectedAgents: getSelectedAgentSelector(state),
    agentsData: getDataSelector(state),
  };
};

const mapDispatchToProps = () => {
  return {};
};

export default connect(mapStateToProps, mapDispatchToProps)(TimeLineActionsMenu);
