import { clone } from 'ramda';
import React, { FC, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import restApi from '../../../../../api/rest';
import { ApiCodes } from '../../../../../api/ts/constants/codes';
import {
  ICreateReOptimizationParam,
  ICreateReOptimizationRequestPayload,
  IRebuildRequestPayload,
  ISetScenarioParamsPayload,
  ReOptimizationType,
} from '../../../../../api/ts/interfaces/config.payload';
import {
  IResponseStatusInfo,
  ISchScenarioParams,
  StaffingType,
} from '../../../../../api/ts/interfaces/SchScenarioParams';
import { IBusinessUnits } from '../../../../../common/interfaces/config';
import DateUtils from '../../../../../helper/dateUtils';
import SchUtils from '../../../../../helper/schedule/SchUtils';
import Utils from '../../../../../helper/utils';
import { getFilterData } from '../../../../../redux/selectors/filterSelector';
import { defaultProgressState, requestTimer } from '../constants';
import { IReviewMessage, IScheduleRebuildWizardPageProps, TeamConstraints } from '../interfaces';
import { ReactComponent as DoneIcon } from './icons/iconDone.svg';
import { ReactComponent as ErrorIcon } from './icons/iconError.svg';
import { ReactComponent as WarningIcon } from './icons/iconWarning.svg';
import { useAppDispatch } from '../../../../../redux/hooks';
import { refreshAgentsSchedule } from '../../../../../redux/actions/timeLineAction';
import styles from './index.module.scss';

const RebuildProgressPage: FC<IScheduleRebuildWizardPageProps> = props => {
  const dispatch = useAppDispatch();
  const filterDate = useSelector(getFilterData);
  const [progressState, setProgressState] = useState<IResponseStatusInfo>(defaultProgressState);
  const [startTimestamp, setStartTimestamp] = useState<number>(Date.now());
  const [selectedAgentCount, setSelectedAgentCount] = useState<number>(0);

  useEffect(() => {
    if (props.initState.data.rebuildProgressPage.requestParameters === null) return;

    setProgressState(getProgressState());
  }, [props.initState.data.rebuildProgressPage.requestParameters]);

  useEffect(() => {
    if (props.initState.data.rebuildProgressPage.requestParameters === null) return;

    const timer = setTimeout(() => {
      if (props.initState.data.rebuildProgressPage.requestParameters === null) return;
      if (progressState.percentageDone < 100) {
        restApi.getRequestStatusInfo(props.initState.data.rebuildProgressPage.requestParameters).then(res => {
          setProgressState(res.data);
        });
      } else {
        restApi.closeRequest(props.initState.data.rebuildProgressPage.requestParameters).then(() => {
          if (progressState.percentageDone >= 100) {
            const isWarnings = Boolean(progressState.warningCount) && !Boolean(progressState.errorCount);
            onChangeState({ isStart: true, isDone: true, requestParameters: null, isWarnings });
            dispatch(refreshAgentsSchedule());
          }
        });
      }
    }, requestTimer);

    return () => {
      clearTimeout(timer);
    };
  }, [progressState, props.initState.data.rebuildProgressPage.requestParameters]);

  const getProgressState = (): IResponseStatusInfo => {
    return defaultProgressState;
  };

  const onChangeState = (newState: {
    isStart?: boolean;
    isDone?: boolean;
    requestParameters?: IRebuildRequestPayload | null;
    isWarnings?: boolean,
    reviewMessages?: IReviewMessage[]
  }) => {
    const _rebuildProgressPage = clone(props.initState.data.rebuildProgressPage);
    props.onChangeState('rebuildProgressPage', { ..._rebuildProgressPage, ...newState });
  };

  const collectAgentsTeamsAndActivities = (): Promise<{
    agents: any;
    teams: any;
    activities: number[];
  }> => {
    const checkedAgents = props.initState.data.selectAgentsPage.checkedAgents;
    const checkedActivities = props.initState.data.selectActivitiesPage.checkedActivities;
    const result: {
      buIds: number[];
      siteIds: number[];
      teamIds: number[];
    } = {
      buIds: [],
      siteIds: [],
      teamIds: [],
    };

    let buList: IBusinessUnits = {};
    let teamList: IBusinessUnits = {};
    const agentPayloads: any[] = [];

    return restApi
      .buildTreeWithBuAndSites({})
      .then(res => {
        buList = res.data;
        result.buIds = Object.keys(buList)
          .filter(k => Object.keys(checkedAgents).includes(k))
          .map(k => Number(k));

        result.siteIds = result.buIds.reduce(
          (acc: number[], buId) => [
            ...acc,
            //@ts-ignore
            ...Object.keys(buList[buId].sites)
              .filter(
                siteId => checkedAgents[buId].isAllChecked || Object.keys(checkedAgents[buId].sites).includes(siteId),
              )
              .map(k => Number(k)),
          ],
          [],
        );

        const teamsPayload = {
          sites: result.siteIds.reduce(
            (acc, siteId) => ({
              ...acc,
              [siteId]: {
                buId: Object.values(buList).find(bu => Object.keys(bu.sites).includes(String(siteId)))?.buId ?? 0,
                siteId,
              },
            }),
            {},
          ),
        };

        return restApi.buildTreeWithTeamByBuAndSiteId(teamsPayload);
      })
      .then(res => {
        teamList = res.data;
        result.teamIds = result.buIds.reduce((acc: number[], buId) => {
          const sitesIds = Object.keys(teamList[buId].sites)
            .map(k => Number(k))
            .filter(siteId => result.siteIds.includes(siteId));
          if (!sitesIds.length) return [...acc];
          const teamIds: number[] = [];
          const siteIdMapped = sitesIds.map(siteId => {
            const teams = teamList[buId].sites[siteId].teams;
            const _teamIds = Object.keys(teams)
              .filter(
                teamId =>
                  checkedAgents[buId]?.isAllChecked ||
                  ((checkedAgents[buId]?.isChecked ?? false) && checkedAgents[buId].sites[siteId]?.isAllChecked) ||
                  ((checkedAgents[buId].sites[siteId]?.isChecked ?? false) &&
                    Object.keys(checkedAgents[buId]?.sites[siteId].teams ?? {}).includes(teamId)),
              )
              .map(k => Number(k));
            teamIds.push(..._teamIds);
            return { buId, siteId, teamId: _teamIds };
          }, []);
          agentPayloads.push(...siteIdMapped);

          return [...acc, ...teamIds];
        }, []);

        return Promise.all(agentPayloads.map(payload => restApi.buildTreeWithAgents(payload)));
      })
      .then(res => {
        const collect: {
          agents: any;
          teams: any;
          activities: number[];
        } = {
          agents: {},
          teams: {},
          activities: [],
        };
        res.forEach(r => {
          Object.keys(r.data).forEach(buId =>
            Object.keys((r.data as any)[buId].sites).forEach(siteId =>
              Object.keys((r.data as any)[buId].sites[siteId].teams).forEach(teamId => {
                if (checkedAgents[buId]?.isAllChecked ||
                  (checkedAgents[buId]?.isChecked && (checkedAgents[buId]?.sites[siteId]?.isAllChecked ?? false)) ||
                  (checkedAgents[buId]?.sites[siteId]?.isChecked && (checkedAgents[buId]?.sites[siteId]?.teams[teamId]?.isAllChecked ?? false))) {
                  if ((collect.teams[siteId] ?? []).length) {
                    collect.teams[siteId].push(Number(teamId));
                  } else {
                    collect.teams[siteId] = [Number(teamId)];
                  }
                }
                Object.keys((r.data as any)[buId].sites[siteId].teams[teamId].agents).forEach(agentId => {
                  if (
                    checkedAgents[buId]?.isAllChecked ||
                    (checkedAgents[buId]?.isChecked && (checkedAgents[buId]?.sites[siteId]?.isAllChecked ?? false)) ||
                    (checkedAgents[buId]?.sites[siteId]?.isChecked &&
                      (checkedAgents[buId]?.sites[siteId]?.teams[teamId]?.isAllChecked ?? false)) ||
                    (checkedAgents[buId]?.sites[siteId]?.teams[teamId]?.isChecked &&
                      (checkedAgents[buId]?.sites[siteId].teams[teamId].agents[agentId]?.isChecked ?? false))
                  ) {
                    if ((collect.agents[siteId] ?? []).length) {
                      collect.agents[siteId].push(Number(agentId));
                    } else {
                      collect.agents[siteId] = [Number(agentId)];
                    }
                  }
                });
              }),
            ),
          );
        });

        res.forEach(r => {
          Object.keys(r.data).forEach(buId => {
            if (!checkedActivities[buId].isActivityChecked) {
              return;
            }

            if (checkedActivities[buId].isAllActivitiesChecked) {
              //@ts-ignore
              Object.values(buList[buId]?.sites ?? {})
                //@ts-ignore
                .reduce((acc: number[], s) => [...acc, ...Object.keys(s.activities)], [])
                //@ts-ignore
                .map(a => Number(a))
                .forEach((a: number) => {
                  if (!collect.activities.includes(a)) collect.activities.push(a);
                });
            } else if (checkedActivities[buId].isActivityChecked && !checkedActivities[buId].isAllActivitiesChecked) {
              const activeBySites = Object.keys(checkedActivities[buId].sites);
              activeBySites.forEach(siteId => {
                if (checkedActivities[buId]?.sites[siteId].isAllActivitiesChecked) {
                  const act = Object.keys(buList[buId]?.sites[siteId]?.activities ?? {}).map(a => Number(a));
                  act.forEach(a => {
                    if (!collect.activities.includes(a)) collect.activities.push(a);
                  });
                } else if (checkedActivities[buId]?.sites[siteId].isActivityChecked) {
                  //@ts-ignore
                  const act = Object.keys(checkedActivities[buId]?.sites[siteId].activities ?? {}).map(a => Number(a));
                  act.forEach(a => {
                    if (!collect.activities.includes(a)) collect.activities.push(a);
                  });
                }
              });
            }
          });
        });
        const totalAgentCount = Object.keys(collect.agents).reduce(
          (acc: number, k) => acc + collect.agents[k].length,
          0,
        );
        setSelectedAgentCount(totalAgentCount);

        return collect;
      });
  };

  // todo: need refactoring onApply method
  const onApply = () => {
    const selectSitesPage = props.initState.data.selectSitesPage;
    const selectOptionsPage = props.initState.data.selectOptionsPage;
    const sharedTransport = props.initState.data.sharedTransportPage;

    const teamSynchronicity = props.initState.data.teamSynchronicityPage;
    const selectAgentsPage = props.initState.data.selectAgentsPage;
    const selectActivitiesPage = props.initState.data.selectActivitiesPage;

    const params: ISchScenarioParams[] = selectSitesPage.reduce((acc: ISchScenarioParams[], site) => {
      const _params = props.initState.initScenarioParams.find(s => s.siteId === site.siteId);
      const _sharedTransportPapams = sharedTransport.find(sT => sT.siteName === site.siteName);
      const _teamSynchronicityPapams = teamSynchronicity.find(tS => tS.siteName === site.siteName);
      if (!_params) return [...acc];
      if (!site.isChecked) return [...acc, _params];

      const _sharedTransport = _sharedTransportPapams
        ? {
            teamConstraints: TeamConstraints.CARPOOL,
            teamWorkWindow: Math.round(DateUtils.convertTimeToMs(_sharedTransportPapams.maximumDeviation) / 60000),
          }
        : {};
      const _teamSynchronicity = _teamSynchronicityPapams
        ? {
            teamConstraints: _teamSynchronicityPapams.isOnlySameContracts
              ? TeamConstraints.USE_WITHIN_CONTRACT
              : TeamConstraints.USE,
            isSynchDaysOff: _teamSynchronicityPapams.isSynchronizeDaysOff,
            isSynchStartTime: Utils.getBooleanFromBitmask(_teamSynchronicityPapams.synchronizeBy, 0),
            isSynchDuration: Utils.getBooleanFromBitmask(_teamSynchronicityPapams.synchronizeBy, 1),
            isSynchMeals: Utils.getBooleanFromBitmask(_teamSynchronicityPapams.synchronizeBy, 2),
            isSynchBreaks: Utils.getBooleanFromBitmask(_teamSynchronicityPapams.synchronizeBy, 3),
            teamWorkWindow: Math.round(
              DateUtils.convertTimeToMs(_teamSynchronicityPapams.maximumStartTimeDifference) / 60000,
            ),
          }
        : {};

      return [
        ...acc,
        {
          ..._params,
          siteId: site.siteId,
          isMultiSkill: !site.isForceSkill,
          staffingType: site.isUseRequired ? StaffingType.REQUIRED : StaffingType.CALCULATED,
          isIgnoreConstraint: site.isDisableMonthlyConstrains,
          isShuffleAgents: site.isShuffleAgents,
          isExcludeGranted: site.isExcludeGrantedAgents,
          isUseSecondaryActivities: site.isUseSecondaryActivities,
          teamConstraints: TeamConstraints.IGNORE,
          ...(site.isUseSharedTransportConstraints ? _sharedTransport : {}),
          ...(site.isUseTeamConstraints ? _teamSynchronicity : {}),
        },
      ];
    }, []);

    const setParamPayload: ISetScenarioParamsPayload = {
      scheduleId: 0,
      params,
    };
    restApi
      .setScenarioParams(setParamPayload)
      .then(({ status }) => {
        if (status.code !== ApiCodes.SUCCESS) throw status;
        setStartTimestamp(Date.now());
        return collectAgentsTeamsAndActivities();
      })
      .then(({ agents, teams, activities }) => {
        const { teamId, agentId } = SchUtils.getSelectedElements(selectAgentsPage.checkedAgents, filterDate);

        const payload: ICreateReOptimizationRequestPayload = {
          scheduleId: 0,
          params: params
            .filter(
              ({ siteId }) =>
                (selectSitesPage.find(sp => sp.siteId === Number(siteId))?.isChecked ?? false) &&
                (Object.keys(teams)
                  .map(k => Number(k))
                  .includes(siteId) ||
                  Object.keys(agents)
                    .map(k => Number(k))
                    .includes(siteId)),
            )
            .map(p => {
              const _param: ICreateReOptimizationParam = {
                siteId: p.siteId,
                staffingType: p.staffingType,
                teamConstraints: p.teamConstraints,
                teamWorkWindow: p.teamWorkWindow,
                isMultiSkill: p.isMultiSkill,
                isExcludeGranted: p.isExcludeGranted,
                isShuffleAgents: p.isShuffleAgents,
                isIgnoreConstraints: p.isIgnoreConstraint,
                isSynchStartTime: p.isSynchStartTime,
                isSynchDaysOff: p.isSynchDaysOff,
                isSynchDuration: p.isSynchDuration,
                isSynchMeals: p.isSynchMeals,
                isSynchBreaks: p.isSynchBreaks,
                grantAllPreferences: false,
                useSecondaryActivities: p.isUseSecondaryActivities,
              };

              const _agents: number[] = agentId.filter(aId => (agents[p.siteId] ?? []).includes(aId));
              const _teams: number[] = teamId.filter(tId => (teams[p.siteId] ?? []).includes(tId));

              if (_agents.length) _param.agents = _agents;
              if (_teams.length) _param.teams = _teams;

              return _param;
            }),
          reOptimizationType: selectOptionsPage.option,
          timezoneId: selectOptionsPage.selectedTz.timezoneId,
          startDate: selectOptionsPage.rangeDate[0],
          endDate: selectOptionsPage.rangeDate[selectOptionsPage.rangeDate.length - 1],
          dates: selectOptionsPage.rangeDate,
          startMinute: DateUtils.convertTimeToMinutes(selectOptionsPage.startTime),
          isModified: !selectAgentsPage.isDoNotRebuildModified,
          isFixShiftStart: selectOptionsPage.isShiftStartFixed,
          isFixShiftEnd: selectOptionsPage.isShiftEndFixed,
          isFixShiftPaidDuration: selectOptionsPage.isPaidDurationFixed,
          useCurrentAgentDayActivities: selectActivitiesPage.isCheckedRetain,
          saveToCommitted: true,
        };
        // if (payload.timezoneId === 0) {
        //   const _siteData = filterDate[buId[0]].sites[payload.params[0].siteId];
        //   payload.timezoneId = _siteData.timezoneId;
        // }
        if (
          selectOptionsPage.option !== ReOptimizationType.BREAKS &&
          selectOptionsPage.option !== ReOptimizationType.BREAKS_MEALS
        ) {
          payload.activities = activities;
        }
        return restApi.createReOptimizationRequest(payload);
      })
      .then(request => {
        onChangeState({ requestParameters: request.data });
      })
      .catch(err => {
        const _progressState = clone(progressState);
        onChangeState({ isStart: true, isDone: true });
        setProgressState({
          ..._progressState,
          errorCount: ++_progressState.errorCount,
          errorMessage: err.message,
          stageName: err.message,
        });
        progressState.errorCount = 1;
      });
  };

  useEffect(() => {
    if (props.initState.data.rebuildProgressPage.isStart) return;
    onApply();
    onChangeState({ isStart: true });
  }, []);

  const getSites = (): string =>
    `[${props.initState.data.selectSitesPage
      .filter(s => s.isChecked)
      .map(s => s.siteName)
      .join(', ')}]`;

  const getDayCount = (): number => progressState.dayCount;

  const getNumberOfAgent = (): string => `${progressState.agentCount} out of ${selectedAgentCount}`;

  const getScheduleStartDate = (): string => props.initState.data.selectOptionsPage.rangeDate[0];

  const getStartTime = (): string =>
    DateUtils.convertMinutesToTime(DateUtils.convertTimeToMinutes(new Date(startTimestamp).toLocaleTimeString()));

  const getElapsedTime = (): string => DateUtils.convertTimestampToTimeHhMmSec(Date.now() - startTimestamp);

  const getProbableAgentCount = (): string =>
    `From ${progressState.minEstimatedAgentCount} to ${progressState.maxEstimatedAgentCount}`;

  const getStatusIcon = () => {
    if (!progressState.errorMessage && progressState.warningCount === 0) {
      return progressState.stageName ? <DoneIcon /> : '';
    }
    if (progressState.errorCount !== 0) return <ErrorIcon />;
    if (progressState.warningCount !== 0) return <WarningIcon />;
  };

  const getProgressWidth = (): string => {
    if (props.initState.data.rebuildProgressPage.isDone) return `492px`;
    return `${progressState.percentageDone * 4.92}px`;
  };

  const getNotification = (): string => {
    if (!progressState.stageName && progressState.errorMessage) return progressState.errorMessage;

    const warningStr = progressState.warningCount === 1 ? 'a warning' : `${progressState.warningCount} warnings`;
    const errorStr = progressState.errorCount === 1 ? 'an error' : `${progressState.errorCount} errors`;
    const strArr = [];
    if (progressState.warningCount) strArr.push(warningStr);
    if (progressState.errorCount) strArr.push(errorStr);
    const notification = strArr.join(' and \n');

    if (!progressState.stageName && (progressState.warningCount || progressState.errorCount)) {
      return `Finished with ${notification}`;
    }

    return `${progressState.stageName}${
      progressState.warningCount || progressState.errorCount ? ` with ${notification}` : ''
    }`;
  };

  const getErrorMessage = () => {
    if (progressState.errorCount < 1) return '';

    return progressState.errorMessage;
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.infoWrapper}>
        <div className={styles.container}>
          <div className={styles.infoBlock}>
            <span className={styles.label}>Sites:</span>
            <span className={styles.value}>{getSites()}</span>
          </div>
          <div className={styles.infoBlock}>
            <span className={styles.label}>Number of Days:</span>
            <span className={styles.value}>{getDayCount()}</span>
          </div>
          <div className={styles.infoBlock}>
            <span className={styles.label}>Number of Agents:</span>
            <span className={styles.value}>{getNumberOfAgent()}</span>
          </div>
          <div className={styles.infoBlock}>
            <span className={styles.label}>Schedule Start Date:</span>
            <span className={styles.value}>{getScheduleStartDate()}</span>
          </div>
        </div>
      </div>
      <div className={styles.infoWrapper_separate}>
        <div className={styles.container}>
          <div className={styles.blockTitle}>Build Progress</div>
          <div className={styles.infoBlock}>
            <span className={styles.label}>Start Time:</span>
            <span className={styles.value}>{getStartTime()}</span>
          </div>
          <div className={styles.infoBlock}>
            <span className={styles.label}>Elapsed Time:</span>
            <span className={styles.value}>{getElapsedTime()}</span>
          </div>
          <div className={styles.infoBlock}>
            <span className={styles.label}>Current Status:</span>
            <span className={styles.value}>{progressState.stageName}</span>
          </div>
          <div className={styles.infoBlock}>
            <span className={styles.label}>Iteration:</span>
            <span className={styles.value}>{progressState.buildIteration}</span>
          </div>
          <div className={styles.infoBlock}>
            <span className={styles.label}>Min/Max Agent Count Range:</span>
            <span className={styles.value}>
              From {progressState.minAgentCount} to {progressState.maxAgentCount}
            </span>
          </div>
          <div className={styles.infoBlock}>
            <span className={styles.label}>Probable Agent Count range:</span>
            <span className={styles.value}>{getProbableAgentCount()}</span>
          </div>
          <div className={styles.progressBlock}>
            <div className={styles.progressValue} style={{ width: getProgressWidth() }}></div>
          </div>
          <div className={styles.infoBlock_inline}>
            <div className={styles.statusIcon}>{getStatusIcon()}</div>
            <span className={styles.notification}>{getNotification()}</span>
          </div>
          <div className={styles.infoBlock_error}>
            <span className={styles.notification}>{getErrorMessage()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RebuildProgressPage;
