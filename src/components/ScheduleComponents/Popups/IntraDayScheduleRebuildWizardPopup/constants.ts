import { IIntraDayRebuildState, IntraDayRebuildPage, SynchronizeByOptions } from './interfaces';
import { ReOptimizationType } from '../../../../api/ts/interfaces/config.payload';
import { IResponseStatusInfo } from '../../../../api/ts/interfaces/SchScenarioParams';

export const requestTimer = 500;

export const allPages: number[] = [
  IntraDayRebuildPage.SELECT_SITES,
  IntraDayRebuildPage.SELECT_OPTIONS,
  IntraDayRebuildPage.TEAM_SYNCHRONICITY,
  IntraDayRebuildPage.SHARED_TRANSPORT_CONSTRAINTS,
  IntraDayRebuildPage.FILTER_BY_CONTRACT,
  IntraDayRebuildPage.SELECT_AGENTS,
  IntraDayRebuildPage.SELECT_ACTIVITIES,
  IntraDayRebuildPage.REBUILD_PROGRESS,
];

export const siteLocalTz = {
  gswTimezoneId: 0,
  description: '',
  name: 'My local',
  timezoneId: 0,
  value: 0,
  currentOffset: 0,
};

export const defaultSelectOptionsPage = {
  isRangeMode: true,
  rangeDate: [],
  option: ReOptimizationType.BREAKS,
  isShiftStartFixed: true,
  isShiftEndFixed: false,
  isPaidDurationFixed: false,
  isAdditionallyFilterAgents: false,
  selectedTz: siteLocalTz,
  startTime: '00:00',
};

export const defaultFilterContractPage = {
  contracts: [],
}

export const defaultSelectAgentsPage = {
  isDoNotRebuildModified: true,
  checkedAgents: {},
};

export const defaultSelectActivitiesPage = {
  isCheckedRetain: true,
  checkedActivities: {},
};

export const defaultRebuildProgressPage = {
  requestParameters: null,
  isStart: false,
  isDone: false,
  isWarnings: false,
  reviewMessages: [],
};

export const defaultIntraDayRebuildState: IIntraDayRebuildState = {
  isLoading: true,
  isDisabledButtons: true,
  pages: [...allPages],
  pageIndex: 0,
  data: {
    selectSitesPage: [],
    selectOptionsPage: defaultSelectOptionsPage,
    filterContractPage: defaultFilterContractPage,
    selectAgentsPage: defaultSelectAgentsPage,
    selectActivitiesPage: defaultSelectActivitiesPage,
    sharedTransportPage: [],
    teamSynchronicityPage: [],
    rebuildProgressPage: defaultRebuildProgressPage,
  },
  initScenarioParams: [],
  errorMessage: '',
  isValidate: true,
};

export const defaultProgressState: IResponseStatusInfo = {
  agentCount: 0,
  buildIteration: 0,
  dayCount: 0,
  errorCount: 0,
  errorMessage: '',
  executionTime: 0,
  maxAgentCount: 0,
  maxEstimatedAgentCount: 0,
  minAgentCount: 0,
  minEstimatedAgentCount: 0,
  percentageDone: 0,
  siteCount: 0,
  stage: 0,
  stageName: '',
  timeInQueue: 0,
  warningCount: 0,
};

export const pageConfig = {
  [IntraDayRebuildPage.SELECT_SITES]: {
    subTitle: 'Select sites',
  },
  [IntraDayRebuildPage.SELECT_OPTIONS]: {
    subTitle: 'Select options',
  },
  [IntraDayRebuildPage.TEAM_SYNCHRONICITY]: {
    subTitle: 'Team synchronicity',
  },
  [IntraDayRebuildPage.SHARED_TRANSPORT_CONSTRAINTS]: {
    subTitle: 'Shared transport constraints',
  },
  [IntraDayRebuildPage.FILTER_BY_CONTRACT]: {
    subTitle: 'Filter by contract',
  },
  [IntraDayRebuildPage.SELECT_AGENTS]: {
    subTitle: 'Select agents',
  },
  [IntraDayRebuildPage.SELECT_ACTIVITIES]: {
    subTitle: 'Select activities',
  },
  [IntraDayRebuildPage.REBUILD_PROGRESS]: {
    subTitle: 'Schedule information',
  },
};

export const SynchronizeByOptionsLabel = {
  [SynchronizeByOptions.NO_ADDITIONAL_SYNCHRONISATION]: 'No Additional Synchronization',
  [SynchronizeByOptions.SHIFT_START_TIME]: 'Shift Start Time',
  [SynchronizeByOptions.PAID_DURATION]: 'Paid Duration',
  [SynchronizeByOptions.SHIFT_START_TIME_AND_PAID_DURATION]: 'Shift Start Time and Paid Duration',
  [SynchronizeByOptions.PAID_DURATION_AND_MEALS]: 'Paid Duration and Meals',
  [SynchronizeByOptions.SHIFT_START_TIME_PAID_DURATION_AND_MEALS]: 'Shift Start Time, Paid Duration and Meals',
  [SynchronizeByOptions.PAID_DURATION_MEALS_AND_BREAKS]: 'Paid Duration, Meals and Breaks',
  [SynchronizeByOptions.SHIFT_START_TIME_PAID_DURATION_MEALS_AND_BREAKS]:
    'Shift Start Time, Paid Duration, Meals and Breaks',
};
