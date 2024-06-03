import React, { FC } from 'react';
import { useSelector } from 'react-redux';

import { usePopUpHotkeys } from '../../../../hooks';
import {
    closeModifiedWarning, getAgentsSchedule, saveAgentDay
} from '../../../../redux/actions/timeLineAction';
import { useAppDispatch } from '../../../../redux/hooks';
import { getModifiedData } from '../../../../redux/selectors/timeLineSelector';
import Button from '../../../ReusableComponents/button';
import styles from './confirmation.module.scss';
import { Cross } from '../../../../static/svg';

const ScheduleModifiedPopup: FC = () => {
  const dispatch = useAppDispatch();
  const modifiedData = useSelector(getModifiedData);

  const handleClickSave = async (e: React.MouseEvent | KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      dispatch(closeModifiedWarning());
      await dispatch(
        saveAgentDay({
          agents: modifiedData,
          ignoreWarnings: false,
          checkTimestamp: false,
          reviewWarningsType: 'full',
        }),
      );
    } catch (err: any) {
      // return alert(err.message);
    }
  };

  const handleDiscardBtn = async () => {
    dispatch(closeModifiedWarning());
    await dispatch(getAgentsSchedule());
  };

  const handleClickCloseBtn = () => {
    dispatch(closeModifiedWarning());
  };

  usePopUpHotkeys({ onSubmit: [handleClickSave], onCancel: [handleClickCloseBtn] });

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <div className={styles.header}>
          <span>Save changes?</span>
          <Cross onClick={handleClickCloseBtn} />
        </div>

        <div className={styles.body}>
          <span className={styles.text1}>Agent Day Schedule was modified by another user.</span>
          <span className={styles.text2}>Do you want to publish or discard your changes?</span>
        </div>

        <div className={styles.footer}>
          <div className={styles.buttonWrap1}>
            <Button
              innerText={'Discard'}
              click={handleDiscardBtn}
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

export default ScheduleModifiedPopup;
