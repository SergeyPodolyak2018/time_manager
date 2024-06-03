import React, {
  FC, useState,
} from 'react';

import styles from '../scenarioScheduler.module.scss';
import AgentTree from '../../../../ReusableComponents/FilterTree';
import { IMainState } from '../index';
import { IBusinessUnits } from '../../../../../common/interfaces/config';
import classnames from 'classnames';
import Checkbox from '../../../../ReusableComponents/CheckboxStyled';

interface SelectActivities {
  mainState: IMainState;
  singleChange: (name: string, value: any) => void;
  fetchedData: IBusinessUnits;
  initChecked: IBusinessUnits;
  snapshotId:string;
}

const SelectActivities: FC<SelectActivities> = ({ mainState, fetchedData, singleChange, snapshotId }) => {
  const setLocalCheckedItems = (newItems: IBusinessUnits) => {
    singleChange('localCheckedItems', newItems);
  };

  const [ filterAgentsByContacts, setFilterAgentsByContacts ] = useState(false)
  const filterAgents = ()=>{
    return JSON.parse(JSON.stringify(mainState.localCheckedItems));
  };

  return (
    <>
      <div className={styles.subHeader}>
        <span>Select activities</span>
      </div>

      <div
        className={styles.agentWrapper}
      >
        <AgentTree
          useSelectedAgents={false}
          setLocalCheckedItems={setLocalCheckedItems}
          localCheckedItems={filterAgents()}
          fetchedData={fetchedData}
          isWithoutFilterTabs={true}
          initActiveTab={'Activities'}
          snapshotId={snapshotId}
          externalStyle={{maxHeight:'463px'}}
        />
      </div>
      <div className={styles.fieldsContainer} style={{ height: '60px' }}>
        <div
          className={classnames({
            [styles.fieldsContainer__Body]: true,
            [styles.height40]: true,
            [styles.grid3]: true,
          })}
        >
          <div className={styles.insertScheduleView1__checkboxContainer}>
            <Checkbox
              checked={filterAgentsByContacts}
              onClick={() => setFilterAgentsByContacts(!filterAgentsByContacts)}
              style={{ width: '16px', height: '16px' }}
            />
            <label
              htmlFor={'createNewScenario'}
              onClick={() => setFilterAgentsByContacts(!filterAgentsByContacts)}
              style={{ marginLeft: '8px' }}
            >
              Additionally filter agents by contracts
            </label>
          </div>
        </div>
      </div>
    </>
  );
};

export default SelectActivities;
