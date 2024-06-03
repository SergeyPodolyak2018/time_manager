import { ApiCallParams, ApiResponse } from '../apiCall';
import { components } from '../customer_api.types';

export type TOpenScenarioSnapshotParams = ApiCallParams<'/customer/schedule/openScenarioSnapshot', 'post'>;
export type TFindScenarioFromSnapshotParams = ApiCallParams<'/customer/schedule/findScenarioFromSnapshot', 'post'>;
export type TDeleteScenarioParams = ApiCallParams<'/customer/schedule/deleteScenario', 'post'>;

export type TDeleteScenarioResponse = ApiResponse<'/customer/schedule/deleteScenario', 'post'>;
export type TCreateScenarioParams = ApiCallParams<'/customer/schedule/createScenario', 'post'>;

export type TScheduleScenario = components['schemas']['SchScenario'];

export type TFindScenarioFromSnapshotResponse = { data: components['schemas']['SchScenario'][] };
export type TCreateScenarioResponse = ApiResponse<'/customer/schedule/createScenario', 'post'>;
export type TOpenScenarioSnapshotResponse = { data: components['schemas']['SchScenarioSnapshot'] };

export type TGetSitesParams = ApiCallParams<'/customer/config/findSites', 'post'>;
export type TSite = components['schemas']['CfgSite'];

export type TGetScenarioPayload = ApiCallParams<'/customer/schedule/getScenario', 'post'>;
export type TGetScenarioResponse = ApiResponse<'/customer/schedule/getScenario', 'post'>;

export type TRenameScenarioParams = ApiCallParams<'/customer/schedule/renameScenario', 'post'>;
export type TSaveScenarioCommentsParams = ApiCallParams<'/customer/schedule/saveScenarioComments', 'post'>;