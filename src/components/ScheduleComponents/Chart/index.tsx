import './chart.overrides.css';

import classnames from 'classnames';
import React, { RefObject, useEffect, useMemo, useState } from 'react';
import Chart from 'react-apexcharts';
import { renderToString } from 'react-dom/server';
import { connect, useSelector } from 'react-redux';
import useStateRef from 'react-usestateref';

import { IControlChartState } from '../../../common/interfaces/storage';
import { ColumsForChart } from '../../../helper/chart';
import SchAgent from '../../../helper/schedule/SchAgent';
import utils from '../../../helper/utils';
import { addChartDataAction, changeChartActiveAction, togleBindingAction } from '../../../redux/actions/ChartActions';
import {
  getCalculatedScheduleShifts,
  setChartControlData,
  setScheduleForecast,
} from '../../../redux/actions/timeLineAction';
import { useAppDispatch } from '../../../redux/hooks';
import {
  getActive,
  getChartBinding,
  getChartContainerScrollPosition,
  getData,
} from '../../../redux/selectors/chartSelector';
import { getActiveDateSelector } from '../../../redux/selectors/controlPanelSelector';
import { getLastId, getLastParams } from '../../../redux/selectors/snapShotsSelector';
import {
  getAgentWorksDay,
  getDataSelector,
  getIsFullDay,
  getModifiedAgents,
  getSitesMultipleTimezonesWarningSelector,
  getSumWidth,
  getTimeDiscetness,
  getTimeFormat,
  getTimelineOptions,
  scheduleCalculatedSelector,
} from '../../../redux/selectors/timeLineSelector';
import { ICalculatedSchedule, IChartsData, ISnapShot } from '../../../redux/ts/intrefaces/timeLine';
import { WarningIcon } from '../../../static/svg';
import InlineSpinner from '../../ReusableComponents/InlineSpinnerBlue';
import Range from '../../ReusableComponents/RangeDebounce';
import { TooltipContent, TooltipLegacy, TooltipTrigger } from '../../ReusableComponents/Tooltip/Tooltip';
import { ReactComponent as AgentsCoverageGraph } from './AgentsCoverageGraph.svg';
import styles from './chart.module.scss';

//import { GRANULARITY_LIST_REVERT } from '../../../common/constants/chart';
// export interface ITotalHours {
//   coverage?: number;
//   calculated?: number;
//   scheduleBuilder?: number;
// }

export interface IChartProps {
  snapShot: ISnapShot;
  snapShotId: string;
  fullDayView: boolean;
  timeFormat: string;
  tableGranularity: number;
  data: IChartsData;
  active: string[];
  changeActive: (...args: any[]) => void;
  columnsWidth: number;
  scrolHandler: (...args: any[]) => void;
  refHandler: RefObject<HTMLDivElement>;
  bind: boolean;
  togleBind: () => void;
  scheduleCalculated: ICalculatedSchedule;
  setNewScheduleForecast: (data: number[]) => void;
  granularity: number;
  changeContrtol: (...args: any[]) => void;
  rebuildChart: () => void;
  isMultipleTimezonesWarningShown: boolean;
  chartContainerScrollPosition: number;
}

export type ICurve = 'smooth' | 'straight' | 'stepline' | ('smooth' | 'straight' | 'stepline')[];

export type IType = 'front' | 'back' | undefined;

const curve: ICurve = 'stepline';

const type: IType = 'back';

