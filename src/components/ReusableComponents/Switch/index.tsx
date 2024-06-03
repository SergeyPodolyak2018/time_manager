import React from 'react';
import styles from './switch.module.scss';
import classnames from 'classnames';

export interface ICheckbox extends React.HTMLProps<HTMLElement> {
  onClick?: (e: React.MouseEvent) => void;
  checked?: boolean;
  customStyle?:any;
}

export type IconTypes = 'circle' | 'arrow' | undefined;

const Checkbox = (props: ICheckbox) => {
  const { onClick, checked, customStyle} = props;

  return (
   <div
        onClick={onClick}
        className={classnames({
          [styles.switch]: true,
          [styles['switch--checked']]: checked,
        })}
        style={customStyle}
   >

     <div className={classnames({
       [styles.round]: true,
       [styles['round--checked']]: checked,
     })}>

     </div>
   </div>
  );
};

export default Checkbox;
