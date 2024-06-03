import React from 'react';
import styles from '../menu.module.scss';
//import classnames from 'classnames';
import CheckboxBig from '../../../../ReusableComponents/Checkbox';
//import DateUtils from '../../../../../helper/dateUtils';
import { IException } from '../../../../../redux/ts/intrefaces/timeLine';
import { ISite } from '../../../../../common/interfaces/config';

export interface IButtonProps extends React.HTMLProps<HTMLElement> {
  type: string;
  items:any[];
  selectItems:(index:number)=> void;
  isSelectedItem:(element: any, index: number)=>boolean;
}

const ExceptionTable = (props: IButtonProps) => {
  const { type, items, selectItems, isSelectedItem } = props;

  const getSites = (item: IException): string => {
    const sites: [string | number, ISite][] = item.sites ? Object.entries(item.sites) : [];
    return sites.map(([, v]) => v.name).join(', ');
  };

  return (
    <table>
      <thead>
      <tr>
        <td>
          <span>{type}</span>
        </td>
        <td style={{width:'60px'}}>
          <span>Short</span>
        </td>
        <td>
          <span>Site</span>
        </td>
        <td>
          <span>Paid</span>
        </td>
        <td>
          <span>Convertible</span>
        </td>
        <td style={{width:'75px'}}>
          <span>Time off</span>
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
            <td style={{width:'60px'}}>
                        <span title={el.shortName} className={styles.secTd}>
                          {el.shortName}
                        </span>
            </td>
            <td>
                        <span title={getSites(el)} className={styles.secTd}>
                          {getSites(el)}
                        </span>
            </td>
            <td>
                        <span className={styles.secTd}>
                          <CheckboxBig icon={'mark'} checked={el.isPaid} />
                        </span>
            </td>
            <td>
                        <span className={styles.secTd}>
                          <CheckboxBig icon={'mark'} checked={el.isConvertable2dayOff ?? el.isFullDay} />
                        </span>
            </td>
            <td style={{width:'75px'}}>
                        <span className={styles.fthTd}>
                          <CheckboxBig icon={'mark'} checked={el.isUsedAsVacation} />
                        </span>
            </td>
          </tr>
        );
      })}
      </tbody>
    </table>
  );
};

export default ExceptionTable;
