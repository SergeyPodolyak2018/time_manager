import { IResponse } from '../interfaces/response';

export type TUserInfoResponse = IResponse<TUserInfoData>;
export type TUserInfoData = {
  sub: string;
  aud: string;
  user_name: string;
  given_name: string;
  family_name: string;
  dbid: number;
  details: TUserInfoDetails;
};

type TUserInfoDetails = {
  userType: string;
  securitySubsystemID: number[];
  userID: number;
  lastLoginTime: string;
};
