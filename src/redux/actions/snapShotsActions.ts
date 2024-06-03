import SnapShotsTypes from './types/snapShots';
import { ISnapShot } from '../ts/intrefaces/timeLine';
import { ICloseAgentDaySnapshot } from '../../api/ts/interfaces/config.payload';

export const addSnapShotAction = (data: ISnapShot) => {
  return async (dispatch: any) => {
    await dispatch(addSnapShot(data));
  };
};

export const removeSnapShotAction = (data: ICloseAgentDaySnapshot) => {
  return async (dispatch: any) => {
    await dispatch(removeSnapShot(data));
  };
};

export const addSnapShot = (data: ISnapShot) => ({
  type: SnapShotsTypes.ADD_SNAP_SHOT,
  payload: data,
});

export const removeSnapShot = (data: ICloseAgentDaySnapshot) => ({
  type: SnapShotsTypes.REMOVE_SNAP_SHOT,
  payload: data,
});
