import React, {useRef} from 'react';
import useStateRef from 'react-usestateref';
import styles from './range.module.scss';


export interface IRangeProps extends React.HTMLProps<HTMLElement> {
  value: number;
  changeValue: (val: number) => void;
  mouseUp?: () => void;
  mouseDown?: () => void;
  min: number;
  max: number;
  step:number;
  percent:boolean;
  indicator?: number;
}

const Range = (props: IRangeProps) => {
  const { value, changeValue, mouseDown, mouseUp, min, max, step, percent, indicator} = props;
  const [, setMainState, mainStateRef] = useStateRef(value);
  const refTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, setPrevValue, prevValueRef] = useStateRef(value);

  const interval = 10

    const change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const data = parseInt(e.currentTarget.value);
    setMainState(data)
    if (refTimer.current !== null){
      clearTimeout(refTimer.current);
    }
    refTimer.current =  setTimeout(()=>{
      changeValue(data);
    },interval);

  };
  const getLeft = () => {
    return ((mainStateRef.current - min) * 100) / (max - min);
  };

  const mouseUpEv = (e: React.MouseEvent<HTMLInputElement>) => {
    const data = parseInt(e.currentTarget.value);
    if (data === prevValueRef.current || !mouseUp) return;
    mouseUp();
  }

  const mouseDownEv = (e: React.MouseEvent<HTMLInputElement>) => {
    const data = parseInt(e.currentTarget.value);
    setPrevValue(data);

    if (!mouseDown) return;
    mouseDown();
  }

  return (
    <div className={styles.container}>
      <input type="range" min={min} max={max} value={mainStateRef.current} onChange={change} onMouseDown={mouseDownEv} onMouseUp={mouseUpEv} step={step} className={styles.range} />
      <div className={styles.round} style={{ left: `${getLeft()}%` }}></div>
      <div className={styles.track} style={{ width: `${getLeft()}%` }}></div>
      <div className={styles.staticTrack}></div>
      <div style={{ left: `${getLeft()}%` }} className={styles.indicator}>
        <div className={styles.innerWrapper}>{indicator?indicator:mainStateRef.current}{percent?' %':''}</div>
      </div>
    </div>
  );
};

export default Range;
