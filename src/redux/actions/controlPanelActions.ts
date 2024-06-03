import restApi from '../../api/rest';
import { ITimezone } from '../../common/interfaces/config/ITimezone';
import { IControlPanelStateSave } from '../../common/interfaces/storage';
import logger from '../../helper/logger';
import { getChartBinding } from '../selectors/chartSelector';
import { getCheckedItems } from '../selectors/filterSelector';
import { getIsModifiedData } from '../selectors/timeLineSelector';
import { togleBindingAction } from './ChartActions';
import {
  closeSubMenu,
  getAgentsSchedule,
  openSaveConfirm,
  setDefaultConfirmState,
  setIsModified,
} from './timeLineAction';
import ControlPanelTypes from './types/controlPanel';
import { ControlPanelLoaderKey } from '../ts/intrefaces/timeLine';

export interface ILoginData {
  email: string;
  password: string;
}

export const getTimeZones = () => {
  return (dispatch: any) => {
    dispatch(setControlPanelLoading(ControlPanelLoaderKey.timezones, true));
    return restApi
      .fetchTimeZones()
      .then(result => {
        if (result && result.data) {
          return new Promise(resolve => {
            const sorted = result.data.sort((a: ITimezone, b: ITimezone) => {
              return a.value - b.value;
            });
            resolve(sorted);
          });
        } else {
          throw new Error(`Can't get time zones`);
        }
      })
      .then(data => {
        dispatch(timeZoneGeted(data));
      })
      .catch(err => {
        logger.error(err);
      })
      .finally(() => {
        dispatch(setControlPanelLoading(ControlPanelLoaderKey.timezones, false));
      });
  };
};

export const setTimeZonesAction = (tz: ITimezone) => {
  return (dispatch: any, getstate: any) => {
    const isUnsavedChanges = getIsModifiedData(getstate());
    const isBind = getChartBinding(getstate());
    const checked = getCheckedItems(getstate());
    if (isUnsavedChanges) {
      const proceed = () => {
        dispatch(setIsModified(false));

        dispatch(timeZoneSelect(tz));
        if (Object.keys(checked).length > 0) {
          dispatch(getAgentsSchedule(false, false, false)).then(() => {
            if (tz.timezoneId === 0 && isBind) {
              dispatch(togleBindingAction());
            }
          });
        }
        dispatch(setDefaultConfirmState());
      };
      dispatch(openSaveConfirm({ onConfirm: proceed, onDiscard: proceed }));
    } else {
      dispatch(timeZoneSelect(tz));
      if (Object.keys(checked).length > 0) {
        dispatch(getAgentsSchedule(false, false, false)).then(() => {
          if (tz.timezoneId === 0 && isBind) {
            dispatch(togleBindingAction());
          }
        });
      }
    }
  };
};

export const changeActiveDataAction = (data: string) => {
  return (dispatch: any) => {
    dispatch(setActivData(data));
    dispatch(closeSubMenu());
  };
};

export const getAgentsScheduleIfChecked = () => {
  return async (dispatch: any, getstate: any) => {
    const checked = getCheckedItems(getstate());
    if (Object.keys(checked).length > 0) {
      await dispatch(getAgentsSchedule(false, false, false));
    }
  };
};

const timeZoneGeted = (data: any) => ({
  type: ControlPanelTypes.SET_TIME_ZONE,
  payload: data,
});

const setControlPanelLoading = (key: ControlPanelLoaderKey, value: boolean) => ({
  type: ControlPanelTypes.SET_LOADING,
  payload: { key, value },
});

export const timeZoneSelect = (data: ITimezone) => ({
  type: ControlPanelTypes.SELECT_TIME_ZONE,
  payload: data,
});

export const setActivData = (data: string) => ({
  type: ControlPanelTypes.SET_DATE,
  payload: data,
});

export const restoreControlPanelData = (data: IControlPanelStateSave) => ({
  type: ControlPanelTypes.RESTORE_CONTROL_PANEL,
  payload: data,
});
