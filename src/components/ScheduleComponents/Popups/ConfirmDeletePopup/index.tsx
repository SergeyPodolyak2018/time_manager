import React, { FC, useMemo } from 'react';
import styles from './menu.module.scss';
import Button from '../../../ReusableComponents/button';
import { clearBuffer } from '../../../../redux/actions/timeLineAction';
import { useAppDispatch } from '../../../../redux/hooks';
import { useSelector } from 'react-redux';
import { getBuffer, getSelectedAgentSelector } from '../../../../redux/selectors/timeLineSelector';
import { ISelectedActivity } from '../../../../redux/ts/intrefaces/timeLine';
import { SCH_STATE_TYPE } from '../../../../common/constants';
import { SchStateType } from '../../../../common/constants/schedule';
import { useHotkeys } from 'react-hotkeys-hook';
import { TimelineHotKeys } from '../../../../common/constants/schedule/hotkeys/timeline';
import { Cross } from '../../../../static/svg';

export interface IConfirmDeleteProps {
  onClickSubmit: () => void;
  onClickClose: () => void;
  activitiesToDelete?: ISelectedActivity[];
}

const ConfirmDeletePopup: FC<IConfirmDeleteProps> = ({ onClickSubmit, onClickClose, activitiesToDelete = [] }) => {
  const dispatch = useAppDispatch();
  const selectedAgents = useSelector(getSelectedAgentSelector);
  const buffer = useSelector(getBuffer);

  const getDeleteText = (activitiesToDelete: ISelectedActivity[]) => {
    if (!activitiesToDelete.length) {
      return `Do you really want to clear the day of ${selectedAgents[0].agentName}`;
    }

    const length = activitiesToDelete.length;
    const plural = length > 1 ? 's' : '';
    const countText = length > 1 ? `${length} ` : '';
    const { type } = activitiesToDelete[0];

    if (type === SCH_STATE_TYPE[SchStateType.SHIFT]) {
      const article = length > 1 ? 'these' : 'this';
      return `Do you really want to delete ${article} ${countText}shift${plural}?`;
    }

    return `Do you really want to delete ${countText} "${activitiesToDelete[0].name}" item${plural}?`;
  };

  const handleClickDelete = (e: React.MouseEvent | KeyboardEvent) => {
    if (buffer?.elements) {
      dispatch(clearBuffer());
    }
    e.preventDefault();
    e.stopPropagation();
    onClickSubmit();
  };

  const handleClickCloseBtn = () => {
    onClickClose();
  };

  useHotkeys(TimelineHotKeys.MODAL_AGREE, handleClickDelete, [
    handleClickDelete,
    { preventDefault: true, stopPropagation: true },
  ]);

  useHotkeys(TimelineHotKeys.ESCAPE, handleClickCloseBtn, [
    handleClickCloseBtn,
    { preventDefault: true, stopPropagation: true },
  ]);

  const deleteText = useMemo(() => getDeleteText(activitiesToDelete), [activitiesToDelete]);

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <div className={styles.header}>
          <span>Are you sure?</span>
          <Cross onClick={handleClickCloseBtn} />
        </div>
        <div className={styles.type}>
          <div className={styles.typeWrapper2}>
            <span className={styles.typeWrapper2Content}>{deleteText}</span>
          </div>
          {/*<div className={styles.typeWrapper2}>*/}
          {/*  <span>Names: </span>*/}
          {/*  {selectedActivities.map((element, index) => {*/}
          {/*    return (*/}
          {/*      <span className={styles.typeWrapper1Content} key={index}>*/}
          {/*        {element.name}*/}
          {/*      </span>*/}
          {/*    );*/}
          {/*  })}*/}
          {/*</div>*/}
        </div>

        <div className={styles.footer}>
          <div className={styles.buttonWrap1}>
            <Button
              innerText={'Cancel'}
              click={() => handleClickCloseBtn()}
              style={{ background: '#FFFFFF', color: '#006FCF', border: '0.5px solid #0183F5', borderRadius: '5px' }}
            />
          </div>

          <div className={styles.buttonWrap2}>
            <Button
              innerText={'Delete'}
              click={handleClickDelete}
              style={{ background: '#EB5757', color: '#FFFFFF', borderRadius: '5px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
export default ConfirmDeletePopup;
