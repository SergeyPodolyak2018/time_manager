import React, { FC, useState } from 'react';
import styles from './filterItem.module.scss';
import { FilterType } from '../../index';
import classnames from 'classnames';
import {
  autoUpdate,
  detectOverflow,
  MiddlewareState,
  offset,
  useFloating,
  useHover,
  useInteractions,
} from '@floating-ui/react';
import ReactHtmlParser from 'react-html-parser';

export interface IFilterItem extends React.HTMLProps<HTMLElement> {
  content: any;
  type: FilterType;
  onClick: (e: React.MouseEvent) => void;
  loading?: boolean;
}

const FilterItem: FC<IFilterItem> = props => {
  const { content, type, onClick, loading } = props;
  const [isFullNameVisible, setIsFullNameVisible] = useState(false);

  const checkOverflow = {
    name: 'detectOverflow',
    async fn(state: MiddlewareState) {
      const overflow = await detectOverflow(state, {
        elementContext: 'reference',
      });
      if (overflow.right !== 0) {
        state.elements.floating.style.display = 'none';
        return { ...state, strategy: 'fixed' };
      }
      return state;
    },
  };

  const { x, y, strategy, refs, context } = useFloating({
    placement: 'top-start',
    open: isFullNameVisible,
    onOpenChange: setIsFullNameVisible,
    whileElementsMounted: autoUpdate,
    middleware: [offset(0), checkOverflow],
  });

  const hover = useHover(context, {
    restMs: 800,
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

  return (
    <>
      {isFullNameVisible && (
        <div
          ref={refs.setFloating}
          style={{
            position: strategy,
            top: y ?? 0,
            left: x ?? 0,
            width: 'max-content',
          }}
          {...getFloatingProps()}
          className={styles.floatName__popup}
        >
          {content.replaceAll('<mark>', '').replaceAll('</mark>', '')}
        </div>
      )}
      <div
        className={classnames({
          [styles.filterItem]: true,
          [styles.filterItemAllScenarios]: type === FilterType.allScenarios,
          [styles.filterItemSharedScenarios]: type === FilterType.sharedScenarios,
          [styles.filterItemMyScenarios]: type === FilterType.myScenarios,
          [styles.filterItemOtherScenarios]: type === FilterType.otherScenarios,
          [styles.loading]: loading,
        })}
        onClick={onClick}
        id={'filterItem'}
        datatype={type}
      >
        <div
          className={classnames({
            [styles.filterItem__titleWrapper]: true
          })}
          datatype={content.replaceAll('<mark>', '').replaceAll('</mark>', '')}
        >
          <span
            ref={refs.setReference}
            {...getReferenceProps()}
            id={`filterText`}
            className={styles.filterItemBU__title}
          >
            {content.includes('<None>') ? `${content}` : ReactHtmlParser(content)}
          </span>
        </div>
      </div>
    </>
  );
};

export default FilterItem;
