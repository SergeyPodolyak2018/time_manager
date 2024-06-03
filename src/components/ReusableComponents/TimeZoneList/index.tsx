import React, { useEffect, useState } from 'react';
import styles from './timezone.module.scss';
import { ITimezone } from '../../../common/interfaces/config/ITimezone';
import Search from '../search';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../../redux/hooks';
import { meetingSchedulerCalendar } from '../../../redux/selectors/timeLineSelector';
import { changeMeetingCalendarVisible } from '../../../redux/actions/timeLineAction';

export interface ITimeZoneList {
  activeTimeZone: ITimezone;
  setTimezone: (show: ITimezone) => void;
  allTimezones: ITimezone[];
  heightTzList?: string;
}

const TimezoneList = (props: ITimeZoneList) => {
  const dispatch = useAppDispatch();
  // const [listState, setListState] = useState(false);
  const isOpen = useSelector(meetingSchedulerCalendar);
  const [filter, changeFilter] = useState('');
  const localTzname = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    if (props.activeTimeZone.gswTimezoneId < 0) {
      const localTz = getTzByName(localTzname);
      if (localTz) {
        props.setTimezone(localTz);
      }
    }
  }, []);

  const clickOnTimeZone = (type: ITimezone) => {
    props.setTimezone(type);
  };
  const getTzByName = (name: string) => {
    return props.allTimezones.find(el => el.name === name);
  };
  const setLocal = () => {
    const localTz = getTzByName(localTzname);
    if (localTz) {
      props.setTimezone(localTz);
    }
  };
  const getLocalTzName = () => {
    const tz = getTzByName(localTzname);
    return tz?.name;
  };
  const setSiteLocal = () => {
    props.setTimezone({
      gswTimezoneId: 0,
      description: '',
      name: 'Site',
      timezoneId: 0,
      value: 0,
      currentOffset: 0,
    });
  };
  const addFilter = (filter: string) => {
    changeFilter(filter);
  };

  const filtration = (timeZons: ITimezone[]) => {
    if (filter) {
      const regex = new RegExp(`.*${filter.startsWith('+') ? '\\' : ''}${filter}.*`, 'gi');
      return timeZons.filter(element => regex.test(element.name));
    }
    return timeZons;
  };

  return (
    <div
      id="timezone"
      className={styles.container}
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        dispatch(changeMeetingCalendarVisible(!isOpen));
      }}
    >
      {props.activeTimeZone.timezoneId === 0 ? (
        <div className={styles.default}>
          <>
            Time zone: <i>site</i>
          </>
        </div>
      ) : (
        <div className={styles.default}>
          {localTzname === props.activeTimeZone.name ? (
            <>
              Time zone: <i>my local - {props.activeTimeZone.name}</i>
            </>
          ) : (
            `${props.activeTimeZone.name} ${props.activeTimeZone.value / 60}`
          )}
        </div>
      )}
      <div className={`${styles.arrow} ${isOpen ? styles.rotate : ''}`}></div>

      {isOpen ? (
        <div className={styles.tzContainer} style={{ height: props.heightTzList }}>
          <div className={styles.tzElementContainer}>
            <div className={`${styles.tzElement} ${styles.tzElementNotHover}`}>
              <Search change={addFilter} />
            </div>
          </div>
          <div className={styles.tzElementContainer}>
            <div
              className={styles.tzElement}
              onClick={() => {
                setLocal();
              }}
            >
              <i>{'My local - ' + getLocalTzName()}</i>
            </div>
          </div>
          <div className={styles.tzElementContainer}>
            <div
              className={styles.tzElement}
              onClick={() => {
                setSiteLocal();
              }}
            >
              <i>Site local</i>
            </div>
          </div>
          <div className={styles.tzContainerDinamic}>
            {filtration(props.allTimezones).map((element, index) => {
              return (
                <div className={styles.tzElementContainer} key={index}>
                  <div
                    className={styles.tzElement}
                    onClick={() => {
                      clickOnTimeZone(element);
                    }}
                  >
                    <i>
                      {element.name} (GMT {getFormatedTime(element.value / 60)})
                    </i>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        ''
      )}
    </div>
  );
};

const getFormatedTime = (value: number) => {
  return value < 0 ? value : value > 0 ? '+' + value : value;
};

export default TimezoneList;
