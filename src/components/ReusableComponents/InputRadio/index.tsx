import React from 'react';
import styles from './inputRadio.module.scss';
import classnames from 'classnames';

export interface ICheckbox extends React.HTMLProps<HTMLElement> {
  id?: string;
  checked: boolean | undefined;
  onClick?: (e: React.MouseEvent) => void;
  classNames?: string[];
  type?: 'checkbox' | 'radio';
  disabled?: boolean;
  name?: string;
  value?: string;
  onChange?: (val: any) => void;
  dataTest?: string;
  error?:boolean;
}

const InputRadio = (props: ICheckbox) => {
  const {
    checked,
    onClick,
    classNames,
    id,
    type = 'radio',
    name,
    disabled = false,
    onChange = () => {},
    value,
    dataTest,
    error,
  } = props;


  return (
    <>
      <input
        style={{ display: 'none' }}
        type={type}
        id={id}
        name={name || `${id}`}
        onChange={val => onChange(val)}
        checked={!!checked}
        value={value || id}
        disabled={disabled}
      ></input>
      <label
        data-test={dataTest}
        id={classnames({
          [`${id}Radio`]: id,
        })}
        onClick={onClick}
        className={classnames([...(classNames || [])], {
          [styles.inputRadio]: true,
          [styles.inputRadio__disabled]: disabled,
          [styles['inputRadio--checked']]: checked,
          [styles.inputRadio__error]: error,
        })}
      ></label>
    </>
  );
};

export default InputRadio;
