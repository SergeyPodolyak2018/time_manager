import React from 'react';
import styles from './text.module.scss';
import classnames from 'classnames';

export interface ISearchProps extends React.HTMLProps<HTMLElement> {
  id: string;
  change: (...args: any[]) => void;
  value: string;
  removeSpecialCharacters?: boolean;
  placeHolder: string;
  style: any;
  notValid?: boolean;
}

const Text = (props: ISearchProps) => {
  const change = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if(props.removeSpecialCharacters){
      const newString = e.target.value.replace(/[.*+?^${}()|[\]\\]/g, '');
      props.change(newString);
    }else{
      props.change(e.target.value);
    }
  };

  return (
    <div className={styles.input_wrapper} style={props.style}>
      <input
        id={props.id}
        className={classnames({
          [styles.input]: true,
          [styles.valid]: props.notValid,
          [styles.focusMain]: !props.notValid,
        })}
        type="text"
        name="name"
        autoComplete="off"
        value={props.value}
        onChange={change}
        placeholder={props.placeHolder}
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
        }}
      />
    </div>
  );
};

export default Text;
