import React, { FC, useState } from 'react';
import styles from './filterItem.module.scss';
import Checkbox, { IconTypes } from '../../../../ReusableComponents/Checkbox';
import { ItemType } from '../../index';
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
  type: ItemType;
  checked?: boolean | undefined;
  onClick: (e: React.MouseEvent) => void;
  isFounded?: boolean;
  isAllChecked?: boolean | undefined;
  onClickCheckbox: (e: React.MouseEvent) => void;
  counter?: string | number;
  loading?: boolean;
}

const FilterItem: FC<IFilterItem> = props => {
  const { content, type, onClick, checked, onClickCheckbox, isFounded, isAllChecked, counter, loading } = props;
  const [isFullNameVisible, setIsFullNameVisible] = useState(false);

  // const isElementHidden = async (state: Partial<UseFloatingProps<ReferenceType>> ) => {
  //
  // };
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

  const icon: IconTypes = isAllChecked ? 'arrow' : checked ? 'circle' : undefined;

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
          [styles.filterItemBU]: type === ItemType.businessUnits,
          [styles.filterItemSite]: type === ItemType.sites,
          [styles.filterItemTeam]: type === ItemType.teams,
          [styles.filterItemAgent]: type === ItemType.agents,
          [styles.filterItemActivities]: type === ItemType.activities,
          [styles['filterItem--founded']]: isFounded,
          [styles.loading]: loading,
        })}
        onClick={onClick}
        id={'filterItem'}
        datatype={type}
      >
        <div
          className={classnames({
            [styles.filterItem__titleWrapper]: true,
            [styles.filterItemBU__titleWrapper]: type === ItemType.businessUnits,
            [styles.filterItemSite__titleWrapper]: type === ItemType.sites,
            [styles.filterItemTeam__titleWrapper]: type === ItemType.teams || type === ItemType.activities,
            [styles.filterItemAgent__titleWrapper]: type === ItemType.agents,
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
            {counter && <span> {counter}</span>}
          </span>
        </div>
        <div
          className={styles.filterItem__checkbox}
          datatype={content.replaceAll('<mark>', '').replaceAll('</mark>', '')}
        >
          <Checkbox id={content} icon={icon} onClick={onClickCheckbox} />
        </div>
      </div>
    </>
  );
};

export default FilterItem;
