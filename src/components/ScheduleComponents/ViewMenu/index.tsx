import React from 'react';
import styles from './viewMenu.module.scss';
//import { ReactComponent as Site } from './icons/site.svg';
//import { ReactComponent as Team } from './icons/team.svg';
import { ReactComponent as Rows } from './icons/rows.svg';
import { ReactComponent as Arrows } from './icons/arrows.svg';
import { ReactComponent as ExportIcon } from './icons/export.svg';
import { ReactComponent as Hourly } from './icons/hourlyRange.svg';
import { ReactComponent as TimeFormat } from './icons/timeFormat.svg';
import { ReactComponent as AmPm } from './icons/amPm.svg';
import { ReactComponent as StandardTime } from './icons/standardTime.svg';
import { ReactComponent as Granularity } from './icons/granularity.svg';
import { ReactComponent as Delimiter } from './icons/delimiter.svg';
import { ReactComponent as Color } from './icons/color.svg';
import { GRANULARITY_LIST, GRANULARITY_LIST_REVERT } from '../../../common/constants/chart';
import Checkbox from '../../ReusableComponents/Checkbox';
import {
  getView,
  getTextCoefficient,
  getTimeDiscetness,
  getIsFullDay,
  getTimeFormat,
  getIsShowDelimiter,
  timeLineSelector,
  getDataSelector,
  getSortBy, scheduleCalculatedSelector,
  getIsUseCustomColors,
} from '../../../redux/selectors/timeLineSelector';
import {
  actionchangeViewSortType,
  changeTextCoefficient,
  changeTimeDiscretness,
  togleFullDayViewAction,
  actionChangeTimeFormat,
  togleDelimiterAction,
  togleUseCustomColors,
  refreshViewSortBy,
  getAgentsDaysForExport,
} from '../../../redux/actions/timeLineAction';
import {connect, useSelector} from 'react-redux';
import Range from '../../ReusableComponents/Range';
import { IAgentTimeline } from '../../../redux/ts/intrefaces/timeLine/IAgentTimeline';
//import { columnsForTable } from '../../../common/constants';
import { ISortBy } from '../../../redux/ts/intrefaces/timeLine';

// const viewButtons2 = [
//   {
//     id: columnsForTable.find(({ sortMode }) => sortMode === AGENT_SORT.SITE)?.id ?? 'siteName',
//     icon: <Site />,
//     name: 'Site',
//   },
//   {
//     id: columnsForTable.find(({ sortMode }) => sortMode === AGENT_SORT.TEAM)?.id ?? 'teamName',
//     icon: <Team />,
//     name: 'Team',
//   },
// ];

const viewButtons4 = [
  {
    id: '12hours',
    icon: <AmPm />,
    name: '12 Hours',
  },
  {
    id: '24hours',
    icon: <StandardTime />,
    name: '24 Hours',
  },
];

interface IColumnsMenu {
  view: string;
  sortBy: ISortBy;
  changeView: (columnId: string) => void;
  timeFormat: string;
  changeTimeFormat: (columnId: string) => void;
  textCoeff: number;
  changeTextCoeff: (coeff: number) => void;
  timeDiscreteness: number;
  fullDayView: boolean;
  togleFullDay: () => void;
  changeTimeDiscretness: (coeff: number) => void;
  showDelimiter: boolean;
  showCustomColors: boolean;
  togleDelimiter: () => void;
  togleCustomColors: () => void;
  timeLine: any;
  timeLineData: IAgentTimeline[];
  refreshViewSortBy: () => void;
  getAgentsDaysForExport: (arg: any) => void;
}

