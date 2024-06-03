import { WizardType } from '../../../../redux/ts/intrefaces/timeLine/WizardType';

interface IWizardData {
  [type: string]: IDataByType;
}

export interface IDataByType {
  type: WizardType;
  title: string;
  selectType: string;
  width: string;
  checkboxText1: string;
}

export const dataByType: IWizardData = {
  edit: {
    type: 'edit',
    title: 'Edit Multiple Wizard',
    selectType: 'Select state types: ',
    checkboxText1: 'Edit only if there are no errors or warnings',
    width: '860px',
  },
  insert: {
    type: 'insert',
    title: 'Insert Multiple Wizard',
    selectType: 'Select insert types: ',
    checkboxText1: 'Insert only if there are no errors or warnings',
    width: '740px',
  },
  delete: {
    type: 'delete',
    title: 'Delete Multiple Wizard',
    checkboxText1: 'Delete only if there are no errors or warnings',
    selectType: 'Select delete types: ',
    width: '740px',
  },
};
