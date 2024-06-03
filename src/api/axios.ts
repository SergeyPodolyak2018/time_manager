import axios, { AxiosError } from 'axios';

import { addGlobalError } from '../redux/actions/globalErrorActions';
import { notAuthorizedAction } from '../redux/actions/loginActions';
import { RootStore } from '../redux/store';
import { StatusCodes } from './ts/constants/codes';
import Utils, { NODE_ENV_TYPE } from '../helper/utils';
import { closeSnapshotById, openAgentDaySnapshot } from '../redux/actions/timeLineAction';
import { getLastId } from '../redux/selectors/snapShotsSelector';
import { setupCache } from 'axios-cache-interceptor';
import logger from '../helper/logger';

let store: RootStore;

const isSnapshotExpiredError = (error: any) => {
  try {
    const status = error.response?.status ?? null;
    const code = error.response?.data?.status?.code ?? null;
    const message = error.response?.data?.status?.message?.toLowerCase() ?? null;
    const isSnapshotExpired =
      typeof message === 'string' && message.includes('expired') && message.includes('snapshot id');

    return status === 400 && code == 651 && isSnapshotExpired;
  } catch (e) {
    return false;
  }
};

const isMeetingSchedulerError = (err: any) => {
  const requestURL = err.response.request.responseURL.split('/').pop();
  return requestURL === 'scheduleMeeting';
};

export const injectStore = (_store: RootStore) => {
  store = _store;
};

const apiRequester = setupCache(
  axios.create({
    baseURL: 'http://localhost:3001',
    withCredentials: true,
    maxContentLength: 1000,
    timeout: Utils.GATEWAY_TIME_OUT,
  }),
  {
    methods: ['get', 'post'],
    cachePredicate: {
      statusCheck: status => [200].includes(status),
      responseMatch: res => {
        return Utils.CACHED_ENDPOINTS.some(endpoint => res.config.url?.includes(endpoint));
      },
    },
    ttl: Utils.CACHE_TTL,
  },
);

apiRequester.interceptors.response.use(
  response => {
    response.cached && logger.debug(`${response.config.url} from cache`);
    return response;
  },
  (
    error: AxiosError<{
      status?: {
        code: number;
        message: string;
        details: string[] | any[];
      };
    }>,
  ) => {
    if (isSnapshotExpiredError(error)) {
      return Promise.reject(error);
    }
    if (isMeetingSchedulerError(error)) {
      return Promise.reject(error);
    }

    const isDetailsPresent = error?.response?.data?.status?.details?.length;
    let code = error?.response?.data?.status?.code.toString() || error.code?.toString();
    code += error?.response?.data?.status?.message ? `: ${error?.response?.data?.status?.message}` : '';
    let message;
    if (isDetailsPresent) {
      if (typeof error?.response?.data?.status?.details[0] === 'object') {
        if (error?.response?.data?.status?.details[0]?.message) {
          message = `\r\n${error?.response?.data?.status?.details[0]?.message}`;
        } else {
          message = `\r\n${error?.response?.data?.status?.message}`;
        }
      } else {
        message = `\r\n${error?.response?.data?.status?.details?.join('\n')}`;
      }
    } else {
      message = error.message;
    }
    const requestParams = `${error.config?.method?.toUpperCase().trim() || ''} ${error.config?.url || ''}`;

    const description = `${requestParams}. ${message}`;

    const partialAxiosError = {
      message: description,
      code,
    };
    if (
      error.response?.status === StatusCodes.UNAUTHORIZED
      // ||
      // error.response.data.status.code === ApiCodes.SESSION_EXPIRED ||
      // error.response.data.status.code === ApiCodes.UNAUTHORIZED
    ) {
      if (Utils.NODE_ENV === NODE_ENV_TYPE.DEV) {
        store.dispatch(notAuthorizedAction());
      } else if (Utils.NODE_ENV === NODE_ENV_TYPE.PROD) {
        store.dispatch(notAuthorizedAction());
        window.location.href = window.location.origin + '/customer';
      }
      return Promise.reject(error);
    }
    store.dispatch(addGlobalError(partialAxiosError));
    return Promise.reject(error);
  },
);

apiRequester.interceptors.request.use(
  response => {
    return response;
  },
  (error: AxiosError) => {
    const partialAxiosError = {
      message: error.message,
      code: error.code,
    };
    store.dispatch(addGlobalError(partialAxiosError));
    return Promise.reject(error);
  },
);

apiRequester.interceptors.response.use(
  response => {
    return response;
  },
  async error => {
    if (!isSnapshotExpiredError(error)) {
      return Promise.reject(error);
    }
    try {
      const getState = store.getState;
      const lastSnapshotId = getLastId(getState());
      if (lastSnapshotId) {
        await store.dispatch(closeSnapshotById(lastSnapshotId, false));
      }
      await store.dispatch(openAgentDaySnapshot());
      const snapshotId = getLastId(getState());

      if (!snapshotId) {
        return Promise.reject(error);
      }

      const originalRequest = error.config;
      originalRequest.data = { ...JSON.parse(originalRequest.data), snapshotId: snapshotId };

      return apiRequester(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);

export default apiRequester;
