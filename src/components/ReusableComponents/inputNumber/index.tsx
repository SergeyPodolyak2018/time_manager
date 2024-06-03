import React from 'react';
import styles from './number.module.scss';
import classnames from 'classnames';

export interface ISearchProps extends React.HTMLProps<HTMLElement> {
  id: string;
  change: (...args: any[]) => void;
  value: number | string;
  removeSpecialCharacters?: boolean;
  style: any;
  disabled: boolean;
  min: number;
  max: number;
  valid: boolean;
  placeholder?: string;
}

const InputNumber = (props: ISearchProps) => {
  const change = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (props.removeSpecialCharacters) {
      const newString = e.target.value.replace(/[.*eE?\-+^${}()|[\]\\]/g, '');
      if (!newString) {
        props.change(0);
      } else {
        if (isInRange(newString)) {
          props.change(newString);
        } else {
          props.change(props.value);
        }
      }
    } else {
      props.change(e.target.value);
    }
  };

  const isInRange = (value: string): boolean => {
    if (props.min && props.max) {
      return parseInt(value) >= props.min && parseInt(value) <= props.max;
    }
    if (props.min && !props.max) {
      return parseInt(value) >= props.min;
    }
    if (!props.min && props.max) {
      return parseInt(value) <= props.max;
    }
    return true;
  };
  const inpNum = (e: any) => {
    const charCode = typeof e.which == 'undefined' ? e.keyCode : e.which;
    const charStr = String.fromCharCode(charCode);
    if (!charStr.match(/^[0-9]+$/)) {
      e.preventDefault();
    }
  };

  return (
    <div className={styles.input_wrapper} style={props.style}>
      <input
        id={props.id}
        className={classnames({
          [styles.input]: true,
          [styles.disabeled]: props.disabled,
          [styles.valid]: !props.disabled && !props.valid,
          [styles.focusMain]: props.valid,
        })}
        type="number"
        name="name"
        autoComplete="off"
        value={props.value === 0 ? '' : props.value}
        onChange={change}
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onKeyPress={inpNum}
        placeholder={props.placeholder || '0'}
        disabled={props.disabled}
        min={`${props.min}`}
        max={`${props.max}`}
      />
    </div>
  );
};

export default InputNumber;
