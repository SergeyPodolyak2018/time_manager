import 'react-virtualized/styles.css';

import { CSSProperties, FC, ReactElement } from 'react';
import { AutoSizer, Grid, GridCellProps, OnScrollParams } from 'react-virtualized';
import { useAppSelector } from '../../../../../redux/hooks';
import { getScrollToIndex } from '../../../../../redux/selectors/timeLineSelector';
import styles from './scroll.styles.module.scss';

interface IAgentInfoVirtualScrollerProps {
  data: any[];
  remoteRowCount: number;
  renderItem: (index: number, element: any, key: string, style: CSSProperties, isVisible: boolean) => ReactElement;
  rowHeight: number;
  columnWidth: number;
  scrollTop: number;
  onScroll: (params: OnScrollParams) => void;
}

const AgentInfoVirtualScroller: FC<IAgentInfoVirtualScrollerProps> = ({
  data,
  renderItem,
  remoteRowCount,
  rowHeight,
  columnWidth,
  scrollTop,
  onScroll,
}) => {
  // region Selectors
  const scrollToIndex = useAppSelector(getScrollToIndex);

  // region Render
  const cellRenderer = ({ key, rowIndex, style, isVisible }: GridCellProps) => {
    // const isLastChild = rowIndex === data.length - 1;
    return renderItem(
      rowIndex,
      data[rowIndex],
      key,
      {
        ...style,
        height: rowHeight - 4,
        marginBottom: '2px',
      },
      isVisible,
    );
  };

  // endregion
  return (
    <AutoSizer className={styles.agentInfoScroller} disableWidth>
      {({ height }) => (
        <Grid
          cellRenderer={cellRenderer}
          columnCount={1}
          columnWidth={columnWidth}
          height={height}
          scrollToRow={scrollToIndex}
          rowCount={remoteRowCount}
          rowHeight={rowHeight}
          width={columnWidth}
          onScroll={onScroll}
          scrollTop={scrollTop}
        />
      )}
    </AutoSizer>
  );
};

export default AgentInfoVirtualScroller;
