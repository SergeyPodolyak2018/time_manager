export interface IFilterItem {
  isChecked?: boolean;
  isAllChecked?: boolean;
  isAllActivitiesChecked?: boolean;
  isActivityChecked?: boolean;
  isUploaded?: boolean;
  isOpen?: boolean;
}

export interface IBusinessUnits {
  [buId: string | number]: IBusinessUnit;
}

export interface ISites {
  [siteId: string | number]: ISite;
}

export interface IActivities {
  [activityId: string | number]: IActivity;
}

export interface ITeams {
  [teamId: string | number]: ITeam;
}

export interface IAgents {
  [agentId: string | number]: IAgent;
}

export interface IBusinessUnit extends IFilterItem {
  sites: ISites;
  buId: number;
  name: string;
  timezoneId: number;
}

export interface ISite extends IFilterItem {
  activities: IActivities;
  teams: ITeams;
  buId: number;
  siteId: number;
  name: string;
  timezoneId: number;
  contracts?: IContractItems;
}

export interface ITeam extends IFilterItem {
  agents: IAgents;
  teamId: number;
  buId: number;
  siteId: number;
  name: string;
}

export interface IAgent extends IFilterItem {
  employeeId: string;
  agentId: number;
  teamId: number;
  buId: number;
  siteId: number;
  lastName: string;
  firstName: string;
}

export interface IActivity extends IFilterItem {
  activityId: number | string;
  siteId: number | string;
  buId: number | string;
  name: string;
}

export interface ICfgContract {
  id: number;
  buId: number;
  siteId: number[];
  name: string;
  icon: number;
}

export interface IContractItem {
  id: number;
  buId: number;
  siteId: number[];
  name: string;
  icon: number;
  isChecked: boolean;
}

export interface IContractItems {
  [key: string | number]: IContractItem
}
