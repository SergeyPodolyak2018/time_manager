import { createSelector } from 'reselect';

import { SnapShotsState } from '../../common/constants';
import { rootSelector } from '.';

export const snapShotsSelector = createSelector(rootSelector, state => state[SnapShotsState]);
export const getLastId = createSelector(snapShotsSelector, data => data.last);
export const getLastParams = createSelector(snapShotsSelector, data => data.snapShots[data.last]);
export const getAll = createSelector(snapShotsSelector, data => data.snapShots);
