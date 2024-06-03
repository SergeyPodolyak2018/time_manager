export interface IResponseInsertStateStatus {
  message?:string;
  code:number;
  details?:string[];
}

export interface IResponseInsertStateData {
  success: boolean;
}

export interface IResponseInsertStateErrors {
  validations: IResponseInsertStateErrorsValidations;
}

export interface IResponseInsertStateErrorsValidations {
  agentId: number;
  date: number;
  errors: string[];
  messages: string[];
  siteId: number;
}

export interface IResponseInsertState {
  data: IResponseInsertStateData;
  errors: IResponseInsertStateErrors;
  status: IResponseInsertStateStatus;
}
