import React from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useSelector } from 'react-redux';

import { TimelineHotKeys } from '../../common/constants/schedule/hotkeys/timeline';
import ConfirmChangesPopup from '../../components/ConfirmChangesPopup';
import ConfirmPopup from '../../components/ReusableComponents/ConfirmPopup';
import ErrorPopup from '../../components/ScheduleComponents/Popups/ErrorPopup';
import SuccessPopup from '../../components/ScheduleComponents/Popups/SuccessPopup';
import WarningPopup from '../../components/ScheduleComponents/Popups/WarningPopup';
import { ScheduleScenariosInfoView } from '../../components/ScheduleScenariosComponents/InfoView/InfoViewContainer';
import NewScenarioWizardPopup from '../../components/ScheduleScenariosComponents/Popups/NewScenarioWizardPopup';
import { ScenarioBar } from '../../components/ScheduleScenariosComponents/ScenarioBar';
import { ScheduleScenariosTable } from '../../components/ScheduleScenariosComponents/Table/Table';
import { closeAllMenu, closeAllPopups, setSelectedActivity } from '../../redux/actions/timeLineAction';
import { useAppDispatch } from '../../redux/hooks';
import { confirmPopupSelector } from '../../redux/selectors/confirmPopupSelector';
import { isNewScenarioWizardOpen } from '../../redux/selectors/scheduleScenariosSelector';
import {
  getConfirmPopUp,
  getErrorPopUpOpen,
  getIsAnyMenuOpen,
  getIsAnyPopupOpen,
  getSelectedActivitySelector,
  isErrorPopUpOpenSelector,
  isSuccessPopUpOpenSelector,
  isWarningPopUpOpenSelector,
} from '../../redux/selectors/timeLineSelector';
import styles from './ScheduleScenario.module.scss';

export const ScheduleScenario = () => {
  const dispatch = useAppDispatch();
  const selectedActivity = useSelector(getSelectedActivitySelector);
  const { isOpen: isConfirmPopupOpen } = useSelector(confirmPopupSelector);

  const isAnyMenuOpen = useSelector(getIsAnyMenuOpen);
  const isAnyPopupOpen = useSelector(getIsAnyPopupOpen);
  const errorPopUpIsOpen = useSelector(getErrorPopUpOpen);
  const confirmPopUp = useSelector(getConfirmPopUp);
  const isErrorPopUpOpen = useSelector(isErrorPopUpOpenSelector);
  const isWarningPopUpOpen = useSelector(isWarningPopUpOpenSelector);
  const isSuccessPopUpOpen = useSelector(isSuccessPopUpOpenSelector);
  const isNewScenarioWizardPopupOpen = useSelector(isNewScenarioWizardOpen);

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
  return (
    <div
      className={styles.container}
      style={{ width: `100%` }}
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
        <ScenarioBar />

        <div className={styles.containerChildFlex}>
          {/* <ResizableContainer
            secondChildPxAdjustment={0}
            onScroll={e => {
              dispatch(setChartContainerScrollPosition(e.currentTarget.scrollLeft));
            }}
            initialHeight={268}
          > */}
          <ScheduleScenariosTable />
          <ScheduleScenariosInfoView />
          {/* </ResizableContainer> */}
        </div>
      </div>
      {isConfirmPopupOpen && <ConfirmPopup />}
      {confirmPopUp.isOpen ? <ConfirmChangesPopup /> : ''}
      {isErrorPopUpOpen.isOpen ? <ErrorPopup isOpen={isErrorPopUpOpen.isOpen} data={isErrorPopUpOpen.data} /> : ''}
      {isWarningPopUpOpen.isOpen ? (
        <WarningPopup
          isOpen={isWarningPopUpOpen.isOpen}
          data={isWarningPopUpOpen.data}
          agents={isWarningPopUpOpen.agents}
          onApplyAction={isWarningPopUpOpen.onApplyAction}
        />
      ) : (
        ''
      )}
      {isSuccessPopUpOpen.isOpen ? (
        <SuccessPopup isOpen={isSuccessPopUpOpen.isOpen} data={isSuccessPopUpOpen.data} />
      ) : (
        ''
      )}
      {isNewScenarioWizardPopupOpen ? <NewScenarioWizardPopup /> : ''}
    </div>
  );
};
