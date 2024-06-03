import React from 'react';
import styles from './contractItems.module.scss';
import {ContractItemType} from '../index';
import {
  IBusinessUnit,
  IBusinessUnits,
  IContractItem,
  IContractItems,
  ISite,
  ISites
} from '../../../../common/interfaces/config';
import ContractItem from './contractItem';
import {IContractOpenItem} from '../../../ReusableComponents/ContractTrees';

export interface IContractItemsEl extends React.HTMLProps<HTMLElement> {
  items: IBusinessUnits;
  openItems: IContractOpenItem[];
  onClickItem: (item: IBusinessUnit | ISite | IContractItem, type: ContractItemType) => void;
  onClickCheckbox: (e: React.MouseEvent, item: IBusinessUnit | ISite | IContractItem, type: ContractItemType) => void;
}

const ContractItems = (props: IContractItemsEl) => {
  const {
    items,
    openItems,
    onClickItem,
    onClickCheckbox,
  } = props;
  // const loading = useSelector(getFilterLoading);

  const getSortObjectByName = (items: IBusinessUnits | ISites | IContractItems) =>
      Object.keys(items)
          .map(id => items[String(id)])
          .sort((i0, i1) => i0.name > i1.name ? 1 : -1);

  const isOpen = (id: number | string, type: ContractItemType): boolean =>
    openItems.find(openItem => openItem.type === type && String(openItem.id) === String(id))?.isOpen ?? false;

  return (
    <div className={styles.filterItemsWrapper} id="contractItems">
      { getSortObjectByName(items).map((bu) => (
        <div style={{ width: '100%' }} key={`${bu.buId}-key`}>
          <ContractItem
            key={`buId-${bu.buId}`}
            content={`${bu.name}`}
            type={ContractItemType.businessUnits}
            counter={`(${Object.keys((bu as IBusinessUnit).sites ?? {}).length})`}
            checked={bu.isChecked}
            isAllChecked={(bu as IBusinessUnit).isAllChecked}
            onClick={() => onClickItem(bu, ContractItemType.businessUnits)}
            onClickCheckbox={(e: React.MouseEvent) => onClickCheckbox(e, bu, ContractItemType.businessUnits)}
            loading={false}
          />
          {
            isOpen(bu.buId, ContractItemType.businessUnits) && (getSortObjectByName((bu as IBusinessUnit).sites) as ISite[]).map((site) =>
              (<div style={{ width: '100%' }} key={`${bu.buId}-${site.siteId}key`}>
                <ContractItem
                  key={`buId-${bu.buId}-siteId-${site.siteId}`}
                  content={`${site.name}`}
                  type={ContractItemType.sites}
                  counter={`(${Object.keys((site as ISite).contracts ?? {}).length})`}
                  checked={site.isChecked}
                  isAllChecked={site.isAllChecked}
                  onClick={() => onClickItem(site, ContractItemType.sites)}
                  onClickCheckbox={(e: React.MouseEvent) => onClickCheckbox(e, site, ContractItemType.sites)}
                  loading={false}
                />
                {
                  isOpen(site.siteId, ContractItemType.sites) && (getSortObjectByName((site as ISite).contracts ?? {}) as IContractItem[]).map((contract) =>
                    (<div style={{ width: '100%' }} key={`${bu.buId}-${site.siteId}-${contract.id}key`}>
                      <ContractItem
                        key={`buId-${bu.buId}-siteId-${site.siteId}-contractId-${contract.id}`}
                        content={`${contract.name}`}
                        type={ContractItemType.contracts}
                        checked={contract.isChecked}
                        isAllChecked={contract.isChecked}
                        onClick={(e: React.MouseEvent) => onClickCheckbox(e, contract, ContractItemType.contracts)}
                        onClickCheckbox={(e: React.MouseEvent) => onClickCheckbox(e, contract, ContractItemType.contracts)}
                        loading={false}
                      />
                    </div>)
                  )
                }
              </div>)
            )
          }
        </div>
      ))}
    </div>
  );
};

export default ContractItems;
