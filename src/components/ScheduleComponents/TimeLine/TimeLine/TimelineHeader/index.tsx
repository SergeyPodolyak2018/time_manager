import React, { FC, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { commonElementLimits } from '../../../../../common/constants';
import SchUtils from '../../../../../helper/schedule/SchUtils';
import {
  changeColumnValue,
  openSaveConfirm,
  setColumnSortBy,
  setDefaultConfirmState,
  setIsModified,
} from '../../../../../redux/actions/timeLineAction';
import { useAppDispatch } from '../../../../../redux/hooks';
import {
  getColumns,
  getIsFullDay,
  getIsModifiedData,
  getSortBy,
  getSortingProcess,
  getTimeDiscetness,
  getTimeFormat,
  getTimelineOptions,
} from '../../../../../redux/selectors/timeLineSelector';
import { IPossibleColumns, ISortBy, SORT_ORDER, SORT_TYPE } from '../../../../../redux/ts/intrefaces/timeLine';
import { IAgentTimeline } from '../../../../../redux/ts/intrefaces/timeLine/IAgentTimeline';
import styles from '../lineBarContainer.module.scss';
import classnames from 'classnames';

export interface ITimeLineHeaderProps extends React.HTMLProps<HTMLElement> {
  agents: IAgentTimeline[];
  scrollHandler?: any;
  refHandler?: any;
  headerTimesRef: any;
  headerRef: any;
  onScroll: any;
}

const timeList = [
  '12',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
];

const timeAmPm = Array(24).fill('AM', 0, 12).fill('PM', 12, 24);

const TimeLineHeader: FC<ITimeLineHeaderProps> = ({ agents, headerTimesRef, headerRef, onScroll }) => {
  const dispatch = useAppDispatch();
  // const buffer = useSelector(getBuffer);
  // const modifiedData = useSelector(getModifiedData);

  // region Selectors
  const columns = useSelector(getColumns);
  const fullDay = useSelector(getIsFullDay);
  const timeFormat = useSelector(getTimeFormat);
  const discreetness = useSelector(getTimeDiscetness);
  const isUnsavedChanges = useSelector(getIsModifiedData);
  const options = useSelector(getTimelineOptions);
  const sortingProcess = useSelector(getSortingProcess);
  // endregion

  const dataElements = (datas: string[], classType?: string) => {
    const elements: React.ReactElement[] = [];
    datas.forEach((element, i) => {
      elements.push(
        <p
          key={i}
          style={{ left: `${SchUtils.getLeftForTime(i)}%` }}
          className={`${styles.headerTimeContainerNumbers} ${classType}`}
        >
          {element}
        </p>,
      );
    });

    return elements;
  };

  const lineElements = (classname: any) => {
    const elements: React.ReactElement[] = [];
    for (let i = 0; i < 25; i++) {
      elements.push(
        <div key={i} style={{ right: `calc(${SchUtils.getRightForLineByTime(i)}%` }} className={classname}></div>,
      );
    }
    return elements;
  };

  const timeElementsHardCode = (discret: number, timeFormat: string) => {
    const elements: React.ReactElement[] = [];
    const timeValues = timeFormat === '12hours' ? timeList : [...Array(24).keys()].map(key => ('0' + key).slice(-2));
    for (let i = 0; i < timeList.length; i++) {
      elements.push(
        <div key={i} className={styles.internalContainer}>
          <span>
            {`${timeValues[i]}:00`}
            <i>{` ${timeFormat === '12hours' ? timeAmPm[i] : ''} / ${discret} min`}</i>
          </span>
        </div>,
      );
    }
    return elements;
  };

  const columnsElement = (column: IPossibleColumns) => {
    const refColumn = useRef<HTMLInputElement | null>(null);
    const refResize = useRef<HTMLInputElement | null>(null);
    const getSort = useSelector(getSortBy);
    const [sortCurrentBy, setCurrentSortBy] = useState<ISortBy>({});

    useEffect(() => {
      setCurrentSortBy(getSort);
    }, [getSort]);

    useEffect(() => {
      const resizeableEl = refColumn.current;
      const controlEl = refResize.current;
      if (!resizeableEl || !controlEl) return;

      const bodyStyle = document.body.style;
      const styles = window.getComputedStyle(resizeableEl);
      const minWidth = commonElementLimits.columnsMinWidth;
      const maxWidth = commonElementLimits.columnsMaxWidth;
      const startWidth: number = parseInt(styles.width, 10);
      let startX: number, width: number;

      const onMoveResize = (event: MouseEvent) => {
        width = startWidth + (event.clientX - startX);
        if (width < minWidth) width = minWidth;
        if (width > maxWidth) width = maxWidth;
        dispatch(changeColumnValue({ ...column, width }));
        resizeableEl.style.width = `${width}px`;
      };
      const onEndResize = () => {
        bodyStyle.userSelect = '';
        bodyStyle.cursor = '';
        document.removeEventListener('mousemove', onMoveResize);
        document.removeEventListener('mouseup', onEndResize);
      };
      const onStartResize = (event: MouseEvent) => {
        startX = event.clientX;
        bodyStyle.userSelect = 'none';
        bodyStyle.cursor = 'col-resize';
        document.addEventListener('mousemove', onMoveResize);
        document.addEventListener('mouseup', onEndResize);
      };

      controlEl.addEventListener('mousedown', onStartResize);

      return () => {
        controlEl.removeEventListener('mousedown', onStartResize);
      };
    }, [column]);

    const onSortToggle = (column: IPossibleColumns) => {
      if (!column.sortMode || sortingProcess) return;

      const proceed = () => {
        dispatch(setColumnSortBy(column));
        dispatch(setIsModified(false));
        dispatch(setDefaultConfirmState());
      };

      if (isUnsavedChanges) {
        return dispatch(openSaveConfirm({ onConfirm: proceed, onDiscard: proceed }));
      }

      dispatch(setColumnSortBy(column));
    };

    const getArrowClassName = (column: IPossibleColumns) => {
      return styles[
        `arrowSort${column?.sortType === SORT_TYPE.AGENT ? '_solid' : ''}${
          SchUtils.isSortColumnIncludes(sortCurrentBy, column)
            ? sortCurrentBy.order === SORT_ORDER.SORT_ORDER_ASC
              ? '_asc'
              : '_desc'
            : ''
        }`
      ];
    };

    if (column.visible) {
      return (
        <div
          data-test={column.name.toLocaleLowerCase() + '-column'}
          key={column.id}
          style={{ width: `${column.width}px` }}
          className={styles.columnElement}
          ref={refColumn}
        >
          <span onClick={() => onSortToggle(column)}>{getColumnLabel(column.id, column.name)}</span>
          {/* ToDo: temp for 2nd Oct, need to return it after */}
          {/*{SchUtils.isSortColumnIncludes(sortCurrentBy, column) && sortingProcess?<div className={`${styles.spinnerSort}`}><InlineSpinner color={'blue'} style={{ width: '16px', height: '16px', marginLeft:'0px'}}/></div>:*/}
          <div onClick={() => onSortToggle(column)} className={getArrowClassName(column)}>
            {!!column.sortMode ? <div className={styles.arrowIcon}></div> : null}
          </div>
          {/*}*/}
          <div ref={refResize} className={styles.resizeController}></div>
        </div>
      );
    }
    return '';
  };

  const getColumnLabel = (id: string, name: string) => {
    return id === 'agentName'
      ? name + getAgentsLength(agents)
      : id === 'siteName'
      ? name + getSitesLength(agents)
      : id === 'teamName'
      ? name + getTeamsLength(agents)
      : name;
  };

  const getSitesLength = (list: any[]) => {
    const items = list.map(item => item.siteName);

    const unique = Array.from(new Set(items));

    return unique.length === 0 ? '' : ' (' + unique.length + ')';
  };

  const getTeamsLength = (list: any[]) => {
    const items = list.map(item => item.teamName);

    const unique = Array.from(new Set(items));

    return unique.length === 0 ? '' : ' (' + unique.length + ')';
  };

  const getAgentsLength = (list: any[]) => {
    return (list?.length ?? 0) === 0 ? '' : ` (${list?.length})`;
  };

  return (
    <>
      <div
        className={classnames(styles.headerContainer, {
          [styles.headerContainer__pinned]: options.pinColumn,
          [styles.headerContainer__fullDayView]: !fullDay,
        })}
        ref={headerRef}
        onScroll={options.pinColumn ? () => {} : onScroll}
      >
        <div id={'headerSortColumns'} className={styles.colums}>
          {columns.map((el: IPossibleColumns) => columnsElement(el))}
        </div>
        {fullDay ? (
          timeFormat === '12hours' ? (
            <div
              className={classnames(styles.headerScaleContainer, {
                [styles.headerScaleContainer__pinned]: options.pinColumn,
                [styles.headerScaleContainer__fullDayView]: fullDay,
              })}
              ref={headerTimesRef}
              onScroll={!options.pinColumn ? () => {} : onScroll}
            >
              <div className={styles.headerScaleSubContainer}>
                {dataElements(timeAmPm, styles.headerAmPm).map(el => el)}
                {dataElements(timeList).map(el => el)}
                {lineElements(styles.headerTimeContainerLines).map(el => el)}
              </div>
            </div>
          ) : (
            <div
              onScroll={!options.pinColumn ? () => {} : onScroll}
              ref={headerTimesRef}
              className={classnames(styles.headerScaleContainer, {
                [styles.headerScaleContainer__pinned]: options.pinColumn,
                [styles.headerScaleContainer__fullDayView]: fullDay,
              })}
            >
              <div className={styles.headerScaleSubContainer}>
                {dataElements(
                  [...Array(24).keys()].map(key => ('0' + key).slice(-2)),
                  styles.headerTimeContainerMilitaryFormat,
                ).map(el => el)}
                {lineElements(styles.headerTimeContainerLines).map(el => el)}
              </div>
            </div>
          )
        ) : (
          <div
            className={classnames(styles.headerScaleContainer, {
              [styles.headerScaleContainer__pinned]: options.pinColumn,
            })}
            onScroll={!options.pinColumn ? () => {} : onScroll}
            ref={headerTimesRef}
          >
            <div className={styles.headerScaleSubContainer} style={{ minWidth: '4000px' }}>
              {timeElementsHardCode(discreetness, timeFormat).map(el => el)}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default TimeLineHeader;
