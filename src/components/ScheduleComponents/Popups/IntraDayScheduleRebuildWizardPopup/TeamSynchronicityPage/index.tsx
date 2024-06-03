import React, { FC, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { getTimeFormat } from '../../../../../redux/selectors/timeLineSelector';
import CheckboxBig from '../../../../ReusableComponents/CheckboxStyled';
import InputTimeShort from '../../../../ReusableComponents/InputTimeChort';
import { SynchronizeByOptionsLabel } from '../constants';
import { IScheduleRebuildWizardPageProps, ITeamSynchronicityItem, SynchronizeByOptions } from '../interfaces';
import styles from './index.module.scss';

const TeamSynchronicityPage: FC<IScheduleRebuildWizardPageProps> = props => {
  const timeFormat = useSelector(getTimeFormat);
  const [items, setItems] = useState<ITeamSynchronicityItem[]>(props.initState.data.teamSynchronicityPage);
  const [openCheckboxSynchronizeBy, setOpenCheckBoxSynchronizeBy] = useState<string | null>(null);
  const options = [
    SynchronizeByOptions.NO_ADDITIONAL_SYNCHRONISATION,
    SynchronizeByOptions.SHIFT_START_TIME,
    SynchronizeByOptions.PAID_DURATION,
    SynchronizeByOptions.SHIFT_START_TIME_AND_PAID_DURATION,
    SynchronizeByOptions.SHIFT_START_TIME_PAID_DURATION_AND_MEALS,
    SynchronizeByOptions.SHIFT_START_TIME_PAID_DURATION_MEALS_AND_BREAKS,
    SynchronizeByOptions.PAID_DURATION_AND_MEALS,
    SynchronizeByOptions.PAID_DURATION_MEALS_AND_BREAKS,
  ];

  useEffect(() => {
    window.addEventListener('click', closeCheckboxSynchronizeBy);
    return () => {
      window.removeEventListener('click', closeCheckboxSynchronizeBy);
    };
  });

  const onMaximumStartTimeDifference = (el: ITeamSynchronicityItem, value: string) => {
    const _item = { ...el, maximumStartTimeDifference: value };
    const _items: ITeamSynchronicityItem[] = items.map(i => (i.siteName === _item.siteName ? _item : i));

    props.onChangeState('teamSynchronicityPage', _items);
    setItems(_items);
  };

  const onClickCheckbox = (el: ITeamSynchronicityItem, field: 'isSynchronizeDaysOff' | 'isOnlySameContracts') => {
    if (field === 'isOnlySameContracts' && isOnlySameContractsDisabled(el)) return;

    const _item = { ...el, [field]: !el[field] };
    const _items: ITeamSynchronicityItem[] = items.map(i => (i.siteName === _item.siteName ? _item : i));

    props.onChangeState('teamSynchronicityPage', _items);
    setItems(_items);
  };

  const getSynchronizeByLabel = (n: SynchronizeByOptions) => {
    return SynchronizeByOptionsLabel[n];
  };

  const closeCheckboxSynchronizeBy = () => {
    setOpenCheckBoxSynchronizeBy(null);
  };

  const onChangeSynchronizeBy = (el: ITeamSynchronicityItem, option: SynchronizeByOptions) => {
    const _item = { ...el, synchronizeBy: option };
    const _items: ITeamSynchronicityItem[] = items.map(i => (i.siteName === _item.siteName ? _item : i));

    props.onChangeState('teamSynchronicityPage', _items);
    setItems(_items);

    return setOpenCheckBoxSynchronizeBy(null);
  };

  const onOpenCheckBox = (e: React.MouseEvent, siteName: string): void => {
    e.stopPropagation();
    if (siteName !== openCheckboxSynchronizeBy) {
      return setOpenCheckBoxSynchronizeBy(siteName);
    }

    return closeCheckboxSynchronizeBy();
  };

  const isOnlySameContractsDisabled = (el: ITeamSynchronicityItem) => {
    return [
      SynchronizeByOptions.NO_ADDITIONAL_SYNCHRONISATION,
      SynchronizeByOptions.SHIFT_START_TIME,
      SynchronizeByOptions.SHIFT_START_TIME_AND_PAID_DURATION,
      SynchronizeByOptions.SHIFT_START_TIME_PAID_DURATION_AND_MEALS,
      SynchronizeByOptions.SHIFT_START_TIME_PAID_DURATION_MEALS_AND_BREAKS,
    ].includes(Number(el.synchronizeBy));
  };

  const isMaximumStartTimeDifferenceDisabled = (el: ITeamSynchronicityItem) => {
    return !isOnlySameContractsDisabled(el) || el.synchronizeBy === SynchronizeByOptions.NO_ADDITIONAL_SYNCHRONISATION;
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.tableContainer}>
        <div className={styles.tableSubWrapper}>
          <table>
            <thead>
              <tr>
                <td>
                  <div>Site</div>
                </td>
                <td>
                  <div>Synchronize Days Off</div>
                </td>
                <td>
                  <div>Synchronize By</div>
                </td>
                <td>
                  <div>Maximum Start Time Difference</div>
                </td>
                <td>
                  <div>Apply Constraints Only to the Same Contracts Inside Team</div>
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
                    <div className={styles.alignCentre} onClick={() => onClickCheckbox(el, 'isSynchronizeDaysOff')}>
                      <CheckboxBig checked={el.isSynchronizeDaysOff} />
                    </div>
                  </td>
                  <td>
                    <div>
                      <div className={styles.selectWrapper} onClick={e => onOpenCheckBox(e, el.siteName)}>
                        <span className={styles.selectLabel}>{getSynchronizeByLabel(el.synchronizeBy)}</span>
                        <div className={styles.selectIcon}></div>
                      </div>
                      <div
                        className={styles.optionsWrapper}
                        style={{ display: openCheckboxSynchronizeBy === el.siteName ? 'block' : 'none' }}
                      >
                        {options.map((option, i) => (
                          <div
                            className={`${styles.option} ${option === el.synchronizeBy ? styles.selected : ''}`}
                            key={`${idx}-${i}`}
                            onClick={() => onChangeSynchronizeBy(el, option)}
                          >
                            <div className={styles.optionLabel}>{getSynchronizeByLabel(option)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <InputTimeShort
                        onChange={value => onMaximumStartTimeDifference(el, value)}
                        format={timeFormat}
                        isEndTime={true}
                        disabled={isMaximumStartTimeDifferenceDisabled(el)}
                        defaultTime={el.maximumStartTimeDifference}
                      />
                    </div>
                  </td>
                  <td>
                    <div className={styles.alignCentre} onClick={() => onClickCheckbox(el, 'isOnlySameContracts')}>
                      <CheckboxBig
                        checked={el.isOnlySameContracts}
                        isGrayAsDefault={isOnlySameContractsDisabled(el)}
                        disabled={isOnlySameContractsDisabled(el)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeamSynchronicityPage;
