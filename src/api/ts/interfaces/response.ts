export interface IStatus {
  code: number;
  message?: string;
  details?: string[];
}

export interface IResponseData {
  success: boolean;
}

export interface IResponse<T = any, E = any> {
  data: T;
  status: IStatus;
  errors?: E[];
}
