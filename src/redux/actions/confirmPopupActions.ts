import { ConfirmPopupActionTypes } from './types/confirmPopupActionTypes';
import { ConfirmPopupResult, IConfirmPopupStore } from '../reducers/confirmPopupReducer';
import { createAction, PayloadActionCreator } from '@reduxjs/toolkit';

export const setConfirmPopupData: PayloadActionCreator<
  Partial<IConfirmPopupStore>,
  ConfirmPopupActionTypes.SET_DATA
> = createAction(ConfirmPopupActionTypes.SET_DATA);

export const toggleConfirmPopup: PayloadActionCreator<undefined, ConfirmPopupActionTypes.TOGGLE_POPUP> = createAction(
  ConfirmPopupActionTypes.TOGGLE_POPUP,
);

export const setResultConfirmPopup: PayloadActionCreator<ConfirmPopupResult, ConfirmPopupActionTypes.SET_RESULT> =
  createAction(ConfirmPopupActionTypes.SET_RESULT);
