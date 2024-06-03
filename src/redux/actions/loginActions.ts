import { AxiosError } from 'axios';

import { createAction } from '@reduxjs/toolkit';

import restApi from '../../api/rest';
import { TUserInfoResponse } from '../../api/ts/responses/userInfo';
import { ChartState, FilterState, TimeLineState, ControlPanelState } from '../../common/constants';
import { IStorageBaseObject } from '../../common/interfaces/storage';
import StorageMediator from '../../helper/storageMediator';
import { getChartDataForStorage } from '../selectors/chartSelector';
import { getSideBarDataForStorage } from '../selectors/filterSelector';
import { getControlPanelDataForStorage } from '../selectors/controlPanelSelector';
import { isUserCheckedSelector, subNameSelector } from '../selectors/loginSelector';
import { getTimeLIneDataForStorage } from '../selectors/timeLineSelector';
import { AppDispatch, GetRootState } from '../store';
import { restoreChartData } from './ChartActions';
import { getTimeZones, restoreControlPanelData } from './controlPanelActions';
import { restoreFilterSideBarData } from './filterAction';
import { restoreTimeLineData } from './timeLineAction';
import { ELoginActionTypes } from './types/loginActionTypes';
import { addGlobalError } from './globalErrorActions';

export interface ILoginData {
  userName: string;
  password: string;
}

export const loginAction = (credentials: ILoginData) => {
  return async (dispatch: AppDispatch) => {
    restApi
      .fetchLogin(credentials)
      .then(() => {
        dispatch(userLoadingBeginAction());
      })
      .then(() => {
        return Promise.all([restApi.getUser(), dispatch(getTimeZones())]);
      })
      .then(result => {
        if (result && result[0].data.data) {
          dispatch(restoreUserInfoAction(result[0].data.data.sub));
          dispatch(userInfoFetchedAction({ user: result[0].data }));
        }
      })
      .then(() => {
        dispatch(userLoadingStopAction());
      })
      .catch(err => {
        dispatch(userLoginErrorAction(err.message));
      });
  };
};
export const checkIsUserAuthorizedAction = () => {
  return (dispatch: AppDispatch) => {
    dispatch(toggleLoginLoader(true));
    restApi
      .getUser()
      .then(result => {
        if (result && result.data.data) {
          dispatch(restoreUserInfoAction(result.data.data.sub));
          return Promise.all([dispatch(userInfoFetchedAction({ user: result.data })), dispatch(getTimeZones())]);
        }
      })
      .catch((error: AxiosError) => {
        error.message;
        // handled in interceptor with status 401
        dispatch(
          addGlobalError({
            message: error.message,
            code: error.code,
          }),
        );
        error.response?.status === 401 && dispatch(notAuthorizedAction());
      })
      .finally(() => {
        dispatch(toggleLoginLoader(false));
      });
  };
};
export const saveUserInfoAction = () => {
  return (dispatch: AppDispatch, getState: GetRootState) => {
    const dataForStoreTimeLIne = getTimeLIneDataForStorage(getState());
    const dataForStoreChart = getChartDataForStorage(getState());
    const dataForStoreFilter = getSideBarDataForStorage(getState());
    const dataForControlPanel = getControlPanelDataForStorage(getState());
    const userId = subNameSelector(getState());
    const data: IStorageBaseObject = {
      [TimeLineState]: dataForStoreTimeLIne,
      [ChartState]: dataForStoreChart,
      [FilterState]: dataForStoreFilter,
      [ControlPanelState]: dataForControlPanel,
    };
    StorageMediator.saveToStorage(userId || '', data);
  };
};
const restoreUserInfoAction = (userId: string) => {
  return (dispatch: AppDispatch, getState: GetRootState) => {
    const userChecked = isUserCheckedSelector(getState());
    if (!userChecked) {
      const storeData = StorageMediator.updateFromStorage(userId);
      if (storeData) {
        const dataForStoreTimeLine = storeData[TimeLineState];
        const dataForStoreChart = storeData[ChartState];
        const dataForStoreFilter = storeData[FilterState];
        const dataForControlPanel = storeData[ControlPanelState];
        dataForStoreTimeLine && dispatch(restoreTimeLineData(dataForStoreTimeLine));
        dataForStoreChart && dispatch(restoreChartData(dataForStoreChart));
        dataForStoreFilter && dispatch(restoreFilterSideBarData(dataForStoreFilter));
        dataForControlPanel && dispatch(restoreControlPanelData(dataForControlPanel));
      }
    }
  };
};

export const notAuthorizedAction = () => {
  return (dispatch: AppDispatch) => {
    // dispatch(resetTimeLineData());
    dispatch(notAuthorized());
  };
};

export const userLoadingBeginAction = createAction(ELoginActionTypes.USER_LOADING_BEGIN);
export const userInfoFetchedAction = createAction<{ user: TUserInfoResponse }>(ELoginActionTypes.USER_INFO_FETCHED);
export const notAuthorized = createAction(ELoginActionTypes.NOT_AUTHORIZED);
export const userLoadingStopAction = createAction(ELoginActionTypes.USER_LOADING_STOP);
export const userLoginErrorAction = createAction<{ error: string }>(ELoginActionTypes.USER_LOGIN_ERROR);
export const userLogOutAction = createAction(ELoginActionTypes.USER_LOGOUT);

export const toggleLoginLoader = (data: boolean) => ({
  type: ELoginActionTypes.LOADING,
  payload: data,
});
