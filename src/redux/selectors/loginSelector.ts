import { createSelector } from 'reselect';

import { LoginState } from '../../common/constants';
import { rootSelector } from '.';

export const loginSelector = createSelector(rootSelector, state => state[LoginState]);
export const isUserCheckedSelector = createSelector(loginSelector, data => data.userChecked);
export const subNameSelector = createSelector(loginSelector, data => data.user?.sub);
export const authorizedSelector = createSelector(loginSelector, data => data.authorized);
export const isLoadingSelector = createSelector(loginSelector, data => data.loading);
export const userNameSelector = createSelector(loginSelector, data => data.user?.user_name);
export const firstNameSelector = createSelector(loginSelector, data => data.user?.given_name);
export const secondNameSelector = createSelector(loginSelector, data => data.user?.family_name);
export const logOutSelector = createSelector(loginSelector, data => data.logOutPopUp);
