import * as R from 'ramda';

import axios from './axios';
import { IBusinessUnits, ICfgContract } from '../common/interfaces/config';
import {
  IAgentSchedule,
  IMarkedTime,
  ISchActivity,
  ISchActivitySet,
} from '../common/interfaces/schedule/IAgentSchedule';
import { IResponseValidateAgentDay, IWarning } from '../common/interfaces/schedule/IWarning';
import { ICfgAuditLog } from '../common/models/cfg.auditLog';
import { ICfgException } from '../common/models/cfg.exeption';
import { ICfgTimeOff } from '../common/models/cfg.timeOff';
import logger from '../helper/logger';
import Utils from '../helper/utils';
import { ILoginData } from '../redux/actions/loginActions';
import { ICfgBreak, ICfgMeal, IShifts } from '../redux/ts/intrefaces/timeLine';
import apiHelpers from './apiHelpers';
import { BuildAgentDayInSnapshot } from './ts/interfaces/buildAgentDayInSnapshot';
import { ICalcScheduleResponse } from './ts/interfaces/calcScheduleResponse';
import {
    FetchAgents,
    FetchBu,
    FetchTeams,
    FindBreaks,
    FindMeals,
    FindShifts,
    ICalcSchedule,
    ICloseAgentDaySnapshot,
    ICreateReOptimizationRequestPayload,
    IFindAgentDayFromSnapshot,
    IFindPerformanceDataFromSnapshot,
    IFindShiftItemsPayload,
    IGetScenarioParamsPayload,
    IInsertAgentDayPayload,
    IOpenAgentDaySnapshot,
    IRebuildRequestPayload, ISessionRequestIdPayload,
    ISetScenarioParamsPayload,
    ISortAgentDaySnapshot,
    SearchAgents,
    SearchTeams,
    TGetColorsPayload,
} from './ts/interfaces/config.payload';
import { FindAgentDay } from './ts/interfaces/findAgentDay.payload';
import {
  IPayLoadFindAgentsFromSnapshot,
  IResponseFindAgentsFromSnapshot,
} from './ts/interfaces/findAgentsFromSnapshot';
import { FindMarkedTimePayload } from './ts/interfaces/findMarkedTime.payload';
import { FindTimeOffPayload } from './ts/interfaces/findTimeOff.payload';
import {
  TFindScenarioFromSnapshot,
  TFindScenarios,
  TFindScenariosResponse,
  TOpenForecastScenarioSnapshot,
  TOpenForecastScenarioSnapshotResponse,
} from './ts/interfaces/forecast';
import {
  IPayLoadGetMeetingFromSnapshot,
  IResponseGetMeetingFromSnapshot,
} from './ts/interfaces/getMeetingtFromSnapshot';
import { IHealthResponse } from './ts/interfaces/health';
import { IInsertAgentDayResponse } from './ts/interfaces/insertAgentDay';
import { IPayloadInserNewMeeting, IResponseInserNewMeeting } from './ts/interfaces/insertNewMeeting';
import { IResponseInsertState } from './ts/interfaces/insertState';
import { OpenAgentDaySnapshotResponse } from './ts/interfaces/openAgentDaySnapshot.response';
import { IPayLoadOpenAgentSnapshot, IResponseOpenAgentSnapshot } from './ts/interfaces/openAgentSnapshot';
import { IPayLoadOpenMeetingSnapshot, IResponseOpenMeetingSnapshot } from './ts/interfaces/openMeetingtSnapshot';
import {
  IPayLoadOpenScheduleAgentSnapshot,
  IResponseOpenScheduleAgentSnapshot,
} from './ts/interfaces/openScheduleAgentSnapshot';
import { IResponse, IResponseData, IStatus } from './ts/interfaces/response';
import {
  TCreateScenarioParams,
  TCreateScenarioResponse,
  TDeleteScenarioParams,
  TDeleteScenarioResponse,
  TFindScenarioFromSnapshotParams,
  TFindScenarioFromSnapshotResponse,
  TGetSitesParams,
  TOpenScenarioSnapshotParams,
  TOpenScenarioSnapshotResponse,
  TRenameScenarioParams,
  TSaveScenarioCommentsParams,
  TSite,
} from './ts/interfaces/scenario';
import { IPayloadScheduleMeeting, IResponseScheduleMeeting } from './ts/interfaces/scheduleMeeting';
import { IAuditLog, IDeleteAgentDay, IRollbackSchedule, IValidateAgentDay } from './ts/interfaces/schedulePayload';
import { IResponseStatusInfo, IResponseStatusResponse, ISchScenarioParams } from './ts/interfaces/SchScenarioParams';
import { TUserInfoResponse } from './ts/responses/userInfo';
import { TGetColorsResponse } from './ts/responses/getColors';
import {
  IGetScenarioWarningsPayload,
  ISaveScenarioWarningsPayload,
  ISchScenarioWarning,
} from './ts/interfaces/scenarioWarnings';
import {
  IPayloadFindContractFromSnapshot,
  IPayloadOpenContractSnapshot,
  IResponseOpenContractSnapshot,
} from './ts/interfaces/openContractFromSnapshot';
import { AxiosResponse } from 'axios';

