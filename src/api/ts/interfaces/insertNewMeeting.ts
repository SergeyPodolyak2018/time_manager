
export interface IPayloadInserNewMeeting {
  meeting: {
    id: number;
    buId: number;
    siteId: number[];
    name: string,
    exceptionTypeId: number,
    startDate: string,
    startTime: {
      hours: number;
      minutes: number,
    },
    endDate: string,
    endTime: {
      hours: number;
      minutes: number,
    },
    duration: number;
    weekDays: boolean[],
    isUseMinmaxGroup: boolean,
    isIndividual: boolean,
    recurrenceType: number;
    timezoneId: number;
    maxShortagePerc: number;
    maxSurplusPerc: number;
    isUseTotalMinutes: boolean,
    totalMinutes: number;
    minGroup: number;
    maxGroup: number;
    minAttendeesPerc: number;
    occurences: number;
    recurrenceMultiplier: number;
    minOccurences: number;
    maxOccurences: number;
    meetingAgents: number[],
    timestamp: number,
  },
  ignoreWarnings: boolean
}


export interface IResponseInserNewMeetingStatus {
  message?:string;
  code:number;
  details?:string[];
}
export interface IResponseInserNewMeetingData {
  success: boolean;
  warnings: string[];
  id: number;
}

export interface IResponseInserNewMeeting {
  data:IResponseInserNewMeetingData;
  status:IResponseInserNewMeetingStatus;
}
