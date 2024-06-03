import { AxiosResponse } from 'axios';

import { createReducer } from '@reduxjs/toolkit';

import { TForecastScenarioInformation } from '../../api/ts/interfaces/forecast';
import {
    TFindScenarioFromSnapshotResponse, TOpenScenarioSnapshotResponse
} from '../../api/ts/interfaces/scenario';
import { columnsForFilter } from '../../components/ScheduleScenariosComponents/FilterMenu';
import { EScheduleScenariosActionTypes } from '../actions/types/scheduleScenariosActionTypes';
import { ScenarioTypes, TScheduleScenariosStore } from '../ts/intrefaces/scheduleScenarios';

const allFilterMenuIds = columnsForFilter.map(column => column.id);
export const masterScenario: Partial<TForecastScenarioInformation> = {
  name: 'MASTER',
};

const initialState: TScheduleScenariosStore = {
  scenarios: [],
  snapshotId: '',
  selectedScenarioIndex: -1,
  newScenarioWizardOpen: false,
  isScenariosSorted: false,
  sites: [],
  selectedScenarioType: ScenarioTypes.MY,
  deleteScenarioPopupOpen: false,
  deleteLoading: false,
  forecastSnapshotId: '',
  forecastScenarios: [],
  forecastScenariosIds: [],
  forecastScenariosFromForecastGetScenarios: [],
  filterMenuOpen: true,
  filterMenuCheckedIds: allFilterMenuIds,
};

export const scheduleScenariosReducer = createReducer(initialState, {
  [`${EScheduleScenariosActionTypes.OPEN_SCENARIO_SNAPSHOT}/fulfilled`]: (
    state,
    action: { payload: AxiosResponse<TOpenScenarioSnapshotResponse> },
  ) => {
    state.snapshotId = action.payload.data.data.snapshotId;
  },
  [`${EScheduleScenariosActionTypes.LOAD_FORECAST_SCENARIOS}/fulfilled`]: (
    state,
    action: { payload: { data: { data: TForecastScenarioInformation[] } } },
  ) => {
    const scenarios = action.payload.data.data;

    state.forecastScenarios = [masterScenario as TForecastScenarioInformation, ...scenarios].filter(
      scenario => scenario.name,
    );
  },
  [`${EScheduleScenariosActionTypes.LOAD_SCENARIOS}/fulfilled`]: (
    state,
    action: { payload: AxiosResponse<TFindScenarioFromSnapshotResponse> },
  ) => {
    state.scenarios = action.payload.data.data;
    state.forecastScenariosIds = action.payload.data.data
      .map(scenario => scenario.forecastId)
      .filter(id => id !== 0)
      // remove duplicates
      .filter((value, index, self) => self.indexOf(value) === index);
  },
  [EScheduleScenariosActionTypes.SELECT_SCENARIO]: (state, action: { payload: { scenarioIndex: number } }) => {
    state.selectedScenarioIndex = action.payload.scenarioIndex;
  },
  [EScheduleScenariosActionTypes.SET_OPEN_NEW_SCENARIO_WIZARD]: (
    state: typeof initialState,
    action: { payload: boolean },
  ) => {
    state.newScenarioWizardOpen = action.payload;
  },
  [EScheduleScenariosActionTypes.SORT_SCENARIOS]: state => {
    const isSorted = state.isScenariosSorted;
    const selectedScenario = state.scenarios[state.selectedScenarioIndex];

    const sorted_scenarios = [...state.scenarios].sort((scenario1, scenario2) => {
      return isSorted ? scenario1.name.localeCompare(scenario2.name) : scenario2.name.localeCompare(scenario1.name);
    });

    state.scenarios = sorted_scenarios;
    if (state.selectedScenarioIndex !== -1) {
      state.selectedScenarioIndex = sorted_scenarios.findIndex(scenario => {
        return (
          scenario.name === selectedScenario.name &&
          scenario.createDateTime === selectedScenario.createDateTime &&
          scenario.timestamp === selectedScenario.timestamp
        );
      });
    }
    state.isScenariosSorted = !state.isScenariosSorted;
  },
  [EScheduleScenariosActionTypes.SET_SELECTED_SCENARIO_TYPE]: (
    state: typeof initialState,
    action: { payload: ScenarioTypes },
  ) => {
    state.selectedScenarioType = action.payload;
  },
  [`${EScheduleScenariosActionTypes.GET_SITES}/fulfilled`]: (
    state,
    action: { payload: AxiosResponse<TFindScenarioFromSnapshotResponse> },
  ) => {
    state.sites = action.payload.data.data;
  },
  [`${EScheduleScenariosActionTypes.DELETE_SCENARIO}/pending`]: state => {
    state.deleteLoading = true;
  },
  [`${EScheduleScenariosActionTypes.DELETE_SCENARIO}/fulfilled`]: state => {
    state.deleteLoading = false;
  },
  [EScheduleScenariosActionTypes.TOGGLE_DELETE_SCENARIO_POPUP]: state => {
    state.deleteScenarioPopupOpen = !state.deleteScenarioPopupOpen;
  },
  [`${EScheduleScenariosActionTypes.FIND_SCENARIOS}/fulfilled`]: (
    state,
    action: { payload: { data: AxiosResponse<TForecastScenarioInformation[]> } },
  ) => {
    if (action.payload) state.forecastScenariosFromForecastGetScenarios = action.payload.data.data;
  },
  [EScheduleScenariosActionTypes.TOGGLE_FILTER_MENU]: state => {
    state.filterMenuOpen = !state.filterMenuOpen;
  },
  [EScheduleScenariosActionTypes.TOGGLE_FILTER_ITEM]: (state, action: { payload: string }) => {
    if (action.payload === 'allStatuses' && state.filterMenuCheckedIds.length > 0) {
      state.filterMenuCheckedIds = [];
      return;
    } else if (action.payload === 'allStatuses' && state.filterMenuCheckedIds.length === 0) {
      state.filterMenuCheckedIds = allFilterMenuIds;
      return;
    }
    const index = state.filterMenuCheckedIds.indexOf(action.payload);
    if (index === -1) {
      state.filterMenuCheckedIds.push(action.payload);
    } else {
      state.filterMenuCheckedIds.splice(index, 1);
    }
    // fix allStatuses id persisting in filterMenuCheckedIds
    if (
      state.filterMenuCheckedIds.length === allFilterMenuIds.length - 1 &&
      !state.filterMenuCheckedIds.includes('allStatuses')
    ) {
      state.filterMenuCheckedIds.push('allStatuses');
    }
    // remove allStatuses id from filterMenuCheckedIds if not all statuses are checked
    if (
      state.filterMenuCheckedIds.length < allFilterMenuIds.length &&
      state.filterMenuCheckedIds.includes('allStatuses')
    ) {
      state.filterMenuCheckedIds.splice(state.filterMenuCheckedIds.indexOf('allStatuses'), 1);
    }
  },
});