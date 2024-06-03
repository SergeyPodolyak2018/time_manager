import React, { FC, ReactNode } from 'react';
import BlankForm from './BlankForm';
import HeaderForm from './HeaderForm';
import FooterForm from './FooterForm';
import { IModalForm } from './ModalFormElements.interfaces';

const ModalForm: FC<IModalForm & { children?: ReactNode }> = props => {
  return (
    <BlankForm isLoading={props.isLoading}>
      <HeaderForm title={props.title} onCloseHandle={props.onCloseHandle} />
      {props.children}
      <FooterForm buttons={props.buttons} />
    </BlankForm>
  );
};

export default ModalForm;
