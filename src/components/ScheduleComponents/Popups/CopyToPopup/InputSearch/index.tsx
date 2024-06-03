import React from 'react';
import styles from './input.module.scss';

export interface IInputProps extends React.HTMLProps<HTMLElement> {
  onChange: (e: any) => void;
  value?: string;
  placeholder: string;
}

const InputSearch = (props: IInputProps) => {
  const { value, onChange } = props;

  return (
    <div className={styles.inputWrapper}>
      <input
        id="search-input"
        className={styles.input}
        onChange={e => onChange(e.target.value)}
        value={value}
        placeholder={'Search activities'}
      />
    </div>
  );
};

export default InputSearch;
