import classnames from 'classnames';
import React, { FC, useEffect, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useSelector } from 'react-redux';
import useStateRef from 'react-usestateref';

import Api from '../../../../../api/rest';
import { SchStateType } from '../../../../../common/constants/schedule';
import {
    DeleteMultipleHotKeys
} from '../../../../../common/constants/schedule/hotkeys/deleteMultiple';
import { ITimezone } from '../../../../../common/interfaces/config/ITimezone';
import {
    CfgMarkedTimeType, IMarkedTime
} from '../../../../../common/interfaces/schedule/IAgentSchedule';
import SchMultipleItems from '../../../../../helper/schedule/SchMultipleItems';
import { ISelected } from '../../../../../helper/schedule/SchUtils';
import { getActiveDateSelector } from '../../../../../redux/selectors/controlPanelSelector';
import { getTimeFormat } from '../../../../../redux/selectors/timeLineSelector';
import { ReactComponent as Cross } from '../../../../../static/svg/cross.svg';
import Button from '../../../../ReusableComponents/button';
import CheckboxBig from '../../../../ReusableComponents/Checkbox';
import CheckboxStyled from '../../../../ReusableComponents/CheckboxStyled';
import InputTime, { ITimeLimit } from '../../../../ReusableComponents/InputTime';
import Spiner from '../../../../ReusableComponents/spiner';
import stylesSeletTime from '../../common/SelectTime/selectTime.module.scss';
import styles3 from '../../InsertExceptionMenu/menu.module.scss';
import stylesSelectMarketTime from '../../InsertMarkedTime/SelectMarkedTime/selectMarkedTime.module.scss';
import styles2 from '../menu.module.scss';

export interface IInsertMarkedTimeState {
  isNextDay: boolean;
  isPrevDay: boolean;
  timeStart: string;
  timeEnd: string;
  markedTimeIds: number[];
  markedTimes: IMarkedTime[];
  isLoading: boolean;
}

export interface IInsertMultipleMarkedTimeProps {
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
  selectedTz: ITimezone;
  loading: boolean;
  visible: boolean;
}

