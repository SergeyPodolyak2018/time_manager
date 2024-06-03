import { ITimezone } from '../../../../common/interfaces/config/ITimezone';
import { IRebuildRequestPayload, ReOptimizationType } from '../../../../api/ts/interfaces/config.payload';
import { ISchScenarioParams } from '../../../../api/ts/interfaces/SchScenarioParams';
import {ISchScenarioWarning} from '../../../../api/ts/interfaces/scenarioWarnings';
import {IContractItem} from '../../../../common/interfaces/config';

export interface IScheduleRebuildWizardPageProps {
  initState: IIntraDayRebuildState;
  onChangeState: (fieldName: keyof IIntraDayRebuildStateData | keyof IIntraDayRebuildState, data: any, isMainField?: boolean) => void;
}

export enum IntraDayRebuildPage {
  SELECT_SITES,
  SELECT_OPTIONS,
  TEAM_SYNCHRONICITY,
  SHARED_TRANSPORT_CONSTRAINTS,
  FILTER_BY_CONTRACT,
  SELECT_AGENTS,
  SELECT_ACTIVITIES,
  REBUILD_PROGRESS,
}

export interface IIntraDayRebuildState {
  isLoading: boolean;
  isDisabledButtons: boolean;
  pages: IntraDayRebuildPage[];
  pageIndex: number;
  data: IIntraDayRebuildStateData;
  initScenarioParams: ISchScenarioParams[];
  errorMessage: string;
  isValidate: boolean;
}

export interface IIntraDayRebuildStateData {
  selectSitesPage: ISelectSitesItem[];
  selectOptionsPage: ISelectOptionsData;
  filterContractPage: IFilterContractPage;
  selectAgentsPage: ISelectAgentsData;
  selectActivitiesPage: ISelectActivitiesData;
  sharedTransportPage: ISharedTransportItem[];
  teamSynchronicityPage: ITeamSynchronicityItem[];
  rebuildProgressPage: IRebuildProgressData;
}

export interface ISelectSitesItem {
  isChecked: boolean;
  siteId: number;
  siteName: string;
  isForceSkill: boolean;
  isUseRequired: boolean;
  isDisableMonthlyConstrains: boolean;
  isShuffleAgents: boolean;
  isUseTeamConstraints: boolean;
  isUseSharedTransportConstraints: boolean;
  isExcludeGrantedAgents: boolean;
  isUseSecondaryActivities: boolean;
  isSynchroniseDaysOffInit: boolean;
  isSynchroniseStartTimeInit: boolean;
  isSynchroniseDurationInit: boolean;
  isSynchroniseMealsInit: boolean;
  isSynchroniseBreaksInit: boolean;
  teamConstraints: number;
  teamWorkWindow: number;
}

export interface ISharedTransportItem {
  siteName: string;
  maximumDeviation: string;
}

export interface ITeamSynchronicityItem {
  siteName: string;
  isSynchronizeDaysOff: boolean;
  synchronizeBy: SynchronizeByOptions;
  maximumStartTimeDifference: string;
  isOnlySameContracts: boolean;
}

export enum SynchronizeByOptions {
  NO_ADDITIONAL_SYNCHRONISATION = 0,
  SHIFT_START_TIME = 1,
  PAID_DURATION = 2,
  SHIFT_START_TIME_AND_PAID_DURATION = 3,
  SHIFT_START_TIME_PAID_DURATION_AND_MEALS = 7,
  SHIFT_START_TIME_PAID_DURATION_MEALS_AND_BREAKS = 15,
  PAID_DURATION_AND_MEALS = 6,
  PAID_DURATION_MEALS_AND_BREAKS = 14,
}

export enum TeamConstraints {
  IGNORE = 0,
  USE = 1,
  USE_WITHIN_CONTRACT = 2,
  CARPOOL = 4,
}

export interface ISelectOptionsData {
  isRangeMode: boolean;
  rangeDate: string[];
  option: ReOptimizationType;
  isShiftStartFixed: boolean;
  isShiftEndFixed: boolean;
  isPaidDurationFixed: boolean;
  isAdditionallyFilterAgents: boolean;
  selectedTz: ITimezone;
  startTime: string;
}

export interface IFilterContractPage {
  contracts: IContractItem[];
}

export interface ISelectAgentsData {
  isDoNotRebuildModified: boolean;
  checkedAgents: any;
}

export interface ISelectActivitiesData {
  isCheckedRetain: boolean;
  checkedActivities: any;
}

export interface IRebuildProgressData {
  requestParameters: IRebuildRequestPayload | null;
  isStart: boolean;
  isDone: boolean;
  isWarnings: boolean;
  reviewMessages: IReviewMessage[];
}

export enum TimeZoneSelectorCurrentTimeZone {
  ctz_LOCAL = 0,
  ctz_BU = 1,
}

export interface ITimeZoneSelector {
  initSelectedTZ: ITimezone;
  siteLocalTz: ITimezone;
  onChangeState: (selectedTz: ITimezone) => void;
  currentTimeZone: TimeZoneSelectorCurrentTimeZone;
}

export interface ISelectedCell {
  fieldName: keyof ISelectSitesItem | null;
  itemIndex: number | null;
}

export interface IReviewMessage extends ISchScenarioWarning {
  siteName: string;
}

export interface IScheduleRebuildReviewMessagesDialog {
  initState: IIntraDayRebuildState;
  onChangeState: (fieldName: keyof IIntraDayRebuildStateData, data: any) => void;
}
