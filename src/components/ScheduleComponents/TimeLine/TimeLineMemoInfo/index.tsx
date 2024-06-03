import {
  FloatingArrow,
  MiddlewareState,
  arrow,
  autoUpdate,
  flip,
  hide,
  offset,
  shift,
  useFloating,
} from '@floating-ui/react';
import { useCallback, useLayoutEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { useOutsideClick } from '../../../../hooks';
import { closeMemoInfo } from '../../../../redux/actions/timeLineAction';
import { useAppDispatch } from '../../../../redux/hooks';
import { getSelectedActivitySelector } from '../../../../redux/selectors/timeLineSelector';
import styles from './menu.module.scss';

export interface IMemoInfoProps {
  memo?: string;
  referenceElement: HTMLDivElement;
}

const TimeLineMemoInfo = (props: IMemoInfoProps) => {
  const dispatch = useAppDispatch();
  const { memo, referenceElement } = props;
  const arrowRef = useRef(null);
  const isShift =
    referenceElement.getAttribute('datatype') === 'shift' || !referenceElement.parentElement?.getAttribute('datatype');
  const referenceElementOffset = Number(
    window.getComputedStyle(referenceElement).getPropertyValue('left')?.replace('px', ''),
  );
  const parentOffset = referenceElement.offsetParent
    ? Number(window.getComputedStyle(referenceElement.offsetParent).getPropertyValue('left')?.replace('px', ''))
    : 0;

  const lineBarContainerElement = document.getElementById('lineBarContainer') as HTMLDivElement;
  const lineBarContainerRect = lineBarContainerElement.getBoundingClientRect();
  const checkOverflow = {
    name: 'detectOverflow',
    async fn(state: MiddlewareState) {
      Object.assign(state.elements.floating.style, {
        visibility: state.y < lineBarContainerRect.y - state.rects.floating.height ? 'hidden' : 'visible',
      });
      if (isShift) {
        state.x =
          referenceElementOffset < 0
            ? state.x + state.rects.floating.width - 14
            : state.x - state.rects.floating.width - (state.middlewareData.shift?.x || 0) + 14;
      } else {
        state.x =
          parentOffset < 0
            ? state.x + state.rects.floating.width - 14
            : state.x - state.rects.floating.width - (state.middlewareData.shift?.x || 0) + 14;
      }
      return state;
    },
  };

  const { x, y, strategy, refs, context } = useFloating({
    placement: isShift
      ? referenceElementOffset < 0
        ? 'top-end'
        : 'top-start'
      : parentOffset < 0
      ? 'top-end'
      : 'top-start',
    middleware: [
      offset(10),
      flip(),
      shift({ padding: 5 }),
      checkOverflow,
      hide({ strategy: 'escaped' }),
      arrow({
        element: arrowRef,
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const handleClickOutside = useCallback(() => {
    dispatch(closeMemoInfo());
  }, [dispatch]);

  const outsideClickRef = useOutsideClick(handleClickOutside);

  useLayoutEffect(() => {
    refs.setReference(referenceElement);
  }, [refs, referenceElement]);

  return (
    <div
      ref={refs.setFloating}
      style={{
        position: strategy,
        top: y ?? 0,
        left: x ?? 0,
      }}
      className={styles.memoWrapper}
    >
      <div ref={outsideClickRef}>
        <div>Memo:</div>
        <span>{memo}</span>
        <FloatingArrow
          ref={arrowRef}
          context={context}
          stroke="rgba(188, 196, 200, 0.25)"
          strokeWidth={1}
          fill="white"
        />
      </div>
    </div>
  );
};

const mapStateToProps = (state: any) => {
  return {
    selectedActivities: getSelectedActivitySelector(state),
  };
};

export default connect(mapStateToProps)(TimeLineMemoInfo);
