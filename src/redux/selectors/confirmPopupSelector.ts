import { createSelector } from '@reduxjs/toolkit';

import { ConfirmPopup } from '../../common/constants';
import { rootSelector } from '.';
import { IConfirmPopupStore } from '../reducers/confirmPopupReducer';

export const confirmPopupSelector = createSelector(rootSelector, state => state[ConfirmPopup] as IConfirmPopupStore);

export const getConfirmPopupOpen = createSelector(confirmPopupSelector, state => state.isOpen);
