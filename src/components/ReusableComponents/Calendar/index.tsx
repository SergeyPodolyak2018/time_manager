import './react-datepicker.css';
import * as Moment from 'moment';
import React, { useRef } from 'react';
import DatePicker from 'react-datepicker';
import { connect, useSelector } from 'react-redux';
import { dayName, months, years } from '../../../common/constants';
import { changeActiveDataAction, getAgentsScheduleIfChecked } from '../../../redux/actions/controlPanelActions';
import {
  changeCalendarVisibility,
  openSaveConfirm,
  setDefaultConfirmState,
  setIsModified,
  toggleLoader,
} from '../../../redux/actions/timeLineAction';
import { useAppDispatch } from '../../../redux/hooks';
import { getActiveDateSelector } from '../../../redux/selectors/controlPanelSelector';
import {
  calendarIsOpen,
  getDataSelector,
  getIsModifiedData,
  isLoadingSelector,
} from '../../../redux/selectors/timeLineSelector';
import UniversalList from '../UniversalList';
import styles from './calendar.module.scss';
import { ReactComponent as CalendarBlank } from './CalendarBlank.svg';
import { ReactComponent as TodayIcon } from './Today.svg';
import DateUtils from '../../../helper/dateUtils';
import { extendMoment } from 'moment-range';

const moment = extendMoment(Moment);
interface IButtonProps extends React.HTMLProps<HTMLElement> {
  activeDate: string;
  changeDate: (...args: any[]) => void;
  getAgentsScheduleForDate: (...args: any[]) => void;
}

const addYears = (existingYears: string[], fromBegining?: boolean) => {
  // add 5 years to array
  const lastYear = parseInt(existingYears[existingYears.length - 1]);
  const newYears = [];
  if (fromBegining) {
    const firstYear = parseInt(existingYears[0]);

    for (let i = 1; i <= 5; i++) {
      newYears.push((firstYear - i).toString());
    }
    return [...newYears.reverse(), ...existingYears];
  }

  for (let i = 1; i <= 5; i++) {
    newYears.push((lastYear + i).toString());
  }
  return [...existingYears, ...newYears];
};

const Calendar = (props: IButtonProps) => {
  const dispatchHook = useAppDispatch();
  const isUnsavedChanges = useSelector(getIsModifiedData);
  const { activeDate, changeDate, getAgentsScheduleForDate } = props;
  const dispatch = useAppDispatch();
  const isCalendarOpen = useSelector(calendarIsOpen);
  const data = useSelector(getDataSelector);
  const today = moment(DateUtils.localDate()).format('llll').split(' ').slice(0, 4).join(' ').replaceAll(',', '');
  const [visibleYears, setVisibleYears] = React.useState(years);
  const refTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoading = useSelector(isLoadingSelector);

  const setCalendarOpen = (state: boolean) => {
    dispatch(changeCalendarVisibility(state));
  };

  const setActive = async (date: string) => {
    if (isLoading) return;
    if (activeDate !== date) {
      const proceed = async () => {
        const newActiveDate = date.split('T')[0];
        dispatch(setDefaultConfirmState());
        changeDate(newActiveDate);
        dispatchHook(setIsModified(false));
        if (refTimer.current !== null) clearTimeout(refTimer.current);
        refTimer.current = await setTimeout(async () => {
          if (data.length !== 0) dispatchHook(toggleLoader(true));
          await getAgentsScheduleForDate();
        }, 600);
      };

      if (isUnsavedChanges) {
        dispatchHook(openSaveConfirm({ onConfirm: proceed, onDiscard: proceed }));
      } else {
        await proceed();
      }
    }
  };

  const handleChange = (e: any) => {
    dispatch(changeCalendarVisibility(!isCalendarOpen));
    setActive(moment(e).format());
  };
  const getYear = (date: any) => {
    return new Date(date).getFullYear();
  };
  const getMonth = (date: any) => {
    return moment(date).month();
  };

  const dayClassName = (date: Date): string | null => {
    const _date = date.toDateString();

    if (_date === today) {
      return DateUtils.toLocalDate(activeDate) !== today
        ? styles['customize_today']
        : styles['customize_today_selected'];
    }

    return null;
  };
  const getDate = () => {
    return new Date(moment(activeDate).format());
  };

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.calendarButtonWrapper} ${styles.todayButton}`}>
        <div className={styles.calendarSpanDiv}>
          <span className={styles.calendarButtonSpan}>Today</span>
        </div>
        <div
          id="today"
          className={`${styles.dayButton} ${styles.calendarIcon}`}
          onClick={() => {
            setActive(DateUtils.getCurrentDate());
          }}
        >
          <TodayIcon />
        </div>
      </div>
      <div className={styles.datesWrapper}>
        {DateUtils.getDates(activeDate).map(element => {
          return (
            <div
              className={`${styles.day} ${element.active ? styles.active : ''}`}
              key={element.date}
              onClick={() => {
                setActive(element.date);
              }}
            >
              <p>{dayName[element.weekDay]}</p>
              <p>{element.day}</p>
            </div>
          );
        })}
      </div>
      <div className={styles.calendarButtonWrapper}>
        <div className={styles.calendarSpanDiv}>
          <span className={`${styles.calendarButtonSpan} ${styles.withYear}`}>{`${
            months[getMonth(activeDate)]
          } / ${getYear(activeDate)}`}</span>
        </div>
        <div
          id="calendar"
          className={`${styles.dayButton} ${isCalendarOpen ? styles.activeCalendar : ''} ${styles.calendarIcon}`}
          onClick={() => {
            setCalendarOpen(!isCalendarOpen);
          }}
        >
          <CalendarBlank />
        </div>
      </div>
      {isCalendarOpen && (
        <div
          className={styles.datepickerContainer}
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <DatePicker
            renderCustomHeader={({ date, changeYear, changeMonth }) => (
              <div className={styles.navContainer}>
                <div className={styles.monthContainer}>
                  <UniversalList
                    list={months}
                    clickOn={(value: string) => {
                      changeMonth(months.indexOf(value));
                    }}
                    active={months[getMonth(date)]}
                  />
                </div>
                <div className={styles.yearContainer}>
                  <UniversalList
                    containerStyle={{ maxHeight: '200px' }}
                    list={visibleYears}
                    clickOn={value => changeYear(parseInt(value))}
                    active={getYear(date).toString()}
                    onScrolledToEnd={() => {
                      setVisibleYears(addYears(visibleYears));
                    }}
                    onScrolledToStart={() => {
                      setVisibleYears(addYears(visibleYears, true));
                    }}
                  />
                </div>
              </div>
            )}
            selected={getDate()}
            onChange={handleChange}
            inline
            dayClassName={dayClassName}
          />
        </div>
      )}
    </div>
  );
};

const mapStateToProps = (state: any) => {
  return {
    activeDate: getActiveDateSelector(state),
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    changeDate: (date: string) => dispatch(changeActiveDataAction(date)),
    getAgentsScheduleForDate: () => dispatch(getAgentsScheduleIfChecked()),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Calendar);
