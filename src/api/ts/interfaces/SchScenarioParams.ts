import { TeamConstraints } from '../../../components/ScheduleComponents/Popups/IntraDayScheduleRebuildWizardPopup/interfaces';

export interface ISchScenarioParams {
  siteId: number;
  isMultiSkill: boolean;
  staffingType: StaffingType;
  isIgnoreConstraint: boolean;
  isShuffleAgents: boolean;
  swapMode: SwapMode;
  teamConstraints: TeamConstraints;
  isExcludeGranted: boolean;
  isSynchDaysOff: boolean;
  isSynchStartTime: boolean;
  teamWorkWindow: number;
  isSynchDuration: boolean;
  isSynchBreaks: boolean;
  isSynchMeals: boolean;
  teamSize: number;
  ratio: number;
  isUseSecondaryActivities: boolean;
  profiles: SchScenarioProfileSchScenarioProfile[];
  teamProfiles: SchSTeamProfileSchSTeamProfile[];
}

export enum StaffingType {
  CALCULATED,
  REQUIRED,
}

export enum SwapMode {
  NONE,
  STRICT,
  LOOSE,
  FREE,
}

export interface SchScenarioProfileSchScenarioProfile {
  profileId: number;
  minNumber: number;
  maxNumber: number;
  currNumber: number;
  growPerc: number;
}

export interface SchSTeamProfileSchSTeamProfile {
  teamId: number;
  profileId: number;
}

export interface IResponseStatusResponse {
  progress: number;
  status: string;
}

export interface IResponseStatusInfo {
  agentCount: number;
  buildIteration: number;
  dayCount: number;
  errorCount: number;
  errorMessage: string;
  executionTime: number;
  maxAgentCount: number;
  maxEstimatedAgentCount: number;
  minAgentCount: number;
  minEstimatedAgentCount: number;
  percentageDone: number;
  siteCount: number;
  stage: number;
  stageName: string;
  timeInQueue: number;
  warningCount: number;
}
