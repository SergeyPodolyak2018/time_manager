import { createReducer } from '@reduxjs/toolkit';
import { ConfirmPopupActionTypes } from '../actions/types/confirmPopupActionTypes';
import { isNil } from 'ramda';

export enum ConfirmPopupResult {
  SAVE = 'save',
  CLOSE = 'close',
  DISCARD = 'discard',
  NONE = '',
}

export interface IConfirmPopupStore {
  isOpen: boolean;
  onConfirm: () => any;
  onDiscard: () => any;
  onClose: () => any;
  onResult: (result: ConfirmPopupResult) => void;
  title: string;
  text: string;
  btnDiscardTitle: string;
  btnConfirmTitle: string;
  result: ConfirmPopupResult;
}
const initialState: IConfirmPopupStore = {
  isOpen: false,
  onConfirm: () => {},
  onDiscard: () => {},
  onResult: () => {},
  onClose: () => {},
  title: 'Warning',
  text: '',
  btnDiscardTitle: 'Discard',
  btnConfirmTitle: 'Confirm',
  result: ConfirmPopupResult.NONE,
};

export const confirmPopupReducer = createReducer(initialState, {
  [ConfirmPopupActionTypes.SET_DATA]: (state, action: { payload: Partial<IConfirmPopupStore> }) => {
    const { isOpen, title, btnConfirmTitle, btnDiscardTitle, onConfirm, onDiscard, text, onResult, onClose } =
      action.payload;
    if (!isNil(isOpen)) state.isOpen = isOpen;
    if (title) state.title = title;
    if (btnConfirmTitle) state.btnConfirmTitle = btnConfirmTitle;
    if (btnDiscardTitle) state.btnDiscardTitle = btnDiscardTitle;
    if (text) state.text = text;
    if (onConfirm) state.onConfirm = onConfirm;
    if (onDiscard) state.onDiscard = onDiscard;
    if (onResult) state.onResult = onResult;
    if (onClose) state.onClose = onClose;
  },
  [ConfirmPopupActionTypes.TOGGLE_POPUP]: state => {
    state.isOpen = !state.isOpen;
  },
  [ConfirmPopupActionTypes.SET_RESULT]: (state, action: { payload: ConfirmPopupResult }) => {
    state.result = action.payload;
  },
});
export default confirmPopupReducer;
