import React from 'react';
import styles from '../menu.module.scss';
//import classnames from 'classnames';
import CheckboxBig from '../../../../ReusableComponents/Checkbox';
import DateUtils from '../../../../../helper/dateUtils';

export interface IButtonProps extends React.HTMLProps<HTMLElement> {
  type: string;
  items:any[];
  selectItems:(index:number)=> void;
  isSelectedItem:(element: any, index: number)=>boolean;
}

const BreakTable = (props: IButtonProps) => {
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
          <span>Hours</span>
        </td>
        <td>
          <span>Paid</span>
        </td>
      </tr>
      </thead>
      <tbody>
      {items.map((el, index) => {
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
              <span
                title={`${DateUtils.convertMinutesToTime(el.duration)}`}
                className={styles.secTd}
              >{`${DateUtils.convertMinutesToTime(el.duration)}`}</span>
            </td>
            <td>
              <span className={styles.fthTd}>
                <CheckboxBig icon={'mark'} checked={el.isPaid} />
              </span>
            </td>
          </tr>
        );
      })}
      </tbody>
    </table>
  );
};

export default BreakTable;
