import '../../NewShiftMenu/TimePicker.css';

import React, { FC, useEffect, useMemo, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useSelector } from 'react-redux';
import { TimePickerValue } from 'react-time-picker';
import useStateRef from 'react-usestateref';

import restApi from '../../../../../api/rest';
import { IFindShiftItemsPayload } from '../../../../../api/ts/interfaces/config.payload';
import { SchStateType } from '../../../../../common/constants/schedule';
import {
    DeleteMultipleHotKeys
} from '../../../../../common/constants/schedule/hotkeys/deleteMultiple';
import { ISite } from '../../../../../common/interfaces/config';
import { ITimezone } from '../../../../../common/interfaces/config/ITimezone';
import { ICfgException } from '../../../../../common/models/cfg.exeption';
import SchMultipleItems from '../../../../../helper/schedule/SchMultipleItems';
import { ISelected } from '../../../../../helper/schedule/SchUtils';
import { getActiveDateSelector } from '../../../../../redux/selectors/controlPanelSelector';
import { getTimeFormat } from '../../../../../redux/selectors/timeLineSelector';
import { Cross } from '../../../../../static/svg';
import Button from '../../../../ReusableComponents/button';
import CheckboxBig from '../../../../ReusableComponents/Checkbox';
import Checkbox from '../../../../ReusableComponents/CheckboxStyled';
import InputTime, { ITimeLimit } from '../../../../ReusableComponents/InputTime';
import InputTimeShort from '../../../../ReusableComponents/InputTimeChort';
import Spiner from '../../../../ReusableComponents/spiner';
import styles from '../../InsertExceptionMenu/menu.module.scss';
import styles2 from '../menu.module.scss';

export interface IInsertExceptionMenuProps {
  onClose: (...args: any[]) => void;
  onReturn: (...args: any[]) => void;
  apply: (...args: any[]) => void;
  checkedItems: ISelected;
  dateRange: string[];
  insertOnlyErrorsOrWarning: boolean;
  showWarnings: boolean;
  siteId: number;
  siteTzId: number;
  isDelete?: boolean;
  showNextBtn?: boolean;
  itemsStartTime?: string;
  itemsEndTime?: string;
  itemsNextEndDay?: boolean;
  snapshotId: string;
  selectedTz: ITimezone;
  loading: boolean;
  visible: boolean;
}

