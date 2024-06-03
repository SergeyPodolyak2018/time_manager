import React, { FC } from 'react';
import styles from '../../InsertTimeOffMenu/menu.module.scss';
import styles2 from '../menu.module.scss';
import '../../NewShiftMenu/TimePicker.css';
import Button from '../../../../ReusableComponents/button';
import { IDataByType } from '../dataByType';
import { useSelector } from 'react-redux';
import { getSaveWarnings } from '../../../../../redux/selectors/timeLineSelector';
import { Cross } from '../../../../../static/svg';

interface IEditMultipleProps {
  onClose: () => void;
  onReturn: () => void;
  onSave: () => void;
  isSaveDisable: boolean;
  children?: any;
  dataByType: IDataByType;
  setLoading: (isLoading: boolean) => void,
  loading: boolean;
}

const WizardLayout: FC<IEditMultipleProps> = ({
  onClose,
  onReturn,
  onSave,
  children,
  isSaveDisable,
  dataByType,
  setLoading,
  loading,
}) => {
  const saveWarnings = useSelector(getSaveWarnings);
  const saveChanges = () => {
    onSave();
  };

  return (
    <div
      className={styles.formWrapper}
      style={{ width: dataByType.width, height: '721px', display: saveWarnings.length ? 'none' : 'flex' }}
    >
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
            disabled={loading}
            style={{ background: '#FFFFFF', color: '#0183F5', border: '0.5px solid #0183F5', borderRadius: '5px' }}
          />
        </div>
        <div className={styles2.buttonWrap5}>
          <Button
            innerText={'< Return'}
            click={() => {
              onReturn();
            }}
            disabled={loading}
            type={'primary'}
          />
        </div>

        <div className={styles2.buttonWrap2}>
          <Button
            innerText={'Apply'}
            click={() => {
              setLoading(true);
              saveChanges();
            }}
            disable={isSaveDisable || loading}
            style={{ background: '#0183F5', color: '#FFFFFF', borderRadius: '5px' }}
            isSaveButton={true}
          />
        </div>
      </div>
    </div>
  );
};

export default WizardLayout;
