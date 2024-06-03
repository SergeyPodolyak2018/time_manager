import '../../NewShiftMenu/TimePicker.css';

import React, { FC, useEffect, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useSelector } from 'react-redux';
import { TimePickerValue } from 'react-time-picker';
import useStateRef from 'react-usestateref';

import restApi from '../../../../../api/rest';
import { SchStateType } from '../../../../../common/constants/schedule';
import {
    DeleteMultipleHotKeys
} from '../../../../../common/constants/schedule/hotkeys/deleteMultiple';
import { ISite } from '../../../../../common/interfaces/config';
import { ITimezone } from '../../../../../common/interfaces/config/ITimezone';
import { ICfgTimeOff } from '../../../../../common/models/cfg.timeOff';
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
import styles from '../../InsertTimeOffMenu/menu.module.scss';
import styles2 from '../menu.module.scss';

export interface IInsertTimeOffMenuProps {
  onclose: (...args: any[]) => void;
  onReturn: (...args: any[]) => void;
  apply: (...args: any[]) => void;
  checkedItems: ISelected;
  dateRange: string[];
  insertOnlyErrorsOrWarning: boolean;
  showWarnings: boolean;
  siteId: number;
  buId: number;
  siteTzId: number;
  isDelete?: boolean;
  showNextBtn?: boolean;
  itemsStartTime?: string;
  itemsEndTime?: string;
  itemsNextEndDay?: boolean;
  snapshotId: string;
  hasNoShowAll?: boolean;
  selectedTz: ITimezone;
  loading: boolean;
  visible: boolean;
}

