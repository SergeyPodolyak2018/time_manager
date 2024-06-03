import React, {
  FC, useState,
} from 'react';

import styles from '../scenarioScheduler.module.scss';
import AgentTree from '../../../../ReusableComponents/FilterTree';
import { IMainState } from '../index';
import { IBusinessUnits } from '../../../../../common/interfaces/config';
import classnames from 'classnames';
import Checkbox from '../../../../ReusableComponents/CheckboxStyled';

interface ISelectAgents {
  mainState: IMainState;
  singleChange: (name: string, value: any) => void;
  fetchedData: IBusinessUnits;
  initChecked: IBusinessUnits;
  snapshotId:string;
}

const SelectAgents: FC<ISelectAgents> = ({ mainState, fetchedData, singleChange, snapshotId }) => {
  const setLocalCheckedItems = (newItems: IBusinessUnits) => {
      singleChange('localCheckedItems', newItems);
  };

  const filterAgents = ()=>{
    return JSON.parse(JSON.stringify(mainState.localCheckedItems));
  };

  const [copySchedule, setCopySchedule] = useState(false)
  return (
    <>
      <div className={styles.subHeader}>
        <span>Select agents</span>
      </div>

      <div
        className={styles.agentWrapper}
      >
        <AgentTree
          useSelectedAgents={true}
          setLocalCheckedItems={setLocalCheckedItems}
          localCheckedItems={filterAgents()}
          fetchedData={fetchedData}
          isWithoutFilterTabs={true}
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
              checked={copySchedule}
              onClick={() => setCopySchedule(!copySchedule)}
              style={{ width: '16px', height: '16px' }}
              disabled={true}
            />
            <label
              htmlFor={'createNewScenario'}
              style={{ marginLeft: '8px' }}
            >
              Copy Schedule
            </label>
          </div>
        </div>
      </div>
    </>
  );
};

export default SelectAgents;
