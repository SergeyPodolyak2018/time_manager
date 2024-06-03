import '../../NewShiftMenu/TimePicker.css';

import React, { FC, useEffect, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useSelector } from 'react-redux';
import useStateRef from 'react-usestateref';

import restApi from '../../../../../api/rest';
import { SchStateType } from '../../../../../common/constants/schedule';
import {
    DeleteMultipleHotKeys
} from '../../../../../common/constants/schedule/hotkeys/deleteMultiple';
import { ITimezone } from '../../../../../common/interfaces/config/ITimezone';
import DateUtils from '../../../../../helper/dateUtils';
import SchMultipleItems from '../../../../../helper/schedule/SchMultipleItems';
import { ISelected } from '../../../../../helper/schedule/SchUtils';
import { getActiveDateSelector } from '../../../../../redux/selectors/controlPanelSelector';
import { getTimeFormat } from '../../../../../redux/selectors/timeLineSelector';
import { IBreakMeal } from '../../../../../redux/ts/intrefaces/timeLine';
import { Cross } from '../../../../../static/svg';
import Button from '../../../../ReusableComponents/button';
import CheckboxBig from '../../../../ReusableComponents/Checkbox';
import Checkbox from '../../../../ReusableComponents/CheckboxStyled';
import InputTime, { ITimeLimit } from '../../../../ReusableComponents/InputTime';
import Spiner from '../../../../ReusableComponents/spiner';
import styles2 from '../menu.module.scss';
import styles from './styles/menu.module.scss';