const InsertMultipleMarkedTime: FC<IInsertMultipleMarkedTimeProps> = props => {
  const currentDate = useSelector(getActiveDateSelector);
  const timeFormat = useSelector(getTimeFormat);
  const [isValid, setIsValid] = useState<boolean>(true);

  const [, setState, stateRef] = useStateRef<IInsertMarkedTimeState>({
    isNextDay: false,
    isPrevDay: false,
    timeStart: '12:00',
    timeEnd: '13:00',
    markedTimes: [],
    markedTimeIds: [],
    isLoading: true,
  });

  useEffect(() => {
    if(props.visible){
      if (stateRef.current.markedTimes.length) return setState(prevState => ({ ...prevState, isLoading: false }));
    Api.findMarkedTimes({
      ...(props.checkedItems.agentId.length > 0 && { agentId: props.checkedItems.agentId }),
      ...(props.checkedItems.teamId.length > 0 && { teamId: props.checkedItems.teamId }),
      ...(props.checkedItems.siteId.length > 0 && { siteId: props.checkedItems.siteId }),
      ...(props.checkedItems.buId.length > 0 && { buId: props.checkedItems.buId }),
    })
      .then(response => {
        setState(prevState => ({
          ...prevState,
          markedTimes: response.data,
        }));
      })
      .finally(() => {
        setState(prevState => ({ ...prevState, isLoading: false }));
      });
    }
  }, [props.visible]);

  // select region
  const selectAll = () => {
    if (!props.isDelete) return;
    const ids = stateRef.current.markedTimes.map(item => item.id);
    setState(prevState => ({ ...prevState, markedTimeIds: ids }));
  };
  useHotkeys(DeleteMultipleHotKeys.SELECT_ALL, selectAll, { preventDefault: true });

  const handleClickItem = (e: React.MouseEvent, item: IMarkedTime, index: number) => {
    const selectedIndex = stateRef.current.markedTimeIds.map(id =>
      stateRef.current.markedTimes.findIndex(item => item.id === id),
    );
    const newSelectedItemsIndex = props.isDelete
      ? SchMultipleItems.selectMultiple(e, index, selectedIndex)
      : SchMultipleItems.selectSingle(index, selectedIndex);

    setState(prevState => ({
      ...prevState,
      markedTimeIds: newSelectedItemsIndex.map(index => stateRef.current.markedTimes[index].id),
    }));
  };
  // endregion

  const [limits, setLimits] = useStateRef<ITimeLimit>({});

  useEffect(() => {
    setLimits({
      ...limits,
      isNextEndDay: stateRef.current.isNextDay,
      isPreviousStartDay: stateRef.current.isPrevDay,
    });
  }, [stateRef.current, props.visible]);

  const onValidate = (msg: string | null): void => {
    setIsValid(!msg);
  };

  const saveChanges = () => {
    const filterAgents = props.checkedItems;
    const datesFullRange: string[] =
      props.dateRange.length === 2 && props.dateRange[0] === props.dateRange[1]
        ? [props.dateRange[0]]
        : props.dateRange;

    const repeatRequestForData = datesFullRange.indexOf(currentDate) > -1;

    const itemIndex = stateRef.current.markedTimes.findIndex(el => el.id === stateRef.current.markedTimeIds[0]);

    const formData = {
      item: stateRef.current.markedTimes[itemIndex],
      type: SchStateType.MARKED_TIME,
      startTime: stateRef.current.timeStart,
      endTime: stateRef.current.timeEnd,
      isNextStartDay: stateRef.current.isNextDay,
      isNextEndDay: stateRef.current.isPrevDay,
    };
    let states: any[];
    if (props.isDelete) {
      states = SchMultipleItems.prepareStatesForDeleteMultiple(
        SchStateType.MARKED_TIME,
        stateRef.current.markedTimeIds,
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

  if (!props.visible) return null;
  return (
    <div className={styles3.formWrapper} style={{ width: '740px', height: '721px' }}>
      <div className={styles3.header}>
        <span>{`${props.isDelete ? 'Delete' : 'Insert'} Marked Time`}</span>
        <Cross onClick={props.onClose} />
      </div>
      <div className={styles3.body}>
        <div className={classnames([stylesSelectMarketTime.selectMarkedTime])}>
          <div className={styles3.tableWrapper} style={{ width: '680px', height: props.isDelete ? '530px' : '212px' }}>
            {stateRef.current.isLoading ? (
              <Spiner />
            ) : (
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <td style={{ maxWidth: 'none' }}>
                      <span>Marked</span>
                    </td>
                    <td>
                      <span>Short</span>
                    </td>
                    <td>
                      <span>Overtime</span>
                    </td>
                    <td>
                      <span>Payback</span>
                    </td>
                  </tr>
                </thead>
                <tbody>
                  {stateRef.current.markedTimes.map((item, index) => {
                    return (
                      <tr
                        key={index}
                        onClick={e => handleClickItem(e, item, index)}
                        className={`${stateRef.current.markedTimeIds.includes(item.id) ? styles3.selected : ''}`}
                      >
                        <td>
                          <span title={item.name} className={styles3.firstTd}>
                            {item.name}
                          </span>
                        </td>
                        <td>
                          <span title={item.shortName} className={styles3.secTd}>
                            {item.shortName}
                          </span>
                        </td>
                        <td>
                          <span className={styles3.vthTd}>
                            <CheckboxBig icon={'mark'} checked={item.type === CfgMarkedTimeType.OVERTIME} />
                          </span>
                        </td>
                        <td>
                          <span className={styles3.sthTd}>
                            <CheckboxBig icon={'mark'} checked={item.type === CfgMarkedTimeType.PAYBACK} />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
        {props.isDelete ? (
          ''
        ) : (
          <div className={stylesSeletTime.selectTime}>
            <div className={stylesSeletTime.selectTime__columnItem}>
              <div
                className={stylesSeletTime.selectTime__timepickerContainer}
                style={{
                  width: '200px',
                }}
              >
                <InputTime
                  onChangeStartTime={val => setState({ ...stateRef.current, timeStart: val })}
                  onChangeEndTime={val => setState({ ...stateRef.current, timeEnd: val })}
                  startTime={stateRef.current.timeStart}
                  endTime={stateRef.current.timeEnd}
                  format={timeFormat}
                  limits={limits}
                  onValidate={onValidate}
                />
              </div>
            </div>
            <div className={stylesSeletTime.selectTime__checkboxContainer}>
              <CheckboxStyled
                id={'prevDay'}
                onClick={() =>
                  setState({ ...stateRef.current, isPrevDay: !stateRef.current.isPrevDay, isNextDay: false })
                }
                checked={stateRef.current.isPrevDay}
              />
              <label
                htmlFor={'prevDay'}
                onClick={() =>
                  setState({ ...stateRef.current, isPrevDay: !stateRef.current.isPrevDay, isNextDay: false })
                }
              >
                Prev start time
              </label>
            </div>
            <div className={stylesSeletTime.selectTime__checkboxContainer}>
              <CheckboxStyled
                id={'nextDay'}
                onClick={() =>
                  setState({ ...stateRef.current, isNextDay: !stateRef.current.isNextDay, isPrevDay: false })
                }
                checked={stateRef.current.isNextDay}
              />
              <label
                htmlFor={'nextDay'}
                onClick={() =>
                  setState({ ...stateRef.current, isNextDay: !stateRef.current.isNextDay, isPrevDay: false })
                }
              >
                Next end time
              </label>
            </div>
          </div>
        )}
      </div>
      <div className={styles2.footer}>
        <div className={styles2.buttonWrap1}>
          <Button
            innerText={'Cancel'}
            click={props.onClose}
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
            disable={!stateRef.current.markedTimeIds.length || !isValid || props.loading}
            innerText={props.isDelete ? 'Cleanup' : props.isDelete ? 'Cleanup' : 'Publish'}
            click={saveChanges}
            style={{ background: '#0183F5', color: '#FFFFFF', borderRadius: '5px' }}
            isSaveButton={true}
          />
        </div>
      </div>
    </div>
  );
};

export default InsertMultipleMarkedTime;
