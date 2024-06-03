import React, { FC } from 'react';
import Button from '../../../ReusableComponents/button';
import styles from './warningPopup.module.scss';
import { useAppDispatch } from '../../../../redux/hooks';
import {
  buildAgentDayInSnapshot,
  openWarningPopUp,
  setDataToStore,
  toggleLoader,
} from '../../../../redux/actions/timeLineAction';
import { IWarningPopUpParam } from '../../../../redux/ts/intrefaces/timeLine';
import DateUtils from '../../../../helper/dateUtils';
import { useSelector } from 'react-redux';
import { getDataSelector, getTimeFormat } from '../../../../redux/selectors/timeLineSelector';
import { useHotkeys } from 'react-hotkeys-hook';
import { Key } from 'ts-key-enum';
import { Cross } from '../../../../static/svg';
import { toggleChartLoader } from '../../../../redux/actions/ChartActions';
import useStateRef from 'react-usestateref/dist';

let list: string[] = [];

const WarningPopup: FC<IWarningPopUpParam> = (props) => {
  const {
    data ,
    agents,
    onApplyAction,
    rerender,
    scheduleShiftItems = false,
    isSaveSelected = false,
    refreshTimeline = true,
    ignoreWarnings = true
  } = props;
  const dispatch = useAppDispatch();
  const timeFormat = useSelector(getTimeFormat);
  const existingAgents = useSelector(getDataSelector);
  const [, setIsDiscard, isDiscardRef] = useStateRef(true);

  const onClose = () => {
    if (rerender && isDiscardRef.current) {
      dispatch(toggleLoader(false));
      dispatch(toggleChartLoader(false));
      dispatch(
        setDataToStore({ agents: existingAgents, isMerge: false, isSaveToHistory: false, isSaveSelected: true }),
      );
      dispatch(openWarningPopUp({ isOpen: false, data: 'discard', agents: [], discard: true }));
    } else {
      dispatch(openWarningPopUp({ isOpen: false, data: '', agents: []}));
    }
  };

  const onApply = () => {
    setIsDiscard(false)
    if (onApplyAction) {
      onApplyAction();
      onClose();
    } else {
      dispatch(buildAgentDayInSnapshot(
        { modifiedAgentDays: agents },
        scheduleShiftItems,
        isSaveSelected,
        refreshTimeline,
        ignoreWarnings
      )).then(() => onClose());
    }
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
          <span>{`Warning`}</span>
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
        <div>{agents ? '' : ''}</div>
        <div className={styles.footer}>
          <div className={styles.buttonWrap1}>
            <Button
              innerText={'Cancel'}
              click={onClose}
              style={{ background: '#FFFFFF', color: '#5D6472', border: '0.5px solid #BCC4C8', borderRadius: '4px' }}
            />
          </div>
          <div className={styles.buttonWrap1}>
          <Button
            innerText={'Confirm'}
            click={onApply}
            style={{ background: '#006fcf', color: 'rgb(255 255 255)', border: '0.5px solid #BCC4C8', borderRadius: '4px' }}
          />
        </div>
        </div>
      </div>
    </div>
  );
};

export default WarningPopup;
