import { createReducer } from '@reduxjs/toolkit';
import ColorsTypes from '../actions/types/colorsTypes';
import { IColors, IColorPayload} from '../ts/intrefaces/timeLine';

const initialState: IColors = {};

const colorsReducer = createReducer(initialState, {
  [ColorsTypes.ADD_COLORS]: (state: typeof initialState, action: { payload: IColorPayload }) => {
    state[action.payload.buId] = action.payload.colors;
  }
});

export default colorsReducer;
