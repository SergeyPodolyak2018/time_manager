import React, { useCallback } from 'react';
import styles from '../menu.module.scss';
import DateUtils from '../../../../../helper/dateUtils';

export interface IButtonProps extends React.HTMLProps<HTMLElement> {
  type: string;
  items: any[];
  selectItems:(index:number) => void;
  isSelectedItem:(element: any, index: number) => boolean;
  timeFormat?: string;
}

const ShiftTable = (props: IButtonProps) => {

  const getShiftTime = useCallback((el: any) => {
      if (props.timeFormat === '12hours') {
        return el.shiftTitle;
      }
      const [start, end] = el.shiftTitle.split('-');
      const startIn24 = DateUtils.convertTimeTo24h(start);
      const endIn24 = DateUtils.convertTimeTo24h(end);
      const res = `${startIn24} - ${endIn24}`;
      return res;
    },
    [props.timeFormat],
  );

  const { type, items, selectItems, isSelectedItem } = props;
  return (
    <table>
      <thead>
      <tr>
        <td>
          <span>{type}</span>
        </td>
        <td>
          <span>Hours</span>
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
              <span title={el.shortName} className={styles.thrTd}>
                {getShiftTime(el)}
              </span>
            </td>
          </tr>
        );
      })}
      </tbody>
    </table>
  );
};

export default ShiftTable;
