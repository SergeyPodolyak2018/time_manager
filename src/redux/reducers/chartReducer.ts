import ChartTypes from '../actions/types/chart';
import { ICharts, IChartsData } from '../ts/intrefaces/timeLine';
import { createReducer } from '@reduxjs/toolkit';
import { IBusinessUnits } from '../../common/interfaces/config';
import { IChartStateSave } from '../../common/interfaces/storage';
import { clone } from 'ramda';
import DateUtils from '../../helper/dateUtils';
import { IChartHistoryData } from '../ts/intrefaces/chart/IHistory';

const initialState: ICharts = {
  history: {
    past: [],
    current: {
      data: {
        ITEM_COVERAGE_SCHEDULED: [],
        ITEM_STAFFING_CALCULATED: [],
        ITEM_STAFFING_REQUIRED: [],
        ITEM_DIFFERENCE_STAFFING_CALCULATED_OVERTIME_REQUIRED: [],
        ITEM_DIFFERENCE_COVERAGE_SCHEDULED_OVERTIME_SCHEDULED: [],
      },
      granularity: 60,
      isModified: false,
    },
    future: [],
  },
  active: ['ITEM_COVERAGE_SCHEDULED', 'ITEM_STAFFING_CALCULATED'],
  checkedItems: {},
  useMSA: false,
  bindGraph: true,
  loading: false,
  containerScrollPosition: 0,
};

const chartReducer = createReducer(initialState, {
  [ChartTypes.ADD_DATA]: (
    state: typeof initialState,
    action: {
      payload: {
        chart: IChartsData;
        isModified: boolean;
        isResetHistory: boolean;
        isSaveToHistory: boolean;
        granularity: number;
      };
    },
  ) => {
    if (action.payload.isResetHistory) {
      state.history.future = [];
      state.history.past = [];
    } else {
      if (action.payload.isSaveToHistory) {
        state.history.past = DateUtils.pushToFixedArray<IChartHistoryData>(
          state.history.past,
          clone(state.history.current),
        );
        state.history.future = [];
      }
    }

    state.history.current.data = { ...state.history.current.data, ...action.payload.chart };
    state.history.current.isModified = true;
    state.history.current.granularity = action.payload.granularity;
    state.loading = false;
  },
  [ChartTypes.CHANGE_ACTIVE]: (state: typeof initialState, action: { payload: string[] }) => {
    state.active = action.payload;
  },
  [ChartTypes.SET_CHECKED_ITEMS]: (state: typeof initialState, action: { payload: IBusinessUnits }) => {
    state.checkedItems = action.payload;
  },
  [ChartTypes.TOGLE_MSA]: (state: typeof initialState) => {
    state.useMSA = !state.useMSA;
  },
  [ChartTypes.TOGLE_BINDING_GRAPH]: (state: typeof initialState) => {
    state.bindGraph = !state.bindGraph;
  },
  [ChartTypes.TOGGLE_CHART_LOADER]: (state: typeof initialState, action: { payload: boolean }) => {
    state.loading = action.payload;
  },
  [ChartTypes.CHANGE_STORE_BY_HISTORY]: (
    state: typeof initialState,
    action: { payload: 'undo' | 'redo' | 'reset' },
  ) => {
    const {
      past,
      current,
      future,
      // current: { isModified },
    } = state.history;

    if (action.payload === 'undo') {
      const previous = past[past.length - 1];
      if (!previous || !previous.isModified) return;

      state.history.past = past.slice(0, past.length - 1);
      state.history.current = previous;
      state.history.future = [current, ...future];
    } else if (action.payload === 'redo') {
      const next = future[0];
      if (!next || !next.isModified) return;
      const newFuture = future.slice(1);

      state.history.past = [...past, current];
      state.history.current = next;
      state.history.future = newFuture;
    } else if (action.payload === 'reset') {
      state.history.past = [];
      state.history.future = [];
    }
  },
  [ChartTypes.RESTORE_GRAPH_SETTINGS]: (state: typeof initialState, action: { payload: IChartStateSave }) => {
    return { ...state, ...action.payload };
  },
  [ChartTypes.SET_SCROLL_POSITION]: (state: typeof initialState, action: { payload: number }) => {
    state.containerScrollPosition = action.payload;
  },
});

export default chartReducer;
