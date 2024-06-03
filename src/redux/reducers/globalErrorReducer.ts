import { createReducer } from '@reduxjs/toolkit';
import EGlobalErrorTypes from '../actions/types/globalErrorTypes';
import { v4 } from 'uuid';
import { TGlobalErrorState, TPartialAxiosError } from '../ts/intrefaces/errorSlice';

const initialState: TGlobalErrorState = {
  errors: [],
};

export const globalErrorReducer = createReducer(initialState, {
  [EGlobalErrorTypes.ADD_GLOBAL_ERROR]: (state: TGlobalErrorState, action: { payload: TPartialAxiosError }) => {
    state.errors = [...state.errors, { id: v4(), ...action.payload }];
  },
  [EGlobalErrorTypes.REMOVE_GLOBAL_ERROR]: (state: TGlobalErrorState, action: { payload: string }) => {
    state.errors = state.errors.filter(error => error.id !== action.payload);
  },
});

export default globalErrorReducer;
