import { createSelector } from 'reselect';

import { ScheduleScenariosState } from '../../common/constants';
import { masterScenario } from '../reducers/scheduleScenariosReducer';
import { rootSelector } from '.';

export const scheduleScenarioSelector = createSelector(rootSelector, state => state[ScheduleScenariosState]);

export const scenariosSelector = createSelector(scheduleScenarioSelector, data => data.scenarios);

export const isNewScenarioWizardOpen = createSelector(scheduleScenarioSelector, data => data.newScenarioWizardOpen);

export const snapshotIdSelector = createSelector(scheduleScenarioSelector, data => data.snapshotId);

export const selectedScenarioTypeSelector = createSelector(scheduleScenarioSelector, data => data.selectedScenarioType);

export const selectedScenarioIndexSelector = createSelector(
  scheduleScenarioSelector,
  data => data.selectedScenarioIndex,
);
export const selectedScenarioSelector = createSelector(
  [scenariosSelector, selectedScenarioIndexSelector],
  (scenarios, selectedScenarioIndex) => scenarios[selectedScenarioIndex],
);

export const isScenariosSortedSelector = createSelector(scheduleScenarioSelector, data => data.isScenariosSorted);

export const sitesSelector = createSelector(scheduleScenarioSelector, data => data.sites);

export const deleteScenarioPopupOpenSelector = createSelector(
  scheduleScenarioSelector,
  data => data.deleteScenarioPopupOpen,
);
export const deleteLoadingSelector = createSelector(scheduleScenarioSelector, data => data.deleteLoading);
export const forecastSnapshotIdSelector = createSelector(scheduleScenarioSelector, data => data.forecastSnapshotId);
export const forecastScenariosSelector = createSelector(scheduleScenarioSelector, data => data.forecastScenarios);
export const forecastScenariosIdsSelector = createSelector(scheduleScenarioSelector, data => data.forecastScenariosIds);
const forecastScenariosFromForecastGetScenariosSelector = createSelector(
  scheduleScenarioSelector,
  data => data.forecastScenariosFromForecastGetScenarios,
);

export const forecastScenarioInfoSelector = createSelector(
  [selectedScenarioSelector, forecastScenariosFromForecastGetScenariosSelector],
  (selectedScenario, forecastScenariosFromForecastGetScenarios) => {
    return (
      forecastScenariosFromForecastGetScenarios.find(scenario => scenario.id === selectedScenario?.forecastId) ||
      masterScenario
    );
  },
);

export const filterMenuOpenSelector = createSelector(scheduleScenarioSelector, data => data.filterMenuOpen);
export const filterMenuCheckedIdsSelector = createSelector(scheduleScenarioSelector, data => data.filterMenuCheckedIds);