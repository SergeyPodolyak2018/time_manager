import { createPortal } from 'react-dom';

import { TScheduleScenario } from '../../../../api/ts/interfaces/scenario';
import { useAppSelector } from '../../../../redux/hooks';
import {
    deleteLoadingSelector, deleteScenarioPopupOpenSelector
} from '../../../../redux/selectors/scheduleScenariosSelector';
import { Cross } from '../../../../static/svg';
import { GeneralButton } from '../../../ReusableComponents/GeneralButton/GeneralButton';
import s from './deleteScenario.module.scss';

type TDeleteScenarioProps = {
  scenario?: TScheduleScenario;
  onOk: () => void;
  onCancel: () => void;
};
export const DeleteScenarioPopup = ({ scenario, onOk, onCancel }: TDeleteScenarioProps) => {
  const deleteScenarioPopupOpen = useAppSelector(deleteScenarioPopupOpenSelector);
  const loading = useAppSelector(deleteLoadingSelector);
  if (!deleteScenarioPopupOpen) return null;
  return createPortal(
    <div className={s.popup}>
      <div className={s.popupContent}>
        <div className={s.popupHeader}>
          <div className={s.popupTitle}>Are you sure?</div>
          <GeneralButton
            p="0"
            hoverable={false}
            icon={Cross}
            onClick={onCancel}
            style={{
              border: 'none',
            }}
          />

          {/* <Cross className={s.popupClose} onClick={onCancel} /> */}
        </div>
        <div className={s.popupBody}>
          <div className={s.popupText}>{`You are about to delete "${scenario?.name}"`}</div>
          <div className={s.popupText}>{`This process cannot be undone.`}</div>
        </div>
        <div className={s.popupButtons}>
          {/* <button className={s.cancel} onClick={onCancel}>
            Cancel
          </button> */}
          <GeneralButton text="Cancel" onClick={onCancel} />
          <GeneralButton loading={loading} cancelClickOnLoading text="Delete" type="danger" onClick={onOk} />
          {/* <button className={s.delete} onClick={onOk}>
            Delete
          </button> */}
          {/* <div className={styles.popupButton}>Cancel</div>
          <div className={styles.popupButton}>Delete</div> */}
        </div>
      </div>
    </div>,
    document.body,
    'delete-modal',
  );
};
