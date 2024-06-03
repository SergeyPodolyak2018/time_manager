import type { paths } from './customer_api.types';

type PathKeys = keyof paths;
type PathMethod<T extends PathKeys> = keyof paths[T];
type RequestParams<P extends PathKeys, M extends PathMethod<P>> = paths[P][M] extends {
  requestBody: {
    content: {
      'application/json': any;
    };
  };
}
  ? paths[P][M]['requestBody']['content']['application/json']
  : undefined;

export type ApiResponseOk<P extends PathKeys, M extends PathMethod<P>> = paths[P][M] extends {
  responses: {
    '200': {
      content: {
        'application/json': any;
      };
    };
  };
}
  ? paths[P][M]['responses']['200']['content']['application/json']
  : undefined;

export type ApiResponseError<P extends PathKeys, M extends PathMethod<P>> = paths[P][M] extends {
  responses: {
    '400': {
      content: {
        'application/json': any;
      };
    };
  };
}
  ? paths[P][M]['responses']['400']['content']['application/json']
  : undefined;

export type ApiResponse<P extends PathKeys, M extends PathMethod<P>> = ApiResponseOk<P, M> | ApiResponseError<P, M>;

export type ApiCallParams<P extends PathKeys, M extends PathMethod<P>> = RequestParams<P, M> extends undefined
  ? undefined
  : RequestParams<P, M>;