const createCategories = (granularity: number, fullDay: boolean, timeFormat: string) => {
  let defaultCategories = [
    '12 AM',
    '1 AM',
    '2 AM',
    '3 AM',
    '4 AM',
    '5 AM',
    '6 AM',
    '7 AM',
    '8 AM',
    '9 AM',
    '10 AM',
    '11 AM',
    '12 PM',
    '1 PM',
    '2 PM',
    '3 PM',
    '4 PM',
    '5 PM',
    '6 PM',
    '7 PM',
    '8 PM',
    '9 PM',
    '10 PM',
    '11 PM',
    '12 AM',
  ];
  if (timeFormat === '24hours') {
    defaultCategories = [
      '00',
      '01',
      '02',
      '03',
      '04',
      '05',
      '06',
      '07',
      '08',
      '09',
      '10',
      '11',
      '12',
      '13',
      '14',
      '15',
      '16',
      '17',
      '18',
      '19',
      '20',
      '21',
      '22',
      '23',
      '00',
    ];
  }
  const newCategories = [];
  const gaps = Array(60 / granularity - 1).fill(' ', 0, 60 / granularity - 1);
  for (let i = 0; i < defaultCategories.length; i++) {
    newCategories.push(defaultCategories[i]);
    if (i < defaultCategories.length - 1) {
      newCategories.push(...gaps);
    }
  }

  return newCategories;
};

