import React, { FC } from 'react';
import styles from './agent.module.scss';
import { IAgentTimeline } from '../../../../../../redux/ts/intrefaces/timeLine/IAgentTimeline';
import CheckboxStyled from '../../../../../ReusableComponents/CheckboxStyled';
import DateUtils from '../../../../../../helper/dateUtils';

interface IAgentProps {
  agent: IAgentTimeline;
  handleClickAgentCheckbox: (agent: IAgentTimeline) => void;
}

const Agent: FC<IAgentProps> = ({ agent, handleClickAgentCheckbox }) => {
  if (agent.errors?.length === 0) return <></>;

  return (
    <>
      {agent.days.map((day, index) => {
        if (day.errors?.length === 0) return;
        return (
          <tr key={agent.agentId + index} className={styles.agent}>
            <td>
              <CheckboxStyled
                id={`${agent.agentId}+${index}`}
                checked={false}
                disabled={true}
                onClick={() => handleClickAgentCheckbox(agent)}
              />
            </td>
            <td>{DateUtils.getDateFromString(new Date(day.date).toISOString())}</td>
            <td>{agent.agentName}</td>
            <td>{agent.teamName}</td>
            <td>Error: {agent.errors}</td>
          </tr>
        );
      })}
    </>
  );
};

export default Agent;
