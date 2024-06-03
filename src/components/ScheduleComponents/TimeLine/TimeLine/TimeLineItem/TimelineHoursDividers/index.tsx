import React, { FC, memo, useMemo } from 'react';
import SchUtils from '../../../../../../helper/schedule/SchUtils';

interface ITimelineHoursDividers {
  isFullDay: boolean;
  discretness: number;
  elements: any;
}

const TimelineHoursDividers: FC<ITimelineHoursDividers> = ({ isFullDay, discretness, elements }) => {
  const lineElements = (classname: any) => {
    let adder = 60;
    if (!isFullDay) {
      adder = discretness;
    }
    const discret = adder / 60;
    const elements: React.ReactElement[] = [];
    for (let i = 0; i < 25; i = i + discret) {
      elements.push(
        <div key={i} style={{ right: `calc(${SchUtils.getRightForLineByTime(i)}%` }} className={classname}></div>,
      );
    }
    return elements;
  };

  const lines = useMemo(() => lineElements(elements), [isFullDay,discretness]);

  return <>{lines.map(el => el)}</>;
};
export default memo(TimelineHoursDividers);
