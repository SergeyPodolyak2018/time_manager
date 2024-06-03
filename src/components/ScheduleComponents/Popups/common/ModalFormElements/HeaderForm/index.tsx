import React, { FC } from 'react';
import { ReactComponent as Cross } from '../assets/cross.svg';
import styles from './HeaderForm.module.scss';
import { IHeaderForm } from '../ModalFormElements.interfaces';

const HeaderForm: FC<IHeaderForm> = props => {
  return (
    <div className={styles.header}>
      <span>{props.title}</span>
      <Cross onClick={props.onCloseHandle} />
    </div>
  );
};

export default HeaderForm;
