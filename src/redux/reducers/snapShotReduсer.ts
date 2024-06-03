import SnapShotsTypes from '../actions/types/snapShots';
import { ISnapShots, ISnapShot } from '../ts/intrefaces/timeLine';
import { createReducer } from '@reduxjs/toolkit';
import { omit } from 'ramda';
import { ICloseAgentDaySnapshot } from '../../api/ts/interfaces/config.payload';

const initialState: ISnapShots = {
  snapShots: {},
  last: '',
};

const snapShotsReducer = createReducer(initialState, {
  [SnapShotsTypes.ADD_SNAP_SHOT]: (state: typeof initialState, action: { payload: ISnapShot }) => {
    state.snapShots[action.payload.id] = action.payload;
    state.last = action.payload.id;
  },
  [SnapShotsTypes.REMOVE_SNAP_SHOT]: (state: typeof initialState, action: { payload: ICloseAgentDaySnapshot }) => {
    state.snapShots = omit([action.payload.snapshotId], state.snapShots);
    if (action.payload.isLast && state.last == action.payload.snapshotId) {
      state.last = '';
    }
  },
});

export default snapShotsReducer;
