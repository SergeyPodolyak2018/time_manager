import { createReducer } from '@reduxjs/toolkit';

import { TUserInfoData } from '../../api/ts/responses/userInfo';
import { ELoginActionTypes, TUserInfoFetchedAction, TUserLoginErrorAction } from '../actions/types/loginActionTypes';

type TLoginState = {
  loading: boolean;
  user?: TUserInfoData;
  error: string | null;
  authorized: boolean;
  userChecked: boolean;
  logOutPopUp: boolean;
};
const initialState: TLoginState = {
  loading: true,
  user: undefined,
  error: null,
  authorized: false,
  userChecked: false,
  logOutPopUp: false,
};

export const loginReducer = createReducer(initialState, {
  [ELoginActionTypes.USER_LOADING_BEGIN]: state => {
    state.loading = true;
  },
  [ELoginActionTypes.USER_LOADING_STOP]: state => {
    state.loading = false;
  },
  [ELoginActionTypes.USER_INFO_FETCHED]: (state, action: TUserInfoFetchedAction) => {
    state.user = action.payload.user.data;
    state.authorized = true;
  },
  [ELoginActionTypes.NOT_AUTHORIZED]: state => {
    state.loading = false;
    state.authorized = false;
    state.user = undefined;
    state.userChecked = false;
    state.logOutPopUp = false;
  },
  [ELoginActionTypes.USER_LOGIN_ERROR]: (state, action: TUserLoginErrorAction) => {
    state.loading = false;
    state.error = action.payload.error;
  },
  [ELoginActionTypes.USER_LOGOUT]: state => {
    state.logOutPopUp = !state.logOutPopUp;
  },
  [ELoginActionTypes.LOADING]: (state, action) => {
    state.loading = action.payload;
  },
});
export default loginReducer;
