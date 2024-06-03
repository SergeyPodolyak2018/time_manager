import React, { FC, useMemo } from 'react';
import { IAgentInternalTz, IAgentTimeline } from '../../../../../../redux/ts/intrefaces/timeLine/IAgentTimeline';
import { ReactComponent as Delimitre } from '../icons/delimitre.svg';
import { ReactComponent as DST } from '../icons/dst.svg';
import styles from '../lineBar.module.scss';
import { useSelector } from 'react-redux';
import { getActiveDateSelector, getSelectedTzSelector } from '../../../../../../redux/selectors/controlPanelSelector';
import DateUtils from '../../../../../../helper/dateUtils';
import DateUtilsTimeZone from '../../../../../../helper/DateUtilsTimeZone';
import SchUtils from '../../../../../../helper/schedule/SchUtils';

interface IDayDelimiters {
  agent: IAgentTimeline;
}
const DayDelimiters: FC<IDayDelimiters> = ({ agent }) => {
  const currentDate = useSelector(getActiveDateSelector);
  const selectedTz = useSelector(getSelectedTzSelector);

  const dayDelimetrElement = (data: IAgentInternalTz) => {
    const currentDay = currentDate;
    const previousDay = DateUtils.getPreviousDay(String(currentDay));
    const nextDay = DateUtils.getNextDay(String(currentDay));
    const delimetrsTzInIso2 = [
      DateUtilsTimeZone.getTzDifference(DateUtils.getPreviousDay(String(previousDay)), data.tzSite, data.tzSelected),
      DateUtilsTimeZone.getTzDifference(previousDay, data.tzSite, data.tzSelected),
      DateUtilsTimeZone.getTzDifference(String(currentDay), data.tzSite, data.tzSelected),
      DateUtilsTimeZone.getTzDifference(nextDay, data.tzSite, data.tzSelected),
      DateUtilsTimeZone.getTzDifference(DateUtils.getNextDay(String(nextDay)), data.tzSite, data.tzSelected),
    ];
    const elements: React.ReactElement[] = [];
    if(DateUtilsTimeZone.isThisdayDangerous(currentDate, data.tzSite)){
      const dstData = DateUtilsTimeZone.getDangerousTime(currentDate, data.tzSite, data.tzSelected);
      const leftDst = SchUtils.getLeft(dstData.start, DateUtilsTimeZone.getDateInTZ(currentDate));
      const rightDst = SchUtils.getLeft(dstData.end, DateUtilsTimeZone.getDateInTZ(currentDate));
      if(leftDst>rightDst){
        elements.push(<DST key={'dst'} style={{ left: `${rightDst}%`, width: `${leftDst - rightDst }%`}} className={styles.dstMarker} />);
      }else{
        elements.push(<DST key={'dst'} style={{ left: `${leftDst}%`, width: `${rightDst - leftDst }%`}} className={styles.dstMarker} />);
      }
    }
    if (selectedTz.timezoneId !== 0) {
      for (let i = 0; i < delimetrsTzInIso2.length; i++) {
        const left = SchUtils.getLeft(delimetrsTzInIso2[i], DateUtilsTimeZone.getDateInTZ(currentDate));
        elements.push(<Delimitre key={i} style={{ left: `${left}%` }} className={styles.delimiter} />);
      }
    }

    return elements;
  };

  const delimiters = useMemo(() => dayDelimetrElement(agent._TZ_INTERNAL_USAGE), [selectedTz, currentDate, agent]);
  return <>{delimiters.map(el => el)}</>;
};

export default DayDelimiters;
