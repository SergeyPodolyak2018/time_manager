import { createAction, PayloadActionCreator } from '@reduxjs/toolkit';

import Api from '../../api/rest';
import { EFrcActivitySelectionBranch } from '../../common/constants/chart';
import { IBusinessUnits } from '../../common/interfaces/config';
import { IAgentSchedule } from '../../common/interfaces/schedule/IAgentSchedule';
import { IChartStateSave } from '../../common/interfaces/storage';
import {
  calculateDifference,
  convertData,
  EPerfInfoItems,
  getTypeAndId,
  targetType as TargetTypeForRequest,
} from '../../helper/chart';
import DateUtils from '../../helper/dateUtils';
import { getCheckedItems as ChartCheckedItems, getMSAuse } from '../selectors/chartSelector';
import { getCheckedItems, getFilterData } from '../selectors/filterSelector';
import { getLastId, getLastParams } from '../selectors/snapShotsSelector';
import { getTimeDiscetness } from '../selectors/timeLineSelector';
import { AppDispatch, GetRootState } from '../store';
import { IChartsData } from '../ts/intrefaces/timeLine';
import CartTypes from './types/chart';
import { clone } from 'ramda';
import { toggleLoader } from './timeLineAction';
//import { getTimezonesSelector } from '../selectors/controlPanelSelector';

export const addChartDataAction = (
  updateTree?: boolean,
  agentDays?: IAgentSchedule[],
  isResetHistory = false,
  isSaveToHistory = true,
  isTriggerToggler = true,
) => {
  return async (dispatch: AppDispatch, getstate: GetRootState) => {
    if (isTriggerToggler) dispatch(toggleLoader(true));
    const filterData = getFilterData(getstate());
    const checked = getCheckedItems(getstate());
    const useMSA = getMSAuse(getstate());
    const chartChecked = ChartCheckedItems(getstate());
    const lastSnapshot = getLastParams(getstate());
    const granularity = getTimeDiscetness(getstate());

    const typeAndId = getTypeAndId(checked);
    const localTypeAndId = getTypeAndId(chartChecked);
    let timeZoneId = lastSnapshot?.timezoneId ?? 0;
    let infoForRequest = typeAndId;
    if (!lastSnapshot) {
      const data = {
        ITEM_COVERAGE_SCHEDULED: [],
        ITEM_STAFFING_CALCULATED: [],
        ITEM_STAFFING_REQUIRED: [],
        ITEM_DIFFERENCE_STAFFING_CALCULATED_OVERTIME_REQUIRED: [],
        ITEM_DIFFERENCE_COVERAGE_SCHEDULED_OVERTIME_SCHEDULED: [],
      };
      await dispatch(addChartData(data, !!agentDays, isResetHistory, isSaveToHistory, granularity));
      if (isTriggerToggler) dispatch(toggleLoader(false));
      return;
    }

    if (!updateTree) {
      infoForRequest = localTypeAndId;
    }
    if (timeZoneId === 0 && infoForRequest.type !== TargetTypeForRequest.BUSINESS_UNIT) {
      timeZoneId = filterData[infoForRequest.buId].sites[infoForRequest.siteId].timezoneId;
    }

    const dataForRequest = {
      snapshotId: getLastId(getstate()),
      targetType: infoForRequest.type,
      targetId: infoForRequest.id,
      startDate: timeZoneId === 0 ? DateUtils.getPreviousDayWithMoment(lastSnapshot.date) : lastSnapshot.date,
      endDate: DateUtils.getNextDayWithMoment(lastSnapshot.date),
      requestedItems: [12, 21, 91, 16, 90],
      granularity: granularity,
      timezoneId: timeZoneId === 0 ? undefined : timeZoneId,
      timezoneOption: timeZoneId === 0 ? 0 : 1,
      branch: useMSA
        ? EFrcActivitySelectionBranch.FRC_SELECT_VIRTUAL_ACTIVITY_BRANCH
        : EFrcActivitySelectionBranch.FRC_SELECT_SITE_BRANCH,
      agentDays: agentDays ? agentDays : [],
    };
    const result: any = await Api.findPerformanceDataFromSnapshotUseChunks(dataForRequest).then(res => res?.data);
    if (result && result.status.code === 0) {
      const currentDateResult = { ...result };
      // const currentDateResult = {
      //   ...result,
      //   data: result.data.map((item: any) => ({
      //     ...item,
      //     data: timeZoneId === 0 ? item.data.slice(-item.dataArraySize / 2) : item.data,
      //   })),
      // };
      const calculatedPerfItems = convertData(currentDateResult.data, 24, granularity);
      calculateDifference(
        EPerfInfoItems.ITEM_DIFFERENCE_CALCULATED,
        EPerfInfoItems.ITEM_COVERAGE_SCHEDULED,
        EPerfInfoItems.ITEM_STAFFING_CALCULATED,
        calculatedPerfItems,
      );
      calculateDifference(
        EPerfInfoItems.ITEM_DIFFERENCE_REQUIRED,
        EPerfInfoItems.ITEM_COVERAGE_SCHEDULED,
        EPerfInfoItems.ITEM_STAFFING_CALCULATED,
        calculatedPerfItems,
      );
      calculateDifference(
        EPerfInfoItems.ITEM_DIFFERENCE_STAFFING_CALCULATED_OVERTIME_REQUIRED,
        EPerfInfoItems.ITEM_STAFFING_CALCULATED,
        EPerfInfoItems.ITEM_OVERTIME_REQUIRED,
        calculatedPerfItems,
      );
      calculateDifference(
        EPerfInfoItems.ITEM_DIFFERENCE_COVERAGE_SCHEDULED_OVERTIME_SCHEDULED,
        EPerfInfoItems.ITEM_COVERAGE_SCHEDULED,
        EPerfInfoItems.ITEM_OVERTIME_SCHEDULED,
        calculatedPerfItems,
      );
      const data = {
        ITEM_COVERAGE_SCHEDULED: calculatedPerfItems.get(EPerfInfoItems.ITEM_COVERAGE_SCHEDULED).values,
        ITEM_STAFFING_CALCULATED: calculatedPerfItems.get(EPerfInfoItems.ITEM_STAFFING_CALCULATED).values,
        ITEM_STAFFING_REQUIRED: calculatedPerfItems.get(EPerfInfoItems.ITEM_STAFFING_REQUIRED).values,
        ITEM_DIFFERENCE_STAFFING_CALCULATED_OVERTIME_REQUIRED: calculatedPerfItems.get(
          EPerfInfoItems.ITEM_DIFFERENCE_STAFFING_CALCULATED_OVERTIME_REQUIRED,
        ).values,
        ITEM_DIFFERENCE_COVERAGE_SCHEDULED_OVERTIME_SCHEDULED: calculatedPerfItems.get(
          EPerfInfoItems.ITEM_DIFFERENCE_COVERAGE_SCHEDULED_OVERTIME_SCHEDULED,
        ).values,
      };
      dispatch(addChartData(data, !!agentDays, isResetHistory, isSaveToHistory, granularity));
      //await dispatch(setChecked(JSON.parse(JSON.stringify(checked))))
      if (!updateTree) {
        dispatch(setChecked(clone(chartChecked)));
      } else {
        dispatch(setChecked(clone(checked)));
      }
    }
    if (isTriggerToggler) dispatch(toggleLoader(false));
  };
};

