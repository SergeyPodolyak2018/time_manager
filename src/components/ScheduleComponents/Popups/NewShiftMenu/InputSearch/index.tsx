import React from 'react';
import styles from './input.module.scss';
import classnames from 'classnames';

export interface IInputProps extends React.HTMLProps<HTMLElement> {
  onChange: (e: any) => void;
  value?: string;
  placeholder: string;
  classNames?: string[];
}

const InputSearch = (props: IInputProps) => {
  const { value, onChange, classNames } = props;

  return (
    <div className={classnames([styles.inputWrapper, classNames])}>
      <input
        id="search-input"
        className={classnames([styles.input])}
        onChange={e => onChange(e.target.value)}
        value={value}
        placeholder={'Search activities'}
      />
    </div>
  );
};

export default InputSearch;
