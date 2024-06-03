import React, { FC, useEffect, useState } from 'react';
import useStateRef from 'react-usestateref';
import styles from '../menu.module.scss';
import './react-calendar.css';
import { Value } from 'react-multi-date-picker';
import Checkbox from '../../../../ReusableComponents/Checkbox';
import Switch from '../../../../ReusableComponents/Switch';

import { IMainState } from '../index';
import { IDataByType } from '../dataByType';
import InputTime, { ITimeLimit } from '../../../../ReusableComponents/InputTime';
import { useSelector } from 'react-redux';
import { getTimeFormat } from '../../../../../redux/selectors/timeLineSelector';
import CalendarPopups from '../../../../ReusableComponents/CalendarAndDatePicker/CalendarPopups';
import DateUtils from '../../../../../helper/dateUtils';
import { getTimezonesSelector } from '../../../../../redux/selectors/controlPanelSelector';
import TimeZoneList from '../../../../ReusableComponents/TimeZoneList';
import classnames from 'classnames';

interface ISelectDate {
  mainState: IMainState;
  mainStateRef: { current: IMainState };
  setMainState: React.Dispatch<React.SetStateAction<IMainState>>;
  singleChange: (name: string, value: any) => void;
  initChecked: any;
  dataByType: IDataByType;
  isDelete?: boolean;
  currentDate?: string;
}

