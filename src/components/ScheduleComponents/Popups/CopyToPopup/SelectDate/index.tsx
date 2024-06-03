import React, { FC } from 'react';
import styles from '../menu.module.scss';
import { IMainState } from '../index';
import CalendarPopups from '../../../../ReusableComponents/CalendarAndDatePicker/CalendarPopups';
import { Value } from 'react-multi-date-picker';
import Switch from '../../../../ReusableComponents/Switch';
import DateUtils from '../../../../../helper/dateUtils';

interface ISelectDate {
  mainState: IMainState;
  mainStateRef: { current: IMainState };
  singleChange: (name: string, value: any) => void;
}

const SelectDate: FC<ISelectDate> = ({ singleChange, mainStateRef }) => {
  const changeData = (data: Value) => {
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
      if (rezult.length === 2 && rezult[0] !== rezult[1] && mainStateRef.current.dateRange) {
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
        <span>Select day range to be inserted</span>
      </div>
      <div className={styles.calendarWrapper}>
        <CalendarPopups
          multiple={true}
          range={mainStateRef.current.isRange}
          value={mainStateRef.current.dateRange}
          onChange={update => {
            changeData(update);
          }}
          className={styles.customCalendar}
        ></CalendarPopups>
      </div>
      <div className={styles.switchWrapper}>
        <Switch
          checked={mainStateRef.current.isRange}
          onClick={() => {
            singleChange('isRange', !mainStateRef.current.isRange);
          }}
        />
        <span>
          Range mode <i>(Ctrl)</i>
        </span>
      </div>
    </>
  );
};

export default SelectDate;
