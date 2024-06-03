import React from 'react';
import styles from './filterPanel.module.scss';
import FilterItem from './filterItem';
import { FilterType } from '../index';
import { ScenarioTypes } from '../../../../redux/ts/intrefaces/scheduleScenarios';

export interface IFilterItems extends React.HTMLProps<HTMLElement> {
  onClickItem: (type: ScenarioTypes) => void;
}


const FilterItems = (props: IFilterItems) => {
  const { onClickItem } = props;

  return (
    <div className={styles.filterItemsWrapper} id="filterItems">
        <div style={{ width: '100%' }} key={FilterType.myScenarios + 'key'}>
          <FilterItem
            key={FilterType.myScenarios}
            content={`My scenarios`}
            type={FilterType.myScenarios}
            onClick={() => onClickItem(ScenarioTypes.MY)}
          />
        </div>
        <div style={{ width: '100%' }} key={FilterType.sharedScenarios + 'key'}>
          <FilterItem
            key={FilterType.sharedScenarios}
            content={`Shared scenarios`}
            type={FilterType.sharedScenarios}
            onClick={() => onClickItem(ScenarioTypes.SHARED)}
          />
        </div>
        <div style={{ width: '100%' }} key={FilterType.otherScenarios + 'key'}>
          <FilterItem
            key={FilterType.otherScenarios}
            content={`Other scenarios`}
            type={FilterType.otherScenarios}
            onClick={() => onClickItem(ScenarioTypes.OTHER)}
          />
        </div>
    </div>
  );
};

export default FilterItems;
