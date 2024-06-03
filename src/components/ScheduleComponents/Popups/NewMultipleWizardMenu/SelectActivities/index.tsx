import React, {FC, useState} from 'react';
import styles from '../menu.module.scss';
import AgentTree from '../../../../ReusableComponents/FilterTree';
import { IMainState } from '../index';
import { IBusinessUnits } from '../../../../../common/interfaces/config';
import { IDataByType } from '../dataByType';
import classnames from 'classnames';
import SchMultipleItems from '../../../../../helper/schedule/SchMultipleItems';
import { useSelector } from 'react-redux';
import { getCheckedItems } from '../../../../../redux/selectors/filterSelector';
import Spiner from '../../../../ReusableComponents/spiner';

interface ISelectActivities {
  mainState: IMainState;
  fetchedData: IBusinessUnits;
  initChecked: IBusinessUnits;
  setMainState: React.Dispatch<React.SetStateAction<IMainState>>;
  dataByType: IDataByType;
  singleChange: (name: string, value: any) => void;
  isDelete?: boolean;
  externalSearch?:string
  externalSearchChange?:(val:string) => void;
}

const SelectActivities: FC<ISelectActivities> = ({ singleChange, mainState, fetchedData, setMainState, dataByType, externalSearch, externalSearchChange }) => {
  const initChecked = useSelector(getCheckedItems);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const setLocalCheckedItems = (newItems: IBusinessUnits) => {
      setMainState(prevState => {
        return {
          ...prevState,
          localCheckedActivities: newItems,
        };
      });
  };

  const setLoadingCB = (isLoadingValue: boolean) => {
    singleChange('loading', isLoadingValue);
    setIsLoading(isLoadingValue);
  }

  return (
    <>
      {isLoading && (<Spiner></Spiner>)}
      <div className={styles.subHeader}>
        <span>Select activities</span>
      </div>

      <div
        className={classnames({
          [styles.activitiesWrapper]: dataByType.type !== 'edit',
          [styles.agentWrapperEditWizard]: dataByType.type === 'edit',
        })}
      >
        <AgentTree
          useSelectedAgents={mainState.passedView.indexOf(mainState.viewState) > -1 ? true : mainState.useCurrentSelectedAgents}
          setLocalCheckedItems={setLocalCheckedItems}
          localCheckedItems={mainState.localCheckedActivities}
          fetchedData={SchMultipleItems.filterData(initChecked,fetchedData)}
          initActiveTab={'Activities'}
          isWithoutFilterTabs={true}
          revertCheckActivityBehaviour={true}
          excludeSearchType={['businessUnits']}
          setLoadingCallback={setLoadingCB}
          externalSearchValue={externalSearch}
          externalSearchChange={externalSearchChange}
        />
      </div>
    </>
  );
};

export default SelectActivities;
