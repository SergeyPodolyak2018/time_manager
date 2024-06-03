import styles from './calendar.and.date.picker.module.scss';
import { IMapDaysProcess } from './calendar.and.date.picker.interfaces';

export const mapDaysProcess = ({ date, selectedDate, today, isSameDate }: IMapDaysProcess, currentDate: string) => {
  const _selectedDate = Array.isArray(selectedDate) ? selectedDate : [selectedDate];
  if (isSameDate(date, today)) {
    if (_selectedDate.some(d => isSameDate(d, date))) {
      return { className: styles.today_selected };
    }
    return { className: date.toString() === currentDate ? styles.today_current : styles.today_regular };
  } else {
    if (_selectedDate.some(d => isSameDate(d, date))) {
      return { className: styles.day_selected };
    }
    if (date.toString() === currentDate) {
      return {
        className: styles.current_regular,
      };
    }
  }
};
