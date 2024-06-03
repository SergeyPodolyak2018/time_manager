import { WizardType } from '../../../../redux/ts/intrefaces/timeLine/WizardType';

interface IWizardData {
  [type: string]: IDataByType;
}

export interface IDataByType {
  type: WizardType;
  title: string;
  selectType: string;
  width: string;
}

export const dataByType: IWizardData = {
  edit: {
    type: 'edit',
    title: 'Edit Multiple Wizard',
    selectType: 'Select state types: ',
    width: '860px',
  },
  insert: {
    type: 'insert',
    title: 'Insert Multiple Wizard',
    selectType: 'Select insert types: ',
    width: '740px',
  },
  delete: {
    type: 'delete',
    title: 'Delete Multiple Wizard',
    selectType: 'Select delete types: ',
    width: '740px',
  },
};
