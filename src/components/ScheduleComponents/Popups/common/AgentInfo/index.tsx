import React, { CSSProperties, FC } from 'react';
import styles from './agentInfo.module.scss';
import classnames from 'classnames';
import { IAgentTimeline } from '../../../../../redux/ts/intrefaces/timeLine/IAgentTimeline';

interface IAgentInfoProps {
  classNames?: string[];
  agentInfo: IAgentTimeline;
  style?: CSSProperties;
}

const AgentInfo: FC<IAgentInfoProps> = ({ classNames, agentInfo, style }) => {
  return (
    <div className={classnames([styles.agentInfo, ...(classNames || [])])} style={style}>
      <div className={styles.agentInfo__column}>
        <div className={styles.agentInfo__columnItem}>
          <h4 className={styles.agentInfo__titleH4}>Agent</h4>
        </div>
        <div className={styles.agentInfo__columnItem}>
          <h5 className={styles.agentInfo__titleH5}>Name:</h5>
          <span data-test={'edit-agent-name'}>{agentInfo?.agentName}</span>
        </div>
        <div className={styles.agentInfo__columnItem}>
          <h5 className={styles.agentInfo__titleH5}>Business Unit:</h5>
          <span data-test={'edit-agent-bu'}>{agentInfo?.buName}</span>
        </div>
        <div className={styles.agentInfo__columnItem}>
          <h5 className={styles.agentInfo__titleH5}>Site:</h5>
          <span data-test={'edit-agent-site'}> {agentInfo?.siteName}</span>
        </div>
        <div className={styles.agentInfo__columnItem}>
          <h5 className={styles.agentInfo__titleH5}>Time Zone:</h5>
          <span data-test={'edit-agent-timezone'}>{agentInfo?.timeZone}</span>
        </div>
      </div>
    </div>
  );
};

export default AgentInfo;
