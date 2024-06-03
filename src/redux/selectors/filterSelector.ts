import { createSelector } from '@reduxjs/toolkit';

import { FilterState } from '../../common/constants';
import { rootSelector } from '.';
import { IFilterLoading } from '../ts/intrefaces/filter';
import { IBusinessUnits } from '../../common/interfaces/config';

const filterSelector = createSelector(rootSelector, state => state[FilterState]);
export const getFilterData = createSelector(filterSelector, filter => filter.data as IBusinessUnits);
export const getFilterLoading = createSelector(filterSelector, filter => filter.loading as IFilterLoading);
export const getSearchData = createSelector(filterSelector, filter => filter.searchData as IBusinessUnits);
export const getIsSearchActive = createSelector(filterSelector, filter => filter.isSearchActive);
export const getCheckedItems = createSelector(filterSelector, filter => filter.checkedItems);
export const getInitCheckedItems = createSelector(filterSelector, filter => filter.initCheckedItems);
export const getSidebar = createSelector(filterSelector, state => state.sidebar);
export const getSideBarDataForStorage = createSelector(filterSelector, filter => ({
  sidebar: filter.sidebar,
}));
