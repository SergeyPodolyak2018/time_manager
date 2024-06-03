import React, {FC, useState} from 'react';
import styles from '../menu.module.scss';
import AgentTree from '../../../../ReusableComponents/FilterTree';
import Checkbox from '../../../../ReusableComponents/Checkbox';
import { IMainState } from '../index';
import { IBusinessUnits } from '../../../../../common/interfaces/config';
import { clone } from 'ramda';
import Utils from '../../../../../helper/utils';
import Spiner from '../../../../ReusableComponents/spiner';

interface ISelectAgents {
  mainState: IMainState;
  fetchedData: IBusinessUnits;
  initChecked: IBusinessUnits;
  setMainState: React.Dispatch<React.SetStateAction<IMainState>>;
  singleChange: (name: string, value: any) => void;
}

const SelectAgents: FC<ISelectAgents> = ({ mainState, fetchedData, singleChange, setMainState }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const isMultisite = (localCheckedItems: IBusinessUnits) => {
    const keys = Object.keys(localCheckedItems);
    if (keys.length === 0) {
      return true;
    }
    if (keys.length > 1) {
      return true;
    }

    return localCheckedItems[keys[0]].isAllChecked && Object.keys(localCheckedItems[keys[0]].sites).length !== 1;
  };

  const _fetchedData = Utils.getFilteredSelectAgentsList(fetchedData, mainState.agentFilterFromSelected);

  const setLocalCheckedItems = (newItems: IBusinessUnits) => {
    setMainState(prevState => {
      const newIndicators = clone(prevState.indicators);
      if (isMultisite(newItems)) {
        newIndicators.forEach(el => {
          if (el.disableIfMultisite && el.checked) {
            el.checked = false;
          }
        });
      }
      return {
        ...prevState,
        localCheckedItems: newItems,
        indicators: newIndicators,
      };
    });
  };

  const setLoadingCB = (isLoadingValue: boolean) => {
    singleChange('disabledButtons', isLoadingValue);
    setIsLoading(isLoadingValue);
  }

  return (
    <>
      {isLoading && (<Spiner></Spiner>)}
      <div className={styles.subHeader}>
        <span>Select agents</span>
      </div>

      <div className={`${styles.agentWrapper}`}>
        <AgentTree
          useSelectedAgents={mainState.useCurrentSelectedAgents}
          setLocalCheckedItems={setLocalCheckedItems}
          localCheckedItems={mainState.localCheckedItems}
          fetchedData={_fetchedData}
          isWithoutFilterTabs={true}
          excludeSearchType={['businessUnits']}
          setLoadingCallback={setLoadingCB}
        />
        <div className={styles.agentFooterWrapper}>
          <div
            className={styles.checkBoxWrap6}
            data-test={'match-activities-skills'}
            style={{ width: '260px', height: '16px' }}
          >
            <Checkbox
              checked={mainState.copyAllIncluded}
              onClick={() => singleChange('copyAllIncluded', !mainState.copyAllIncluded)}
              style={{ width: '10px', height: '10px' }}
            />
            <span onClick={() => singleChange('copyAllIncluded', !mainState.copyAllIncluded)}>
              Copy all included items
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default SelectAgents;
