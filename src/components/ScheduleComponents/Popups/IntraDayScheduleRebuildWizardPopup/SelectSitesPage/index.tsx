import classNames from 'classnames';
import { clone } from 'ramda';
import React, { FC, useEffect, useState } from 'react';

import Checkbox from '../../../../ReusableComponents/CheckboxStyled';
import { IScheduleRebuildWizardPageProps, ISelectedCell, ISelectSitesItem } from '../interfaces';
import styles from './index.module.scss';

const SelectSitesPage: FC<IScheduleRebuildWizardPageProps> = props => {
  const [items, setItems] = useState<ISelectSitesItem[]>(props.initState.data.selectSitesPage);
  const [selectedCell, setSelectedCell] = useState<ISelectedCell>({
    fieldName: null,
    itemIndex: null,
  });

  useEffect(() => {
    props.onChangeState('selectSitesPage', items);
  }, []);

  useEffect(() => {
    setItems(props.initState.data.selectSitesPage);
  }, [props.initState]);

  const onChangeState = (newItems: ISelectSitesItem[]) => {
    const _newItems = newItems.map((item, idx) => ({
      ...item,
      isUseTeamConstraints:
        item.isUseSharedTransportConstraints && !items[idx].isUseSharedTransportConstraints
          ? false
          : item.isUseTeamConstraints,
      isUseSharedTransportConstraints:
        item.isUseTeamConstraints && !items[idx].isUseTeamConstraints ? false : item.isUseSharedTransportConstraints,
    }));
    setItems(_newItems);
    props.onChangeState('selectSitesPage', _newItems);
  };

  const isCheckedAll = (fieldName: keyof ISelectSitesItem): boolean => {
    const isSelectedSite = items.findIndex(item => item.isChecked) !== -1;

    return (
      !!items.length &&
      items.every(item =>
        fieldName === 'isChecked' || !isSelectedSite ? item[fieldName] : item[fieldName] || !item.isChecked,
      )
    );
  };

  const onCheckAll = (fieldName: keyof ISelectSitesItem): void => {
    if (fieldName !== 'isChecked' && isCheckedAllDisabled()) return;

    setSelectedCell({ fieldName, itemIndex: null });
    const isSelected = isCheckedAll(fieldName);
    onChangeState(
      items.map(item =>
        item.isChecked || fieldName === 'isChecked' ? { ...item, [fieldName]: !isSelected } : { ...item },
      ),
    );
  };

  const isCheckedAllDisabled = () => !items.some(item => item.isChecked);

  const onCheck = (idx: number, fieldName: keyof ISelectSitesItem): void => {
    if (fieldName !== 'isChecked' && !items[idx].isChecked) return;

    setSelectedCell({ fieldName, itemIndex: idx });
    const _items = clone(items);
    //@ts-ignore
    _items[idx][fieldName] = !items[idx][fieldName];
    onChangeState(_items);
  };

  const isRowSelected = (fieldName: keyof ISelectSitesItem): boolean => {
    return selectedCell.fieldName === fieldName;
  };

  const isLineSelected = (idx: number): boolean => {
    return selectedCell.itemIndex === idx;
  };

  const isCellSelected = (idx: number, fieldName: keyof ISelectSitesItem): boolean => {
    return isRowSelected(fieldName) && isLineSelected(idx);
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.tableSubWrapper}>
        <table>
          <thead>
            <tr>
              <td
                className={classNames({
                  [styles.selectedRow]: isRowSelected('isChecked'),
                })}
              >
                <div></div>
              </td>
              <td>
                <div>Site</div>
              </td>
              <td
                className={classNames({
                  [styles.selectedRow]: isRowSelected('isForceSkill'),
                })}
              >
                <div>Force Single Skill</div>
              </td>
              <td
                className={classNames({
                  [styles.selectedRow]: isRowSelected('isUseRequired'),
                })}
              >
                <div>Use Required</div>
              </td>
              <td
                className={classNames({
                  [styles.selectedRow]: isRowSelected('isDisableMonthlyConstrains'),
                })}
              >
                <div>Disable Monthly Constrains for the First Month</div>
              </td>
              <td
                className={classNames({
                  [styles.selectedRow]: isRowSelected('isShuffleAgents'),
                })}
              >
                <div>Shuffle Agents</div>
              </td>
              <td
                className={classNames({
                  [styles.selectedRow]: isRowSelected('isUseTeamConstraints'),
                })}
              >
                <div>Use Team Constraints</div>
              </td>
              <td
                className={classNames({
                  [styles.selectedRow]: isRowSelected('isUseSharedTransportConstraints'),
                })}
              >
                <div>Use Shared Transport Constraints</div>
              </td>
              <td
                className={classNames({
                  [styles.selectedRow]: isRowSelected('isExcludeGrantedAgents'),
                })}
              >
                <div>Exclude Granted Agents From Used Constraints</div>
              </td>
              <td
                className={classNames({
                  [styles.selectedRow]: isRowSelected('isUseSecondaryActivities'),
                })}
              >
                <div>Use Secondary Activities</div>
              </td>
            </tr>
            <tr>
              <td
                className={classNames({
                  [styles.selectedRow]: isRowSelected('isChecked'),
                })}
              >
                <div className={styles.alignCentre}>
                  <Checkbox
                    checked={isCheckedAll('isChecked')}
                    onClick={() => onCheckAll('isChecked')}
                    // isGrayAsDefault={true}
                  />
                </div>
              </td>
              <td>
                <div></div>
              </td>
              <td
                className={classNames({
                  [styles.selectedRow]: isRowSelected('isForceSkill'),
                })}
              >
                <div className={styles.alignCentre}>
                  <Checkbox
                    checked={isCheckedAll('isForceSkill')}
                    onClick={() => onCheckAll('isForceSkill')}
                    disabled={isCheckedAllDisabled()}
                    // isGrayAsDefault={true}
                  />
                </div>
              </td>
              <td
                className={classNames({
                  [styles.selectedRow]: isRowSelected('isUseRequired'),
                })}
              >
                <div className={styles.alignCentre}>
                  <Checkbox
                    checked={isCheckedAll('isUseRequired')}
                    onClick={() => onCheckAll('isUseRequired')}
                    disabled={isCheckedAllDisabled()}
                    // isGrayAsDefault={true}
                  />
                </div>
              </td>
              <td
                className={classNames({
                  [styles.selectedRow]: isRowSelected('isDisableMonthlyConstrains'),
                })}
              >
                <div className={styles.alignCentre}>
                  <Checkbox
                    checked={isCheckedAll('isDisableMonthlyConstrains')}
                    onClick={() => onCheckAll('isDisableMonthlyConstrains')}
                    disabled={isCheckedAllDisabled()}
                    // isGrayAsDefault={true}
                  />
                </div>
              </td>
              <td
                className={classNames({
                  [styles.selectedRow]: isRowSelected('isShuffleAgents'),
                })}
              >
                <div className={styles.alignCentre}>
                  <div className={styles.alignCentre}>
                    <Checkbox
                      checked={isCheckedAll('isShuffleAgents')}
                      onClick={() => onCheckAll('isShuffleAgents')}
                      disabled={isCheckedAllDisabled()}
                    />
                  </div>
                </div>
              </td>
              <td
                className={classNames({
                  [styles.selectedRow]: isRowSelected('isUseTeamConstraints'),
                })}
              >
                <div className={styles.alignCentre}>
                  <div className={styles.alignCentre}>
                    <Checkbox
                      checked={isCheckedAll('isUseTeamConstraints')}
                      onClick={() => onCheckAll('isUseTeamConstraints')}
                      disabled={isCheckedAllDisabled()}
                    />
                  </div>
                </div>
              </td>
              <td
                className={classNames({
                  [styles.selectedRow]: isRowSelected('isUseSharedTransportConstraints'),
                })}
              >
                <div className={styles.alignCentre}>
                  <Checkbox
                    checked={isCheckedAll('isUseSharedTransportConstraints')}
                    onClick={() => onCheckAll('isUseSharedTransportConstraints')}
                    disabled={isCheckedAllDisabled()}
                  />
                </div>
              </td>
              <td
                className={classNames({
                  [styles.selectedRow]: isRowSelected('isExcludeGrantedAgents'),
                })}
              >
                <div className={styles.alignCentre}>
                  <Checkbox
                    checked={isCheckedAll('isExcludeGrantedAgents')}
                    onClick={() => onCheckAll('isExcludeGrantedAgents')}
                    disabled={isCheckedAllDisabled()}
                  />
                </div>
              </td>
              <td
                className={classNames({
                  [styles.selectedRow]: isRowSelected('isUseSecondaryActivities'),
                })}
              >
                <div className={styles.alignCentre}>
                  <Checkbox
                    checked={isCheckedAll('isUseSecondaryActivities')}
                    onClick={() => onCheckAll('isUseSecondaryActivities')}
                    disabled={isCheckedAllDisabled()}
                  />
                </div>
              </td>
            </tr>
          </thead>
          <tbody>
            {items.map((el, idx) => (
              <tr key={idx}>
                <td
                  className={classNames({
                    [styles.indexCell]: true,
                    [styles.selectedLine]: isLineSelected(idx),
                  })}
                >
                  <div className={styles.alignCentre}>
                    <Checkbox checked={el.isChecked} onClick={() => onCheck(idx, 'isChecked')} />
                  </div>
                </td>
                <td>
                  <div title={el.siteName}>{el.siteName}</div>
                </td>
                <td
                  className={classNames({
                    [styles.selectedCell]: isCellSelected(idx, 'isForceSkill'),
                  })}
                >
                  <div className={styles.alignCentre}>
                    <Checkbox
                      checked={el.isForceSkill}
                      onClick={() => onCheck(idx, 'isForceSkill')}
                      disabled={!el.isChecked}
                    />
                  </div>
                </td>
                <td
                  className={classNames({
                    [styles.selectedLine]: isCellSelected(idx, 'isUseRequired'),
                  })}
                >
                  <div className={styles.alignCentre}>
                    <Checkbox
                      checked={el.isUseRequired}
                      onClick={() => onCheck(idx, 'isUseRequired')}
                      disabled={!el.isChecked}
                    />
                  </div>
                </td>
                <td
                  className={classNames({
                    [styles.selectedLine]: isCellSelected(idx, 'isDisableMonthlyConstrains'),
                  })}
                >
                  <div className={styles.alignCentre}>
                    <Checkbox
                      checked={el.isDisableMonthlyConstrains}
                      onClick={() => onCheck(idx, 'isDisableMonthlyConstrains')}
                      disabled={!el.isChecked}
                    />
                  </div>
                </td>
                <td
                  className={classNames({
                    [styles.selectedLine]: isCellSelected(idx, 'isShuffleAgents'),
                  })}
                >
                  <div className={styles.alignCentre}>
                    <Checkbox
                      checked={el.isShuffleAgents}
                      onClick={() => onCheck(idx, 'isShuffleAgents')}
                      disabled={!el.isChecked}
                    />
                  </div>
                </td>
                <td
                  className={classNames({
                    [styles.selectedLine]: isCellSelected(idx, 'isUseTeamConstraints'),
                  })}
                >
                  <div className={styles.alignCentre}>
                    <Checkbox
                      checked={el.isUseTeamConstraints}
                      onClick={() => onCheck(idx, 'isUseTeamConstraints')}
                      disabled={!el.isChecked}
                    />
                  </div>
                </td>
                <td
                  className={classNames({
                    [styles.selectedLine]: isCellSelected(idx, 'isUseSharedTransportConstraints'),
                  })}
                >
                  <div className={styles.alignCentre}>
                    <Checkbox
                      checked={el.isUseSharedTransportConstraints}
                      onClick={() => onCheck(idx, 'isUseSharedTransportConstraints')}
                      disabled={!el.isChecked}
                    />
                  </div>
                </td>
                <td
                  className={classNames({
                    [styles.selectedLine]: isCellSelected(idx, 'isExcludeGrantedAgents'),
                  })}
                >
                  <div className={styles.alignCentre}>
                    <Checkbox
                      checked={el.isExcludeGrantedAgents}
                      onClick={() => onCheck(idx, 'isExcludeGrantedAgents')}
                      disabled={!el.isChecked}
                    />
                  </div>
                </td>
                <td
                  className={classNames({
                    [styles.selectedLine]: isCellSelected(idx, 'isUseSecondaryActivities'),
                  })}
                >
                  <div className={styles.alignCentre}>
                    <Checkbox
                      checked={el.isUseSecondaryActivities}
                      onClick={() => onCheck(idx, 'isUseSecondaryActivities')}
                      disabled={!el.isChecked}
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

export default SelectSitesPage;
