import classnames from 'classnames';
import React, { Dispatch, FC, SetStateAction, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import Api from '../../../../../api/rest';
import { CfgMarkedTimeType, IMarkedTime } from '../../../../../common/interfaces/schedule/IAgentSchedule';
import { getSelectedActivitySelector, getSelectedAgentSelector } from '../../../../../redux/selectors/timeLineSelector';
import Spiner from '../../../../ReusableComponents/spiner';
import { IInsertWorkSetState } from '../index';
import styles from './View3SelectMarkedTime.module.scss';

interface IView3SelectMarkedTimeProps {
  setState: Dispatch<SetStateAction<IInsertWorkSetState>>;
  state: IInsertWorkSetState;
  setIsLoadingCallback: (isLoading: boolean) => void;
}

const View3SelectMarkedTime: FC<IView3SelectMarkedTimeProps> = ({ state, setState , setIsLoadingCallback}) => {
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
      type: CfgMarkedTimeType.OVERTIME,
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

  useEffect(() => {
    setIsLoadingCallback(isLoading);
  }, [isLoading]);

  useEffect(() => {
    setState(prevState => ({ ...prevState, isValid: !!prevState.markedTimeId }));
  }, [state.markedTimeId]);

  const handleClickItem = (item: IMarkedTime) => {
    setState(prevState => ({ ...prevState, markedTimeId: item.id }));
  };

  return (
    <div className={classnames([styles.insertWorkSetView3])}>
      <div className={styles.insertWorkSetView3__content}>
        {isLoading ? (
          <Spiner />
        ) : (
          <table className={styles.insertWorkSetView3__table}>
            <thead className={styles.insertWorkSetView3__titleWrapper}>
              <tr>
                <th
                  style={{
                    width: '201px',
                  }}
                >
                  Select marked time
                </th>
                <th>Short</th>
                <th>Sites</th>
              </tr>
            </thead>
            <tbody>
              {state.markedTimes.map(item => {
                const siteInfo = item.siteInfo.map(item => item.name).join(', ');
                return (
                  <tr
                    id={item.name}
                    key={item.id}
                    className={classnames({
                      [styles.insertWorkSetView3__tr]: true,
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
                    <td title={siteInfo}>
                      <span>{siteInfo}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default View3SelectMarkedTime;
