import { TPartialAxiosError } from '../ts/intrefaces/errorSlice';
import EGlobalErrorTypes from './types/globalErrorTypes';

export const addGlobalError = (error: TPartialAxiosError) => {
  return {
    type: EGlobalErrorTypes.ADD_GLOBAL_ERROR,
    payload: error,
  };
};

export const removeGlobalError = (id: string) => {
  return {
    type: EGlobalErrorTypes.REMOVE_GLOBAL_ERROR,
    payload: id,
  };
};
