import React, { FC } from 'react';
import styles from './contractItem.module.scss';
import Checkbox, { IconTypes } from '../../../../ReusableComponents/Checkbox';
import { ContractItemType } from '../../index';
import classnames from 'classnames';
import ReactHtmlParser from 'react-html-parser';

export interface IContractItemEl extends React.HTMLProps<HTMLElement> {
  content: any;
  type: ContractItemType;
  checked?: boolean | undefined;
  onClick: (e: React.MouseEvent) => void;
  isFounded?: boolean;
  isAllChecked?: boolean | undefined;
  onClickCheckbox: (e: React.MouseEvent) => void;
  counter?: string | number;
  loading?: boolean;
}

const ContractItem: FC<IContractItemEl> = props => {
  const { content, type, onClick, checked, onClickCheckbox, isFounded, isAllChecked, counter, loading } = props;
  const icon: IconTypes = isAllChecked ? 'arrow' : checked ? 'circle' : undefined;

  return (
    <>
      <div
        className={classnames({
          [styles.filterItem]: true,
          [styles.filterItemBU]: type === ContractItemType.businessUnits,
          [styles.filterItemSite]: type === ContractItemType.sites,
          [styles.filterItemActivities]: type === ContractItemType.contracts,
          [styles['filterItem--founded']]: isFounded,
          [styles.loading]: loading,
        })}
        onClick={onClick}
        id={'filterItem'}
        datatype={type}
      >
        <div
          className={classnames({
            [styles.filterItem__titleWrapper]: true,
            [styles.filterItemBU__titleWrapper]: type === ContractItemType.businessUnits,
            [styles.filterItemSite__titleWrapper]: type === ContractItemType.sites,
            [styles.filterItemAgent__titleWrapper]: type === ContractItemType.contracts,
          })}
          datatype={content.replaceAll('<mark>', '').replaceAll('</mark>', '')}
        >
          <span
            id={`filterText`}
            className={styles.filterItemBU__title}
          >
            {content.includes('<None>') ? `${content}` : ReactHtmlParser(content)}
            {counter && <span> {counter}</span>}
          </span>
        </div>
        <div
          className={styles.filterItem__checkbox}
          datatype={content.replaceAll('<mark>', '').replaceAll('</mark>', '')}
        >
          <Checkbox id={content} icon={icon} onClick={onClickCheckbox} />
        </div>
      </div>
    </>
  );
};

export default ContractItem;
