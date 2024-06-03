import React, { FC } from 'react';
import dateUtils from '../../../../helper/dateUtils';
import DatePicker from 'react-multi-date-picker';
import { useSelector } from 'react-redux';
import { getActiveDateSelector } from '../../../../redux/selectors/controlPanelSelector';
import { mapDaysProcess } from '../calendar.and.date.picker.helpers';
import { IDatePickerPopups, IMapDaysProcess } from '../calendar.and.date.picker.interfaces';

const DatePickerPopups: FC<IDatePickerPopups> = props => {
  const currentDate: string = useSelector(getActiveDateSelector);

  return (
    <DatePicker
      id={props.id}
      disabled={props.disabled}
      className={props.className}
      containerClassName={props.containerClassName}
      inputClass={props.inputClass}
      format="YYYY-MM-DD"
      disableMonthPicker
      disableYearPicker
      value={props.value}
      onChange={props.onChange}
      currentDate={dateUtils.toDateObject(currentDate)}
      mapDays={data => mapDaysProcess(data as IMapDaysProcess, currentDate)}
      shadow={false}
      arrow={<div style={{
        backgroundColor: 'white',
        height: '15px',
        width: '15px',
        transform: 'translate(4.5px, 8px) rotate(45deg)',
        zIndex: '101',
        borderTop: '1px solid #cfd8e2',
        borderLeft: '1px solid #cfd8e2',
      }}/>}
    />
  );
};

export default DatePickerPopups;
