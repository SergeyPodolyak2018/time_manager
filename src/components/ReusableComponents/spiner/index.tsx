import React from 'react';
import styles from './spinner.module.scss';

const Spinner = (props: {className?: string}) => {
  const { className } = props;
  return <div className={`${className} ${styles.loader}`}>Loading...</div>;
};

export default Spinner;
