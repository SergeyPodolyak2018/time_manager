import React, { Dispatch, FC, MutableRefObject, SetStateAction, useRef } from 'react';
import styles from './warningsTimelineContainer.module.scss';
import WarningsTimeLine from './WarningsTimeline/WarningTimeline';
import { getTimeFormat } from '../../../../../redux/selectors/timeLineSelector';
import classnames from 'classnames';
import { useSelector } from 'react-redux';
import { IAgentTimeline } from '../../../../../redux/ts/intrefaces/timeLine/IAgentTimeline';
import { WarningsSubmenuOptions } from '../../../../../common/constants/schedule/submenu/common';
import SchUtils from '../../../../../helper/schedule/SchUtils';
import { ISelectedActivity } from '../../../../../redux/ts/intrefaces/timeLine';
import { useMergeRefs } from '@floating-ui/react';
import { useOutsideClick } from '../../../../../hooks';
import { setSelectedActivity } from '../../../../../redux/actions/timeLineAction';

export interface IWarningsTimelineContainer extends React.HTMLProps<HTMLElement> {
  agent: IAgentTimeline;
  openedMenuItem: WarningsSubmenuOptions | null;
  setOpenedMenuItem: (value: WarningsSubmenuOptions | null) => void;
  setSelectedActivities: Dispatch<SetStateAction<ISelectedActivity[]>>;
  selectedActivities: ISelectedActivity[];
  editTimeRef: MutableRefObject<any>;
}

const timeList = [
  '12',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
];

const timeAmPm = Array(24).fill('AM', 0, 12).fill('PM', 12, 24);

const WarningsTimelineContainer: FC<IWarningsTimelineContainer> = ({
  agent,
  openedMenuItem,
  setOpenedMenuItem,
  editTimeRef,
  selectedActivities,
  setSelectedActivities,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const timeFormat = useSelector(getTimeFormat);

  // return [...<span>11 PM/AM</span>]
  const getElementsTime = (data: string[], timeList?: string[], classType?: string) => {
    return data.map((element, i) => {
      return (
        <span
          key={i}
          style={{ left: `${SchUtils.getLeftForTime(i)}%` }}
          className={classnames({
            [styles.headerTimeContainerNumbers]: true,
            classType: classType,
          })}
        >
          <div>{timeList && timeList[i]}</div> <div className={styles.headerTimeContainerNumbers__AmPm}>{element}</div>
        </span>
      );
    });
  };

  const lineElements = (classname: any) => {
    const elements: React.ReactElement[] = [];
    for (let i = 0; i < 25; i++) {
      elements.push(
        <span key={i} style={{ right: `calc(${SchUtils.getRightForLineByTime(i)}%` }} className={classname}></span>,
      );
    }
    return elements;
  };
  const timelineRef = useOutsideClick(() => {
    setSelectedActivity([]);
  });

  return (
    <div ref={useMergeRefs([timelineRef, containerRef])} className={styles.mainContainer}>
      <div className={styles.headerContainer}>
        {timeFormat === '12hours' ? (
          <div className={styles.headerScaleContainer}>
            {getElementsTime(timeAmPm, timeList, styles.headerAmPm).map(el => el)}
            {lineElements(styles.headerTimeContainerLines).map(el => el)}
          </div>
        ) : (
          <div className={styles.headerScaleContainer}>
            {getElementsTime([...Array(24).keys()].map(key => ('0' + key).slice(-2))).map(el => el)}
            {lineElements(styles.headerTimeContainerLines).map(el => el)}
          </div>
        )}
      </div>
      <WarningsTimeLine
        editTimeRef={editTimeRef}
        setSelectedActivities={setSelectedActivities}
        selectedActivities={selectedActivities}
        agent={agent}
        parent={containerRef.current}
        openedMenuItem={openedMenuItem}
        setOpenedMenuItem={setOpenedMenuItem}
      />
    </div>
  );
};

export default WarningsTimelineContainer;
