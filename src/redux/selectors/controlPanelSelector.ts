import { createSelector } from 'reselect';

import { ControlPanelState } from '../../common/constants';
import { IControlPanel } from '../ts/intrefaces/timeLine';
import { rootSelector } from '.';

export const controlPanelSelector = createSelector(rootSelector, state => state[ControlPanelState]);

export const getTimezonesSelector = createSelector(controlPanelSelector, (data: IControlPanel) => data.timezone);

export const getSelectedTzSelector = createSelector(controlPanelSelector, (data: IControlPanel) => data.selectedTz);

export const getActiveDateSelector = createSelector(controlPanelSelector, (data: IControlPanel) => data.activeDate);

export const getControlPanelLoader = createSelector(controlPanelSelector, (data: IControlPanel) => data.loader);

export const getControlPanelDataForStorage = createSelector(controlPanelSelector, (data: IControlPanel) => ({
  selectedTz: data.selectedTz,
}));

export const getTimezonesHashSelector = createSelector(
  controlPanelSelector,
  (data: IControlPanel) => data.timezonesHash,
);