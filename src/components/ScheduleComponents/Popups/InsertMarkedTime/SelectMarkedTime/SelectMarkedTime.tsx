import classnames from 'classnames';
import React, { Dispatch, FC, SetStateAction, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import Api from '../../../../../api/rest';
import { CfgMarkedTimeType, IMarkedTime } from '../../../../../common/interfaces/schedule/IAgentSchedule';
import { getSelectedActivitySelector, getSelectedAgentSelector } from '../../../../../redux/selectors/timeLineSelector';
import CheckboxBig from '../../../../ReusableComponents/Checkbox';
import Spiner from '../../../../ReusableComponents/spiner';
import { IInsertMarkedTimeState } from '../index';
import styles from './selectMarkedTime.module.scss';

export interface ISelectMarkedTimeProps {
  setState: Dispatch<SetStateAction<IInsertMarkedTimeState>>;
  state: IInsertMarkedTimeState;
}
const SelectMarkedTime: FC<ISelectMarkedTimeProps> = ({ state, setState }) => {
  const selectedActivities = useSelector(getSelectedActivitySelector);
  const selectedAgents = useSelector(getSelectedAgentSelector);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const agent = selectedAgents[0];
    if (state.markedTimes.length) return setIsLoading(false);

    Api.findMarkedTimes({
      agentId: agent.agentId,
      siteId: agent.siteId,
      buId: agent.buId,
      teamId: agent.teamId,
      shiftId: selectedActivities[0]?._id,
    })
      .then(response => {
        setState(prevState => ({
          ...prevState,
          markedTimes: response.data,
        }));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleClickItem = (item: IMarkedTime) => {
    setState(prevState => ({ ...prevState, markedTimeId: item.id }));
  };

  return (
    <div className={classnames([styles.selectMarkedTime])}>
      <div className={styles.selectMarkedTime__content}>
        {isLoading ? (
          <Spiner />
        ) : (
          <section className={styles.tableWrapper}>
            <table className={styles.selectMarkedTime__table}>
              <thead className={styles.selectMarkedTime__titleWrapper}>
                <tr>
                  <th
                    style={{
                      width: '207px',
                    }}
                  >
                    Marked Time
                  </th>
                  <th>Short</th>
                  <th>Overtime</th>
                  <th>Payback</th>
                </tr>
              </thead>
              <tbody>
                {state.markedTimes.map(item => {
                  return (
                    <tr
                      id={item.name}
                      title={item.name}
                      key={item.id}
                      className={classnames({
                        [styles.selectMarkedTime__tr]: true,
                        [styles.selected]: item.id === state.markedTimeId,
                      })}
                      onClick={() => handleClickItem(item)}
                    >
                      <td title={item.name}>
                        <span>{item.name}</span>
                      </td>
                      <td title={item.shortName}>
                        <span>{item.shortName}</span>
                      </td>
                      <td className={styles.check}>
                        <span>
                          <CheckboxBig icon={'mark'} checked={item.type === CfgMarkedTimeType.OVERTIME} />
                        </span>
                      </td>
                      <td className={styles.check}>
                        <span>
                          <CheckboxBig icon={'mark'} checked={item.type === CfgMarkedTimeType.PAYBACK} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </div>
  );
};

export default SelectMarkedTime;
