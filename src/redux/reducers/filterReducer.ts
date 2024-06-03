import { isEmpty, mergeDeepRight } from 'ramda';

import { createReducer } from '@reduxjs/toolkit';

import { filterSidebarState } from '../../common/constants';
import { IBusinessUnits } from '../../common/interfaces/config';
import { IFilterStateSave } from '../../common/interfaces/storage';
import {
  buildTreeWithAgents,
  buildTreeWithBuAndSites,
  buildTreeWithTeamByBuAndSiteId,
  buildTreeWithTeams,
  searchAgents,
} from '../actions/filterAction';
import FilterTypes from '../actions/types/filter';
import { IFilterSidebarState, IFilterStore } from '../ts/intrefaces/filter';

const initialState: IFilterStore = {
  data: {},
  searchData: {},
  initCheckedItems: {},
  checkedItems: {},
  emptyItems: {},
  loading: {
    isBuLoading: false,
    isTeamLoading: false,
    isAgentsLoading: false,
    isSearch: false,
    isLoading: false,
    buId: null,
    siteId: null,
  },
  sidebar: filterSidebarState,
  isSearchActive: false,
  error: null,
  loadedData: {
    bus: [],
    sites: [],
    teams: [],
    agents: [],
  },
};

const filterReducer = createReducer(initialState, {
  [FilterTypes.SET_CHECKED_ITEMS]: (state: typeof initialState, action: { payload: IBusinessUnits }) => {
    state.checkedItems = action.payload;
  },
  // [FilterTypes.SHOW_EMPTY]: (state: typeof initialState, action: { payload: boolean }) => {
  //   state.emptyItems = Object.values(state.data).;
  // },
  [FilterTypes.SET_INIT_CHECKED_ITEMS]: (state: typeof initialState, action: { payload: IBusinessUnits }) => {
    state.initCheckedItems = action.payload;
  },
  [FilterTypes.SET_FILTER_DATA]: (state: typeof initialState, action: { payload: IBusinessUnits }) => {
    state.data = action.payload;
  },
  [FilterTypes.SET_SEARCH_DATA]: (state: typeof initialState, action: { payload: IBusinessUnits }) => {
    state.searchData = action.payload;

    // detect if all agents in team are selected during search and set isAllChecked to true in team
    const dataKeys = Object.keys(state.data || {});
    for (const buId of dataKeys) {
      const sites = state.data[buId]?.sites;
      if (!sites) continue;
      const siteKeys = Object.keys(sites);
      for (const siteId of siteKeys) {
        const teams = state.data[buId]?.sites[siteId]?.teams;
        if (!teams) continue;
        const teamKeys = Object.keys(teams);
        for (const teamId of teamKeys) {
          const agents = state.data[buId]?.sites[siteId]?.teams[teamId]?.agents;
          if (!agents) continue;
          const agentKeys = Object.keys(agents);
          const selectedAgentsKeys = Object.keys(state.checkedItems[buId]?.sites[siteId]?.teams[teamId]?.agents || {});
          if (agentKeys.every((agentId: string) => selectedAgentsKeys.includes(agentId))) {
            const team = state.checkedItems[buId]?.sites[siteId]?.teams[teamId];
            if (team && state.loadedData.teams.includes(teamId)) {
              team.isAllChecked = true;
            }
          }
        }
        const checkedTeams = state?.checkedItems[buId]?.sites[siteId]?.teams || {};
        // check is all teams have isAllChecked = true
        const isAllTeamsAllChecked = teamKeys.every(
          (teamId: string) => checkedTeams[teamId]?.isAllChecked && state.loadedData.teams.includes(teamId),
        );

        const selectedTeamsKeys = Object.keys(checkedTeams);

        // if all teams selected and isAllTeamsAllChecked = true then set isAllChecked = true in site
        if (teamKeys.every((teamId: string) => selectedTeamsKeys.includes(teamId)) && isAllTeamsAllChecked) {
          const site = state.checkedItems[buId]?.sites[siteId];
          if (site) {
            site.isAllChecked = true;
          }
        }
        const checkedActivities = state.checkedItems[buId]?.sites[siteId]?.activities || {};
        const activities = state.data[buId]?.sites[siteId]?.activities || {};

        const activityKeys = Object.keys(activities);
        const selectedActivitiesKeys = Object.keys(checkedActivities);

        // check is all activities have isChecked = true
        const isAllActivitiesChecked = activityKeys.every(
          (activityId: string) => checkedActivities[activityId]?.isChecked,
        );

        // if all activities selected and isAllActivitiesChecked = true then set isAllActivitiesChecked = true in site
        if (
          activityKeys.every((activityId: string) => selectedActivitiesKeys.includes(activityId)) &&
          isAllActivitiesChecked
        ) {
          const site = state.checkedItems[buId]?.sites[siteId];
          if (site) {
            site.isAllActivitiesChecked = true;
          }
        }
      }
      const checkedSites = state.checkedItems[buId]?.sites || {};
      const selectedSitesKeys = Object.keys(checkedSites);
      // check is all sites have isAllChecked = true
      const isAllSitesAllChecked = siteKeys.every((siteId: string) => checkedSites[siteId]?.isAllChecked);

      if (siteKeys.every((siteId: string) => selectedSitesKeys.includes(siteId)) && isAllSitesAllChecked) {
        const bu = state.checkedItems[buId];
        if (bu) {
          bu.isAllChecked = true;
        }
      }
      // if all sites have isAllActivitiesChecked = true then set isAllActivitiesChecked = true in bu

      // check is all sites have isAllActivitiesChecked = true
      const isAllSitesAllActivitiesChecked = siteKeys.every(
        (siteId: string) => checkedSites[siteId]?.isAllActivitiesChecked,
      );
      if (siteKeys.every((siteId: string) => selectedSitesKeys.includes(siteId)) && isAllSitesAllActivitiesChecked) {
        const bu = state.checkedItems[buId];
        if (bu) {
          bu.isAllActivitiesChecked = true;
        }
      }
    }
  },
  [FilterTypes.SET_SEARCH_ACTIVE]: (state: typeof initialState, action: { payload: boolean }) => {
    state.isSearchActive = action.payload;
  },
  [FilterTypes.CHANGE_SIDEBAR]: (state: typeof initialState, action: { payload: IFilterSidebarState }) => {
    state.sidebar = action.payload;
    const r = document.querySelector<HTMLElement>(':root');
    if (!r) return;
    const width = action.payload.isCollapsed ? 0 : action.payload.width;
    r.style.setProperty('--sidebar-width', width + 'px');
  },

  [buildTreeWithBuAndSites.pending.type]: (state: typeof initialState, action: any) => {
    state.loading.isSearch = !!action.meta.arg?.isSearch;
    state.loading.isBuLoading = true;
    state.loading.isLoading = true;
    state.error = null;
  },
  [buildTreeWithBuAndSites.fulfilled.type]: (state: typeof initialState, action: { payload: any }) => {
    if (!action.payload.data) return;
    state.data = mergeDeepRight(state.data, action.payload.data);
    state.loadedData = {
      bus: Object.keys(action.payload.data),
      sites: Object.keys(action.payload.data[Object.keys(action.payload.data)[0]].sites),
      teams: [],
      agents: [],
    };
    state.loading.isBuLoading = false;
    state.loading.isLoading = false;
    state.loading.isSearch = false;
    // if (state.isSearchActive) {
    //   state.searchData = mergeDeepRight(state.searchData, action.payload.data);
    // }
  },
  [buildTreeWithBuAndSites.rejected.type]: (state: typeof initialState, action: { error: any }) => {
    state.loading.isBuLoading = false;
    state.loading.isLoading = false;
    state.error = action.error;
    state.loading.isSearch = false;
  },
  [buildTreeWithTeamByBuAndSiteId.pending.type]: (state: typeof initialState, action: any) => {
    state.loading.isTeamLoading = true;
    state.loading.isLoading = true;
    state.error = null;
    state.loading.isSearch = !!action.meta.arg?.isSearch;
    Object.keys(action.meta.arg.sites).map((siteID: string) => {
      const buId = +action.meta.arg.sites[siteID].buId;
      state.loading.buId = [...(state.loading.buId ?? []), buId];
      // state.data[buId].sites[siteID].teams = {};
    });
  },
  [buildTreeWithTeamByBuAndSiteId.fulfilled.type]: (
    state: typeof initialState,
    action: { payload: any; meta: any },
  ) => {
    state.data = mergeDeepRight(state.data, action.payload.data);
    state.loading.isTeamLoading = false;
    state.loading.isLoading = false;
    state.loading.buId = null;
    state.loading.isSearch = false;
    populateLoadedData(action.payload.data, state);

    if (!isEmpty(state.searchData)) {
      state.searchData = mergeDeepRight(state.searchData, action.payload.data);
    }
  },
  [buildTreeWithTeamByBuAndSiteId.rejected.type]: (state: typeof initialState, action: { error: any }) => {
    state.loading.isTeamLoading = false;
    state.loading.isLoading = false;
    state.loading.isSearch = false;
    state.error = action.error;
  },
  [buildTreeWithAgents.pending.type]: (state: typeof initialState, action: any) => {
    state.loading.isAgentsLoading = true;
    state.loading.isLoading = true;
    state.loading.isSearch = !!action.meta.arg?.isSearch;
    state.error = null;
    state.loading.siteId = action.meta.arg.siteId;
  },
  [buildTreeWithAgents.fulfilled.type]: (state: typeof initialState, action: any) => {
    state.data = mergeDeepRight(state.data, action.payload.data);
    state.loading.isAgentsLoading = false;
    state.loading.isLoading = false;
    state.loading.siteId = null;
    state.loading.isSearch = false;
    populateLoadedData(action.payload.data, state);

    if (!isEmpty(state.searchData)) {
      state.searchData = mergeDeepRight(state.searchData, action.payload.data);
    }
  },
  [buildTreeWithAgents.rejected.type]: (state: typeof initialState, action: { error: any }) => {
    state.loading.isAgentsLoading = false;
    state.loading.isLoading = false;
    state.error = action.error;
    state.loading.isSearch = false;
  },
  [searchAgents.pending.type]: (state: typeof initialState) => {
    state.loading.isSearch = true;

    state.error = null;
  },
  [searchAgents.fulfilled.type]: (
    state: {
      isSearchActive: boolean;
      searchData: any;
      data: any;
      loading: { isSearch: boolean };
    },
    action: { payload: any },
  ) => {
    state.data = mergeDeepRight(state.data, action.payload.data);
    state.searchData = action.payload.data;
    state.isSearchActive = true;
    state.loading.isSearch = false;
  },
  [searchAgents.rejected.type]: (state: typeof initialState, action: { error: any }) => {
    state.loading.isSearch = false;
    state.error = action.error;
  },
  [buildTreeWithTeams.pending.type]: (state: typeof initialState, action: any) => {
    state.loading.isSearch = !!action.meta.arg?.isSearch;
    state.error = null;
  },
  [buildTreeWithTeams.fulfilled.type]: (state: typeof initialState, action: { payload: any }) => {
    state.searchData = action.payload.data;
    state.data = mergeDeepRight(state.data, action.payload.data);
    state.isSearchActive = true;
    state.loading.isSearch = false;
  },
  [buildTreeWithTeams.rejected.type]: (state: typeof initialState, action: { error: any }) => {
    state.loading.isSearch = false;
    state.error = action.error;
  },
  [FilterTypes.MERGE_DATA]: (state: typeof initialState, action: { payload: any }) => {
    state.data = mergeDeepRight(state.data, action.payload);
  },
  [FilterTypes.RESTORE_FILTER_SETTINGS]: (state: typeof initialState, action: { payload: IFilterStateSave }) => {
    const r = document.querySelector<HTMLElement>(':root');
    if (!r) return { ...state, ...action.payload };
    const width = action.payload.sidebar.isCollapsed ? 0 : action.payload.sidebar.width;
    r.style.setProperty('--sidebar-width', width + 'px');
    return { ...state, ...action.payload };
  },
});

export default filterReducer;

const populateLoadedData = (data: IBusinessUnits, state: IFilterStore) => {
  for (const buId of Object.keys(data)) {
    const sites = data[buId]?.sites;
    if (!sites) continue;
    const siteKeys = Object.keys(sites);
    for (const siteId of siteKeys) {
      const teams = data[buId]?.sites[siteId]?.teams;
      if (!teams) continue;
      const teamKeys = Object.keys(teams);

      for (const teamId of teamKeys) {
        const agents = data[buId]?.sites[siteId]?.teams[teamId]?.agents;
        if (!agents) continue;
        const agentKeys = Object.keys(agents);
        state.loadedData.agents = [...state.loadedData.agents, ...agentKeys];
      }

      state.loadedData.teams = [...state.loadedData.teams, ...teamKeys];
    }
  }
};
