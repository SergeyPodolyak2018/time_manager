import React from 'react';
import styles from './settingsOption.module.scss';
import InputRadio from '../../../../ReusableComponents/InputRadio';

export interface ISettingsOption extends React.HTMLProps<HTMLElement> {
  item: any;
  onClickSettingsCheckbox: (type: any, conventional?: boolean) => void;
  checked: boolean;
}

const SettingsOption = (props: ISettingsOption) => {
  const { item, onClickSettingsCheckbox, checked } = props;

  return (
    <div className={styles.settingsOptionWrapper}>
      <div
        className={`
      ${styles.settingsOption} 
      ${item.type === 'businessUnits' &&  styles['settingsOption--buIcon']}
      ${item.type === 'sites' &&  styles['settingsOption--siteIcon']}
      ${item.type === 'teams' && styles['settingsOption--teamIcon']}
      ${item.type === 'agentName' &&  styles['settingsOption--agentNameIcon']}
      ${item.type === 'agentId' && !item.conventional && styles['settingsOption--agentIdIcon']}
      ${item.type === 'agentId' && item.conventional && styles['settingsOption--agentIdConventionalIcon']}
      ${item.type === 'activities' && styles['settingsOption--activityIcon']}

      ${item.type === 'businessUnits' && checked && styles['settingsOption--buIconActive']}
      ${item.type === 'sites' && checked && styles['settingsOption--siteIconActive']}
      ${item.type === 'teams' && checked && styles['settingsOption--teamIconActive']}
      ${item.type === 'agentName' && checked && styles['settingsOption--agentNameIconActive']}
      ${item.type === 'agentId' && checked && styles['settingsOption--agentIdIconActive']}
      ${item.type === 'agentId' && checked && !item.conventional && styles['settingsOption--agentIdIconActive']}
      ${item.type === 'agentId' && checked && item.conventional && styles['settingsOption--agentIdConventionalIconActive']}
      ${item.type === 'activities' && checked && styles['settingsOption--activityIconActive']}
    `}
        onClick={() => onClickSettingsCheckbox(item.type, item.conventional)}
      >
        <span className={styles.settingsOption__text}>{item.text}</span>
        <InputRadio onClick={() => onClickSettingsCheckbox(item.type)} checked={checked} />
      </div>
    </div>
  );
};

export default SettingsOption;
