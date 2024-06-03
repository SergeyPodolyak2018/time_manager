import React, { FC } from 'react';
import { ReactComponent as Cross } from '../assets/cross.svg';
import styles from '../../InsertTimeOffMenu/menu.module.scss';
import styles2 from '../menu.module.scss';
import '../../NewShiftMenu/TimePicker.css';
import Button from '../../../../ReusableComponents/button';
import { IDataByType } from '../dataByType';

interface IEditMultipleProps {
  onClose: () => void;
  onReturn: () => void;
  onSave: () => void;
  isSaveDisable: boolean;
  children?: any;
  dataByType: IDataByType;
}

const WizardLayout: FC<IEditMultipleProps> = ({ onClose, onReturn, onSave, children, isSaveDisable, dataByType }) => {
  const saveChanges = () => {
    onSave();
  };

  return (
    <div className={styles.formWrapper} style={{ width: dataByType.width, height: '721px' }}>
      <div className={styles.header}>
        <span>{dataByType.title}</span>
        <Cross onClick={onClose} />
      </div>
      <div className={styles.body}>{children}</div>

      <div className={styles2.footer}>
        <div className={styles2.buttonWrap1}>
          <Button
            innerText={'Cancel'}
            click={onClose}
            style={{ background: '#FFFFFF', color: '#0183F5', border: '0.5px solid #0183F5', borderRadius: '5px' }}
          />
        </div>
        <div className={styles2.buttonWrap5}>
          <Button
            innerText={'< Return'}
            click={() => {
              onReturn();
            }}
            type={'primary'}
          />
        </div>

        <div className={styles2.buttonWrap2}>
          <Button
            innerText={'Apply'}
            click={() => {
              saveChanges();
            }}
            disable={isSaveDisable}
            style={{ background: '#0183F5', color: '#FFFFFF', borderRadius: '5px' }}
            isSaveButton={true}
          />
        </div>
      </div>
    </div>
  );
};

export default WizardLayout;
