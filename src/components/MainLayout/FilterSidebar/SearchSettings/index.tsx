import React from 'react';
import styles from './searchSettings.module.scss';
import SettingsOption from './SettingsOption';
import { ActiveTab } from '../FilterTabs';

export interface ISearchSettings extends React.HTMLProps<HTMLElement> {
  onClickSettingsCheckbox: (type: any) => void;
  selectedOption: SearchOptions;
  activeTab: ActiveTab;
  isConventionalSearch?: boolean;
  excludeType?:SearchOptions[]
}

export type SearchOptions = 'agentName' | 'businessUnits' | 'sites' | 'teams' | 'agentId' | 'activities';

export interface searchType {
  text: 'Agent name' | 'Business unit' | 'Site' | 'Team' | 'Employee ID' | 'Activity' | 'Employee ID (conventional)' ;
  type: SearchOptions;
  tab: ActiveTab | 'All';
  conventional?: boolean;
}

const searchTypes: searchType[] = [
  {
    text: 'Activity',
    type: 'activities',
    tab: 'Activities',
  },
  {
    text: 'Agent name',
    type: 'agentName',
    tab: 'Agents',
  },
  {
    text: 'Business unit',
    type: 'businessUnits',
    tab: 'All',
  },
  {
    text: 'Site',
    type: 'sites',
    tab: 'All',
  },
  {
    text: 'Team',
    type: 'teams',
    tab: 'Agents',
  }
];

const additionalSearchTypes: searchType[] = [
  {
    text: 'Employee ID',
    type: 'agentId',
    tab: 'Agents',
    conventional: false

  },
  {
    text: 'Employee ID (conventional)',
    type: 'agentId',
    tab: 'Agents',
    conventional: true
  },
];

const SearchSettings = (props: ISearchSettings) => {
  const { onClickSettingsCheckbox, selectedOption, activeTab, isConventionalSearch, excludeType=[] } = props;

  return (
    <div className={styles.searchSettings}>
      {searchTypes.filter(el=>!excludeType.includes(el.type)).map(
        item =>
          (item.tab === 'All' || item.tab === activeTab) && (
            <SettingsOption
              key={item.type}
              item={item}
              checked={selectedOption === item.type}
              onClickSettingsCheckbox={onClickSettingsCheckbox}
            />
          ),
      )}
      <div className={styles.delimiter}/>
      {additionalSearchTypes.map(
        (item, index) =>
          (item.tab === 'All' || item.tab === activeTab) && (
            <SettingsOption
              key={`${item.type}-${index}`}
              item={item}
              checked={selectedOption === item.type && isConventionalSearch === item.conventional}
              onClickSettingsCheckbox={onClickSettingsCheckbox}
            />
          ),
      )}
    </div>
  );
};

export default SearchSettings;
