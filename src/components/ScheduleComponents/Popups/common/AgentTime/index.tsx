import React, { CSSProperties, FC } from 'react';
import styles from './agentTime.module.scss';
import SchUtils from '../../../../../helper/schedule/SchUtils';
import classnames from 'classnames';
import { useSelector } from 'react-redux';
import { getTimeFormat } from '../../../../../redux/selectors/timeLineSelector';
import { IAgentTimeline } from '../../../../../redux/ts/intrefaces/timeLine/IAgentTimeline';

interface IAgentTimeProps {
  classNames?: string[];
  timeStart: string;
  timeEnd: string;
  agent: IAgentTimeline;
  date: number | string;
  style?: CSSProperties;
}

const AgentTime: FC<IAgentTimeProps> = ({ classNames, timeStart, timeEnd, agent, date, style }) => {
  const timeFormat = useSelector(getTimeFormat);
  return agent && date ? (
    <div className={classnames(styles.agentTime, [...(classNames || [])])} style={style}>
      <span>Agent Time: </span>
      <span className={styles.agentTime__content}>
        {`from ${SchUtils.convertTimeToTz(agent, timeStart, date, timeFormat)} to ${SchUtils.convertTimeToTz(
          agent,
          timeEnd,
          date,
          timeFormat,
        )}`}
      </span>
    </div>
  ) : (
    <></>
  );
};

export default AgentTime;
