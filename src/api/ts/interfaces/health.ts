export enum HealthService {
  customer = 'customer',
  builder = 'builder',
}
export interface IHealthResponseInfo {
  [HealthService.customer]: IServiceInfo;
  [HealthService.builder]: IServiceInfo;
}
interface IServiceInfo {
  status: string;
  message?: string;
}

export interface IHealthResponse {
  version: string;
  status: 'ok' | 'error';
  info: IHealthResponseInfo;
  error: IHealthResponseInfo;
  details: IHealthResponseInfo;
}
