import { GetRootState } from '../store';
import ColorsTypes from './types/colorsTypes';
import restApi from '../../api/rest';

import { TGetColorsPayload } from '../../api/ts/interfaces/config.payload';
import { TColorResponse } from '../../api/ts/responses/getColors';
import { IColorPayload, IErrorPopUpParam, IColor} from '../ts/intrefaces/timeLine';
import { getColors } from '../selectors/colorsSelector';
import { SchStateType } from '../../common/constants/schedule';
import { openErrorPopUp } from './timeLineAction'

export const getColorsAction = (
  data: TGetColorsPayload
) => {
  return async (dispatch: any, getstate: GetRootState) => {
    const colors = getColors(getstate());
    console.log(SchStateType[2])
    try {
      if(!colors[data.buId]){
        const notParsedData = await restApi.getColors(data);
        const newColors:IColor = {};
        notParsedData.data.map((el:TColorResponse)=>{
          newColors[SchStateType[el.type as unknown as keyof typeof SchStateType]]={
            color:el.color,
            fontColor:el.fontColor,
          }
        })
        dispatch(addColor({
          buId: data.buId,
          colors: newColors,
        }));
        return newColors;
      }
      
    } catch (e: any) {
      const exceptionParams: IErrorPopUpParam = {
        isOpen: true,
        data: e.response.data.status.details.join('\n'),
      };
      dispatch(openErrorPopUp(exceptionParams));
    }
  };
};

export const addColor = (data: IColorPayload) => ({
  type: ColorsTypes.ADD_COLORS,
  payload: data,
});
