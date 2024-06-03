import React, { FC } from 'react';
import styles from './displaySettings.module.scss';
import Checkbox from '../../../ReusableComponents/Checkbox';
import InputRadio from '../../../ReusableComponents/InputRadio';
import classnames from 'classnames';

export interface IDisplaySettingsProps extends React.HTMLProps<HTMLElement> {
  activeView: DisplayNameSettings;
  multiplyDisplaySettings: IMultiplyDisplaySettings;
  onClickCheckbox: (type: DisplayMultiplySettings) => void;
  onClickRadio: (type: DisplayNameSettings) => void;
  onClickReset: () => void;
}

export type DisplayNameSettings = 'fullName' | 'fullNameAndEmployeeId' | 'employeeId';
export type DisplayMultiplySettings = 'showCounter' | 'showEmpty';

export interface IMultiplyDisplaySettings {
  showCounter: boolean;
  showEmpty: boolean;
}

export interface IDisplaySetting {
  type: DisplayNameSettings;
  text: string;
}

export interface IDisplaySettingMultiply {
  type: DisplayMultiplySettings;
  text: string;
}

const radios: IDisplaySetting[] = [
  {
    type: 'fullName',
    text: 'First name Last name',
  },
  {
    type: 'fullNameAndEmployeeId',
    text: '“Employee ID” First name Last name',
  },
  {
    type: 'employeeId',
    text: 'Employee ID',
  },
];

const checkboxes: IDisplaySettingMultiply[] = [
  {
    type: 'showCounter',
    text: 'Show counter',
  },
  {
    type: 'showEmpty',
    text: 'Show empty',
  },
];

const clearAll = {
  type: 'clear',
  text: 'Clear selected agents',
};

const DisplaySettings: FC<IDisplaySettingsProps> = props => {
  const { activeView, onClickCheckbox, onClickRadio, multiplyDisplaySettings, onClickReset } = props;

  return (
    <div
      className={classnames({
        [styles.settingDisplay]: true,
      })}
    >
      {radios.map(item => (
        <div
          key={item.type}
          datatype={item.type}
          className={styles.settingDisplay__itemWrapper}
          onClick={() => onClickRadio(item.type)}
        >
          <div
            className={classnames({
              [styles.settingDisplay__item]: true,
              [styles['settingDisplay__item--iconFullName']]: item.type === 'fullName',
              [styles['settingDisplay__item--iconFullNameAndId']]: item.type === 'fullNameAndEmployeeId',
              [styles['settingDisplay__item--id']]: item.type === 'employeeId',
              [styles['settingDisplay__item--iconFullNameActive']]:
                activeView === item.type && item.type === 'fullName',
              [styles['settingDisplay__item--iconFullNameAndIdActive']]:
                activeView === item.type && item.type === 'fullNameAndEmployeeId',
              [styles['settingDisplay__item--idActive']]: activeView === item.type && item.type === 'employeeId',
            })}
          >
            <span className={styles['settingDisplay__item--text']}>{item.text}</span>
            <InputRadio checked={activeView === item.type} onClick={() => onClickRadio(item.type)} />
          </div>
        </div>
      ))}
      {checkboxes.map(item => (
        <div key={item.type} className={styles.settingDisplay__itemWrapper} onClick={() => onClickCheckbox(item.type)}>
          <div
            id={'searchBtn'}
            datatype={item.type}
            className={`
              ${styles.settingDisplay__item}
              ${item.type === 'showCounter' ? styles['settingDisplay__item--iconCounter'] : ''}
              ${item.type === 'showEmpty' ? styles['settingDisplay__item--iconEmpty'] : ''}
              ${
                item.type === 'showCounter' && multiplyDisplaySettings[item.type]
                  ? styles['settingDisplay__item--iconCounterActive']
                  : ''
              }
              ${
                item.type === 'showEmpty' && multiplyDisplaySettings[item.type]
                  ? styles['settingDisplay__item--iconEmptyActive']
                  : ''
              }
            `}
          >
            <span className={styles['settingDisplay__item--text']}>{item.text}</span>
            <Checkbox checked={multiplyDisplaySettings[item.type]} onClick={() => onClickCheckbox(item.type)} />
          </div>
        </div>
      ))}
      <div className={styles.settingDisplay__itemWrapper} onClick={() => onClickReset()}>
        <div className={`${styles.settingDisplay__item} ${styles['settingDisplay__item--iconReset']}`}>
          {clearAll.text}
        </div>
      </div>
    </div>
  );
};

export default DisplaySettings;
