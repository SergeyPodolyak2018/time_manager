
export interface IPayLoadGetMeetingFromSnapshot {
  snapshotId: string,
  firstIndex?: number;
  lastIndex?: number;
}

export interface IResponseGetMeetingFromSnapshotData {
  id: number;
  buId: number;
  siteId: number[];
  name: string,
  exceptionTypeId: number;
  startDate: number,
  startTime: {
    hours: number;
    minutes: number;
  },
  endDate: number,
  endTime: {
    hours: number;
    minutes: number;
  },
  duration: number;
  weekDays: boolean[];
  isUseMinmaxGroup: true,
  isIndividual: true,
  recurrenceType: number;
  timezoneId: number;
  maxShortagePerc: number;
  maxSurplusPerc: number;
  isUseTotalMinutes: true,
  totalMinutes: number;
  minGroup: number;
  maxGroup: number;
  minAttendeesPerc: number;
  occurences: number;
  recurrenceMultiplier: number;
  minOccurences: number;
  maxOccurences: number;
  meetingAgents: number[],
  timestamp: number;
}
export interface IResponseGetMeetingFromSnapshotStatus {
  message?:string;
  code:number;
  details?:string[];
}

export interface IResponseGetMeetingFromSnapshot {
  data?:IResponseGetMeetingFromSnapshotData[];
  status:IResponseGetMeetingFromSnapshotStatus;
}