const ColumnsMenu = (props: IColumnsMenu) => {
  const scheduleCalculated = useSelector(scheduleCalculatedSelector);

  const isDisabledGranularity = (): boolean => {
    if (!scheduleCalculated) return false;

    return Boolean(scheduleCalculated.data?.coverage?.length ?? 0) || (scheduleCalculated.isRecalculation ?? false);
  }

  const isTimeFormat = (id: string) => id === props.timeFormat;

  const rangeDiscretnessCorrector = (value: number) => {
    const normalValue = GRANULARITY_LIST[value as keyof typeof GRANULARITY_LIST];
    props.changeTimeDiscretness(normalValue);
  };

  const exportToCSV = () => { // TODO move to TimeLine
    props.getAgentsDaysForExport((agentData: [any]) => {
      if (!agentData.length) return;

      const visibleColumns = props.timeLine.columns.filter((column: any) => column.visible);
      const headers: Record<string, string> = {};
      visibleColumns.map((column: any) => {
        headers[column.id] = column.name;
      });

      const replacer = (key: any, value: any) => {
        if (value === null) return ''; // specify how you want to handle null values here
        if (typeof value === 'string')
          value = value
            .replace(/(\s\n\s{6})/g, ' ')
            .replaceAll('\n', ' ')
            .replaceAll('  ', ' ')
            .replace(/\s+/g, ' ');
        return value;
      };

      const csv = agentData.map((el: any) => Object.keys(headers).map(fieldId => JSON.stringify(el[fieldId], replacer))
          .join(','));

      csv.unshift(Object.values(headers).join(',')); // add header column
      const csvString = csv.join('\r\n');

      // create a blob of the data
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

      // create a link to download the file
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'exported_data.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  return (
    <div
      className={styles.container}
      onClick={e => {
        e.stopPropagation();
      }}
    >
      {/*<div className={styles.delimeter} />*/}
      {/*<div className={styles.selectContainerParent}>*/}
      {/*  <Rows />*/}
      {/*  <div className={styles.buttonName}>Group by</div>*/}
      {/*  <div className={styles.arrowButton} />*/}
      {/*  <div*/}
      {/*    className={styles.subcontainer}*/}
      {/*    onClick={e => {*/}
      {/*      e.stopPropagation();*/}
      {/*    }}*/}
      {/*  >*/}
      {/*    {viewButtons2.map(element => {*/}
      {/*      return (*/}
      {/*        <div*/}
      {/*          className={`${styles.selectContainer} ${isSortTypeViewTurnOn(element.id) ? styles.active : ''}`}*/}
      {/*          key={element.id}*/}
      {/*          onClick={() => {*/}
      {/*            if (!props.timeLineData.length) return;*/}
      {/*            props.changeView(element.id);*/}
      {/*            props.refreshViewSortBy();*/}
      {/*          }}*/}
      {/*        >*/}
      {/*          {element.icon}*/}
      {/*          <div className={styles.buttonName}>{element.name}</div>*/}
      {/*        </div>*/}
      {/*      );*/}
      {/*    })}*/}
      {/*    <div className={styles.delimeterAbs} />*/}
      {/*  </div>*/}
      {/*</div>*/}
      <div className={styles.delimeter} />
      <div className={styles.selectContainerParent}>
        <TimeFormat />
        <div className={styles.buttonName}>Time Format</div>
        <div className={styles.arrowButton} />
        <div
          className={`${styles.subcontainer} ${styles.subcontainerMedium}`}
          onClick={e => {
            e.stopPropagation();
          }}
        >
          {viewButtons4.map(element => {
            return (
              <div
                className={`${styles.selectContainer} ${isTimeFormat(element.id) ? styles.active : ''}`}
                key={element.id}
                onClick={() => {
                  props.changeTimeFormat(element.id);
                }}
              >
                {element.icon}
                <div className={styles.buttonName}>{element.name}</div>
              </div>
            );
          })}
          <div className={styles.delimeterAbs} />
        </div>
      </div>
      <div className={styles.delimeter} />
      <div className={styles.selectContainerParent}>
        <Rows />
        <div className={styles.buttonName}>View</div>
        <div className={styles.arrowButton} />
        <div
          className={`${styles.subcontainer} ${styles.subcontainerBigger}`}
          onClick={e => {
            e.stopPropagation();
          }}
        >
          <div
            className={`${styles.selectContainer} ${!props.fullDayView ? styles.active : ''}`}
            onClick={e => {
              e.stopPropagation();
              props.togleFullDay();
            }}
          >
            <Hourly />
            <div className={`${styles.buttonName} ${styles.buttonNameCheckbox}`}>Hourly view</div>
            <Checkbox style={{ marginLeft: 'auto' }} checked={!props.fullDayView}/>
          </div>
          <div className={styles.delimeter} />
          <div
            className={`${styles.selectContainer} ${props.showDelimiter ? styles.active : ''}`}
            onClick={e => {
              e.stopPropagation();
              props.togleDelimiter();
            }}
          >
            <Delimiter />
            <div className={`${styles.buttonName} ${styles.buttonNameCheckbox}`}>Show days splitter</div>
            <Checkbox style={{ marginLeft: 'auto' }} checked={props.showDelimiter} />
          </div>
          <div className={styles.delimeter} />
          <div
            className={`${styles.selectContainer} ${props.showCustomColors ? styles.activeFill : ''}`}
            onClick={e => {
              e.stopPropagation();
              props.togleCustomColors();
            }}
          >
            <Color />
            <div className={`${styles.buttonName} ${styles.buttonNameCheckbox}`}>Use custom colors</div>
            <Checkbox style={{ marginLeft: 'auto' }} checked={props.showCustomColors} />
          </div>
          <div className={styles.delimeter} />
          <div className={styles.selectContainer}>
            <Granularity />
            <div className={styles.buttonName}>Granularity</div>
          </div>

          <div className={`${styles.rangeHolder} ${styles.rangeHolderSmall}`}>
            <Range
              value={GRANULARITY_LIST_REVERT[props.timeDiscreteness as keyof typeof GRANULARITY_LIST_REVERT]}
              max={3}
              min={1}
              step={1}
              percent={false}
              disabled={isDisabledGranularity()}
              changeValue={rangeDiscretnessCorrector}
              indicator={props.timeDiscreteness}
            />
          </div>
        </div>
      </div>
      <div className={styles.delimeter} />
      <div className={styles.selectContainer}>
        <Arrows />
        <div className={styles.buttonName}>Zoom</div>
      </div>
      <div className={styles.rangeHolder}>
        <Range
          value={props.textCoeff}
          max={300}
          min={20}
          step={20}
          percent={true}
          changeValue={props.changeTextCoeff}
        />
      </div>
      <div className={styles.delimeter} />
      <div className={styles.selectContainer}>
        <ExportIcon width={18} height={18}/>
        <div className={styles.buttonName} onClick={exportToCSV}>
          Export CSV
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = (state: any) => {
  return {
    view: getView(state),
    sortBy: getSortBy(state),
    timeFormat: getTimeFormat(state),
    textCoeff: getTextCoefficient(state),
    timeDiscreteness: getTimeDiscetness(state),
    fullDayView: getIsFullDay(state),
    showDelimiter: getIsShowDelimiter(state),
    showCustomColors: getIsUseCustomColors(state),
    timeLine: timeLineSelector(state),
    timeLineData: getDataSelector(state),
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    changeView: (viewtype: string) => dispatch(actionchangeViewSortType(viewtype)),
    changeTimeFormat: (timeFormat: string) => dispatch(actionChangeTimeFormat(timeFormat)),
    changeTextCoeff: (coeff: number) => dispatch(changeTextCoefficient(coeff)),
    togleFullDay: () => dispatch(togleFullDayViewAction()),
    changeTimeDiscretness: (coeff: number) => dispatch(changeTimeDiscretness(coeff)),
    togleDelimiter: () => dispatch(togleDelimiterAction()),
    togleCustomColors: () => dispatch(togleUseCustomColors()),
    refreshViewSortBy: () => dispatch(refreshViewSortBy()),
    getAgentsDaysForExport: (callback: any) => dispatch(getAgentsDaysForExport(callback)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ColumnsMenu);
