import { createReducer } from '@reduxjs/toolkit';

import { IControlPanelStateSave } from '../../common/interfaces/storage';
import DateUtils from '../../helper/dateUtils';
import ControlPanelTypes from '../actions/types/controlPanel';
import { ControlPanelLoaderKey, IControlPanel } from '../ts/intrefaces/timeLine';

const initialState: IControlPanel = {
  timezone: [],
  timezonesHash: {},
  selectedTz: {
    currentOffset: 0,
    gswTimezoneId: -1,
    description: '',
    name: '',
    timezoneId: -1,
    value: 0,
  },
  loader: {
    [ControlPanelLoaderKey.timezones]: false,
  },
  activeDate: DateUtils.getCurrentDate(),
  sitesMultipleTimezonesWarning: false,
};

const controlPanelReducer = createReducer(initialState, {
  [ControlPanelTypes.SET_TIME_ZONE]: (state: IControlPanel, action: { payload: any }) => {
    state.timezonesHash = action.payload.reduce((acc: any, item: any) => {
      acc[item.timezoneId] = item;
      return acc;
    });
    state.timezone = action.payload;
  },
  [ControlPanelTypes.SELECT_TIME_ZONE]: (state: IControlPanel, action: { payload: any }) => {
    state.selectedTz = action.payload;
  },
  [ControlPanelTypes.SET_DATE]: (state: IControlPanel, action: { payload: any }) => {
    state.activeDate = action.payload;
  },
  [ControlPanelTypes.RESTORE_CONTROL_PANEL]: (
    state: typeof initialState,
    action: { payload: IControlPanelStateSave },
  ) => {
    return { ...state, ...action.payload };
  },

  [ControlPanelTypes.SET_LOADING]: (
    state: IControlPanel,
    action: { payload: { key: ControlPanelLoaderKey; value: boolean } },
  ) => {
    state.loader[action.payload.key] = action.payload.value;
  },
});

export default controlPanelReducer;
