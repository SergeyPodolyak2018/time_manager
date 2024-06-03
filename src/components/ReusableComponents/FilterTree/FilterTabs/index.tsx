import React, { FC } from 'react';
import styles from './filterTabs.module.scss';
import classnames from 'classnames';

export interface IFilterTabs extends React.HTMLProps<HTMLElement> {
  activeTab: ActiveTab;
  setActiveTab: (val: any) => void;
}

export type ActiveTab = 'Agents' | 'Activities';

const items: ActiveTab[] = ['Agents', 'Activities'];

const FilterTabs: FC<IFilterTabs> = props => {
  const { activeTab, setActiveTab } = props;

  return (
    <div
      className={`
        ${styles.filterTabs} 
    `}
    >
      <div className={styles.filterTabs__wrapper}>
        {items.map(item => (
          <div className={styles.filterTabs__btnWrapper} key={item}>
            <button id={item + '-tab'}
              className={classnames({
                [styles.filterTabs__btn]: true,
                [styles.filterTabs__agentsBtn]: item === 'Agents',
                [styles.filterTabs__activitiesBtn]: item === 'Activities',
                [styles['filterTabs__agentsBtn--active']]: activeTab === item && item === 'Agents',
                [styles['filterTabs__activitiesBtn--active']]: activeTab === item && item === 'Activities',
              })}
              onClick={() => setActiveTab(item)}
            >
              <div className={styles.btnCaption}>{item}</div>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilterTabs;
