import classnames from 'classnames';
import React from 'react';

import styles from './checkbox.module.scss';

export interface ICheckbox extends React.HTMLProps<HTMLElement> {
  onClick?: (e: React.MouseEvent) => void;
  icon?: IconTypes;
  checked?: boolean;
  disable?: boolean;
  isGrayAsDefault?: boolean;
  style?: any;
  indeterminate?: boolean;
}

export type IconTypes = 'circle' | 'arrow' | 'mark' | undefined;

const Checkbox = (props: ICheckbox) => {
  const { onClick, icon, checked, disable, isGrayAsDefault, indeterminate } = props;
  const localClick = (e: any) => {
    if (!disable && onClick) {
      onClick(e);
    }
  };

  return (
    <>
      <div
        id={'searchBtn'}
        onClick={localClick}
        className={classnames({
          [styles.checkbox]: true,
          [styles['checkbox--arrow']]: icon === 'arrow' || checked,
          [styles['checkbox--circle']]: icon === 'circle',
          [styles['checkbox--mark']]: icon === 'mark' && checked,
          [styles['checkbox--markUnchecked']]: icon === 'mark' && !checked,
          [styles['checkbox--disable']]: disable,
          [styles['checkbox--isGrayAsDefault']]: !checked && isGrayAsDefault,
          [styles['checkbox--indeterminate']]: indeterminate,
        })}
        style={props.style}
      ></div>
    </>
  );
};

export default Checkbox;
