import React from 'react';
import styles from './range.module.scss';

export interface IRangeProps extends React.HTMLProps<HTMLElement> {
  value: number;
  changeValue: (val: number) => void;
  min: number;
  max: number;
  step:number;
  percent:boolean;
  indicator?: number;
}

const Range = (props: IRangeProps) => {
  const { value, changeValue, min, max, step, percent, indicator, disabled} = props;
  const change = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const data = parseInt(e.currentTarget.value);
    changeValue(data);
  };
  const getLeft = () => {
    return ((value - min) * 100) / (max - min);
  };
  return (
    <div className={styles.container}>
      <input type="range" min={min} max={max} value={value} onChange={change} step={step} className={disabled ? styles.range_disabled : styles.range} disabled={disabled}/>
      <div className={styles.round} style={{ left: `${getLeft()}%` }}></div>
      <div className={styles.track} style={{ width: `${getLeft()}%` }}></div>
      <div className={styles.staticTrack}></div>
      <div style={{ left: `${getLeft()}%` }} className={styles.indicator}>
        <div className={styles.innerWrapper}>{indicator?indicator:value}{percent?' %':''}</div>
      </div>
    </div>
  );
};

export default Range;
