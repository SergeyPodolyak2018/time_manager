import { TForecastScenarioInformation } from '../../../../api/ts/interfaces/forecast';
import { TOpenScenarioSnapshotResponse, TScheduleScenario, TSite } from '../../../../api/ts/interfaces/scenario';

export type TScheduleScenariosStore = {
  scenarios: TScheduleScenario[];
  snapshotId: TOpenScenarioSnapshotResponse['data']['snapshotId'];
  selectedScenarioIndex: number;
  newScenarioWizardOpen: boolean;
  isScenariosSorted: boolean;
  sites: TSite[];
  selectedScenarioType: ScenarioTypes;
  deleteScenarioPopupOpen: boolean;
  deleteLoading: boolean;

  forecastSnapshotId: TOpenScenarioSnapshotResponse['data']['snapshotId'];
  forecastScenarios: TForecastScenarioInformation[];
  forecastScenariosIds: number[];
  forecastScenariosFromForecastGetScenarios: TForecastScenarioInformation[];
  filterMenuOpen: boolean;
  filterMenuCheckedIds: string[];
};

export enum ScenarioTypes {
  MY,
  SHARED,
  OTHER,
}
