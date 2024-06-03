import React from 'react';
import styles from './scale.module.scss';
import SchUtils from '../../../helper/schedule/SchUtils';

export interface IButtonProps extends React.HTMLProps<HTMLElement> {
  innerText: string;
  style?: any;
}

const timeList = [
  'am 12',
  'am 1',
  'am 2',
  'am 3',
  'am 4',
  'am 5',
  'am 6',
  'am 7',
  'am 8',
  'am 9',
  'am 10',
  'am 11',
  'pm 12',
  'pm 1',
  'pm 2',
  'pm 3',
  'pm 4',
  'pm 5',
  'pm 6',
  'pm 7',
  'pm 8',
  'pm 9',
  'pm 10',
  'pm 11',
];

const dataElements = (datas: string[]) => {
  const elements: React.ReactElement[] = [];
  datas.forEach((element, i) => {
    elements.push(
      <p key={i} style={{ left: `${SchUtils.getLeftForTime(i)}%` }} className={styles.timeContainerNumbers}>
        {element}
      </p>,
    );
  });

  return elements;
};

const lineElements = () => {
  const elements: React.ReactElement[] = [];
  for (let i = 0; i < 25; i++) {
    elements.push(
      <div
        key={i}
        style={{ right: `calc(${SchUtils.getRightForLineByTime(i)}%` }}
        className={styles.timeContainerLines}
      ></div>,
    );
  }
  return elements;
};

const Scale = () => {
  return (
    <div className={styles.container}>
      <div className={styles.scaleContainer}>{dataElements(timeList).map(el => el)}</div>
      <div className={styles.linesContainer}>{lineElements().map(el => el)}</div>
    </div>
  );
};

export default Scale;
