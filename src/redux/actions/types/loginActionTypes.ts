import { userInfoFetchedAction, userLoginErrorAction } from '../loginActions';

export enum ELoginActionTypes {
  USER_LOADING_BEGIN = 'USER_LOADING_BEGIN',
  USER_INFO_FETCHED = 'USER_INFO_FETCHED',
  NOT_AUTHORIZED = 'NOT_AUTHORIZED',
  USER_LOADING_STOP = 'USER_LOADING_STOP',
  USER_LOGIN_ERROR = 'USER_LOGIN_ERROR',
  USER_LOGOUT = 'USER_LOGOUT',
  LOADING = 'LOADING',
}

export type TUserInfoFetchedAction = ReturnType<typeof userInfoFetchedAction>;
export type TUserLoginErrorAction = ReturnType<typeof userLoginErrorAction>;
