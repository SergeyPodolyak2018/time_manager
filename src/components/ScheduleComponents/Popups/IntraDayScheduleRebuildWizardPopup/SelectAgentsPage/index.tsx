import React, { FC, useState } from 'react';
import styles from './index.module.scss';
import AgentTree, {ItemType} from '../../../../ReusableComponents/FilterTree';
import Checkbox from '../../../../ReusableComponents/Checkbox';
import { useSelector } from 'react-redux';
import { getCheckedItems, getFilterData } from '../../../../../redux/selectors/filterSelector';
import {IBusinessUnits, ISites} from '../../../../../common/interfaces/config';
import { clone, omit } from 'ramda';
import { IScheduleRebuildWizardPageProps, ISelectAgentsData} from '../interfaces';
import Spiner from '../../../../ReusableComponents/spiner';

const SelectAgentsPage: FC<IScheduleRebuildWizardPageProps> = props => {
  const initChecked = useSelector(getCheckedItems);
  const [agentSeasrch, setAgentSeasrch] = useState<string>('');
  // @ts-ignore
  const getBuFetchedData = (fetchedData: IBusinessUnits): { [p: string]: { buId: number; name: string; timezoneId: number; sites: ISites } } => {
    return omit([...Object.keys(fetchedData).filter(buId => !Object.keys(initChecked).includes(buId))], fetchedData) as IBusinessUnits;
  }

  const buFetchedData = getBuFetchedData(useSelector(getFilterData));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectAgentState, setSelectAgentState] = useState<ISelectAgentsData>({
    isDoNotRebuildModified: true,
    checkedAgents: props.initState.data.selectAgentsPage.checkedAgents,
  });

  const filteredFetchedData = () => {
    const siteIds = props.initState.data.selectSitesPage
        .filter(({isChecked}) => isChecked)
        .map(({siteId}) => String(siteId));
    return Object.keys(buFetchedData)
      .reduce((acc: IBusinessUnits, buId) => ({
        ...acc,
        [buId]: {
          ...buFetchedData[buId],
          sites: omit(Object.keys(buFetchedData[buId].sites).filter(siteId => !siteIds.includes(siteId)),
      (buFetchedData[buId].sites as ISites) ?? {}),
    }}), {});
  }

  const onChangeState = (fieldName: keyof ISelectAgentsData, value: any) => {
    const _selectAgentState = clone(selectAgentState);
    _selectAgentState[fieldName] = value;
    props.onChangeState('selectAgentsPage', _selectAgentState);

    setSelectAgentState(_selectAgentState);
  };

  const setLocalCheckedItems = (newItems: IBusinessUnits) => {
    onChangeState('checkedAgents', newItems);
  };

  const isCheckedDoNotRebuildModified = (): boolean => selectAgentState.isDoNotRebuildModified;

  const onCheckDoNotRebuildModified = () => {
    onChangeState('isDoNotRebuildModified', !isCheckedDoNotRebuildModified());
  };

  const getContactIds = () => {
    if (!props.initState.data.selectOptionsPage.isAdditionallyFilterAgents) return null;

    return props.initState.data.filterContractPage.contracts.map(({id}) => id);
  }

  const setLoadingCB = (isLoadingValue: boolean) => {
    props.onChangeState('isDisabledButtons', isLoadingValue, true);
    setIsLoading(isLoadingValue);
  }

  return (
    <div className={styles.pageWrapper}>
      {isLoading && (<Spiner></Spiner>)}
      <div className={`${styles.agentWrapper}`}>
        <AgentTree
          initActiveTab={'Agents'}
          useSelectedAgents={true}
          setLocalCheckedItems={setLocalCheckedItems}
          localCheckedItems={selectAgentState.checkedAgents}
          fetchedData={filteredFetchedData()}
          isWithoutFilterTabs={true}
          excludeSearchType={[ItemType.businessUnits]}
          contractId={getContactIds()}
          setLoadingCallback={setLoadingCB}
          externalSearchValue={agentSeasrch}
          externalSearchChange={setAgentSeasrch}
        />
        <div className={styles.agentFooterWrapper}>
          <div className={styles.checkBoxWrap} data-test={'match-activities-skills'}>
            <Checkbox checked={isCheckedDoNotRebuildModified()} onClick={onCheckDoNotRebuildModified} />
            <span onClick={onCheckDoNotRebuildModified}>Do not rebuild modified agent schedule</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectAgentsPage;
