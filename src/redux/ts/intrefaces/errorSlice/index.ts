import { AxiosError } from 'axios';

export type TPartialAxiosError = {
  message: AxiosError['message'];
  code?: AxiosError['code'];
  type?: 'Warn' | 'Error';
};
export type TGlobalError = {
  id: string;
} & TPartialAxiosError;

export type TGlobalErrorState = {
  errors: TGlobalError[];
};
