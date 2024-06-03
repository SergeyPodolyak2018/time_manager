import { createSelector } from '@reduxjs/toolkit';

import { GlobalErrorState } from '../../common/constants';
import { rootSelector } from '.';

export const errorSelector = createSelector(rootSelector, state => state[GlobalErrorState]);
export const getGlobalErrors = createSelector(errorSelector, error => error.errors);
