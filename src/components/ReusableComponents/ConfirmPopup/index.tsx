import React, { FC } from 'react';

import { usePopUpHotkeys } from '../../../hooks';
import styles from './confirmation.module.scss';
import Button from '../button';
import { confirmPopupSelector } from '../../../redux/selectors/confirmPopupSelector';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../../redux/hooks';
import { setResultConfirmPopup, toggleConfirmPopup } from '../../../redux/actions/confirmPopupActions';
import { ConfirmPopupResult } from '../../../redux/reducers/confirmPopupReducer';
import { Cross } from '../../../static/svg';

const ConfirmChangesPopup: FC = () => {
  const dispatch = useAppDispatch();
  const { onConfirm, onResult, onClose, onDiscard, title, text, btnDiscardTitle, btnConfirmTitle } =
    useSelector(confirmPopupSelector);

  const handleClickSave = async (e: React.MouseEvent | KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();

    onConfirm();
    onResult(ConfirmPopupResult.SAVE);
    dispatch(setResultConfirmPopup(ConfirmPopupResult.SAVE));
    dispatch(toggleConfirmPopup());
  };

  const handleClockDiscardBtn = () => {
    onDiscard();
    onResult(ConfirmPopupResult.DISCARD);
    dispatch(setResultConfirmPopup(ConfirmPopupResult.DISCARD));
    dispatch(toggleConfirmPopup());
  };

  const handleClickCloseBtn = () => {
    onClose();
    onResult(ConfirmPopupResult.CLOSE);
    dispatch(setResultConfirmPopup(ConfirmPopupResult.CLOSE));
    dispatch(toggleConfirmPopup());
  };
  usePopUpHotkeys({ onSubmit: [handleClickSave], onCancel: [handleClickCloseBtn] });

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <div className={styles.header}>
          <span>{title}</span>
          <Cross onClick={handleClickCloseBtn} data-test={'unsaved-changes-dialog-close'} />
        </div>

        <div className={styles.body}>
          <span className={styles.text1}>{text}</span>
        </div>

        <div className={styles.footer}>
          <div className={styles.buttonWrap1}>
            <Button
              innerText={btnDiscardTitle}
              click={handleClockDiscardBtn}
              style={{ background: '#FFFFFF', color: '#006FCF', border: '0.5px solid #0183F5', borderRadius: '5px' }}
            />
          </div>

          <div className={styles.buttonWrap2}>
            <Button
              innerText={`${btnConfirmTitle}`}
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
