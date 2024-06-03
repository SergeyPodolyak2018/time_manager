import React, { FC, ReactNode } from 'react';
import styles from './ModalForm.module.scss';
import Spinner from '../../../../../ReusableComponents/spiner';
import { IBlankForm } from '../ModalFormElements.interfaces';

const BlankForm: FC<IBlankForm & { children?: ReactNode }> = props => {
  return (
    <div className={styles.background}>
      <div className={styles.formWrapper}>{props.isLoading === true ? <Spinner /> : props.children}</div>
    </div>
  );
};

export default BlankForm;
