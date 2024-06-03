import React, { Children, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { closeSubMenu } from '../../../redux/actions/timeLineAction';
import { useAppDispatch } from '../../../redux/hooks';
import { isSubMenuOpenSelector } from '../../../redux/selectors/timeLineSelector';
import styles from './container.module.scss';

// const defaultSecondChildPxAdjustment = 56;
export interface IContainerProps extends React.HTMLProps<HTMLElement> {
  style?: any;
  initialHeight: number;
  children?: React.ReactNode;
  onScroll?: (e: any) => void;
  secondChildPxAdjustment?: number;
}

const ResizableContainer = (props: IContainerProps) => {
  // const { secondChildPxAdjustment = defaultSecondChildPxAdjustment } = props;
  const dispatch = useAppDispatch();
  const subMenuIsOpen = useSelector(isSubMenuOpenSelector);

  const { initialHeight, onScroll = null } = props;
  const childrens = Children.toArray(props.children);
  const [elHeight, setEleHeight] = useState(initialHeight);
  const [oldPos, setOldPos] = useState(0);
  const dotsRef = useRef<HTMLDivElement>(null);
  const firstContainerRef = useRef<HTMLDivElement>(null);
  const [draged, setDraged] = useState(false);

  const moveAt = (e: any) => {
    if (draged) {
      let ofset = 0;
      if (e.clientY) {
        if (firstContainerRef.current) {
          ofset = firstContainerRef.current.offsetTop;
        }
        if (oldPos) {
          if (e.clientY > oldPos) {
            setEleHeight(elHeight + (e.clientY - oldPos));
          } else if (e.clientY < oldPos) {
            setEleHeight(elHeight - (oldPos - e.clientY));
          }
        } else {
          setEleHeight(e.clientY - ofset);
        }
        setOldPos(e.clientY);
      }
    }
  };

  const dragstart = () => {
    setDraged(true);
  };
  const dragEnd = () => {
    setDraged(false);
  };

  const getChildren = (num: number, notNum?: number | null) => {
    if (null === notNum) {
      return childrens[num];
    } else {
      return (
        <>
          {childrens.map((element, index) => {
            if (index !== notNum) return element;
          })}
        </>
      );
    }
  };

  return (
    <div
      onScroll={e => {
        if (onScroll) onScroll(e);
        if (subMenuIsOpen) dispatch(closeSubMenu());
      }}
      className={styles.wrapper}
      onMouseMove={moveAt}
      onMouseUp={dragEnd}
    >
      <div
        style={{ height: `${elHeight}px` }}
        className={`${styles.container} ${styles.containerFirst}`}
        ref={firstContainerRef}
      >
        {getChildren(0, null)}
      </div>
      <div className={styles.dotContainer} onMouseDown={dragstart} ref={dotsRef}>
        <div className={styles.dot}></div>
        <div className={styles.dot}></div>
        <div className={styles.dot}></div>
      </div>
      <div
        style={{ height: `calc(100% - ${elHeight}px )` }}
        className={`${styles.container} ${styles.containerSecond} `}
      >
        {getChildren(1, null)}

        {/*<div style={{height:`calc(100% - 68px)`}} className={styles.container}>*/}
        {/*    {getChildren(2,null)}*/}
        {/*</div>*/}
      </div>
    </div>
  );
};

export default ResizableContainer;