const ChartBox = (props: IChartProps) => {
  const modifiedAgents = useSelector(getModifiedAgents);
  const options = useSelector(getTimelineOptions);

  const getCustomTooltipHeader = () => {
    let header = '';
    header += props.fullDayView ? 'Full day' : 'Hourly view';
    header += '/';
    header += props.timeFormat === '24hours' ? '24 hours' : '12 hours';
    return header;
  };

  const times = useMemo(
    () => createCategories(props.granularity, props.fullDayView, props.timeFormat),
    [props.granularity, props.fullDayView, props.timeFormat],
  );

  const getCustomTooltip = (data: any) => {
    return renderToString(
      <div className={styles.customTooltip}>
        <div className={styles.customTooltipHeader}>
          <div className={styles.hourly}>
            <span>{getCustomTooltipHeader()}</span>
          </div>
          <div className={styles.xaxis}>{data.w.globals.categoryLabels[data.dataPointIndex]}</div>
        </div>
        {data.w.config.series.map((el: any, index: number) => {
          return (
            <div className={styles.tooltipItem} key={index}>
              <span style={{ backgroundColor: el.color }} />
              <i className={styles.legend}>
                {el.name}: {el.data[data.dataPointIndex]}
              </i>
            </div>
          );
        })}
      </div>,
    );
  };

  const dispatchHook = useAppDispatch();
  const [mainState, setMainState, mainStateRef] = useStateRef({
    options: {
      chart: {
        height: '100%',
        width: '100%',
        redrawOnParentResize: true,
        zoom: {
          enabled: false,
        },
        toolbar: {
          export: {
            csv: {
              filename: 'American_Express_customer',
            },
            svg: {
              filename: 'American_Express_customer',
            },
            png: {
              filename: 'American_Express_customer',
            },
          },
        },
      },

      stroke: {
        curve: curve,
        width: 2,
      },
      xaxis: {
        categories: times,
        labels: {
          show: !props.bind,
          rotate: -90,
          rotateAlways: true,
        },
        axisTicks: {
          height: props.bind ? 12 : 6,
        },
        tooltip: {
          enabled: false,
        },
      },
      yaxis: {
        labels: {
          minWidth: 40,
          maxWidth: 40,
        },
      },
      grid: {
        padding: {
          right: !props.bind ? 10 : 0,
          left: 5,
          bottom: -20,
        },
        position: type,
        xaxis: {
          lines: {
            show: true,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
      },
      legend: {
        show: false,
      },
      tooltip: {
        custom: getCustomTooltip,
      },
    },
  });

  useEffect(() => {
    if (props.data.ITEM_COVERAGE_SCHEDULED && props.data.ITEM_COVERAGE_SCHEDULED.length > 0) {
      dispatchHook(addChartDataAction(false, SchAgent.prepareAgentForPerformance(modifiedAgents), false, false));
      setMainState({
        ...mainState,
        options: {
          ...mainState.options,
          xaxis: {
            ...mainState.options.xaxis,
            categories: times,
            labels: {
              ...mainState.options.xaxis.labels,
              show: !props.bind,
            },
            axisTicks: {
              height: props.bind ? 12 : 6,
            },
          },
          grid: {
            ...mainState.options.grid,
            padding: {
              ...mainState.options.grid.padding,
              right: !props.bind ? 10 : 0,
            },
          },
          tooltip: {
            custom: getCustomTooltip,
          },
        },
      });
    }
  }, [props.tableGranularity]);

  useEffect(() => {
    if (props.data.ITEM_COVERAGE_SCHEDULED && props.data.ITEM_COVERAGE_SCHEDULED.length > 0) {
      setMainState({
        ...mainState,
        options: {
          ...mainState.options,
          xaxis: {
            ...mainState.options.xaxis,
            categories: times,
            labels: {
              ...mainState.options.xaxis.labels,
              show: !props.bind,
            },
            axisTicks: {
              height: props.bind ? 12 : 6,
            },
          },
          grid: {
            ...mainState.options.grid,
            padding: {
              ...mainState.options.grid.padding,
              right: !props.bind ? 10 : 0,
            },
          },
          tooltip: {
            custom: getCustomTooltip,
          },
        },
      });
    }
  }, [props.fullDayView, props.timeFormat, props.bind]);

  useEffect(() => {
    if (props.data && props.data['ITEM_STAFFING_CALCULATED']) {
      props.setNewScheduleForecast(
        props.data['ITEM_STAFFING_CALCULATED'].slice(0, props.data['ITEM_STAFFING_CALCULATED'].length - 1),
      );
    }
  }, [props.data]);

  const controlChanger = async (data: IControlChartState) => {
    await props.changeContrtol(data);
  };

  const mouseUp = () => {
    if (!props.scheduleCalculated.isRecalculation) {
      props.rebuildChart();
    }
  };

  const chageActive = (name: string) => {
    const indexTarget = props.active.indexOf(name);
    const newActive = [...props.active];
    if (indexTarget > -1) {
      newActive.splice(indexTarget, 1);
    } else {
      newActive.push(name);
    }
    props.changeActive(newActive);
  };

  // ToDo: refactoring - Schedule builder
  const getScheduleBuilder = () => {
    const schBuilder = {
      type: 'line',
      data: Array(25).fill(0),
      color: '#00fc50',
      name: 'Tring Algorithm Covrage',
    };

    if (props.scheduleCalculated.isCalculated || !props.scheduleCalculated.data.coverage.length) return schBuilder;

    const data = [];
    const coverage = props.scheduleCalculated.data.coverage || [];
    const resolution = Math.round(props.granularity / 15);
    for (let idx = 0; idx < Math.floor(coverage.length / resolution); idx++) {
      let result = 0;
      for (let j = 0; j < resolution; j++) {
        result += coverage[idx * resolution + j].value / resolution;
      }
      data.push(result);
    }
    data.push(0);
    schBuilder.data = data;

    return schBuilder;
  };

  const getSeries = () => {
    const series = [];
    for (let i = 0; i < props.active.length; i++) {
      const targetElement = ColumsForChart.find(element => element.idName === props.active[i]);
      series.push({
        type: targetElement?.type || 'area',
        data: props.data[props.active[i] as keyof typeof props.data] || [],
        color: targetElement?.color,
        name: targetElement?.name === 'Coverage' ? 'Original Coverage' : targetElement?.name,
      });
    }
    // todo: refactoring ScheduleBuilder chart
    if (isScheduleBuilderChartVisible && props.scheduleCalculated.data.coverage.length)
      series.push(getScheduleBuilder());

    return series;
  };
  const isActive = (name: string) => {
    return props.active.indexOf(name) > -1;
  };

  /* eslint-disable @typescript-eslint/no-unused-vars */
  const changeBind = () => {
    props.togleBind();
  };

  const [containerWidth, setContainerWidth] = useState<number>(
    (props.refHandler.current?.parentElement as HTMLDivElement)?.clientWidth,
  );

  // ToDo: refactoring ScheduleBuilder chart
  const [isScheduleBuilderChartVisible, setIsScheduleBuilderChartVisible] = useState<boolean>(true);
  // const [totalHours, setTotalHours] = useState<ITotalHours>({});

  useEffect(() => {
    const container = props.refHandler.current?.parentElement as HTMLDivElement;
    const onRefreshWidth = () => {
      setContainerWidth(container?.clientWidth);
    };
    window.addEventListener('resize', onRefreshWidth);
    window.addEventListener('click', onRefreshWidth);
    return () => {
      window.removeEventListener('resize', onRefreshWidth);
      window.removeEventListener('click', onRefreshWidth);
    };
  });

  // const getContainerStyle = () => {
  //   if (props.bind) return {
  //     width:
  //   };
  //
  //   if (props.fullDayView) {
  //     return {
  //       width: `100%`,
  //       // minWidth: `${props.columnsWidth + 600}px`,
  //     };
  //   } else {
  //     return {
  //       width: `100%`,
  //     };
  //   }
  // };
  const getStyleWidth = () => {
    if (props.bind) return {};
    if (!chartDataExists) return {};
    if (!props.bind) return {};
    if (!props.fullDayView) {
      const width = `${(containerWidth > 885 ? containerWidth : 885) - 40}px`;
      return { maxWidth: width, minWidth: width, left: '20px' };
    }
    return {};
  };

  // ToDo: refactoring - Schedule builder
  const toggleScheduleBuilderChart = () => {
    setIsScheduleBuilderChartVisible(!isScheduleBuilderChartVisible);
  };

  // ToDo: refactoring - Schedule builder
  const getLegendLabel = (el: {
    idType: number;
    idName: string;
    color: string;
    name: string;
    type: string;
  }): string => {
    if (!utils.checkEnvFlag(process.env.REACT_APP_SCHEDULE_BUILDER_ENABLED)) return el.name as string;

    if (!['ITEM_COVERAGE_SCHEDULED', 'ITEM_STAFFING_CALCULATED'].includes(el.idName)) return el.name;
    const total = countTotal(props.data[el.idName as keyof IChartsData] || []);

    return `${el.name === 'Coverage' ? 'Original Coverage' : (el.name as string)} ${total} h`;
  };

  // ToDo: refactoring - Schedule builder
  const countTotal = (data: number[]): string => {
    return (data.reduce((acc: number, v: number) => acc + v, 0) / Math.round(60 / props.granularity)).toFixed(1);
  };

  const getOvertime = (data?: number[]) => {
    if (!props.data || !props.data.ITEM_STAFFING_CALCULATED || !props.data.ITEM_COVERAGE_SCHEDULED) return 0;

    let result = 0;
    const forecast = props.data.ITEM_STAFFING_CALCULATED;
    const coverage = data ? data : props.data.ITEM_COVERAGE_SCHEDULED;
    forecast.forEach((v, i) => {
      const o = coverage[i] - v;
      result += o > 0 ? o : 0;
    });

    return (result / Math.round(60 / props.granularity)).toFixed(1);
  };

  const getRequired = (data?: number[]) => {
    if (!props.data || !props.data.ITEM_STAFFING_CALCULATED || !props.data.ITEM_COVERAGE_SCHEDULED) return 0;

    let result = 0;
    const forecast = props.data.ITEM_STAFFING_CALCULATED;
    const coverage = data ? data : props.data.ITEM_COVERAGE_SCHEDULED;
    forecast.forEach((v, i) => {
      const o = v - coverage[i];
      result += o > 0 ? o : 0;
    });

    return (result / Math.round(60 / props.granularity)).toFixed(1);
  };

  const agents = useSelector(getDataSelector);
  const currentDate = useSelector(getActiveDateSelector);

  const getWorkAgent = () => {
    if (!currentDate || !agents || !agents.length) return 0;

    const date = new Date(currentDate).getTime();
    const agentDays = agents.map(a => a.days.find(d => d.date === date));
    return agentDays.filter(d => d && d.id != 0 && d.dayState && d.dayState.startDateTime && d.dayState.endDateTime)
      .length;
  };

  const agentWorkDay = useSelector(getAgentWorksDay);

  const renderLegend = useMemo(() => {
    return (
      <div
        className={styles.legendContainer}
        style={{
          width: `${props.bind ? props.columnsWidth - 45 : 200}px`,
          minWidth: `${props.bind ? props.columnsWidth - 45 : 200}px`,
        }}
      >
        <div className={styles.subLeged}>
          <span>Legend</span>
          {/* ToDo: refactoring - Schedule builder */}
          {utils.checkEnvFlag(process.env.REACT_APP_SCHEDULE_BUILDER_ENABLED) &&
          !!props.scheduleCalculated.data.coverage.length ? (
            <div className={styles.legendItem} onClick={toggleScheduleBuilderChart}>
              <span style={{ backgroundColor: '#00FC50' }} />
              <i className={`${styles.legend} ${isScheduleBuilderChartVisible ? styles.active : ''} ${styles.preWrap}`}>
                {`Tring Algorithm Covrage ${countTotal(props.scheduleCalculated.data.coverage.map(v => v.value))} h\n` +
                  `overstaff: ${getOvertime(props.scheduleCalculated.data.coverage.map(v => v.value))};\n` +
                  `understaff: ${getRequired(props.scheduleCalculated.data.coverage.map(v => v.value))};\n` +
                  `agents: ${getWorkAgent()}`}
              </i>
            </div>
          ) : null}
          {ColumsForChart.map((el, index) => {
            return (
              <div className={styles.legendItem} key={index} onClick={() => chageActive(el.idName)}>
                <span style={{ backgroundColor: el.color }} />{' '}
                <i className={`${styles.legend} ${isActive(el.idName) ? styles.active : ''} ${styles.preWrap}`}>
                  {utils.checkEnvFlag(process.env.REACT_APP_SCHEDULE_BUILDER_ENABLED) && index == 0
                    ? `${getLegendLabel(el)}\n ` +
                      `overstaff: ${getOvertime()};\n ` +
                      `understaff: ${getRequired()};\n ` +
                      `agents: ${agentWorkDay}`
                    : getLegendLabel(el)}
                </i>
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [props.active, props.bind, props.columnsWidth, ColumsForChart, chageActive, isActive]);

  const chartBuilderControl = () => {
    return (
      <div className={styles.controlContainer}>
        <div className={`${styles.mainHolder}`}>
          <div className={`${styles.subHolder}`}>
            <span className={`${styles.rangeName} ${styles.header}`}>Coverage Smoothing</span>
            <div className={styles.content}>
              <span className={`${styles.rangeHolder__tooltipContainer}`}>Forecast oriented</span>
              <div className={`${styles.rangeHolder} ${styles.content}`}>
                <Range
                  value={props.scheduleCalculated.control.coverageSmoothing}
                  max={16}
                  min={0}
                  step={1}
                  percent={false}
                  changeValue={val => {
                    controlChanger({ name: 'coverageSmoothing', value: val });
                  }}
                  mouseUp={mouseUp}
                />
              </div>
              <span className={`${styles.rangeHolder__tooltipContainer}`}>Averaging</span>
            </div>
          </div>
          <div className={`${styles.subHolder}`}>
            <span className={`${styles.rangeName} ${styles.header}`}>Coverage Multiply</span>
            <div className={styles.content}>
              <span className={`${styles.rangeHolder__tooltipContainer}`}>Understaff</span>
              <div className={`${styles.rangeHolder}`}>
                <Range
                  value={props.scheduleCalculated.control.coverageMultiply}
                  max={200}
                  min={50}
                  step={1}
                  percent={false}
                  changeValue={val => {
                    controlChanger({ name: 'coverageMultiply', value: val });
                  }}
                  mouseUp={mouseUp}
                />
              </div>
              <span className={`${styles.rangeHolder__tooltipContainer}`}>Oversaff</span>
            </div>
          </div>
          <div className={`${styles.subHolder}`}>
            <span
              className={`${styles.rangeName} ${styles.header}`}
              // className={`${styles.rangeName} ${styles.header} ${styles.clickable}`}
              // onClick={async () => {await controlChanger({ name: 'mealsPositioning', value: 50 }); mouseUp()}}
            >
              Meals Positioning
            </span>
            <div className={styles.content}>
              <span className={`${styles.rangeHolder__tooltipContainer}`}>Forecast oriented</span>
              <div className={`${styles.rangeHolder} ${styles.content}`}>
                <Range
                  value={props.scheduleCalculated.control.mealsPositioning}
                  max={100}
                  min={0}
                  step={1}
                  percent={false}
                  changeValue={val => {
                    controlChanger({ name: 'mealsPositioning', value: val });
                  }}
                  mouseUp={mouseUp}
                />
              </div>
              <span className={`${styles.rangeHolder__tooltipContainer}`}>Center</span>
            </div>
          </div>
          <div className={`${styles.subHolder}`}>
            <span className={`${styles.rangeName} ${styles.header}`}>Breaks Positioning</span>
            <div className={styles.content}>
              <span className={`${styles.rangeHolder__tooltipContainer}`}>Forecast oriented</span>
              <div className={`${styles.rangeHolder}`}>
                <Range
                  value={props.scheduleCalculated.control.breaksPositioning}
                  max={100}
                  min={0}
                  step={1}
                  percent={false}
                  changeValue={val => {
                    controlChanger({ name: 'breaksPositioning', value: val });
                  }}
                  mouseUp={mouseUp}
                />
              </div>
              <span className={`${styles.rangeHolder__tooltipContainer}`}>Center</span>
            </div>
          </div>
          <div className={`${styles.subHolder}`}>
            <span className={`${styles.rangeName} ${styles.header}`}>Agents count</span>
            <div className={styles.content}>
              <span className={`${styles.rangeHolder__tooltipContainer}`}>Minimum Agents</span>
              <div className={`${styles.rangeHolder}`}>
                <Range
                  value={props.scheduleCalculated.control.agentsCount}
                  max={100}
                  min={0}
                  step={1}
                  percent={false}
                  changeValue={val => {
                    controlChanger({ name: 'agentsCount', value: val });
                  }}
                  mouseUp={mouseUp}
                />
              </div>
              <span className={`${styles.rangeHolder__tooltipContainer}`}>Forecast oriented</span>
            </div>
          </div>
        </div>
        {props.scheduleCalculated.isRecalculation ? (
          <div className={styles.spinnerContainer}>
            <InlineSpinner />
          </div>
        ) : null}
      </div>
    );
  };

  const renderPlaceholder = useMemo(() => {
    return (
      <div className={styles.placeholder}>
        <AgentsCoverageGraph />
        <p>Select agents to see coverage graph</p>
      </div>
    );
  }, [
    props.columnsWidth,
    props.fullDayView,
    props.granularity,
    props.timeFormat,
    props.bind,
    getSeries,
    mainStateRef?.current.options,
    props.scheduleCalculated.data.coverage,
    props.isMultipleTimezonesWarningShown,
  ]);

  const chartDataExists = props.data.ITEM_COVERAGE_SCHEDULED && props.data.ITEM_COVERAGE_SCHEDULED.length !== 0;

  const renderChart = useMemo(() => {
    let minWidthChartContainer = `643px`;
    let minWidthChart = `643px`;
    if (props.bind && options.pinColumn) {
      minWidthChartContainer = `calc(100% - ${props.columnsWidth}px)`;
    }
    if (!props.fullDayView && !options.pinColumn && props.bind) {
      minWidthChartContainer = '4043px';
    } else if (props.fullDayView && !options.pinColumn && !props.bind) {
      minWidthChartContainer = `643px`;
    }
    if (!props.fullDayView && props.bind) {
      minWidthChart = '4043px';
    }

    return (
      <div
        className={styles.mixedChartContainer}
        style={{
          minWidth: minWidthChartContainer,
        }}
        id={options.pinColumn ? 'chart' : ''}
        onScroll={options.pinColumn ? props.scrolHandler : () => {}}
        ref={options.pinColumn ? props.refHandler : () => {}}
      >
        <div
          className={styles.mixedChart}
          style={{
            minWidth: minWidthChart,
          }}
        >
          <Chart options={mainStateRef.current.options} series={getSeries()} width={`100%`} height={'100%'} />
        </div>
      </div>
    );
  }, [
    props.columnsWidth,
    props.fullDayView,
    props.granularity,
    props.timeFormat,
    props.bind,
    getSeries,
    mainStateRef?.current.options,
    props.scheduleCalculated.data.coverage,
    props.isMultipleTimezonesWarningShown,
  ]);

  const warningStyleLeft = useMemo(() => {
    const r = document.querySelector<HTMLElement>(':root');
    if (!r) return;
    if (!props.bind) {
      r.style.setProperty(
        '--apexcharts-toolbar-left',
        `calc(100vw - var(--sidebar-width, 0px) - 245px + ${props.chartContainerScrollPosition}px)`,
      );
    } else {
      r.style.setProperty(
        '--apexcharts-toolbar-left',
        `calc(100vw - var(--sidebar-width, 0px) - ${props.columnsWidth}px + var(--timeline-scroll) + ${props.chartContainerScrollPosition}px)`,
      );
    }

    return {
      left: `calc(100vw - var(--sidebar-width, 0px) - 200px + ${props.chartContainerScrollPosition}px)`,
    };
  }, [props.columnsWidth, props.bind, props.chartContainerScrollPosition]);

  const multipleTimezonesWarning = props.isMultipleTimezonesWarningShown ? (
    <TooltipLegacy>
      <TooltipTrigger>
        <div
          style={{
            ...warningStyleLeft,
          }}
          className={styles.multipleTimezonesWarning}
        >
          <WarningIcon height={17} width={17} />
          <span>Multiple timezones detected</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        You have selected several sites with different time zones. Graph may not display correctly.
      </TooltipContent>
    </TooltipLegacy>
  ) : null;
  return (
    <div
      className={classnames(styles.container, {
        [styles.container__pinned]: options.pinColumn,
      })}
      // id={'chart'}
      onScroll={options.pinColumn ? () => {} : props.scrolHandler}
      ref={options.pinColumn ? () => {} : props.refHandler}
      // style={getContainerStyle()}
      id={!options.pinColumn ? 'chart' : ''}
    >
      {/*{options.pinColumn && renderLegend}*/}
      {multipleTimezonesWarning}
      {(props.scheduleCalculated.data.coverage.length || props.scheduleCalculated.isRecalculation) &&
        chartBuilderControl()}
      <div
        className={`${styles.subContainer} ${!props.bind && !props.fullDayView ? styles.sticky : ''} ${
          props.scheduleCalculated.data.coverage.length || props.scheduleCalculated.isRecalculation
            ? styles.subContainerSmall
            : ''
        }`}
        style={getStyleWidth()}
      >
        {chartDataExists ? (
          <>
            {renderLegend}
            {renderChart}
          </>
        ) : (
          <>{renderPlaceholder}</>
        )}
      </div>
    </div>
  );
};

const mapStateToProps = (state: any) => {
  return {
    snapShot: getLastParams(state),
    snapShotId: getLastId(state),
    tableGranularity: getTimeDiscetness(state),
    fullDayView: getIsFullDay(state),
    data: getData(state),
    active: getActive(state),
    columnsWidth: getSumWidth(state),
    timeFormat: getTimeFormat(state),
    bind: getChartBinding(state),
    scheduleCalculated: scheduleCalculatedSelector(state),
    granularity: getTimeDiscetness(state),
    isMultipleTimezonesWarningShown: getSitesMultipleTimezonesWarningSelector(state),
    chartContainerScrollPosition: getChartContainerScrollPosition(state),
  };
};
const mapDispatchToProps = (dispatch: any) => {
  return {
    changeActive: (names: string[]) => dispatch(changeChartActiveAction(names)),
    togleBind: () => dispatch(togleBindingAction()),
    changeContrtol: (data: IControlChartState) => dispatch(setChartControlData(data)),
    rebuildChart: () => dispatch(getCalculatedScheduleShifts()),
    setNewScheduleForecast: (data: number[]) => dispatch(setScheduleForecast(data)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ChartBox);
