import { IBusinessUnits } from '../../../../common/interfaces/config';
import { FetchTeams, SearchTeams } from '../../../../api/ts/interfaces/config.payload';

export interface IFilterStore {
  data: IBusinessUnits;
  loadedData: {
    bus: string[];
    sites: string[];
    teams: string[];
    agents: string[];
  };
  emptyItems: IBusinessUnits;
  searchData: IBusinessUnits;
  initCheckedItems: IBusinessUnits;
  checkedItems: IBusinessUnits;
  loading: IFilterLoading;
  sidebar: IFilterSidebarState;
  isSearchActive: boolean;
  error: any | null;
}
export interface IFilterLoading {
  isBuLoading: boolean;
  isTeamLoading: boolean;
  isAgentsLoading: boolean;
  isSearch: boolean;
  isLoading: boolean;
  buId: number[] | null;
  siteId: number[] | null | number;
}
export interface IFilterSidebarState {
  width: number;
  isCollapsed: boolean;
}

export interface IFetchTeams extends FetchTeams {
  isSearch?: boolean;
}

export interface ISearchTeams extends SearchTeams {
  isSearch?: boolean;
}
