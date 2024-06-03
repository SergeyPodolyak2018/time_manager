import classnames from 'classnames';
import React from 'react';

import styles from './checkbox.module.scss';

export interface ICheckbox extends React.HTMLProps<HTMLElement> {
  onClick?: (e: React.MouseEvent) => void;
  icon?: IconTypes;
  checked?: boolean;
  dataTest?: string;
  style?: any;
  classNames?: string[];
  disabled?: boolean;
  isGrayAsDefault?: boolean;
  type?: 'checkbox' | 'radio';
  indeterminate?: boolean;
  error?: boolean;
}

export type IconTypes = 'circle' | 'arrow' | undefined;

const Checkbox = (props: ICheckbox) => {
  const {
    onClick,
    icon,
    checked,
    classNames,
    disabled,
    isGrayAsDefault,
    dataTest,
    type = 'checkbox',
    id,
    indeterminate,
    error,
  } = props;
  return (
    <>
      <input
        id={id}
        style={{ display: 'none' }}
        type={type}
        disabled={disabled}
        onChange={() => {}}
        checked={icon === 'arrow' || checked}
      />
      <label
        onClick={onClick}
        id={classnames({
          [`${id}Checkbox`]: id,
        })}
        data-test={dataTest}
        className={classnames([styles.checkbox, ...(classNames || [])], {
          [styles['checkbox--arrow']]: (icon === 'arrow' || checked) && !disabled,
          [styles['checkbox--arrow-disabled']]: (icon === 'arrow' || checked) && disabled,
          [styles['checkbox--circle']]: icon === 'circle',
          [styles['checkbox--disabled']]: disabled,
          [styles['checkbox--isGrayAsDefault']]: !checked && isGrayAsDefault,
          [styles['checkbox--indeterminate']]: indeterminate,
          [styles['checkbox--error']]: error,
        })}
        style={props.style}
      ></label>
    </>
  );
};

export default Checkbox;
