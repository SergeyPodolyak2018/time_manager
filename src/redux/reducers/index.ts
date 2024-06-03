import { combineReducers } from 'redux';

import {
  ChartState,
  ConfirmPopup,
  ControlPanelState,
  FilterState,
  GlobalErrorState,
  LoginState,
  ScheduleScenariosState,
  SnapShotsState,
  TimeLineState,
  ColorsState
} from '../../common/constants';
import chartReducer from './chartReducer';
import controlPanelReducer from './controlPanelReduсer';
import filterReducer from './filterReducer';
import globalErrorReducer from './globalErrorReducer';
import loginReducer from './loginReducer';
import snapShotsReducer from './snapShotReduсer';
import timeLineReducer from './timeLineReducer';
import confirmPopupReducer from './confirmPopupReducer';
import { scheduleScenariosReducer } from './scheduleScenariosReducer';
import colorsReducer from './colorsReduser';

export default combineReducers({
  [LoginState]: loginReducer,
  [FilterState]: filterReducer,
  [TimeLineState]: timeLineReducer,
  [ControlPanelState]: controlPanelReducer,
  [SnapShotsState]: snapShotsReducer,
  [ChartState]: chartReducer,
  [GlobalErrorState]: globalErrorReducer,
  [ConfirmPopup]: confirmPopupReducer,
  [ScheduleScenariosState]: scheduleScenariosReducer,
  [ColorsState]: colorsReducer,
});
