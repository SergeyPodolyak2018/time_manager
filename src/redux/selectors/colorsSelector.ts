import { createSelector } from 'reselect';

import { rootSelector } from '.';
import { ColorsState } from '../../common/constants';



export const colorsSelector = createSelector(rootSelector, state => state[ColorsState]);
export const getColors = createSelector(colorsSelector, data => data);
export const getColorByID =(Id:number)=> createSelector(colorsSelector, data => data[Id]);