export const changeChartActiveAction = (data: string[]) => {
  return async (dispatch: any) => {
    await dispatch(changeActive(data));
  };
};

export const addChartData = (
  data: IChartsData,
  isModified: boolean,
  isResetHistory = false,
  isSaveToHistory = true,
  granularity: number,
) => ({
  type: CartTypes.ADD_DATA,
  payload: { chart: data, isModified, isResetHistory, isSaveToHistory, granularity },
});

export const changeActive = (data: string[]) => ({
  type: CartTypes.CHANGE_ACTIVE,
  payload: data,
});

export const toggleChartLoader = (data: boolean) => ({
  type: CartTypes.TOGGLE_CHART_LOADER,
  payload: data,
});

export const setChecked = (data: IBusinessUnits) => ({
  type: CartTypes.SET_CHECKED_ITEMS,
  payload: data,
});

export const togleMSAaction = () => ({
  type: CartTypes.TOGLE_MSA,
});

export const togleBindingAction = () => ({
  type: CartTypes.TOGLE_BINDING_GRAPH,
});

export const changeChartStoreByHistory: PayloadActionCreator<
  'undo' | 'redo' | 'reset',
  CartTypes.CHANGE_STORE_BY_HISTORY
> = createAction(CartTypes.CHANGE_STORE_BY_HISTORY);

export const restoreChartData = (data: IChartStateSave) => ({
  type: CartTypes.RESTORE_GRAPH_SETTINGS,
  payload: data,
});

export const setChartContainerScrollPosition = (data: number) => ({
  type: CartTypes.SET_SCROLL_POSITION,
  payload: data,
});
