import React, { FC, useEffect, useState } from 'react';
import styles from './index.module.scss';
import { ReactComponent as MyLocalTzSelected } from './icons/MyLocalTzSelected.svg';
import { ReactComponent as SiteLocalTzSelected } from './icons/SiteLocalTzSelected.svg';
import { ReactComponent as MyLocalTz } from './icons/MyLocalTz.svg';
import { ReactComponent as SiteLocalTz } from './icons/SiteLocalTz.svg';
import Search from '../../../../../ReusableComponents/search';
import { useSelector } from 'react-redux';
import { getTimezonesSelector } from '../../../../../../redux/selectors/controlPanelSelector';
import { ITimezone } from '../../../../../../common/interfaces/config/ITimezone';
import classNames from 'classnames';
import { clone } from 'ramda';
import {ITimeZoneSelector, TimeZoneSelectorCurrentTimeZone} from '../../interfaces';

import { getFilterData } from '../../../../../../redux/selectors/filterSelector';
import { getDataSelector } from '../../../../../../redux/selectors/timeLineSelector';
import { siteLocalTz } from '../../constants';

const TimeZoneSelector: FC<ITimeZoneSelector> = props => {
  const localTzName = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const allTimezones = useSelector(getTimezonesSelector);
  const filterData = useSelector(getFilterData);
  const agents = useSelector(getDataSelector);

  const [isShowedLocalTz, setIsShowedLocalTz] = useState<boolean>(props.currentTimeZone === TimeZoneSelectorCurrentTimeZone.ctz_LOCAL);
  const [isShowedBuTz, setIsShowedBuTz] = useState<boolean>(props.currentTimeZone === TimeZoneSelectorCurrentTimeZone.ctz_BU);

  const buTimezone =
    allTimezones.find(tz => tz.timezoneId === filterData[agents[0].buId].timezoneId) ?? props.initSelectedTZ;

  const [search, setSearch] = useState<string>('');
  const [items, setItems] = useState<ITimezone[]>([]);
  const [selected, setSelected] = useState<ITimezone>(props.initSelectedTZ);

  useEffect(() => {
    setItems(allTimezones);
    setIsShowedLocalTz(props.currentTimeZone === TimeZoneSelectorCurrentTimeZone.ctz_LOCAL);
    setIsShowedBuTz(props.currentTimeZone === TimeZoneSelectorCurrentTimeZone.ctz_BU);
  }, []);
  const changeSearch = (search: string) => {
    setSearch(search);
  };

  const filteredItems = () => {
    if (search) {
      const regex = new RegExp(`.*${search.startsWith('+') ? '\\' : ''}${search}.*`, 'gi');

      return items.filter(element => regex.test(element.name));
    }

    return items;
  };

  const isSelectedMyLocalTz = () => {
    return selected.timezoneId === siteLocalTz.timezoneId;
  };

  const isSelectedBuTz = () => {
    return selected.timezoneId === buTimezone.timezoneId;
  };

  const isSelectedTz = (timezoneId: number) => {
    if (!selected) return;
    return selected.timezoneId === timezoneId;
  };

  const getCurrentTzTitle = (): string => {
    if (isSelectedMyLocalTz()) return `My local - ${localTzName}`;
    if (isSelectedBuTz()) return `BU's - ${selected.name}`;

    return `${selected.name}`;
  };

  const onSelected = (timezone: ITimezone) => {
    const selectedTz = clone(timezone);
    props.onChangeState(selectedTz);
    setSelected(selectedTz);
  };

  const onSelectedMyLocalTz = () => {
    onSelected(siteLocalTz);
  };

  const onSelectedBuTz = () => {
    onSelected(buTimezone);
  };

  return (
    <div className={styles.containerTimeZone}>
      <div className={styles.currentTimeZone}>
        <div className={styles.timeZoneLabel}>Time zone:</div>
        <div className={styles.timeZoneValue}>
          {isSelectedMyLocalTz() || isSelectedBuTz() ? (
            <div className={styles.icon}>
              {isSelectedMyLocalTz() ? <MyLocalTzSelected /> : null}
              {isSelectedBuTz() ? <SiteLocalTzSelected /> : null}
            </div>
          ) : null}
          <div className={styles.name}>{getCurrentTzTitle()}</div>
        </div>
      </div>
      <div className={styles.tzSearchContainer}>
        <div className={styles.tzElementSearch}>
          <Search change={changeSearch} />
        </div>
      </div>
        { isShowedLocalTz ? (
            <div
                className={classNames({
                    [styles.tzMySiteLocalContainer]: true,
                    [styles.selected]: isSelectedMyLocalTz(),
                })}
                onClick={onSelectedMyLocalTz}
            >
                <div className={styles.timeZoneValue}>
                    <div className={styles.icon}>{isSelectedMyLocalTz() ? <MyLocalTzSelected /> : <MyLocalTz />}</div>
                    <div className={styles.name}>My local</div>
                </div>
            </div>
        ) : null }
        { isShowedBuTz ? (
            <div
                className={classNames({
                    [styles.tzMySiteLocalContainer]: true,
                    [styles.selected]: isSelectedBuTz(),
                })}
                onClick={onSelectedBuTz}
            >
                <div className={styles.timeZoneValue}>
                    <div className={styles.icon}>{isSelectedBuTz() ? <SiteLocalTzSelected /> : <SiteLocalTz />}</div>
                    <div className={styles.name}>BU&apos;s</div>
                </div>
            </div>
        ) : null }

      <div className={styles.chooseLabel}>Choose a time zone</div>
      <div className={styles.tzItemsWrapper} style={isShowedLocalTz && isShowedBuTz ? {'height': '196px'} : {}}>
        {filteredItems().map(item => (
          <div className={styles.tzItemContainer} key={item.name}>
            <div
              className={classNames({
                [styles.name]: true,
                [styles.selected]: isSelectedTz(item.timezoneId),
              })}
              onClick={() => onSelected(item)}
            >
              {item.name} (GMT {item.value / 60})
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimeZoneSelector;
