import React, { FC } from 'react';
import { useSelector } from 'react-redux';

import { usePopUpHotkeys } from '../../hooks';
import { closeSaveConfirm, validateAndSaveAgentDay } from '../../redux/actions/timeLineAction';
import { useAppDispatch } from '../../redux/hooks';
import { getConfirmPopUp, getModifiedData } from '../../redux/selectors/timeLineSelector';
import { store } from '../../redux/store';
import styles from './confirmation.module.scss';
import Button from '../ReusableComponents/button';
import { Cross } from '../../static/svg';

// usage:
/*
      const proceed = () => {
        dispatch(setColumnSortBy(column)); //user main action
        dispatch(setIsModified(false));
        dispatch(setDefaultConfirmState());
      };

      if (useSelector(getIsModifiedData)) {
        dispatch(openSaveConfirm({ onConfirm: proceed, onDiscard: proceed }));
      }
*/
const ConfirmChangesPopup: FC = () => {
  const dispatch = useAppDispatch();
  const modifiedData = useSelector(getModifiedData);
  const confirmPopUp = useSelector(getConfirmPopUp);

  const handleClickSave = async (e: React.MouseEvent | KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      dispatch(closeSaveConfirm());
      await dispatch(
        validateAndSaveAgentDay({
          agents: modifiedData,
          ignoreWarnings: false,
          checkTimestamp: true,
          reviewWarningsType: 'full',
        }),
      );

      const scheduleModifiedPopUp = store.getState().TimeLine.scheduleModifiedPopUp;
      const saveWarnings = store.getState().TimeLine.agentsWithSaveWarnings;
      if (scheduleModifiedPopUp.isOpen || saveWarnings.length > 0) {
        return;
      } // checking there are no issues while saving
      confirmPopUp.onConfirm();
      confirmPopUp.onResult('save');
    } catch (err: any) {
      // return alert(err.message);
    }
  };

  const handleClockDiscardBtn = () => {
    dispatch(closeSaveConfirm());
    confirmPopUp.onDiscard();
    confirmPopUp.onResult('discard');
  };

  const handleClickCloseBtn = () => {
    dispatch(closeSaveConfirm());
    confirmPopUp.onClose();
    confirmPopUp.onResult('close');
  };
  usePopUpHotkeys({ onSubmit: [handleClickSave], onCancel: [handleClickCloseBtn] });

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <div className={styles.header}>
          <span>Save changes?</span>
          <Cross onClick={handleClickCloseBtn} data-test={'unsaved-changes-dialog-close'} />
        </div>

        <div className={styles.body}>
          <span className={styles.text1}>You made changes.</span>
          <span className={styles.text2}>Do you want to publish or discard them?</span>
        </div>

        <div className={styles.footer}>
          <div className={styles.buttonWrap1}>
            <Button
              innerText={'Discard'}
              click={handleClockDiscardBtn}
              style={{ background: '#FFFFFF', color: '#006FCF', border: '0.5px solid #0183F5', borderRadius: '5px' }}
            />
          </div>

          <div className={styles.buttonWrap2}>
            <Button
              innerText={'Publish'}
              click={handleClickSave}
              style={{ background: '#006FCF', color: '#FFFFFF', borderRadius: '5px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmChangesPopup;
