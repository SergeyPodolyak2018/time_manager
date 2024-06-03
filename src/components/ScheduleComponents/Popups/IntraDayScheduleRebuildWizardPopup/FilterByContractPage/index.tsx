import React, {FC, useEffect, useState} from 'react';
import styles from './index.module.scss';
import ContractTree from '../../../../ReusableComponents/ContractTrees';
import { useSelector } from 'react-redux';
import { IBusinessUnits, ICfgContract, IContractItem } from '../../../../../common/interfaces/config';
import { IScheduleRebuildWizardPageProps } from '../interfaces';
import restApi from '../../../../../api/rest';
import { getCheckedItems } from '../../../../../redux/selectors/chartSelector';
import { getFilterData } from '../../../../../redux/selectors/filterSelector';
import Spiner from '../../../../ReusableComponents/spiner';


const FilterByContractsPage: FC<IScheduleRebuildWizardPageProps> = (props) => {
  const { initState, onChangeState } = props;
  const initContract: IContractItem[] = props.initState.data.filterContractPage.contracts;
  const filterData = useSelector(getFilterData);
  const checkFilterData = useSelector(getCheckedItems);
  const initFetchData = (checkFilterData: IBusinessUnits): IBusinessUnits =>
    Object.keys(checkFilterData).reduce((acc, buId)=> ({
      ...acc,
      [buId]: {...checkFilterData[buId],
        name: filterData[buId].name ?? `Business unit ${buId}`,
        isChecked: false,
        isAllChecked: false,
        sites:
          Object.keys(checkFilterData[buId].sites).reduce((acc, siteId) => ({
            ...acc,
            [siteId]: {
              ...checkFilterData[buId].sites[siteId],
              name: filterData[buId].sites[siteId].name ?? `Site ${siteId}`,
              isChecked: false,
              isAllChecked: false,
              contracts: {},
            }
          }), {})
      }
    }), {});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchedData, setFetchedData] = useState<IBusinessUnits>(initFetchData(checkFilterData));

  const getContracts = async (): Promise<ICfgContract[]> => {
    setIsLoading(true);
    const ocsPayload = {
      buId: Object.keys(checkFilterData).map(buId => parseInt(buId)),
      siteId: initState.data.selectSitesPage
        .reduce((acc: number[], s) => s.isChecked ? [...acc, s.siteId] : [...acc], []),
    }
    const response = await restApi.openContractSnapshot(ocsPayload);
    const { snapshotId, totalCount } = response.data.data;
    const fcsPayload = {
      snapshotId,
      firstIndex: 0,
      lastIndex: totalCount
    }
    const contractsResponse = await restApi.findContractFromSnapshot(fcsPayload);
    await restApi.closeAgentDaySnapshot({ snapshotId });
    setIsLoading(false);

    return contractsResponse.data.data;
  };

  useEffect(() => {
    getContracts().then(contracts => contracts.reduce((acc: IBusinessUnits, contract) => {
      const _acc: IBusinessUnits = {...acc};
      contract.siteId.forEach(siteId => {
        if ((_acc[contract.buId]?.sites[siteId]?.contracts ?? null) == null) {
          _acc[contract.buId].sites[siteId].contracts = {
            [contract.id]: { ...contract, isChecked: initContract.map(({ id } ) => id).includes(contract.id) }
          };
        }
        (_acc[contract.buId]?.sites[siteId]?.contracts ?? {})[contract.id] = { ...contract, isChecked: initContract.map(({ id } ) => id).includes(contract.id) };
      });

      return _acc;
      }, fetchedData))
        .then(sitesContracts => onSetFetchedData(sitesContracts));

  }, []);

  useEffect(() => {
    onChangeState('isDisabledButtons', isLoading, true);
  }, [isLoading]);

  const onSetFetchedData = (data: IBusinessUnits) => {
    const sitesIds = props.initState.data.selectSitesPage.filter(site => site.isChecked).map(({siteId}) => String(siteId));
    const contracts: IContractItem[] = [];
    Object.keys(data).forEach(buId => {
      data[buId].sites = Object.keys(data[buId].sites).reduce((acc, id) => (sitesIds.includes(id) ? {...acc, [id]: data[buId].sites[id]} : {...acc}), {});
      Object.keys(data[buId].sites).forEach(siteId => {
        if (!sitesIds.includes(String(siteId))) return;
        Object.keys(data[buId].sites[siteId].contracts ?? {}).forEach(contractId => {
          // @ts-ignore
          if (data[buId].sites[siteId].contracts[contractId].isChecked) {
            // @ts-ignore
            contracts.push(data[buId].sites[siteId].contracts[contractId])
          }
        });
        data[buId].sites[siteId].isAllChecked = Object.keys(data[buId].sites[siteId].contracts ?? {})
            // @ts-ignore
            .every(contractId => data[buId].sites[siteId].contracts[contractId].isChecked);
        data[buId].sites[siteId].isChecked = Object.keys(data[buId].sites[siteId].contracts ?? {})
            // @ts-ignore
            .some(contractId => data[buId].sites[siteId].contracts[contractId].isChecked);
      });

      data[buId].isAllChecked = Object.keys(data[buId].sites)
          // @ts-ignore
          .every(siteId => data[buId].sites[siteId].isChecked && data[buId].sites[siteId].isAllChecked);
      data[buId].isChecked = Object.keys(data[buId].sites)
          // @ts-ignore
          .some(siteId => data[buId].sites[siteId].isChecked);
    });

    onChangeState('filterContractPage', { contracts });
    setFetchedData(data);
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={`${styles.agentWrapper}`}>
        {isLoading ? (
          <div style={{height: '80%'}}>
            <Spiner />
          </div>
        ) : (
          <ContractTree
              setFetchedData={onSetFetchedData}
              fetchedData={fetchedData}
          />
        )}
      </div>
    </div>
  );
};

export default FilterByContractsPage;
