import React from 'react';
import styles from './spinner.module.scss';
import classnames from 'classnames';

const customerSpinner = () => {
  return (
    <div className={styles.loading}>
      <div className={classnames(styles.spinnerContainer, styles.fastSpinner)}>
        <div className={classnames(styles.shapeshifter, styles.shapeshifter__play)}></div>
      </div>
    </div>
  );
};

export default customerSpinner;