class RestAPI {
  private readonly base_uri: string;
  private readonly customer_uri: string;

  constructor() {
    this.base_uri = Utils.baseUri + Utils.apiPrefix;
    this.customer_uri = Utils.customerUri + Utils.customerApiPrefix;
    logger.info(`base_uri ${this.base_uri}`);
    logger.info(`customer_uri ${this.customer_uri}`);
  }

  openAgentDaySnapshot(payload: IOpenAgentDaySnapshot): Promise<IResponse<OpenAgentDaySnapshotResponse>> {
    return axios
      .post(`${this.base_uri}/schedule/openAgentDaySnapshot`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  openScheduleAgentSnapshot(payload: IPayLoadOpenScheduleAgentSnapshot): Promise<IResponseOpenScheduleAgentSnapshot> {
    return axios
      .post(`${this.base_uri}/schedule/openScheduleAgentSnapshot`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  async openAgentSnapshot(payload: IPayLoadOpenAgentSnapshot): Promise<IResponseOpenAgentSnapshot> {
    return await axios
      .post(`${this.base_uri}/config/openAgentSnapshot`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  async openMeetingSnapshot(payload: IPayLoadOpenMeetingSnapshot): Promise<IResponseOpenMeetingSnapshot> {
    return await axios
      .post(`${this.base_uri}/config/openMeetingSnapshot`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  async getMeetingFromSnapshot(payload: IPayLoadGetMeetingFromSnapshot): Promise<IResponseGetMeetingFromSnapshot> {
    return await axios
      .post(`${this.base_uri}/config/findMeetingsFromSnapshot`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  async setNewMeeting(payload: IPayloadInserNewMeeting): Promise<IResponseInserNewMeeting> {
    return await axios
      .post(`${this.base_uri}/config/insertMeeting`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  async scheduleMeeting(payload: IPayloadScheduleMeeting): Promise<IResponseScheduleMeeting> {
    return await axios
      .post(`${this.base_uri}/schedule/scheduleMeeting`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  async getScenarioParams(payload: IGetScenarioParamsPayload): Promise<IResponse<ISchScenarioParams[]>> {
    return await axios
      .post(`${this.base_uri}/schedule/getScenarioParams`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  setScenarioParams(payload: ISetScenarioParamsPayload): Promise<IResponse> {
    return axios
      .post(`${this.base_uri}/schedule/setScenarioParams`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  async createScenario(payload: TCreateScenarioParams): Promise<IResponse<TCreateScenarioResponse>> {
    return await axios
      .post(`${this.base_uri}/schedule/createScenario`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  getRequestStatus(payload: IRebuildRequestPayload): Promise<IResponse<IResponseStatusResponse>> {
    return axios
      .post(`${this.base_uri}/builder/getRequestStatus`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  getRequestStatusInfo(payload: IRebuildRequestPayload): Promise<IResponse<IResponseStatusInfo>> {
    return axios
      .post(`${this.base_uri}/builder/getRequestStatusInfo`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  postCancelRequest(payload: IRebuildRequestPayload): Promise<IResponse> {
    return axios
      .post(`${this.base_uri}/builder/cancelRequest`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  postCancelAndSaveRequest(payload: IRebuildRequestPayload): Promise<IResponse> {
    return axios
      .post(`${this.base_uri}/builder/cancelAndSaveRequest`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  closeRequest(payload: IRebuildRequestPayload): Promise<IResponse> {
    return axios
      .post(`${this.base_uri}/builder/closeRequest`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  createReOptimizationRequest(
    payload: ICreateReOptimizationRequestPayload,
  ): Promise<IResponse<IRebuildRequestPayload>> {
    return axios
      .post(`${this.base_uri}/builder/createReOptimizationRequest`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  findAgentDayFromSnapshot(payload: IFindAgentDayFromSnapshot): Promise<IResponse<IAgentSchedule[]>> {
    return axios
      .post(`${this.base_uri}/schedule/findAgentDayFromSnapshot`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  sortAgentDaySnapshot(payload: ISortAgentDaySnapshot) {
    return axios
      .post(`${this.base_uri}/schedule/sortAgentDaySnapshot`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  closeAgentDaySnapshot(payload: ICloseAgentDaySnapshot): Promise<IResponse> {
    return axios
      .post(`${this.base_uri}/session/closeSnapshot`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  findPerformanceDataFromSnapshot(payload: IFindPerformanceDataFromSnapshot): Promise<IResponse<any>> {
    return axios
      .post(`${this.base_uri}/performance/findPerformanceDataFromSnapshot`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  async findPerformanceDataFromSnapshotUseChunks(payload: IFindPerformanceDataFromSnapshot) {
    return await apiHelpers.sendRequestInChunks<[], []>(
      `${this.base_uri}/performance/findPerformanceDataFromSnapshotUseChunk`,
      payload,
      ['agentDays'],
    );
  }

  buildTreeWithBuAndSites(payload: FetchBu): Promise<IResponse<IBusinessUnits>> {
    return axios.post(`${this.base_uri}/config/buildTreeWithBuAndSites`, payload).then(res => res.data);
  }

  buildTreeWithTeamByBuAndSiteId(payload: FetchTeams): Promise<IResponse<IBusinessUnits>> {
    return axios.post(`${this.base_uri}/config/buildTreeWithTeamByBuAndSiteId`, payload).then(res => res.data);
  }

  buildTreeWithTeams(payload: SearchTeams) {
    return axios.post(`${this.base_uri}/config/buildTreeWithTeams`, payload).then(res => res.data);
  }

  buildTreeWithAgents(payload: FetchAgents): Promise<IBusinessUnits> {
    return axios.post(`${this.base_uri}/config/buildTreeWithAgents`, payload).then(res => res.data);
  }

  findAgents(payload: any) {
    return axios
      .post(`${this.base_uri}/config/findAgents`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Error;
      });
  }

  findAgentsFromSnapshot(payload: IPayLoadFindAgentsFromSnapshot): Promise<IResponseFindAgentsFromSnapshot> {
    return axios
      .post(`${this.base_uri}/config/findAgentFromSnapshot`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  searchAgents(payload: SearchAgents) {
    return axios
      .post(`${this.base_uri}/config/searchAgents`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  getAgentShifts(payload: FindShifts): Promise<IResponse<IShifts[]>> {
    return axios
      .post(`${this.base_uri}/config/findShifts`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  findBreaks(payload: FindBreaks): Promise<IResponse<ICfgBreak[]>> {
    return axios
      .post(`${this.base_uri}/config/findBreaks`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  findMeals(payload: FindMeals): Promise<IResponse<ICfgMeal[]>> {
    return axios
      .post(`${this.base_uri}/config/findMeals`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  findExceptions(payload: IFindShiftItemsPayload): Promise<IResponse<ICfgException[]>> {
    return axios
      .post(`${this.base_uri}/config/findExceptions`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  findTimeOffs(payload: FindTimeOffPayload): Promise<IResponse<ICfgTimeOff[]>> {
    return axios
      .post(`${this.base_uri}/config/findTimeOffs`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  findMarkedTimes(payload: FindMarkedTimePayload): Promise<IResponse<IMarkedTime[]>> {
    return axios
      .post(`${this.base_uri}/config/findMarkedTimes`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  getAuditLog(payload: IAuditLog): Promise<IResponse<ICfgAuditLog[]>> {
    return axios
      .post(`${this.base_uri}/schedule/getAuditLog`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  rollbackSchedule(payload: IRollbackSchedule): Promise<IResponse<number[]>> {
    return axios
      .post(`${this.base_uri}/schedule/rollbackSchedule`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  getActivitySet(payload: any): Promise<IResponse<ISchActivitySet[]>> {
    return axios
      .post(`${this.base_uri}/config/findActivitySet`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  getAgentsDay(payload: FindAgentDay): Promise<IResponse<IAgentSchedule[]>> {
    return axios
      .post(`${this.base_uri}/schedule/findAgentDay`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  buildAgentDay(payload: { agentDays: IAgentSchedule[]; scheduleShiftItems: boolean }) {
    return axios
      .post(`${this.base_uri}/schedule/buildAgentDay`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  buildAgentDayAdoptive(payload: BuildAgentDayInSnapshot): Promise<IResponse<IAgentSchedule[]>> {
    return axios
      .post(`${this.base_uri}/schedule/buildAgentDay`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Error;
      });
  }

  buildAgentDayUseChunk(payload: BuildAgentDayInSnapshot) {
    return apiHelpers
      .sendRequestInChunks<IAgentSchedule[], []>(
        `${this.base_uri}/schedule/buildAgentDayUseChunk`,
        payload,
        ['agentDays'],
        { timeout: Utils.GATEWAY_TIME_OUT_LARGE_REQ },
      )
      .then(res => res?.data);
  }

  buildAgentDayInSnapshot(payload: BuildAgentDayInSnapshot): Promise<IResponse<IAgentSchedule[]>> {
    return axios
      .post(`${this.base_uri}/schedule/buildAgentDayInSnapshot`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  buildAgentDayInSnapshotUseChunk(payload: BuildAgentDayInSnapshot) {
    return apiHelpers
      .sendRequestInChunks<IAgentSchedule[], []>(`${this.base_uri}/schedule/buildAgentDayInSnapshotUseChunk`, payload, [
        'agentDays',
      ])
      .then(res => res?.data);
  }

  insertAgentDay(payload: IInsertAgentDayPayload): Promise<IResponse<IInsertAgentDayResponse>> {
    return axios
      .post(`${this.base_uri}/schedule/insertAgentDay`, payload, {
        timeout: Utils.GATEWAY_TIME_OUT_LARGE_REQ,
      })
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  async insertAgentDayUseChunk(payload: IInsertAgentDayPayload) {
    return await apiHelpers.sendRequestInChunks<IInsertAgentDayResponse, []>(
      `${this.base_uri}/schedule/insertAgentDayUseChunk`,
      payload,
      ['agentDays'],
      {
        timeout: Utils.GATEWAY_TIME_OUT_LARGE_REQ,
      },
    );
  }

  insertState(payload: IInsertAgentDayPayload): Promise<IResponse<IResponseInsertState>> {
    return axios
      .post(`${this.base_uri}/schedule/insertState`, payload, { timeout: Utils.GATEWAY_TIME_OUT_LARGE_REQ })
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  insertWorkState(payload: IInsertAgentDayPayload) {
    return axios
      .post(`${this.base_uri}/schedule/insertWorkState`, payload, { timeout: Utils.GATEWAY_TIME_OUT_LARGE_REQ })
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  deleteState(payload: IInsertAgentDayPayload) {
    return axios
      .post(`${this.base_uri}/schedule/deleteState`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  async getActivities(payload: any): Promise<IResponse<ISchActivity[]>> {
    const findActivitiesResponse = await axios.post(`${this.base_uri}/schedule/findActivities`, payload, {
      withCredentials: true,
    });

    return R.prop('data', findActivitiesResponse);
  }

  fetchTimeZones() {
    return axios
      .get(`${this.base_uri}/config/timezone`)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Error;
      });
  }

  helthCheck(): Promise<IHealthResponse> {
    return axios.get(`${this.base_uri}/health`).then(res => {
      return res.data;
    });
  }

  async fetchLogin(credentials: ILoginData) {
    return await axios
      .post(`${this.base_uri}/user/login`, credentials)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  async getUser() {
    return await axios.get<TUserInfoResponse>(`${this.base_uri}/user/info`, {
      headers: {
        browser: Utils.getBrowser(),
      },
    });
  }

  getSchedule() {
    return Promise.resolve().then(scheduleData => scheduleData);
  }

  saveAgentDay(payload: {
    agentDays: IAgentSchedule[];
    ignoreWarnings: boolean;
    checkTimestamp: boolean;
    allOrNothing: boolean;
    refreshSchedule: boolean;
  }): Promise<IResponse<IAgentSchedule[] | IWarning[]>> {
    return axios.post(`${this.base_uri}/schedule/saveAgentDay`, payload);
  }

  async saveAgentDayUseChunk(payload: {
    agentDays: IAgentSchedule[];
    ignoreWarnings: boolean;
    checkTimestamp: boolean;
    allOrNothing: boolean;
    refreshSchedule: boolean;
  }) {
    return await apiHelpers.sendRequestInChunks<IAgentSchedule[] | IWarning[] | IResponseData, []>(
      `${this.base_uri}/schedule/saveAgentDayUseChunk`,
      payload,
      ['agentDays'],
    );
  }

  validateAgentDay(payload: IValidateAgentDay): Promise<AxiosResponse<IResponse<[], IResponseValidateAgentDay>>> {
    if (!payload.agentDays.length && !payload.scheduleId) logger.error('/validateAgentDay, payload empty');
    return axios.post(`${this.base_uri}/schedule/validateAgentDay`, payload);
  }

  openContractSnapshot(
    payload: IPayloadOpenContractSnapshot,
  ): Promise<AxiosResponse<IResponse<IResponseOpenContractSnapshot>>> {
    return axios.post(`${this.base_uri}/config/openContractSnapshot`, payload);
  }

  findContractFromSnapshot(
    payload: IPayloadFindContractFromSnapshot,
  ): Promise<AxiosResponse<IResponse<ICfgContract[]>>> {
    return axios.post(`${this.base_uri}/config/findContractFromSnapshot`, payload);
  }

  async validateAgentDayUseChunk(payload: IValidateAgentDay) {
    return await apiHelpers.sendRequestInChunks<[], IResponseValidateAgentDay>(
      `${this.base_uri}/schedule/validateAgentDayUseChunk`,
      payload,
      ['agentDays'],
    );
  }

  calcSchedule(payload: ICalcSchedule): Promise<IResponse<ICalcScheduleResponse>> {
    return axios.post(`${this.base_uri}/schedule`, payload);
  }

  async deleteAgentDay(payload: IDeleteAgentDay) {
    return await axios.post(`${this.base_uri}/schedule/deleteAgentDay`, payload);
  }

  async userLogout(): Promise<IResponse<undefined>> {
    return await axios.get(`${this.base_uri}/user/logout`);
  }

  async userLogoutProd() {
    window.location.href = `${this.customer_uri}/Logoff.jsp?`;
    return Promise.resolve();
  }

  async openScenarioSnapshot(payload: TOpenScenarioSnapshotParams) {
    return await axios.post<TOpenScenarioSnapshotResponse>(`${this.base_uri}/schedule/openScenarioSnapshot`, payload);
  }

  async findScenarioFromSnapshot(payload: TFindScenarioFromSnapshotParams) {
    return (await axios.post(
      `${this.base_uri}/schedule/findScenarioFromSnapshot`,
      payload,
    )) as TFindScenarioFromSnapshotResponse;
  }
  async deleteScenario(payload: TDeleteScenarioParams) {
    return await axios.post<TDeleteScenarioResponse>(`${this.base_uri}/schedule/deleteScenario`, payload);
  }

  async getSites(payload: TGetSitesParams) {
    return (await axios.post(`${this.base_uri}/config/findSites`, payload)) as TSite[];
  }

  // async getScenario(payload: TGetScenarioPayload) {
  //   return await axios.post<TGetScenarioResponse>(`${this.base_uri}/schedule/getScenario`, payload);
  // }
  async forecastOpenScenarioSnapshot(payload: TOpenForecastScenarioSnapshot) {
    return await axios.post<{ data: TOpenForecastScenarioSnapshotResponse }>(
      `${this.base_uri}/forecast/openScenarioSnapshot`,
      payload,
    );
  }
  //  method: ForecastSoapMethods.GetScenarioFromSnapshot
  async forecastFindScenarioFromSnapshot(payload: TFindScenarioFromSnapshot) {
    return (await axios.post(
      `${this.base_uri}/forecast/findScenarioFromSnapshot`,
      payload,
    )) as TFindScenarioFromSnapshotResponse;
  }
  // async forecastFindScenarioInSnapshot(payload: TFindScenarioInSnapshot) {
  //   return (await axios.post(
  //     `${this.base_uri}/forecast/findScenarioInSnapshot`,
  //     payload,
  //   )) as TFindScenarioInSnapshotResponse;
  // }

  async getScenarioWarnings(
    payload: IGetScenarioWarningsPayload,
  ): Promise<AxiosResponse<IResponse<ISchScenarioWarning[], IStatus>>> {
    return await axios.post(`${this.base_uri}/schedule/getScenarioWarnings`, payload);
  }

  async saveScenarioWarnings(
    payload: ISaveScenarioWarningsPayload,
  ): Promise<AxiosResponse<IResponse<Record<PropertyKey, never>, IStatus>>> {
    return await axios.post(`${this.base_uri}/schedule/saveScenarioWarnings`, payload);
  }

  async saveScenarioComments(payload: TSaveScenarioCommentsParams) {
    return await axios.post(`${this.base_uri}/schedule/saveScenarioComments`, payload);
  }

  async renameScenario(payload: TRenameScenarioParams) {
    return await axios.post(`${this.base_uri}/schedule/renameScenario`, payload);
  }

  async forecastFindScenarios(payload: TFindScenarios) {
    return (await axios.post(`${this.base_uri}/forecast/findScenarios`, payload)) as TFindScenariosResponse;
  }

  async sessionCloseRequest(payload: ISessionRequestIdPayload): Promise<IResponse> {
      return (await axios.post(`${this.base_uri}/session/closeRequest`, payload)) as IResponse;
  }

  async sessionCancelRequest(payload: ISessionRequestIdPayload): Promise<IResponse> {
      return (await axios.post(`${this.base_uri}/session/cancelRequest`, payload)) as IResponse;
  }

  async sessionRequestStatus(payload: ISessionRequestIdPayload): Promise<IResponse<string>> {
    return axios.post(`${this.base_uri}/session/getRequestStatus`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  async insertAgentDayAsync(payload: IInsertAgentDayPayload): Promise<IResponse<string>> {
    return axios.post(`${this.base_uri}/schedule/insertAgentDayAsync`, payload, { timeout: Utils.GATEWAY_TIME_OUT_LARGE_REQ })
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }

  async insertStateAsync(payload: IInsertAgentDayPayload): Promise<IResponse<string>> {
    return axios
      .post(`${this.base_uri}/schedule/insertStateAsync`, payload, { timeout: Utils.GATEWAY_TIME_OUT_LARGE_REQ })
      .then(res => res.data)
      .catch(err => {
            logger.error(err);
            return Promise.reject(err);
      });
  }

  async insertWorkStateAsync(payload: IInsertAgentDayPayload): Promise<IResponse<string>> {
    return axios
      .post(`${this.base_uri}/schedule/insertWorkStateAsync`, payload, { timeout: Utils.GATEWAY_TIME_OUT_LARGE_REQ })
      .then(res => res.data)
      .catch(err => {
            logger.error(err);
            return Promise.reject(err);
      });
  }

  async deleteStateAsync(payload: IInsertAgentDayPayload): Promise<IResponse<string>> {
    return axios
      .post(`${this.base_uri}/schedule/deleteStateAsync`, payload, { timeout: Utils.GATEWAY_TIME_OUT_LARGE_REQ })
      .then(res => res.data)
      .catch(err => {
            logger.error(err);
            return Promise.reject(err);
      });
  }

  async getRequestValidation(payload: ISessionRequestIdPayload): Promise<IResponse<IInsertAgentDayResponse>> {
    return axios
      .post(`${this.base_uri}/schedule/getRequestValidation`, payload)
      .then(res => res.data)
      .catch(err => {
            logger.error(err);
            return Promise.reject(err);
      });
  }

  async getColors(payload: TGetColorsPayload):Promise<TGetColorsResponse> {
    return axios
      .post(`${this.base_uri}/config/getColors`, payload)
      .then(res => res.data)
      .catch(err => {
        logger.error(err);
        return Promise.reject(err);
      });
  }
}


const restApi = new RestAPI();
export default restApi;
