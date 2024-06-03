import React, { FC, useState } from 'react';
import styles from './index.module.scss';
import AgentTree from '../../../../ReusableComponents/FilterTree';
import Checkbox from '../../../../ReusableComponents/Checkbox';
import { useSelector } from 'react-redux';
import { getCheckedItems, getFilterData } from '../../../../../redux/selectors/filterSelector';
import { IBusinessUnits } from '../../../../../common/interfaces/config';
import { clone, omit } from 'ramda';
import { IScheduleRebuildWizardPageProps, ISelectActivitiesData } from '../interfaces';
import Spiner from '../../../../ReusableComponents/spiner';

const SelectActivitiesPage: FC<IScheduleRebuildWizardPageProps> = props => {
  const initChecked = useSelector(getCheckedItems);
  const buFetchedData = ((fetchedData: any): any =>
    omit([...Object.keys(fetchedData).filter(buId => !Object.keys(initChecked).includes(buId))], fetchedData))(
    useSelector(getFilterData),
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectAgentState, setSelectAgentState] = useState<ISelectActivitiesData>({
    isCheckedRetain: true,
    checkedActivities: props.initState.data.selectActivitiesPage.checkedActivities,
  });

  const onChangeState = (fieldName: keyof ISelectActivitiesData, value: any) => {
    const _selectAgentState = clone(selectAgentState);
    _selectAgentState[fieldName] = value;
    props.onChangeState('selectActivitiesPage', _selectAgentState);

    setSelectAgentState(_selectAgentState);
  };

  const setLocalCheckedItems = (newItems: IBusinessUnits) => {
    onChangeState('checkedActivities', newItems);
  };

  const isCheckedRetainScheduleActivities = (): boolean => selectAgentState.isCheckedRetain;

  const onCheckedRetainScheduleActivities = () => {
    onChangeState('isCheckedRetain', !isCheckedRetainScheduleActivities());
  };

  const setLoadingCB = (isLoadingValue: boolean) => {
    setIsLoading(isLoadingValue);
  }

  return (
    <div className={styles.pageWrapper}>
      {isLoading && (<Spiner></Spiner>)}
      <div className={`${styles.agentWrapper}`}>
        <AgentTree
          initActiveTab={'Activities'}
          useSelectedAgents={true}
          setLocalCheckedItems={setLocalCheckedItems}
          localCheckedItems={selectAgentState.checkedActivities}
          fetchedData={buFetchedData}
          isWithoutFilterTabs={true}
          setLoadingCallback={setLoadingCB}
        />
        <div className={styles.agentFooterWrapper}>
          <div className={styles.checkBoxWrap} data-test={'match-activities-skills'}>
            <Checkbox checked={isCheckedRetainScheduleActivities()} onClick={onCheckedRetainScheduleActivities} />
            <span onClick={onCheckedRetainScheduleActivities}>Retain schedule activities</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectActivitiesPage;
