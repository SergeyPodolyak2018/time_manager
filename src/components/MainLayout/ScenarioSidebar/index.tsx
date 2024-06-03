import React, { useEffect } from 'react';
import { connect } from 'react-redux';

import {
  buildTreeWithBuAndSites,
  changeSidebar,
} from '../../../redux/actions/filterAction';
import { useAppDispatch } from '../../../redux/hooks';
import {
  getSidebar,
} from '../../../redux/selectors/filterSelector';
import { IFilterSidebarState } from '../../../redux/ts/intrefaces/filter';
import FilterPanel from './FilterPanel';
import styles from './FilterSidebar.module.scss';
import { changeSelectedScenarioType, getScheduleScenarios } from '../../../redux/actions/scheduleScenariosActions';
import { ScenarioTypes } from '../../../redux/ts/intrefaces/scheduleScenarios';

export enum FilterType {
  'allScenarios' = 'allScenarios',
  'myScenarios' = 'myScenarios',
  'sharedScenarios' = 'sharedScenarios',
  'otherScenarios' = 'otherScenarios'
}

function ScenarioSidebar() {
  const dispatchHook = useAppDispatch();

  useEffect(() => {
    dispatchHook(buildTreeWithBuAndSites({}));
  }, [dispatchHook]);

  const handleClickItem = (type: ScenarioTypes) => {
    dispatchHook(changeSelectedScenarioType(type));
    dispatchHook(getScheduleScenarios())
  };


  return (
    <div
      className={styles.filterSidebar}
    >
      <div className={styles.filterSidebarContainer__wrapper}>
        <div className={styles.filterSidebarContainer}>
          <FilterPanel onClickItem={handleClickItem}/>
        </div>
      </div>
    </div>
  );
}

const mapStateToProps = (state: any) => {
  return {
    sidebar: getSidebar(state),
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    changeSidebar: (state: IFilterSidebarState) => dispatch(changeSidebar(state)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ScenarioSidebar);
