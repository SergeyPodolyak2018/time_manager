import React, { FC } from 'react';

import styles from '../meetingScheduler.module.scss';
import AgentTree from '../../../../ReusableComponents/FilterTree';
import { IMainState } from '../index';
import { IBusinessUnits } from '../../../../../common/interfaces/config';
import SchMultipleItems from '../../../../../helper/schedule/SchMultipleItems';
import { useSelector } from 'react-redux';
import { getCheckedItems } from '../../../../../redux/selectors/filterSelector';
import Spiner from '../../../../ReusableComponents/spiner';

interface ISelectAgents {
  mainState: IMainState;
  singleChange: (name: string, value: any) => void;
  fetchedData: IBusinessUnits;
  initChecked: IBusinessUnits;
  snapshotId:string;
  blockChecking:boolean;
}

const SelectAgents: FC<ISelectAgents> = ({ mainState, fetchedData, singleChange, snapshotId, blockChecking }) => {
  const initChecked = useSelector(getCheckedItems);

  const setLocalCheckedItems = (newItems: IBusinessUnits) => {
    if(!blockChecking){
      singleChange('localCheckedItems', newItems);
    }
  };

  const filterAgents = ()=>{
    const cloneLocalCheckedItems  = JSON.parse(JSON.stringify(mainState.localCheckedItems));
    const mainBu = Object.keys(mainState.localCheckedItems)[0];
    if(!mainState.createNewMeeting){
      const agents=[];
      const agentsTemp = mainState.meetings.filter(el=>el.id===mainState.selectedMeetingId)[0].meetingAgents;
      if(Array.isArray(agentsTemp)){
        agents.push(...agentsTemp);
      }else{
        agents.push(agentsTemp);
      }
      const sites = Object.keys(mainState.localCheckedItems[mainBu].sites);
      for (const i of sites) {
        if (mainState.localCheckedItems[mainBu].sites[i].isChecked) {
          const teams = Object.keys(mainState.localCheckedItems[mainBu].sites[i].teams);
          for (const j of teams) {
            const agentsInTeam = Object.keys(mainState.localCheckedItems[mainBu].sites[i].teams[j].agents);
            if(mainState.localCheckedItems[mainBu].sites[i].teams[j].isChecked && agentsInTeam.length>0){
              const difference = agents.filter(x => !agentsInTeam.includes(x.toString()));
              if(difference.length>0){
                for (const k of difference) {
                  if(cloneLocalCheckedItems[mainBu].sites[i].teams[j].agents[k]){
                    cloneLocalCheckedItems[mainBu].sites[i].teams[j].agents[k].isChecked=false;
                  }

                }
              }
            }
          }
        }
      }
    }
    return cloneLocalCheckedItems
  };

  const setLoadingCB = (isLoadingValue: boolean) => {
    singleChange('loading', isLoadingValue);
  }

  return (
    <>
      {mainState.loading && (<Spiner></Spiner>)}
      <div className={styles.subHeader}>
        <span>Select agents</span>
      </div>

      <div
        className={styles.agentWrapper}
      >
        <AgentTree
          useSelectedAgents={true}
          setLocalCheckedItems={setLocalCheckedItems}
          localCheckedItems={SchMultipleItems.removeEmptySite(filterAgents(),initChecked,mainState.emptySites)}
          fetchedData={SchMultipleItems.removeEmptySite(SchMultipleItems.filterData(initChecked,fetchedData),initChecked,mainState.emptySites)}
          isWithoutFilterTabs={true}
          snapshotId={snapshotId}
          externalStyle={{maxHeight:'463px'}}
          excludeSearchType={['businessUnits']}
          setLoadingCallback={setLoadingCB}
        />
      </div>
    </>
  );
};

export default SelectAgents;
