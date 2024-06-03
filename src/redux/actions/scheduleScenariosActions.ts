import { isArray } from 'lodash';

import { createAction, createAsyncThunk } from '@reduxjs/toolkit';

import restApi from '../../api/rest';
import {
  TFindScenarioFromSnapshot,
  TFindScenarios,
  TOpenForecastScenarioSnapshot,
} from '../../api/ts/interfaces/forecast';
import {
  TDeleteScenarioParams,
  TFindScenarioFromSnapshotParams,
  TGetSitesParams,
  TOpenScenarioSnapshotParams,
  TRenameScenarioParams,
  TSaveScenarioCommentsParams,
} from '../../api/ts/interfaces/scenario';
import { components } from '../../api/ts/customer_api.types';
import { TChangedScenarioParams } from '../../components/ScheduleScenariosComponents/InfoView/InfoViewContainer';
import {
  forecastSnapshotIdSelector,
  selectedScenarioSelector,
  selectedScenarioTypeSelector,
  snapshotIdSelector,
} from '../selectors/scheduleScenariosSelector';
import { AppDispatch, GetRootState } from '../store';
import { ScenarioTypes } from '../ts/intrefaces/scheduleScenarios';
import { EScheduleScenariosActionTypes } from './types/scheduleScenariosActionTypes';

export const getScheduleScenarios = () => {
  return async (dispatch: AppDispatch, getstate: GetRootState) => {
    const snapshotId = snapshotIdSelector(getstate());
    await restApi.closeAgentDaySnapshot({ snapshotId: String(snapshotId) });
    const forecastSnapshotId = forecastSnapshotIdSelector(getstate());
    await restApi.closeAgentDaySnapshot({ snapshotId: String(forecastSnapshotId) });
    const selectedScenarioType = selectedScenarioTypeSelector(getstate());
    const openScenarioPayloadByType = {
      [ScenarioTypes.MY]: { ownership: 0 },
      [ScenarioTypes.SHARED]: { typeFilter: 1, ownership: 1 },
      [ScenarioTypes.OTHER]: { typeFilter: [0, 2], ownership: 1 },
    } as Record<
      number,
      {
        ownership: components['schemas']['OpenScenarioSnapshotDto']['ownership'];
        // typeFilter?: components['schemas']['OpenScenarioSnapshotDto']['typeFilter'];
      }
    >;
    const payload: TOpenScenarioSnapshotParams = openScenarioPayloadByType[selectedScenarioType];
    dispatch(openScenarioSnapshotAction(payload)).then(({ payload }: any) => {
      const { snapshotId } = payload.data.data;
      const fetchPayload = {
        snapshotId,
        firstIndex: 0,
        lastIndex: 16,
        infoType: 0,
        provideUserInfo: true,
      };
      dispatch(findScenarioFromSnapshotAction(fetchPayload));
    });
  };
};

export const openScenarioSnapshotAction = createAsyncThunk(
  EScheduleScenariosActionTypes.OPEN_SCENARIO_SNAPSHOT,
  async (payload: TOpenScenarioSnapshotParams) => {
    return restApi.openScenarioSnapshot(payload);
  },
);

export const findScenarioFromSnapshotAction = createAsyncThunk(
  EScheduleScenariosActionTypes.LOAD_SCENARIOS,
  async (payload: TFindScenarioFromSnapshotParams) => {
    return restApi.findScenarioFromSnapshot(payload);
  },
);

export const setSelectedScenarioAction = createAction(
  EScheduleScenariosActionTypes.SELECT_SCENARIO,
  (scenarioIndex: number) => ({
    payload: {
      scenarioIndex,
    },
  }),
);

export const setOpenNewScenarioWizardAction = (param: any) => ({
  type: EScheduleScenariosActionTypes.SET_OPEN_NEW_SCENARIO_WIZARD,
  payload: param,
});

export const sortScenariosAction = createAction(EScheduleScenariosActionTypes.SORT_SCENARIOS);

export const getSitesAction = createAsyncThunk(
  EScheduleScenariosActionTypes.GET_SITES,
  async (payload: TGetSitesParams) => {
    return restApi.getSites(payload);
  },
);

export const changeSelectedScenarioType = (data: ScenarioTypes) => ({
  type: EScheduleScenariosActionTypes.SET_SELECTED_SCENARIO_TYPE,
  payload: data,
});

export const toggleDeleteScenarioPopup = createAction(EScheduleScenariosActionTypes.TOGGLE_DELETE_SCENARIO_POPUP);

export const deleteScenarioAction = createAsyncThunk(
  EScheduleScenariosActionTypes.DELETE_SCENARIO,
  async (payload: TDeleteScenarioParams) => {
    return restApi.deleteScenario(payload);
  },
);

export const openForecastScenarioSnapshotAction = () => {
  return async (dispatch: AppDispatch, getState: GetRootState) => {
    const selectedScenario = selectedScenarioSelector(getState());
    const openForecastScenarioPayload: TOpenForecastScenarioSnapshot = {
      ownership: 3,
      startDate: new Date(selectedScenario.startDate).toISOString(),
      endDate: new Date(selectedScenario.endDate).toISOString(),
    };
    const { id } = (await restApi.forecastOpenScenarioSnapshot(openForecastScenarioPayload)).data.data;

    const forecastFindScenarioFromSnapshotPayload = {
      snapshotId: id,
      firstIndex: 0,
      lastIndex: 0,
    };
    dispatch(findForecastScenarioFromSnapshotAction(forecastFindScenarioFromSnapshotPayload));
  };
};

export const findForecastScenarioFromSnapshotAction = createAsyncThunk(
  EScheduleScenariosActionTypes.LOAD_FORECAST_SCENARIOS,
  async (payload: TFindScenarioFromSnapshot) => {
    return restApi.forecastFindScenarioFromSnapshot(payload);
  },
);
export const saveScenarioCommentsAction = createAsyncThunk(
  EScheduleScenariosActionTypes.SAVE_SCENARIO_COMMENTS,
  async (payload: TSaveScenarioCommentsParams) => {
    return restApi.saveScenarioComments(payload);
  },
);

export const renameScenarioAction = createAsyncThunk(
  EScheduleScenariosActionTypes.RENAME_SCENARIO,
  async (payload: TRenameScenarioParams) => {
    return restApi.renameScenario(payload);
  },
);

export const saveChangedScenarioAction = (data: TChangedScenarioParams) => {
  return async (dispatch: AppDispatch) => {
    const { scenarioId = -1, name = '', comments = '' } = data;

    await dispatch(
      saveScenarioCommentsAction({
        scenarioId: scenarioId,
        comments: `${comments}`,
      }),
    );

    await dispatch(
      renameScenarioAction({
        scenarioId,
        name: `${name}`,
      }),
    );
    dispatch(getScheduleScenarios());
  };
};

export const findScenariosAction = createAsyncThunk(
  EScheduleScenariosActionTypes.FIND_SCENARIOS,
  async (payload: TFindScenarios) => {
    if (payload.scenarioIds && isArray(payload.scenarioIds) && payload.scenarioIds.length === 0) return;
    if (!payload.scenarioIds) return;
    return restApi.forecastFindScenarios(payload);
  },
);

export const toggleFilterMenuAction = createAction(EScheduleScenariosActionTypes.TOGGLE_FILTER_MENU);
export const toggleFilterItemAction = createAction(EScheduleScenariosActionTypes.TOGGLE_FILTER_ITEM, (id: string) => ({
  payload: id,
}));