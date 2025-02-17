import React, { FC } from 'react';
import Button from '../../../ReusableComponents/button';
import styles from './errorPopup.module.scss';
import { useAppDispatch } from '../../../../redux/hooks';
import { openErrorPopUp } from '../../../../redux/actions/timeLineAction';
import { IErrorPopUpParam } from '../../../../redux/ts/intrefaces/timeLine';
import DateUtils from '../../../../helper/dateUtils';
import { useSelector } from 'react-redux';
import { getTimeFormat } from '../../../../redux/selectors/timeLineSelector';
import { useHotkeys } from 'react-hotkeys-hook';
import { Key } from 'ts-key-enum';
import { Cross } from '../../../../static/svg';

let list: string[] = [];

const ErrorPopup: FC<IErrorPopUpParam> = ({ data }) => {
  const dispatch = useAppDispatch();
  const timeFormat = useSelector(getTimeFormat);

  const onClose = () => {
    dispatch(openErrorPopUp({ isOpen: false, data: '' }));
  };

  const generateListOfExceptions = () => {
    list = [];
    data.split(/\r?\n/).forEach(item => {
      list.push(item);
    });
  };

  generateListOfExceptions();

  useHotkeys([Key.Escape, Key.Enter], onClose, { preventDefault: true }, [onClose]);

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <div className={styles.header}>
          <span>{`Error`}</span>
          <Cross onClick={onClose} />
        </div>
        <div className={styles.body}>
          <div className={styles.itemsWrapper}>
            {list.map((item, index) => {
              return (
                <div key={index} className={styles.wrapper}>
                  <div className={styles.errorIcon}></div>
                  <div className={styles.mainSpan}>{DateUtils.parseStringAndConvertDate(item, timeFormat)}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className={styles.footer}>
          <div className={styles.buttonWrap1}>
            <Button
              innerText={'Got it'}
              click={onClose}
              style={{ background: '#FFFFFF', color: '#5D6472', border: '0.5px solid #BCC4C8', borderRadius: '4px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorPopup;
