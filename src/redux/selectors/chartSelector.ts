import { createSelector } from 'reselect';

import { ChartState } from '../../common/constants';
import { rootSelector } from '.';
import { ICharts } from '../ts/intrefaces/timeLine';

export const chartSelector = createSelector(rootSelector, state => state[ChartState]);

export const getData = createSelector(chartSelector, (state: ICharts) => state.history.current.data);
export const getActive = createSelector(chartSelector, (state: ICharts) => state.active);
export const getCheckedItems = createSelector(chartSelector, (state: ICharts) => state.checkedItems);
export const getMSAuse = createSelector(chartSelector, (state: ICharts) => state.useMSA);
export const getChartBinding = createSelector(chartSelector, (state: ICharts) => state.bindGraph);
export const getChartLoader = createSelector(chartSelector, (state: ICharts) => state.loading);
export const getChartDataForStorage = createSelector(chartSelector, (state: ICharts) => ({
  bindGraph: state.bindGraph,
}));

export const getChartContainerScrollPosition = createSelector(
  chartSelector,
  (state: ICharts) => state.containerScrollPosition,
);