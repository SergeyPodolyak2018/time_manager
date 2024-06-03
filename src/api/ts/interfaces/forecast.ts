import { ApiCallParams } from '../apiCall';
import { components } from '../customer_api.types';

export type TForecastScenarioInformation = Required<components['schemas']['FrcScenarioInformation']>;
export type TOpenForecastScenarioSnapshot = ApiCallParams<'/customer/forecast/openScenarioSnapshot', 'post'>;
export type TOpenForecastScenarioSnapshotResponse = components['schemas']['FrcScenarioSnapshot'];

export type TFindScenarioFromSnapshot = ApiCallParams<'/customer/forecast/findScenarioFromSnapshot', 'post'>;

export type TFindScenarioInSnapshot = ApiCallParams<'/customer/forecast/findScenarioInSnapshot', 'post'>;
export type TFindScenarioInSnapshotResponse = components['schemas']['Number'];
export type TFindScenarios = ApiCallParams<'/customer/forecast/findScenarios', 'post'>;
export type TFindScenariosResponse = TForecastScenarioInformation[];