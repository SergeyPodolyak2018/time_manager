import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { ITimezone } from '../../../common/interfaces/config/ITimezone';
import Utils from '../../../helper/utils';
import { setTimeZonesAction } from '../../../redux/actions/controlPanelActions';
import { changeTzMenuVisibility, closeAllMenu } from '../../../redux/actions/timeLineAction';
import { useAppDispatch } from '../../../redux/hooks';
import {
  getControlPanelLoader,
  getSelectedTzSelector,
  getTimezonesSelector,
} from '../../../redux/selectors/controlPanelSelector';
import { getIsAnyMenuOpen, isTzMenuShow } from '../../../redux/selectors/timeLineSelector';
import { ControlPanelLoaderKey } from '../../../redux/ts/intrefaces/timeLine';
import InlineSpinner from '../../ReusableComponents/InlineSpinner';
import Search from '../../ReusableComponents/search';
import styles from './timezone.module.scss';

const TimezoneList = () => {
  const dispatch = useAppDispatch();

  const listState = useSelector(isTzMenuShow);
  const activeTimeZone = useSelector(getSelectedTzSelector);
  const allTimezones = useSelector(getTimezonesSelector);
  const panelLoader = useSelector(getControlPanelLoader);

  const [filter, changeFilter] = useState('');
  const localTzname = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const isAnyMenuOpen = useSelector(getIsAnyMenuOpen);

  useEffect(() => {
    if (activeTimeZone.gswTimezoneId < 0) {
      const localTz = getTzByName(localTzname);
      if (localTz) {
        dispatch(setTimeZonesAction(localTz));
      }
    }
  }, [allTimezones]);

  const clickOnTimeZone = (type: ITimezone) => {
    dispatch(setTimeZonesAction(type));
  };
  const getTzByName = (name: string) => {
    return allTimezones.find(el => el.name === name);
  };
  const setLocal = () => {
    const localTz = getTzByName(localTzname);
    if (localTz) {
      dispatch(setTimeZonesAction(localTz));
    }
  };
  const getLocalTzName = () => {
    const tz = getTzByName(localTzname);
    return tz?.name;
  };
  const setSiteLocal = () => {
    dispatch(
      setTimeZonesAction({
        gswTimezoneId: 0,
        description: '',
        name: 'Site',
        timezoneId: 0,
        value: 0,
        currentOffset: 0,
      }),
    );
  };
  const addFilter = (filter: string) => {
    changeFilter(filter);
  };

  const filtration = (timeZones: ITimezone[]) => {
    if (filter) {
      return timeZones.filter(element => {
        const str = `${element.name} (GMT ${getFormatedTime(element.value / 60)})`;
        return Utils.findMatch(str, filter);
      });
    }
    return timeZones;
  };

  return (
    <div
      id="timezone"
      className={styles.container}
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        if (isAnyMenuOpen) dispatch(closeAllMenu());
        dispatch(changeTzMenuVisibility(!listState));
      }}
    >
      {activeTimeZone.timezoneId === 0 ? (
        <div className={styles.default}>
          <>
            Time zone: <i>site</i>
          </>
        </div>
      ) : (
        <div className={styles.default}>
          {localTzname === activeTimeZone.name ? (
            <>
              Time zone: <i>my local - {activeTimeZone.name}</i>
            </>
          ) : (
            `${activeTimeZone.name} ${activeTimeZone.value / 60}`
          )}
        </div>
      )}
      {panelLoader[ControlPanelLoaderKey.timezones] ? (
        <InlineSpinner color={'grey'} style={{ width: '30px', height: '20px' }} />
      ) : (
        <div className={`${styles.arrow} ${listState ? styles.rotate : ''}`}></div>
      )}

      {listState ? (
        <div className={styles.tzContainer}>
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
            {filtration(allTimezones).map((element, index) => {
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
