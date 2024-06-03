import { DateObject, Value } from 'react-multi-date-picker';

export interface ICalendarPopups {
  multiple: boolean;
  range: boolean;
  value: string[];
  onChange: (selectedDates: DateObject | DateObject[] | null) => void;
  className?: string;
}

export interface IMapDaysProcess {
  date: DateObject;
  selectedDate: DateObject | DateObject[];
  today: DateObject;
  currentMonth: object;
  isSameDate: (arg1: DateObject, arg2: DateObject) => boolean;
}

export interface IDatePickerPopups {
  disabled?: boolean;
  className?: string;
  id?:string;
  containerClassName?: string;
  inputClass?: string;
  value: Value;
  onChange: (selectedDates: DateObject | DateObject[] | null) => void;
}
