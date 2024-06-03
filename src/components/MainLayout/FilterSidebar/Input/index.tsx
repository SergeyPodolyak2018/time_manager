import React, { useState } from 'react';
import styles from './input.module.scss';
import { SearchOptions } from '../SearchSettings';
import classnames from 'classnames';
import { ActiveTab } from '../FilterTabs';
import InputTagSearch from './InputTag';

export interface IInputProps extends React.HTMLProps<HTMLElement> {
  searchOption: SearchOptions;
  dropDownIsClosed: boolean;
  onChange: (e: any) => void;
  onClickSettings?: () => void;
  onClickSettingsView?: () => void;
  onClickTagsDropdown: () => void;
  isTagsDropdownOpen?: boolean;
  value?: string;
  activeTab: ActiveTab;
  setHighlightedValue: (value: string) => void;
  startSearch: (value: string) => void;
  words: string[];
  setWords: (words: string[]) => void;
  isConventionalSearch: boolean;
  loading: boolean;
}

export type ISearchPlaceholder = {
  [key in SearchOptions]: string;
};

const searchPlaceholder: ISearchPlaceholder = {
  agentId: 'Look up agent by employee ID',
  businessUnits: 'Search business units',
  sites: 'Search sites',
  teams: 'Search teams',
  agentName: 'Search agents by name',
  activities: 'Search activities',
};

const InputSearch = (props: IInputProps) => {
  const {
    value,
    dropDownIsClosed,
    onChange,
    onClickSettings,
    onClickSettingsView,
    onClickTagsDropdown,
    isTagsDropdownOpen,
    searchOption,
    activeTab,
    setHighlightedValue,
    startSearch,
    words,
    setWords,
    isConventionalSearch,
    loading,
  } = props;
  const [firstStateButton, changeFirstState] = useState(false);
  const [secondStateButton, changeSecondState] = useState(false);

  const isClosed = () => {
    return !firstStateButton && !secondStateButton;
  };

  if (dropDownIsClosed && !isClosed()) {
    changeFirstState(false);
    changeSecondState(false);
  }

  const onItemClick = (clickFunction: any, firstState: boolean, secondState: boolean) => {
    if (clickFunction) {
      clickFunction();
    }
    changeFirstState(firstState);
    changeSecondState(secondState);
  };

  return (
    <div
      className={classnames(styles.inputWrapper, {
        [styles.inputWrapper__loading]: loading,
      })}
    >
      {searchOption === 'agentId' ? (
        <InputTagSearch
          words={words}
          setWords={setWords}
          value={value}
          onChange={onChange}
          onClickTagsDropdown={onClickTagsDropdown}
          isTagsDropdownOpen={isTagsDropdownOpen}
          searchPlaceholderValue={searchPlaceholder[searchOption]}
          setHighlightedValue={setHighlightedValue}
          startSearch={startSearch}
          isConventionalSearch={isConventionalSearch}
        />
      ) : (
        <input
          id="search-input"
          autoComplete={'off'}
          className={styles.input}
          onChange={e => onChange(e.target.value)}
          value={value}
          placeholder={searchPlaceholder[searchOption]}
        />
      )}
      <button
        className={classnames({
          [styles.input__btn]: true,
          [styles.input__btn_active]: firstStateButton,
          [styles[firstStateButton ? 'input__btnAgentNameActive' : 'input__btnAgentName']]:
            searchOption === 'agentName',
          [styles[firstStateButton ? 'input__btnAgentIdActive' : 'input__btnAgentId']]: searchOption === 'agentId',
          [styles[firstStateButton ? 'input__btnBUActive' : 'input__btnBU']]: searchOption === 'businessUnits',
          [styles[firstStateButton ? 'input__btnSiteActive' : 'input__btnSite']]: searchOption === 'sites',
          [styles[firstStateButton ? 'input__btnTeamActive' : 'input__btnTeam']]: searchOption === 'teams',
          [styles[firstStateButton ? 'input__btnActivitiesActive' : 'input__btnActivities']]:
            searchOption === 'activities',
        })}
        id={'searchBtn'}
        datatype={'searchBtn'}
        onClick={() => onItemClick(onClickSettingsView, true, false)}
      />
      <button
        datatype={'settingsBtn'}
        id={'searchBtn'}
        className={classnames({
          [styles.input__settingsBtn]: true,
          [styles.input__btn]: true,
          [styles.input__btn_active]: secondStateButton,
          [styles['input__settingsBtn--inactive']]: activeTab === 'Activities',
          [styles['input__Active']]: activeTab !== 'Activities' && secondStateButton,
        })}
        onClick={() => {
          if (activeTab !== 'Activities') {
            onItemClick(onClickSettings, false, true);
          }
        }}
      />
    </div>
  );
};

export default InputSearch;
