
export interface IPayloadScheduleMeeting {
  scheduleId: number;
  meetingId: number;
  startDate: string;
  endDate: string;
  ignoreWarnings: boolean;
  autoCommit: boolean

}


export interface IResponseScheduleMeetingStatus {
  message?:string;
  code:number;
  details?:string[];
}

export interface IResponseScheduleMeetingData {
  success: boolean;
}
export interface IResponseErrors {
  validations: IResponseErrorsValidation[];
  warnings:string[];
}
export interface IResponseErrorsValidation {
  agentId: number
  date: number
  errors: string[];
  messages: string[];
}

export interface IResponseScheduleMeeting {
  data:IResponseScheduleMeetingData;
  errors:IResponseErrors;
  status:IResponseScheduleMeetingStatus;
}