const InsertExceptionMenu: FC<IInsertExceptionMenuProps> = ({
  onClose,
  onReturn,
  apply,
  checkedItems,
  dateRange,
  insertOnlyErrorsOrWarning,
  showWarnings,
  isDelete,
  showNextBtn,
  itemsStartTime,
  itemsEndTime,
  itemsNextEndDay,
  snapshotId,
  selectedTz,
  loading,
  visible,
}) => {
  const timeFormat = useSelector(getTimeFormat);
  const activeDate = useSelector(getActiveDateSelector);

  /* eslint-disable @typescript-eslint/no-unused-vars */
  const [isFullDay, ,] = useStateRef<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [items, setItem] = useState<ICfgException[]>([]);
  const [, setSelectedItems, selectedItemsRef] = useStateRef<number[]>([]);
  const [, setMemo, memoRef] = useStateRef<string>('');
  const [, setIsSpecifyPaid, isSpecifyPaidRef] = useStateRef<boolean>(false);
  const [, setIsSpecifyStartEnd, isSpecifyStartEndRef] = useStateRef<boolean>(true);
  const [isNextStartDay, setIsNextStartDay] = useState<boolean>(false);
  const [, setIsNextEndDay, isNextEndDayRef] = useStateRef<boolean>(true);
  const [, setPaidHours, paidHoursRef] = useStateRef<string>('00:00');
  const [, setStartTime, startTimeRef] = useStateRef<string>('00:00');
  const [, setEndTime, endTimeRef] = useStateRef<string>('00:00');
  const [isValid, setIsValid] = useState<boolean>(true);
  const [limits, setLimits] = useStateRef<ITimeLimit>({
    isNextEndDay: true,
  });

  interface IFindExceptionload {
    [key: string]: number[];
  }

  const initExceptionList = async () => {
    if(visible){
      const keys = Object.keys(checkedItems);
      const payload: IFindExceptionload = {};
      for (const i of keys) {
        if (i !== 'agentId') {
          if (checkedItems[i as keyof typeof checkedItems] && checkedItems[i as keyof typeof checkedItems].length > 0) {
            payload[i] = checkedItems[i as keyof typeof checkedItems];
          }
        }
      }

      const resp = await restApi.findExceptions(payload as IFindShiftItemsPayload);
      const updatedList = filterExceptions(resp.data, checkedItems.siteId);
      setItem(updatedList);
      setIsLoading(false);
    }
    
  };

  useEffect(() => {
    if (isLoading) {
      //setIsSpecifyStartEnd(false);
      initExceptionList();
    }
  }, [checkedItems, visible]);

  // select region
  const selectAll = () => {
    if (!isDelete) return;
    const indexArr = items.map((item, index) => index);
    setSelectedItems(indexArr);
  };
  useHotkeys(DeleteMultipleHotKeys.SELECT_ALL, selectAll, { preventDefault: true });

  const selectItems = (e: React.MouseEvent, index: number) => {
    const newSelectedItems = isDelete
      ? SchMultipleItems.selectMultiple(e, index, selectedItemsRef.current)
      : SchMultipleItems.selectSingle(index, selectedItemsRef.current);

    if (!isDelete) {
      const selectedException = items[index];
      setIsSpecifyStartEnd(!selectedException.isFullDay);
    }
    setSelectedItems(newSelectedItems);
  };
  // endregion

  const filterExceptions = (exceptions: ICfgException[], sitelist: number[]): ICfgException[] => {
    const filteredList = exceptions.filter(el => {
      const difference = sitelist.filter(x => !el.siteId.includes(x));
      return difference.length === 0;
    });
    return filteredList;
  };

  const onClickSpecifyStartEnd = () => {
    if (isSpecifyStartEndDisabled) return;
    setIsSpecifyStartEnd(!isSpecifyStartEndRef.current);
  };

  const onClickedSpecifyPaid = () => {
    if (isSpecifyPaidDisabled) return;
    setIsSpecifyPaid(!isSpecifyPaidRef.current);
  };

  const isSpecifyPaidDisabled = useMemo(() => {
    return (
      !selectedItemsRef.current.length ||
      !(items.length && items[selectedItemsRef.current[0]].isPaid && items[selectedItemsRef.current[0]].isFullDay)
    );
  }, [selectedItemsRef.current, items]);

  const isSpecifyStartEndDisabled = useMemo(() => {
    const selectedException = items[selectedItemsRef.current[0]];
    return !selectedItemsRef.current.length || !selectedException.isFullDay;
  }, [selectedItemsRef.current, items]);

  const onClickNextStartDay = () => {
    if (!isSpecifyStartEndRef.current) return;
    setLimits({ ...limits, isNextStartDay: !isNextStartDay });
    setIsNextStartDay(!isNextStartDay);
  };

  const onClickNextEndDay = () => {
    if (!isSpecifyStartEndRef.current) return;
    setLimits({ ...limits, isNextEndDay: !isNextEndDayRef.current });
    setIsNextEndDay(!isNextEndDayRef.current);
  };

  const onChangePaidHours = (value: TimePickerValue) => {
    setPaidHours(value.toString());
  };

  const onChangeStartTime = (value: TimePickerValue) => {
    setStartTime(value.toString());
  };

  const onChangeEndTime = (value: TimePickerValue) => {
    setEndTime(value.toString());
  };

  const onChangeMemo = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setMemo(e.currentTarget.value);
  };

  const getSites = (item: ICfgException): string => {
    if ('siteInfo' in item) {
      // @ts-ignore
      return item.siteInfo.map(v => v.name).join(', ');
    }
    const sites: [string | number, ISite][] = item.sites ? Object.entries(item.sites) : [];
    return sites.map(([, v]) => v.name).join(', ');
  };

  const onValidate = (msg: string | null) => {
    setIsValid(!msg);
  };

  const saveChanges = () => {
    const filterAgents = checkedItems;

    const datesFullRange: string[] =
      dateRange.length === 2 && dateRange[0] === dateRange[1] ? [dateRange[0]] : dateRange;
    const repeatRequestForData = datesFullRange.indexOf(activeDate) > -1;

    const item = items[selectedItemsRef.current[0]];
    const formData = {
      item,
      startTime: startTimeRef.current,
      endTime: endTimeRef.current,
      paidHours: paidHoursRef.current,
      isSpecifyStartEn: isSpecifyStartEndRef.current,
      isSpecifyPaid: isSpecifyPaidRef.current,
      isNextStartDay,
      isNextEndDay: isNextEndDayRef.current,
      isFullDay: !isSpecifyStartEndRef.current,
      memo: memoRef.current,
    };
    let states: any[];
    if (isDelete) {
      const ids = selectedItemsRef.current.map(index => items[index].id);
      states = SchMultipleItems.prepareStatesForDeleteMultiple(
        SchStateType.EXCEPTION,
        ids,
        datesFullRange,
        itemsStartTime,
        itemsEndTime,
        itemsNextEndDay,
      );
    } else {
      states = SchMultipleItems.prepareDataForNewMultipleException(formData, datesFullRange);
    }

    const agentDays = SchMultipleItems.prepareTeamPlateInsertState(
      filterAgents,
      !showWarnings,
      insertOnlyErrorsOrWarning,
      true,
      states,
      !isSpecifyStartEndRef.current ? 0 : selectedTz.timezoneId,
      snapshotId,
    );
    apply('state', agentDays, repeatRequestForData);
  };

  const getView = () => {
    return (
      <div>
        <div
          className={styles.tableWrapper}
          style={{ width: '680px', height: isDelete ? '530px' : '212px', overflowY: 'auto' }}
        >
          {isLoading ? (
            <Spiner />
          ) : (
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <td>
                    <span>Exception</span>
                  </td>
                  <td>
                    <span>Short</span>
                  </td>
                  <td>
                    <span>Site</span>
                  </td>
                  <td>
                    <span>Paid</span>
                  </td>
                  <td>
                    <span>Convertible</span>
                  </td>
                  <td>
                    <span>Time off</span>
                  </td>
                  <td>
                    <span>Full day</span>
                  </td>
                </tr>
              </thead>
              <tbody>
                {items.map((el, index) => {
                  return (
                    <tr
                      key={index}
                      onClick={e => selectItems(e, index)}
                      className={`${selectedItemsRef.current.includes(index) ? styles.selected : ''}`}
                    >
                      <td>
                        <span title={el.name} className={styles.firstTd}>
                          {el.name}
                        </span>
                      </td>
                      <td>
                        <span title={el.shortName} className={styles.secTd}>
                          {el.shortName}
                        </span>
                      </td>
                      <td>
                        <span title={getSites(el)} className={styles.thrTd}>
                          {getSites(el)}
                        </span>
                      </td>
                      <td>
                        <span className={styles.fthTd}>
                          <CheckboxBig icon={'mark'} checked={el.isPaid} />
                        </span>
                      </td>
                      <td>
                        <span className={styles.vthTd}>
                          <CheckboxBig icon={'mark'} checked={el.isConvertable2dayOff} />
                        </span>
                      </td>
                      <td>
                        <span className={styles.vthTd}>
                          <CheckboxBig icon={'mark'} checked={el.isUsedAsVacation} />
                        </span>
                      </td>
                      <td>
                        <span className={styles.sthTd}>
                          <CheckboxBig icon={'mark'} checked={el.isFullDay} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {isDelete ? (
          ' '
        ) : (
          <div>
            <div className={styles.options_1st}>
              <div
                className={`${styles.checkBoxWrap}  ${isSpecifyPaidDisabled ? styles.disabled : ''}`}
                data-test={'specify-paid-hours-checkbox'}
              >
                <Checkbox
                  checked={isSpecifyPaidRef.current}
                  onClick={onClickedSpecifyPaid}
                  style={{
                    width: '10px',
                    height: '10px',
                    border: isSpecifyPaidDisabled ? '#BCC4C8 solid 1px' : null,
                    cursor: !isSpecifyPaidDisabled ? 'pointer' : 'default',
                  }}
                  disabled={isSpecifyPaidDisabled}
                />
                <span onClick={onClickedSpecifyPaid}>Specify paid hours</span>
                <div className={styles.dataSpecifyTMWrapper}>
                  <InputTimeShort
                    onChange={onChangePaidHours}
                    defaultTime={paidHoursRef.current}
                    isEndTime={true}
                    disabled={!isSpecifyPaidRef.current}
                    onValidate={onValidate}
                    is0Forbidden={true}
                  />
                </div>
              </div>
            </div>
            <div className={styles.options_1st}>
              <div
                className={`${styles.checkBoxWrap} ${isSpecifyStartEndDisabled ? styles.disabled : ''}`}
                data-test={'specify-start-end-checkbox'}
              >
                <Checkbox
                  onClick={onClickSpecifyStartEnd}
                  checked={isSpecifyStartEndRef.current}
                  style={{
                    width: '10px',
                    height: '10px',
                    cursor: !isSpecifyStartEndDisabled ? 'pointer' : 'default',
                  }}
                  disabled={isSpecifyStartEndDisabled}
                />
                <span onClick={onClickSpecifyStartEnd}>Specify start/end</span>
              </div>
            </div>
            <div className={styles.data}>
              <div className={styles.dataStart}>
                <div className={timeFormat === '24hours' ? styles.dataStartTMWrapper : styles.dataStartTMWrapperBigger}>
                  <InputTime
                    onChangeStartTime={onChangeStartTime}
                    onChangeEndTime={onChangeEndTime}
                    startTime={startTimeRef.current}
                    endTime={endTimeRef.current}
                    format={timeFormat}
                    disabled={!isSpecifyStartEndRef.current}
                    limits={limits}
                    onValidate={onValidate}
                  />
                </div>
              </div>
              <div
                className={`${styles.checkBoxWrap3}  ${!isSpecifyStartEndRef.current ? styles.disabled : ''}`}
                data-test={'next-day-start-checkbox'}
              >
                <Checkbox
                  checked={isNextStartDay}
                  onClick={() => onClickNextStartDay()}
                  style={{ height: '10px', width: '10px' }}
                  disabled={!isSpecifyStartEndRef.current}
                />
                <span onClick={() => onClickNextStartDay()}>Start next day</span>
              </div>
              <div
                className={`${styles.checkBoxWrap3}  ${!isSpecifyStartEndRef.current ? styles.disabled : ''}`}
                data-test={'next-day-end-checkbox'}
              >
                <Checkbox
                  checked={isNextEndDayRef.current}
                  onClick={() => onClickNextEndDay()}
                  style={{ height: '10px', width: '10px' }}
                  disabled={!isSpecifyStartEndRef.current}
                />
                <span onClick={() => onClickNextEndDay()}>End next day</span>
              </div>
            </div>
            <div className={styles.memoWrap}>
              <div className={styles.subHeader}>
                <span>Memo:</span>
              </div>
              <div className={styles.memoContainer}>
                <textarea name="memo" placeholder="Text here" onChange={onChangeMemo} value={memoRef.current} />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!visible) return null;
  return (
    <div className={styles.formWrapper} style={{ width: '740px', height: '721px' }}>
      <div className={styles.header}>
        <span>{`${isDelete ? 'Delete' : 'Insert'} Exception`}</span>
        <Cross onClick={onClose} />
      </div>
      <div className={styles.body}>{getView()}</div>

      <div className={styles2.footer}>
        <div className={styles2.buttonWrap1}>
          <Button
            innerText={'Cancel'}
            click={onClose}
            disable={loading || isLoading}
            style={{ background: '#FFFFFF', color: '#0183F5', border: '0.5px solid #0183F5', borderRadius: '5px' }}
          />
        </div>
        <div className={styles2.buttonWrap5}>
          <Button
            innerText={'< Return'}
            click={() => {
              onReturn(2);
            }}
            disable={loading || isLoading}
            type={'primary'}
          />
        </div>

        <div className={styles2.buttonWrap2}>
          <Button
            innerText={showNextBtn ? 'Next >' : isDelete ? 'Cleanup' : 'Publish'}
            click={() => {
              saveChanges();
            }}
            disable={!isValid || !selectedItemsRef.current.length || loading || isLoading}
            type={'primary'}
            isSaveButton={true}
          />
        </div>
      </div>
    </div>
  );
};

export default InsertExceptionMenu;
