import React, { FC } from 'react';
import dateUtils from '../../../../helper/dateUtils';
import { Calendar } from 'react-multi-date-picker';
import { useSelector } from 'react-redux';
import { getActiveDateSelector } from '../../../../redux/selectors/controlPanelSelector';
import { mapDaysProcess } from '../calendar.and.date.picker.helpers';
import { ICalendarPopups, IMapDaysProcess } from '../calendar.and.date.picker.interfaces';

const CalendarPopups: FC<ICalendarPopups> = props => {
  const currentDate: string = useSelector(getActiveDateSelector);

  return (
    <Calendar
      format="YYYY-MM-DD"
      numberOfMonths={2}
      disableMonthPicker
      disableYearPicker
      multiple={props.multiple}
      range={props.range}
      value={props.value}
      onChange={props.onChange}
      className={props.className}
      currentDate={dateUtils.toDateObject(currentDate)}
      mapDays={data => mapDaysProcess(data as IMapDaysProcess, currentDate)}
      shadow={false}
    />
  );
};

export default CalendarPopups;
