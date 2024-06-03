import 'react-virtualized/styles.css';

import { CSSProperties, FC, ReactElement, RefObject, useEffect } from 'react';
import useStateRef from 'react-usestateref';
import { AutoSizer, Grid, GridCellProps, OnScrollParams, ScrollParams } from 'react-virtualized';

import { useAppSelector } from '../../../../../redux/hooks';
import { getSideBarDataForStorage } from '../../../../../redux/selectors/filterSelector';
import {
  getColumns,
  getIsFullDay,
  getScrollToIndex,
  getTimelineOptions,
} from '../../../../../redux/selectors/timeLineSelector';

interface IVirtualScrollerProps {
  data: any[];
  remoteRowCount: number;
  renderItem: (index: number, element: any, key: string, style: CSSProperties, isVisible: boolean) => ReactElement;
  rowHeight: number;
  onScroll?: (params: OnScrollParams) => void;
  headerTimesRef: RefObject<any>;
  headerRef: RefObject<any>;
  scrollTop: number;
  scrollLeft: number;
  setScrollLeft: any;
  setScrollBottomVisible: any;
}

const VirtualScroller: FC<IVirtualScrollerProps> = ({
  data,
  renderItem,
  remoteRowCount,
  rowHeight,
  onScroll,
  headerTimesRef,
  scrollTop,
  headerRef,
  setScrollBottomVisible,
  scrollLeft,
  setScrollLeft,
}) => {
  // region Selectors
  const scrollToIndex = useAppSelector(getScrollToIndex);
  const isFullDayView = useAppSelector(getIsFullDay);
  const options = useAppSelector(getTimelineOptions);
  const columns = useAppSelector(getColumns);
  const sideBar = useAppSelector(getSideBarDataForStorage);
  // const bindChart = useAppSelector(getChartBinding);
  // endregion

  // region Math column width
  const [, setColumnWidth, columnWidthRef] = useStateRef(600);
  const [prevWindowWidth, setPrevWindowWidth] = useStateRef(window.innerWidth);

  useEffect(() => {
    onResize();
    _onScroll({ scrollLeft: scrollLeft, scrollTop: scrollTop } as ScrollParams);
  }, [
    data,
    sideBar,
    columns,
    isFullDayView,
    headerTimesRef,
    headerRef,
    window.innerWidth,
    headerTimesRef.current?.scrollWidth,
  ]);

  useEffect(() => {
    resetScroll();
    onResize();
  }, [options.pinColumn]);

  useEffect(() => {
    checkScrollBottomVisible();
  }, [columnWidthRef.current]);

  useEffect(() => {
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const onResize = (ev?: UIEvent) => {
    const newWindowWidth = window.innerWidth;
    if (ev && newWindowWidth === prevWindowWidth) return;
    setPrevWindowWidth(newWindowWidth);

    let columnWidth = 600;
    if (options.pinColumn && headerTimesRef.current) {
      columnWidth = headerTimesRef.current.scrollWidth;
    }

    if (!options.pinColumn && headerRef.current) {
      columnWidth = !isFullDayView ? headerRef.current.scrollWidth - 16 : headerRef.current.scrollWidth - 16;
    }
    setColumnWidth(columnWidth);
  };
  // endregion

  // region Render
  const cellRenderer = ({ key, rowIndex, style, isVisible }: GridCellProps) => {
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

  // region Scroll
  const resetScroll = () => {
    if (headerRef.current) {
      headerRef.current.scrollLeft = 0;
    }
    setScrollLeft(0);
  };
  const _onScroll = (params: ScrollParams) => {
    // const timelineHeader = headerRef.current;
    const chart = document.getElementById('chart');
    if (headerRef.current && !options.pinColumn) {
      headerRef.current.scrollLeft = params.scrollLeft;
    }
    if (options.pinColumn && headerTimesRef.current) {
      headerTimesRef.current.scrollLeft = params.scrollLeft;
    }
    if (chart) {
      chart.scrollLeft = params.scrollLeft;
    }

    const root = document.querySelector<HTMLElement>(':root');

    if (root) {
      root.style.setProperty('--timeline-scroll', `${params.scrollLeft}px`);
    }
    setScrollLeft(params.scrollLeft);
  };

  const checkScrollBottomVisible = () => {
    const element = document.getElementById('timelineList');
    let isHorizontalScrollbarVisible = false;
    if (element) {
      isHorizontalScrollbarVisible = element.scrollWidth > element.clientWidth;
    }
    setScrollBottomVisible(isHorizontalScrollbarVisible);
  };

  const onScrollbarPresenceChange = () => {
    checkScrollBottomVisible();
  };

  // endregion

  const setOnContextMenuAction = (e: any) => {
    const virtualScroller = document.getElementById('timelineList');
    if (virtualScroller) {
      e.preventDefault();
    }
  };

  useEffect(() => {
    document.addEventListener('contextmenu', setOnContextMenuAction);
    return () => {
      document.removeEventListener('contextmenu', setOnContextMenuAction);
    };
  }, []);

  return (
    <AutoSizer>
      {({ width, height }) => (
        <Grid
          id={'timelineList'}
          scrollTop={scrollTop}
          scrollLeft={scrollLeft}
          cellRenderer={cellRenderer}
          columnCount={1}
          columnWidth={columnWidthRef.current}
          height={height}
          scrollToRow={scrollToIndex}
          rowCount={remoteRowCount}
          rowHeight={rowHeight}
          onScroll={params => {
            onScroll && onScroll(params);
            _onScroll(params);
          }}
          width={width + 3}
          autoContainerWidth={true}
          onScrollbarPresenceChange={onScrollbarPresenceChange}
          containerStyle={{
            userSelect: 'none',
            overflow: 'unset',
          }}
          style={{
            userSelect: 'none',
            outline: 'none',
            position: 'relative',
          }}
        />
      )}
    </AutoSizer>
  );
};

export default VirtualScroller;