const SelectDate: FC<ISelectDate> = ({
  setMainState,
  mainState,
  singleChange,
  initChecked,
  mainStateRef,
  dataByType,
  isDelete,
}) => {
  const timezones = useSelector(getTimezonesSelector);
  const timeFormat = useSelector(getTimeFormat);
  // const [isNextStartDay, setIsNextStartDay] = useState<boolean>(false);
  const [isNextEndDay, setIsNextEndDay] = useState<boolean>(mainStateRef.current.itemsNextEndDay);
  const [, setStartTime, startTimeRef] = useStateRef<string>(mainStateRef.current.itemsStartTime);
  const [, setEndTime, endTimeRef] = useStateRef<string>(mainStateRef.current.itemsEndTime);

  const [limits, setLimits] = useStateRef<ITimeLimit>({ isNextEndDay: isNextEndDay });
  const useCurrentSelectedAgentsTogle = () => {
    setMainState(prevState => {
      let tempDta = {};
      if (!prevState.useCurrentSelectedAgents) {
        tempDta = initChecked;
      }
      return {
        ...prevState,
        useCurrentSelectedAgents: !prevState.useCurrentSelectedAgents,
        localCheckedItems: tempDta,
        localCheckedActivities: tempDta
      };
    });
  };

  /* eslint-disable @typescript-eslint/no-unused-vars */
  // const onClickNextStartDay = () => {
  //   setLimits({ ...limits, isNextStartDay: !isNextStartDay });
  //   setIsNextStartDay(!isNextStartDay);
  // };

  const onClickNextEndDay = () => {
    if (dataByType.type === 'delete') return;
    singleChange('itemsNextEndDay', !isNextEndDay);
    setLimits({ ...limits, isNextEndDay: !isNextEndDay });
    setIsNextEndDay(!isNextEndDay);
  };

  const onChangeStartTime = (value: string) => {
    singleChange('itemsStartTime', value);
    setStartTime(value.toString());
  };

  const onChangeEndTime = (value: string) => {
    singleChange('itemsEndTime', value);
    setEndTime(value.toString());
  };

  const onValidate = (msg: string | null): void => {
    singleChange('itemsTimeValid', !msg);
  };

  useEffect(() => {
    const handleKeyDown = (event: any) => {
      // event.preventDefault();
      if (event.ctrlKey) {
        singleChange('rangeOrSingle', !mainStateRef.current.rangeOrSingle);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (dataByType.type !== 'delete') return;
    setMainState({
      ...mainStateRef.current,
      itemsNextEndDay: endTimeRef.current === '00:00' || endTimeRef.current === '12:00 AM',
    });
  }, [endTimeRef.current]);

  const changeData = (data: Value) => {
    if (dataByType.type === 'edit' && data && Array.isArray(data)) {
      if (data.length === 0) {
        singleChange('dateRange', []);
      } else {
        singleChange('dateRange', [DateUtils.convertDateObjectToDate(data[data.length - 1].toString())]);
      }
      return;
    }
    if (data && Array.isArray(data)) {
      const tempSortedDates = data.sort((a, b) => {
        let val1;
        let val2;
        if (typeof a === 'string') {
          val1 = new Date(a).getTime();
        } else {
          val1 = a.valueOf();
        }
        if (typeof b === 'string') {
          val2 = new Date(b).getTime();
        } else {
          val2 = b.valueOf();
        }
        return val1 - val2;
      });
      let rezult = tempSortedDates.map(d => DateUtils.convertDateObjectToDate(d.toString()));
      if (rezult.length === 2 && rezult[0] !== rezult[1] && mainStateRef.current.rangeOrSingle) {
        rezult = DateUtils.getDateListFromRange(
          tempSortedDates[0].toString(),
          tempSortedDates[tempSortedDates.length - 1].toString(),
        );
      }
      singleChange('dateRange', rezult);
    }
  };

  return (
    <>
      <div className={styles.subHeader}>
        <span>The dates to {isDelete ? 'delete' : 'insert'} for the scheduled items</span>
      </div>
      <div className={styles.calendarWrapper}>
        <CalendarPopups
          multiple={!mainStateRef.current.rangeOrSingle}
          range={mainStateRef.current.rangeOrSingle}
          value={mainStateRef.current.dateRange}
          onChange={data => {
            if (data) {
              changeData(data);
            }
          }}
          className={styles.calendar}
        />
      </div>
      <div
        className={classnames({
          [styles.switchWrapper]: dataByType.type !== 'edit',
          [styles['switchWrapper-noRange']]: dataByType.type === 'edit',
        })}
      >
        {dataByType.type !== 'edit' && (
          <div className={styles.switchItemsHolder}>
            <Switch
              checked={mainStateRef.current.rangeOrSingle}
              onClick={() => {
                singleChange('rangeOrSingle', !mainStateRef.current.rangeOrSingle);
              }}
              customStyle={{ marginLeft: '30px' }}
            />
            <span>
              Range mode <i>(Ctrl)</i>
            </span>
          </div>
        )}
        <div
          className={classnames({
            [styles.tzWrapper]: dataByType.type !== 'edit',
            [styles['tzWrapper-noRange']]: dataByType.type === 'edit',
          })}
          data-test={'match-tz'}
        >
          <div className={styles.listContainer}>
            <TimeZoneList
              allTimezones={timezones}
              activeTimeZone={mainState.localTz}
              setTimezone={data => singleChange('localTz', data)}
              heightTzList={'250px'}
            />
          </div>
        </div>
      </div>

      {isDelete ? (
        <div className={styles.itemsTimeWrapper}>
          <div className={styles.dataStart}>
            <div
              className={timeFormat === '24hours' ? styles.dataStartTMWrapper : styles.dataStartTMWrapperBigger}
              style={{ marginTop: '10px' }}
            >
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
          <div className={styles.checkBoxWrap3} data-test={'next-day-end-checkbox'}>
            <Checkbox
              checked={mainStateRef.current.itemsNextEndDay}
              disable={dataByType.type === 'delete'}
              onClick={() => onClickNextEndDay()}
              style={{ height: '10px', width: '10px' }}
            />
            <span onClick={() => onClickNextEndDay()}>End next day</span>
          </div>
        </div>
      ) : (
        ''
      )}
      <div className={styles.data}>
        <div className={styles.checkBoxWrap3} data-test={'match-activities-skills'}>
          <Checkbox
            checked={mainState.useCurrentSelectedAgents}
            onClick={() => useCurrentSelectedAgentsTogle()}
            style={{ width: '10px', height: '10px' }}
          />
          <span onClick={() => useCurrentSelectedAgentsTogle()}>
            Use currently selected agents
          </span>
        </div>
      </div>
    </>
  );
};

export default SelectDate;
