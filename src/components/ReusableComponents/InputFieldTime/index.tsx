import React from 'react';
import styles from './input.module.scss';

export interface IInputProps extends React.HTMLProps<HTMLElement> {
  onChange: (e: any) => void;
  value?: string;
}

const InputTime = (props: IInputProps) => {
  const {
    value,
    // onChange
  } = props;

  const change = () => {
    //props.onChange()
  };
  // const getHours = () => {};
  // const getMin = () => {};
  const getDayPart = () => {
    return 'AM';
  };

  return (
    <div className={styles.inputWrapper}>
      <input
        className={`
        ${styles.input}
      `}
        onChange={change}
        value={value}
      ></input>
      <span>:</span>
      <input
        className={`
        ${styles.input}
      `}
        onChange={change}
        value={value}
      ></input>
      <span>{getDayPart()}</span>
    </div>
  );
};

export default InputTime;
