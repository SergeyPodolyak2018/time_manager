import { createAction, createAsyncThunk, PayloadActionCreator } from '@reduxjs/toolkit';

import restApi from '../../api/rest';
import { FetchAgents, SearchAgents } from '../../api/ts/interfaces/config.payload';
import { IBusinessUnits } from '../../common/interfaces/config';
import { IFilterStateSave } from '../../common/interfaces/storage';
import { IFetchTeams, IFilterSidebarState, ISearchTeams } from '../ts/intrefaces/filter';
import FilterTypes from './types/filter';
import { omit } from 'ramda';

export const setCheckedItems = createAction<IBusinessUnits | object>(FilterTypes.SET_CHECKED_ITEMS);

export const setInitCheckedItems = createAction<IBusinessUnits | object>(FilterTypes.SET_INIT_CHECKED_ITEMS);

export const setSearchData = createAction<IBusinessUnits | null>(FilterTypes.SET_SEARCH_DATA);

export const setSearchActive = createAction<boolean>(FilterTypes.SET_SEARCH_ACTIVE);

export const showEmpty = createAction<boolean>(FilterTypes.SHOW_EMPTY);

export const buildTreeWithBuAndSites = createAsyncThunk(FilterTypes.FETCH_BU, async (payload: object) => {
  return await restApi.buildTreeWithBuAndSites(omit(['isSearch'], payload));
});

export const buildTreeWithTeamByBuAndSiteId = createAsyncThunk(
  FilterTypes.FETCH_TEAMS,
  async (payload: IFetchTeams) => {
    return await restApi.buildTreeWithTeamByBuAndSiteId(omit(['isSearch'], payload));
  },
);

export const buildTreeWithAgents = createAsyncThunk(FilterTypes.FETCH_AGENTS, async (payload: FetchAgents) => {
  return await restApi.buildTreeWithAgents(payload);
});

export const searchAgents = createAsyncThunk(FilterTypes.SEARCH_AGENTS, async (payload: SearchAgents) => {
  return await restApi.searchAgents(payload);
});
export const mergeData: PayloadActionCreator<any, FilterTypes.MERGE_DATA> = createAction(FilterTypes.MERGE_DATA);

export const buildTreeWithTeams = createAsyncThunk(FilterTypes.SEARCH_TEAMS, async (payload: ISearchTeams) => {
  return await restApi.buildTreeWithTeams(omit(['isSearch'], payload));
});

export const changeSidebar = (data: IFilterSidebarState) => ({
  type: FilterTypes.CHANGE_SIDEBAR,
  payload: data,
});

export const restoreFilterSideBarData = (data: IFilterStateSave) => ({
  type: FilterTypes.RESTORE_FILTER_SETTINGS,
  payload: data,
});