const InsertTimeOffMenu: FC<IInsertTimeOffMenuProps> = ({
  onclose,
  onReturn,
  apply,
  showNextBtn,
  checkedItems,
  dateRange,
  insertOnlyErrorsOrWarning,
  showWarnings,
  buId,
  siteId,
  isDelete,
  itemsStartTime,
  itemsEndTime,
  itemsNextEndDay,
  snapshotId,
  hasNoShowAll,
  selectedTz,
  loading,
  visible,
}) => {
  const timeFormat = useSelector(getTimeFormat);
  const activeDate = useSelector(getActiveDateSelector);

  const [isFullDay] = useStateRef<boolean>(false);
  const [, setIsLoading, isLoadingRef] = useStateRef<boolean>(true);
  const [items, setItem] = useState<ICfgTimeOff[]>([]);
  const [isShowAll, setIsShowAll] = useState<boolean>(true);
  const [allItems, setAllItem] = useState<ICfgTimeOff[]>([]);
  const [selectedItems, setSelectedItems, selectedItemsRef] = useStateRef<number[]>([]);
  const [, setIsSpecifyStartEnd, isSpecifyStartEndRef] = useStateRef<boolean>(true);
  const [, setIsFullDay, isFullDayRef] = useStateRef<boolean>(false);
  const [, setIsSpecifyPaid, isSpecifyPaidRef] = useStateRef<boolean>(false);
  const [isNextStartDay, setIsNextStartDay] = useState<boolean>(false);
  const [isNextEndDay, setIsNextEndDay] = useState<boolean>(false);
  const [, setMemo, memoRef] = useStateRef<string>('');
  const [, setPaidHours, paidHoursRef] = useStateRef<string>('00:00');
  const [, setStartTime, startTimeRef] = useStateRef<string>('12:00');
  const [, setEndTime, endTimeRef] = useStateRef<string>('12:30');
  const [isValid, setIsValid] = useState<boolean>(true);
  const [limits, setLimits] = useStateRef<ITimeLimit>({});

  interface IFindTimOfPayload {
    [key: string]: number[];
  }

  const initTimeOffList = async (showAll: boolean) => {
    if(visible){
      const keys = Object.keys(checkedItems);
      const payload: IFindTimOfPayload = {};
      if (!showAll) {
        for (const i of keys) {
          if (i !== 'agentId') {
            if (checkedItems[i as keyof typeof checkedItems] && checkedItems[i as keyof typeof checkedItems].length > 0) {
              payload[i] = checkedItems[i as keyof typeof checkedItems];
            }
          }
        }
      } else {
        payload['buId'] = [buId];
        payload['siteId'] = [siteId];
      }

      const timeOffs = await restApi.findTimeOffs(payload).then(res => {
        return res.data.filter(timeOff => {
          const siteId = Array.isArray(timeOff.siteId) ? timeOff.siteId : [timeOff.siteId];
          const buId = Array.isArray(timeOff.buId) ? timeOff.buId : [timeOff.buId];
          if (!showAll) return payload.siteId.every(id => siteId.includes(id));
          return payload.buId.every(id => buId.includes(id));
        });
      });

      setAllItem(showAll ? timeOffs : []);

      setItem(!showAll ? timeOffs : []);
    }
    
  };

  useEffect(() => {
    setIsLoading(true);
    initTimeOffList(isShowAll);
    setIsSpecifyStartEnd(true);
    setIsLoading(false);
  }, [checkedItems, isShowAll, visible]);

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

    setSelectedItems(newSelectedItems);
  };
  // endregion

  const onClickShowAll = () => {
    setIsShowAll(!isShowAll);
    setSelectedItems([]);
  };

  const onClickedSpecifyPaid = () => {
    if (isSpecifyPaidDisabled() || isLoadingRef.current) return;
    setIsSpecifyPaid(!isSpecifyPaidRef.current);
  };

  const onClickIsFullDay = () => {
    if (isLoadingRef.current) return;
    setIsSpecifyStartEnd(isFullDayRef.current);
    setIsFullDay(!isFullDayRef.current);
  };

  const onClickNextStartDay = () => {
    if (!isSpecifyStartEndRef.current || isLoadingRef.current) return;
    setLimits({ ...limits, isNextStartDay: !isNextStartDay });
    setIsNextStartDay(!isNextStartDay);
  };

  const onClickNextEndDay = () => {
    if (!isSpecifyStartEndRef.current || isLoadingRef.current) return;
    setLimits({ ...limits, isNextEndDay: !isNextEndDay });
    setIsNextEndDay(!isNextEndDay);
  };

  const onChangePaidHours = (value: TimePickerValue) => {
    setPaidHours(value.toString());
  };

  const onChangeStartTime = (value: TimePickerValue) => {
    setStartTime(value.toString());
  };

  const onClickSpecifyStartEnd = () => {
    if (!isFullDayRef.current) return;
    setIsSpecifyStartEnd(!isSpecifyStartEndRef.current);
  };

  const onChangeEndTime = (value: TimePickerValue) => {
    setEndTime(value.toString());
  };

  const onChangeMemo = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setMemo(e.currentTarget.value);
  };

  const getSites = (item: any): string => {
    const sites: [string | number, ISite][] = item.siteInfo ? Object.entries(item.siteInfo) : [];
    return sites.map(([, v]) => v.name).join(', ');
  };

  const isSpecifyPaidDisabled = (): boolean => {
    const list = isShowAll ? allItems : items;
    return !selectedItems.length || !(list.length && list[selectedItems[0]].isPaid) || !isFullDayRef.current;
  };

  const onValidate = (msg: string | null) => {
    setIsValid(!msg);
  };

  const saveChanges = () => {
    const filterAgents = checkedItems;
    // const targetType = SchUtils.getTargetElements(filterAgents);
    const datesFullRange: string[] =
      dateRange.length === 2 && dateRange[0] === dateRange[1] ? [dateRange[0]] : dateRange;
    const repeatRequestForData = datesFullRange.indexOf(activeDate) > -1;

    const item = isShowAll ? allItems[selectedItems[0]] : items[selectedItems[0]];
    const formData = {
      item,
      startTime: startTimeRef.current,
      endTime: endTimeRef.current,
      paidHours: paidHoursRef.current,
      isSpecifyStartEn: isSpecifyStartEndRef.current,
      isSpecifyPaid: isSpecifyPaidRef.current,
      isNextStartDay,
      isNextEndDay,
      isFullDay: isFullDayRef.current,
      memo: memoRef.current,
    };
    let states: any[];
    if (isDelete) {
      const ids = isShowAll
        ? selectedItemsRef.current.map(index => allItems[index].id)
        : selectedItemsRef.current.map(index => items[index].id);
      states = SchMultipleItems.prepareStatesForDeleteMultiple(
        SchStateType.TIME_OFF,
        ids,
        datesFullRange,
        itemsStartTime,
        itemsEndTime,
        itemsNextEndDay,
      );
    } else {
      states = SchMultipleItems.prepareDataForNewMultipleTimeOff(
        formData,
        datesFullRange,
        !isSpecifyStartEndRef.current,
      );
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

  const onClose = () => {
    onclose();
  };

  const getView = () => {
    return (
      <>
        <div
          className={styles.tableWrapper}
          style={{ width: '680px', height: isDelete ? '525px' : '212px', overflowY: 'auto' }}
        >
          {isLoadingRef.current ? (
            <Spiner />
          ) : (
            <>
              <div className={styles.tableSubWrapper}>
                <table>
                  <thead>
                    <tr>
                      <td>
                        <span>Time-Off Types</span>
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
                        <span>Counts</span>
                      </td>
                    </tr>
                  </thead>
                  <tbody>
                    {(isShowAll ? allItems : items).map((el, index) => {
                      return (
                        <tr
                          key={index}
                          onClick={e => selectItems(e, index)}
                          className={`${selectedItems.includes(index) ? styles.selected : ''}`}
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
                            <span className={styles.sthTd}>
                              <CheckboxBig icon={'mark'} checked={el.isHasLimit} />
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {hasNoShowAll && (
                <div data-test={'time-off-show-all'} className={`${styles.checkBoxWrap2} ${styles.showAll}`}>
                  <Checkbox
                    checked={isShowAll}
                    onClick={onClickShowAll}
                    disabled={isLoadingRef.current}
                    style={{ width: '10px', height: '10px', border: '#BCC4C8 solid 1px' }}
                  />
                  <span>Show all</span>
                </div>
              )}
            </>
          )}
        </div>
        {isDelete ? (
          ' '
        ) : (
          <div>
            <div className={styles.options_1st}>
              <div className={`${styles.checkBoxWrap}`}>
                <Checkbox
                  checked={isFullDayRef.current}
                  onClick={onClickIsFullDay}
                  disabled={isLoadingRef.current}
                  style={{ width: '10px', height: '10px' }}
                  dataTest="full-day-checkbox"
                />
                <span>Full day</span>
              </div>
              <div
                className={`${styles.checkBoxWrap}  ${isSpecifyPaidDisabled() ? styles.disabled : ''}`}
                data-test={'specify-paid-hours-checkbox'}
              >
                <Checkbox
                  checked={isSpecifyPaidRef.current}
                  onClick={onClickedSpecifyPaid}
                  style={{
                    width: '10px',
                    height: '10px',
                    border: isSpecifyPaidDisabled() ? '#BCC4C8 solid 1px' : null,
                    cursor: !isSpecifyPaidDisabled() ? 'point' : 'default',
                  }}
                  dataTest="specify-paid-hours-checkbox"
                  disabled={isSpecifyPaidDisabled() || isLoadingRef.current}
                />
                <span>Specify paid hours</span>
                {/*</div>*/}
                {/*<div className={styles.dataStart}>*/}
                <div className={styles.dataSpecifyTMWrapper}>
                  <InputTimeShort
                    onChange={onChangePaidHours}
                    defaultTime={paidHoursRef.current}
                    isEndTime={true}
                    disabled={!isSpecifyPaidRef.current || isLoadingRef.current}
                    onValidate={onValidate}
                    is0Forbidden={true}
                  />
                </div>
              </div>
            </div>

            <div className={styles.options_1st}>
              <div className={`${styles.checkBoxWrap} ${isFullDay ? styles.disabled : ''}`}>
                <Checkbox
                  onClick={onClickSpecifyStartEnd}
                  checked={isSpecifyStartEndRef.current}
                  style={{
                    width: '10px',
                    height: '10px',
                    cursor: !isFullDayRef.current ? 'point' : 'default',
                  }}
                  dataTest="specify-start-end-checkbox"
                  disabled={isLoadingRef.current || !isFullDayRef.current}
                />
                <span onClick={onClickSpecifyStartEnd}>Specify start/end</span>
              </div>
            </div>
            <div className={styles.options_2nd} style={{ height: '90px' }}>
              <div className={styles.dataStart}>
                <div className={timeFormat === '24hours' ? styles.dataStartTMWrapper : styles.dataStartTMWrapperBigger}>
                  <InputTime
                    onChangeStartTime={onChangeStartTime}
                    onChangeEndTime={onChangeEndTime}
                    startTime={startTimeRef.current}
                    endTime={endTimeRef.current}
                    format={timeFormat}
                    disabled={!isSpecifyStartEndRef.current || isLoadingRef.current}
                    limits={limits}
                    onValidate={onValidate}
                  />
                </div>
              </div>
              <div className={styles.checkBoxWrap3} data-test={'next-day-start-checkbox'}>
                <Checkbox
                  checked={isNextStartDay}
                  onClick={() => onClickNextStartDay()}
                  style={{
                    height: '10px',
                    width: '10px',
                    border: !isSpecifyStartEndRef.current ? '#BCC4C8 solid 1px' : null,
                    cursor: isSpecifyStartEndRef.current ? 'point' : 'default',
                  }}
                  disabled={!isSpecifyStartEndRef.current || isLoadingRef.current}
                  dataTest="next-start-day-checkbox"
                />
                <span
                  className={!isSpecifyStartEndRef.current ? styles.disabled : ''}
                  onClick={() => onClickNextStartDay()}
                >
                  Start next day
                </span>
              </div>
              <div className={styles.checkBoxWrap3} data-test={'next-day-end-checkbox'}>
                <Checkbox
                  checked={isNextEndDay}
                  onClick={() => onClickNextEndDay()}
                  style={{
                    height: '10px',
                    width: '10px',
                    border: !isSpecifyStartEndRef.current ? '#BCC4C8 solid 1px' : null,
                    cursor: isSpecifyStartEndRef.current ? 'point' : 'default',
                  }}
                  disabled={!isSpecifyStartEndRef.current || isLoadingRef.current}
                  dataTest="next-end-day-checkbox"
                />
                <span
                  className={!isSpecifyStartEndRef.current ? styles.disabled : ''}
                  onClick={() => onClickNextEndDay()}
                >
                  End next day
                </span>
              </div>
            </div>
            <div className={styles.memoWrap} style={{ height: '139px' }}>
              <div className={styles.subHeader}>
                <span>Memo:</span>
              </div>
              <div className={styles.memoContainer}>
                <textarea name="memo" placeholder="Text here" onChange={onChangeMemo} value={memoRef.current} />
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  if (!visible) return null;
  return (
    <div className={styles.formWrapper} style={{ width: '740px', height: '721px' }}>
      <div className={styles.header}>
        <span>{`${isDelete ? 'Delete' : 'Insert'} ${isFullDay ? 'Full-Day ' : ''}Time Off`}</span>
        <Cross onClick={onClose} />
      </div>
      <div className={styles.body}>{getView()}</div>

      <div className={styles2.footer}>
        <div className={styles2.buttonWrap1}>
          <Button
            innerText={'Cancel'}
            click={onClose}
            disable={loading || isLoadingRef.current}
            style={{ background: '#FFFFFF', color: '#0183F5', border: '0.5px solid #0183F5', borderRadius: '5px' }}
          />
        </div>
        <div className={styles2.buttonWrap5}>
          <Button
            innerText={'< Return'}
            click={() => {
              onReturn(2);
            }}
            disable={loading || isLoadingRef.current}
            type={'primary'}
          />
        </div>

        <div className={styles2.buttonWrap2}>
          <Button
            innerText={showNextBtn ? 'Next >' : isDelete ? 'Cleanup' : 'Publish'}
            click={saveChanges}
            disable={!isValid || !selectedItems.length || loading || isLoadingRef.current}
            type={'primary'}
            isSaveButton={true}
          />
        </div>
      </div>
    </div>
  );
};

export default InsertTimeOffMenu;
