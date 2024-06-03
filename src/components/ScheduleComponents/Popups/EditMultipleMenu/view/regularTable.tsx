import React from 'react';
import styles from '../menu.module.scss';
//import classnames from 'classnames';
import CheckboxBig from '../../../../ReusableComponents/Checkbox';

export interface IButtonProps extends React.HTMLProps<HTMLElement> {
  type: string;
  items:any[];
  selectItems:(index:number)=> void;
  isSelectedItem:(element: any, index: number)=>boolean;
}

const RegularTable = (props: IButtonProps) => {
  const { type, items, selectItems, isSelectedItem } = props;
  return (
    <table>
      <thead>
      <tr>
        <td>
          <span>{type}</span>
        </td>
        <td>
          <span>Short</span>
        </td>
        <td>
          <span>Action</span>
        </td>
      </tr>
      </thead>
      <tbody>
      {items && items.map((el, index) => {
        return (
          <tr
            key={index}
            onClick={() => selectItems(index)}
            className={`${isSelectedItem(el, index) ? styles.selected : ''}`}
          >
            <td>
              <span title={el.name} className={styles.firstTd}>
                {el.name}
              </span>
            </td>
            <td>
              <span title={el.shortName} className={styles.secTd}>
                {el.shortName}
              </span>
            </td>
            <td>
              <span className={styles.thrTd}>
                <CheckboxBig icon={'mark'} checked={false} />
              </span>
            </td>
          </tr>
        );
      })}
      </tbody>
    </table>
  );
};

export default RegularTable;
