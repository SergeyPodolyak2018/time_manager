import React, { FC, useEffect } from 'react';
import styles from '../../NewMultipleWizardMenu/menu.module.scss';
import cleanUpStyles from '../index.module.scss';
import '../../NewMultipleWizardMenu/SelectDate/react-calendar.css';
import { Value } from 'react-multi-date-picker';
import Switch from '../../../../ReusableComponents/Switch';
import { IMainState } from '../index';
import CalendarPopups from '../../../../ReusableComponents/CalendarAndDatePicker/CalendarPopups';
import DateUtils from '../../../../../helper/dateUtils';

interface ISelectDate {
  mainStateRef: { current: IMainState };
  singleChange: (name: string, value: any) => void;
  currentDate?: string;
}

const SelectDate: FC<ISelectDate> = ({ singleChange, mainStateRef }) => {
  useEffect(() => {
    const handleKeyDown = (event: any) => {
      if (event.ctrlKey) {
        singleChange('rangeOrSingle', !mainStateRef.current.rangeOrSingle);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
        <span>Choose cleanup dates range</span>
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
      <div className={cleanUpStyles.switchWrapper}>
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
    </>
  );
};

export default SelectDate;
