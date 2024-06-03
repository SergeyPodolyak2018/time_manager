import React from 'react';
import styles from './button.module.scss';
import { Tooltip } from '../../../ReusableComponents/Tooltip/Tooltip';

export interface IButtonProps extends React.HTMLProps<HTMLElement> {
  click: (...args: any[]) => void;
}

const ExitButton = (props: IButtonProps) => {
  const { click } = props;

  return (
    <Tooltip text="Logout">
      <div id="logout-button" className={styles.button} onClick={click}></div>
    </Tooltip>
  );
};

export default ExitButton;
