import { IResponse } from '../interfaces/response';

export type TGetColorsResponse = IResponse<TGetColors>;

export type TGetColors = TColorResponse[];

export type TColorResponse = {
  type: number,
  color?: string,
  fontColor?: string,
};