export interface IScheduleMenuProps {
  type: 'INSERT_BREAK' | 'INSERT_MEAL';
  onClose: (...args: any[]) => void;
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

const InsertBreakMealMenu: FC<IScheduleMenuProps> = props => {
  const title = props.type === 'INSERT_MEAL' ? 'Meal' : 'Break';

  const timeFormat = useSelector(getTimeFormat);
  const activeDate = useSelector(getActiveDateSelector);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [items, setItem] = useState<IBreakMeal[]>([]);
  const [allItems, setAllItem] = useState<IBreakMeal[]>([]);
  const [selectedItems, setSelectedItems, selectedItemsRef] = useStateRef<number[]>([]);
  const [isShowAll, setIsShowAll] = useState<boolean>(true);
  const [isNextStartDay, setIsNextStartDay] = useState<boolean>(false);
  const [isNextEndDay, setIsNextEndDay] = useState<boolean>(false);
  const [, setStartTime, startTimeRef] = useStateRef<string>('12:00');
  const [, setEndTime, endTimeRef] = useStateRef<string>('12:30');

  const [isValid, setIsValid] = useState<boolean>(true);
  const [limits, setLimits] = useStateRef<ITimeLimit>({});

  interface IFindTimOfPayload {
    [key: string]: number[];
  }

  const initBreakMealList = async (showAll: boolean) => {
    const keys = Object.keys(props.checkedItems);
    const payload: IFindTimOfPayload = {};
    if (!showAll) {
      for (const i of keys) {
        if (!props.checkedItems[i as keyof typeof props.checkedItems]) continue;

        if (
          props.checkedItems[i as keyof typeof props.checkedItems] &&
          props.checkedItems[i as keyof typeof props.checkedItems].length > 0
        ) {
          payload[i] = props.checkedItems[i as keyof typeof props.checkedItems];
        }
      }
    } else {
      payload['siteId'] = [props.siteId];
      payload['buId'] = [props.buId];
    }

    let resp = null;
    if (props.type === 'INSERT_BREAK') {
      resp = await restApi.findBreaks(payload);
    } else {
      resp = await restApi.findMeals(payload);
    }
    if (showAll) {
      setAllItem(resp.data as IBreakMeal[]);
    } else {
      setItem(resp.data as IBreakMeal[]);
    }
    setIsLoading(false);
  };
  useEffect(() => {
    setItem([]);
    setAllItem([]);
    setIsLoading(true);
  }, [props.type]);
  useEffect(() => {
    const isShowAllState = isShowAll;
    if (isLoading && props.visible) {
      initBreakMealList(isShowAllState);
    }
  }, [props.checkedItems, props.visible]);

  // select region
  const selectAll = () => {
    if (!props.isDelete) return;
    const indexArr = allItems.map((item, index) => index);
    setSelectedItems(indexArr);
  };
  useHotkeys(DeleteMultipleHotKeys.SELECT_ALL, selectAll, { preventDefault: true });

  const selectItems = (e: React.MouseEvent, el: IBreakMeal) => {
    const index = allItems.findIndex(_el => el.id == _el.id);

    const newSelectedItems = props.isDelete
      ? SchMultipleItems.selectMultiple(e, index, selectedItemsRef.current)
      : SchMultipleItems.selectSingle(index, selectedItemsRef.current);
    setSelectedItems(newSelectedItems);
  };
  // endregion

  const onClickShowAll = () => {
    const isShowAllState = !isShowAll;
    if (!items.length || !allItems.length) {
      setIsLoading(true);
      initBreakMealList(isShowAllState);
    }
    setIsShowAll(isShowAllState);
  };

  const onClickNextStartDay = () => {
    setLimits({ ...limits, isNextStartDay: !isNextStartDay });
    setIsNextStartDay(!isNextStartDay);
  };

  const onClickNextEndDay = () => {
    setLimits({ ...limits, isNextEndDay: !isNextEndDay });
    setIsNextEndDay(!isNextEndDay);
  };

  const onChangeStartTime = (value: string) => {
    setStartTime(value.toString());
  };

  const onChangeEndTime = (value: string) => {
    setEndTime(value.toString());
  };

  const onValidate = (msg: string | null): void => {
    setIsValid(!msg);
  };

  const saveChanges = () => {
    const filterAgents = props.checkedItems;
    // const datesFullRange: string[] = DateUtils.getDateListFromRange(
    //   SchMultipleItems.getDate(props.dateRange[0]),
    //   SchMultipleItems.getDate(props.dateRange[1]),
    // );
    const datesFullRange: string[] =
      props.dateRange.length === 2 && props.dateRange[0] === props.dateRange[1]
        ? [props.dateRange[0]]
        : props.dateRange;

    const repeatRequestForData = datesFullRange.indexOf(activeDate) > -1;

    const item = allItems[selectedItems[0]];
    const type = props.type === 'INSERT_BREAK' ? SchStateType.BREAK : SchStateType.MEAL;
    const formData = {
      item,
      type,
      startTime: startTimeRef.current,
      endTime: endTimeRef.current,
      isNextStartDay,
      isNextEndDay,
    };
    let states: any[];
    if (props.isDelete) {
      const ids = selectedItemsRef.current.map(index => allItems[index].id);
      states = SchMultipleItems.prepareStatesForDeleteMultiple(
        type,
        ids,
        datesFullRange,
        props.itemsStartTime,
        props.itemsEndTime,
        props.itemsNextEndDay,
      );
    } else {
      states = SchMultipleItems.prepareDataForNewMultipleBreacMeal(formData, datesFullRange);
    }

    const agentDays = SchMultipleItems.prepareTeamPlateInsertState(
      filterAgents,
      !props.showWarnings,
      props.insertOnlyErrorsOrWarning,
      true,
      states,
      props.selectedTz.timezoneId,
      props.snapshotId,
    );

    props.apply('state', agentDays, repeatRequestForData);
  };

  const onClose = () => {
    props.onClose();
  };

  const getView = () => {
    return (
      <>
        <div className={styles.subHeader}>
          <span>Choose item to {props.isDelete ? 'delete' : 'insert'}</span>
        </div>
        <div className={styles.tableWrapper} style={{ width: '680px', height: props.isDelete ? '525px' : '410px' }}>
          {isLoading ? (
            <Spiner />
          ) : (
            <>
              <div className={styles.tableSubWrapper}>
                <table>
                  <thead>
                    <tr>
                      <td>
                        <span>{title}</span>
                      </td>
                      <td>
                        <span>Short</span>
                      </td>
                      <td>
                        <span>Hours</span>
                      </td>
                      <td>
                        <span>Paid</span>
                      </td>
                    </tr>
                  </thead>
                  <tbody>
                    {(isShowAll ? allItems : items).map((el, index) => {
                      return (
                        <tr
                          key={index}
                          onClick={e => selectItems(e, el)}
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
                            <span
                              title={`${DateUtils.convertMinutesToTime(el.duration)}`}
                              className={styles.secTd}
                            >{`${DateUtils.convertMinutesToTime(el.duration)}`}</span>
                          </td>
                          <td>
                            <span className={styles.fthTd}>
                              <CheckboxBig icon={'mark'} checked={el.isPaid} />
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {props.hasNoShowAll && (
                <div className={`${styles.checkBoxWrap} ${styles.showAll}`}>
                  <Checkbox
                    checked={isShowAll}
                    onClick={onClickShowAll}
                    style={{ width: '10px', height: '10px', border: '#BCC4C8 solid 1px' }}
                  />
                  <span>Show all</span>
                </div>
              )}
            </>
          )}
        </div>
        {props.isDelete ? (
          ''
        ) : (
          <div className={styles.data}>
            <div className={styles.dataStart}>
              <div className={timeFormat === '24hours' ? styles.dataStartTMWrapper : styles.dataStartTMWrapperBigger}>
                <InputTime
                  onChangeStartTime={onChangeStartTime}
                  onChangeEndTime={onChangeEndTime}
                  startTime={startTimeRef.current}
                  endTime={endTimeRef.current}
                  format={timeFormat}
                  limits={limits}
                  onValidate={onValidate}
                />
              </div>
            </div>
            <div className={styles.checkBoxWrap3} data-test={'next-day-start-checkbox'}>
              <Checkbox
                checked={isNextStartDay}
                onClick={() => onClickNextStartDay()}
                style={{ height: '10px', width: '10px' }}
              />
              <span onClick={() => onClickNextStartDay()}>Start next day</span>
            </div>
            <div className={styles.checkBoxWrap3} data-test={'next-day-end-checkbox'}>
              <Checkbox
                checked={isNextEndDay}
                onClick={() => onClickNextEndDay()}
                style={{ height: '10px', width: '10px' }}
              />
              <span onClick={() => onClickNextEndDay()}>End next day</span>
            </div>
          </div>
        )}
      </>
    );
  };

  if (!props.visible) return null;
  return (
    <div className={styles.formWrapper} style={{ width: '740px', height: '721px' }}>
      <div className={styles.header}>
        <span>{`${props.isDelete ? 'Delete' : 'Insert'} ${title}`}</span>
        <Cross onClick={onClose} />
      </div>
      <div className={styles.body}>{getView()}</div>

      <div className={styles2.footer}>
        <div className={styles2.buttonWrap1}>
          <Button
            innerText={'Cancel'}
            click={onClose}
            disable={props.loading}
            style={{ background: '#FFFFFF', color: '#0183F5', border: '0.5px solid #0183F5', borderRadius: '5px' }}
          />
        </div>
        <div className={styles2.buttonWrap5}>
          <Button
            innerText={'< Return'}
            click={() => {
              props.onReturn(2);
            }}
            disable={props.loading}
            type={'primary'}
          />
        </div>

        <div className={styles2.buttonWrap2}>
          <Button
            innerText={props.showNextBtn ? 'Next >' : props.isDelete ? 'Cleanup' : 'Publish'}
            click={() => {
              saveChanges();
            }}
            disable={!isValid || !selectedItems.length || props.loading}
            type={'primary'}
            isSaveButton={true}
          />
        </div>
      </div>
    </div>
  );
};

export default InsertBreakMealMenu;
