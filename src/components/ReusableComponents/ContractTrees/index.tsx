import React, {FC, useState} from 'react';
import styles from './ContractSidebar.module.scss';
import Spinner from '../spiner';
import {useSelector} from 'react-redux';
import {getFilterLoading} from '../../../redux/selectors/filterSelector';
import {IBusinessUnit, IBusinessUnits, IContractItem, ISite} from '../../../common/interfaces/config';
import classnames from 'classnames';
import ContractItems from '../../MainLayout/FilterSidebar/ContractItems';
import {ContractItemType} from '../../MainLayout/FilterSidebar';
import {clone} from 'ramda';

export interface IContractTreeProps {
  fetchedData: IBusinessUnits,
  setFetchedData: (value: IBusinessUnits) => void,
}

export interface IContractOpenItem {
  id: number,
  type: ContractItemType,
  isOpen: boolean,
}

const ContractTree: FC<IContractTreeProps> = ({fetchedData, setFetchedData}) => {
  const loading = useSelector(getFilterLoading);
  const initOpenItems = (): IContractOpenItem[] => {
    const openItems: IContractOpenItem[] = [];
    Object.keys(fetchedData).forEach(buId => {
      openItems.push({ id: parseInt(buId), type: ContractItemType.businessUnits, isOpen: false });
      Object.keys(fetchedData[buId].sites).forEach(siteId => {
        openItems.push({ id: parseInt(siteId), type: ContractItemType.sites, isOpen: false });
        Object.keys(fetchedData[buId].sites[siteId].contracts ?? {}).forEach(contractId => {
          openItems.push({ id: parseInt(contractId), type: ContractItemType.sites, isOpen: false });
        })
      })
    });

    return openItems;
  }

  const [openItems, setOpenItems] = useState<IContractOpenItem[]>(initOpenItems());

  const getIdEl = (item: IBusinessUnit | ISite | IContractItem, type: ContractItemType): string | number => {
    switch (type) {
      case ContractItemType.sites:
        return (item as ISite).siteId;
      case ContractItemType.contracts:
        return (item as IContractItem).id;
      default:
        return item.buId;
    }
  }

  const onClickItem = (item: IBusinessUnit | ISite | IContractItem, type: ContractItemType) => {
    const rawId = getIdEl(item, type)
    const id = typeof rawId === 'string' ? parseInt(rawId) : rawId;

    const openItemIndex = openItems.findIndex(openItem => openItem.id === id && openItem.type === type)
    if (openItemIndex == -1) return;

    const _openItems = clone(openItems);
    _openItems[openItemIndex].isOpen = !_openItems[openItemIndex].isOpen;

    setOpenItems(_openItems);
  }

  const onClickCheckbox = (e: React.MouseEvent, item: IBusinessUnit | ISite | IContractItem, type: ContractItemType) => {
    e.stopPropagation();
    const _fetchedData = clone(fetchedData);
    const isChecked = !item.isChecked;

    if (type === ContractItemType.businessUnits) {
      _fetchedData[item.buId].isChecked = isChecked;
      _fetchedData[item.buId].isAllChecked = isChecked;

      Object.keys(_fetchedData[item.buId].sites).forEach(siteId => {
        _fetchedData[item.buId].sites[siteId].isChecked = isChecked;
        _fetchedData[item.buId].sites[siteId].isAllChecked = isChecked;
        Object.keys(_fetchedData[item.buId].sites[siteId].contracts ?? {}).forEach(contractId => {
          // @ts-ignore
          _fetchedData[item.buId].sites[siteId].contracts[contractId].isChecked = isChecked
        })
      });
    } else if (type === ContractItemType.sites) {
      _fetchedData[item.buId].sites[(item as ISite).siteId].isChecked = isChecked;
      _fetchedData[item.buId].sites[(item as ISite).siteId].isAllChecked = isChecked;

      Object.keys(_fetchedData[item.buId].sites[(item as ISite).siteId].contracts ?? {}).forEach(contractId => {
        // @ts-ignore
        _fetchedData[item.buId].sites[(item as ISite).siteId].contracts[contractId].isChecked = isChecked
      });
    } else if (type === ContractItemType.contracts) {
      Object.keys(_fetchedData[item.buId].sites).forEach(siteId => {
        const contractIds = Object.keys(_fetchedData[item.buId].sites[siteId].contracts ?? {})
        if (contractIds.length && contractIds.includes(String((item as IContractItem).id))) {
          // @ts-ignore
          _fetchedData[item.buId].sites[siteId].contracts[(item as IContractItem).id].isChecked = isChecked;
        }
      });
    }

    Object.keys(_fetchedData).forEach(buId => {
      Object.keys(_fetchedData[buId].sites).forEach(siteId => {
        const isAllChecked =
            // @ts-ignore
            Object.keys(_fetchedData[buId].sites[siteId].contracts ?? {}).every(contractId => _fetchedData[buId].sites[siteId].contracts[contractId].isChecked);
        const isChecked =
            // @ts-ignore
            Object.keys(_fetchedData[buId].sites[siteId].contracts ?? {}).some(contractId => _fetchedData[buId].sites[siteId].contracts[contractId].isChecked);
        _fetchedData[buId].sites[siteId].isAllChecked = isAllChecked;
        _fetchedData[buId].sites[siteId].isChecked = isChecked;
      });

      const isAllChecked =Object.keys(_fetchedData[buId].sites).every(siteId => _fetchedData[buId].sites[siteId].isChecked && _fetchedData[buId].sites[siteId].isAllChecked);
      const isChecked =Object.keys(_fetchedData[buId].sites).some(siteId => _fetchedData[buId].sites[siteId].isChecked);
      _fetchedData[buId].isAllChecked = isAllChecked;
      _fetchedData[buId].isChecked = isChecked;
    });

    setFetchedData(_fetchedData);
  };

  return (
      <div
          className={classnames({
            [styles.filterSidebar]: true,
          })}
      >
      {loading.isLoading && <Spinner />}
      <div className={styles.treeContainerWrapper}>
        <div className={styles.filterSidebarContainer}>
          <div className={styles.treeContainer}>
            <ContractItems
              items={fetchedData}
              openItems={openItems}
              onClickItem={onClickItem}
              onClickCheckbox={onClickCheckbox}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContractTree;
