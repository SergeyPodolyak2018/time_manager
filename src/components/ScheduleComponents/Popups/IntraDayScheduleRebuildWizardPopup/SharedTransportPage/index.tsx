import React, { FC, useState } from 'react';
import { useSelector } from 'react-redux';

import { getTimeFormat } from '../../../../../redux/selectors/timeLineSelector';
// import { clone } from 'ramda';
import InputTimeShort from '../../../../ReusableComponents/InputTimeChort';
import { IScheduleRebuildWizardPageProps, ISharedTransportItem } from '../interfaces';
import styles from './index.module.scss';

const SharedTransportPage: FC<IScheduleRebuildWizardPageProps> = props => {
  const timeFormat = useSelector(getTimeFormat);
  const [items, setItems] = useState<ISharedTransportItem[]>(props.initState.data.sharedTransportPage);

  const onDeviationTime = (el: ISharedTransportItem, value: string) => {
    const _item = { ...el, maximumDeviation: value };
    const _items: ISharedTransportItem[] = items.map(i => (i.siteName === _item.siteName ? _item : i));

    props.onChangeState('sharedTransportPage', _items);
    setItems(_items);
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.tableSubWrapper}>
        <table>
          <thead>
            <tr>
              <td>
                <div>Site</div>
              </td>
              <td>
                <div>The maximum deviation between start times and ends times of shifts</div>
              </td>
            </tr>
          </thead>
          <tbody>
            {items.map((el, idx) => (
              <tr key={idx}>
                <td>
                  <div title={el.siteName}>{el.siteName}</div>
                </td>
                <td>
                  <div>
                    <InputTimeShort
                      onChange={value => onDeviationTime(el, value)}
                      format={timeFormat}
                      isEndTime={true}
                      disabled={false}
                      defaultTime={el.maximumDeviation}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SharedTransportPage;
