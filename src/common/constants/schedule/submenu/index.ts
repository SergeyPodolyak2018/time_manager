import { IMenuItem } from './common';
import { editShiftSubmenu } from './editShiftSubmenu';
import { editBreakSubmenu } from './editBreakSubmenu';
import { editMealSubmenu } from './editMealSubmenu';
import { editTimeOffSubmenu } from './editTimeOffSubmenu';
import { editFullDayTimeOffSubmenu } from './editFullDayTimeOffSubmenu';
import { editExceptionSubmenu } from './editExceptionSubmenu';
import { editFullDayExceptionSubmenu } from './editFullDayExceptionSubmenu';
import { insertShiftSubmenu } from './insertShiftSubmenu';
import { editDayOffSubmenu } from './editDayOffSubmenu';
import { editActivitySubmenu } from './editActivitySubmenu';
import { editMarkedTimeSubmenu } from './editMarkedTimeSubmenu';
import { workSetSubmenu } from './workSetSubmenu';

export const buttonsList: IMenuItem[] = [
  ...editShiftSubmenu,
  ...editActivitySubmenu,
  ...editBreakSubmenu,
  ...editMealSubmenu,
  ...editTimeOffSubmenu,
  ...editFullDayTimeOffSubmenu,
  ...editExceptionSubmenu,
  ...editFullDayExceptionSubmenu,
  ...insertShiftSubmenu,
  ...editDayOffSubmenu,
  ...editMarkedTimeSubmenu,
  ...workSetSubmenu,
];
