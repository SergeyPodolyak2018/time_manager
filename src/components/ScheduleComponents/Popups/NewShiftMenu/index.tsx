import './TimePicker.css';

import { clone } from 'ramda';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactHtmlParser from 'react-html-parser';
import { connect, useSelector } from 'react-redux';
import useStateRef from 'react-usestateref';

import Api from '../../../../api/rest';
import { ActivitySetType } from '../../../../common/constants/schedule';
import { IContract } from '../../../../common/interfaces/schedule/IAgentSchedule';
import DateUtils from '../../../../helper/dateUtils';
import logger from '../../../../helper/logger';
import SchActivitySet from '../../../../helper/schedule/SchActivitySet';
import SchAgent from '../../../../helper/schedule/SchAgent';
import SchDay from '../../../../helper/schedule/SchDay';
import SchUtils from '../../../../helper/schedule/SchUtils';
import Utils from '../../../../helper/utils';
import { usePopUpHotkeys } from '../../../../hooks';
import {
  buildAgentDayInSnapshot,
  closeNewShiftbMenu,
  openErrorPopUp,
  openWarningPopUp,
} from '../../../../redux/actions/timeLineAction';
import { useAppDispatch } from '../../../../redux/hooks';
import { getActiveDateSelector } from '../../../../redux/selectors/controlPanelSelector';
import {
  getAgentById,
  getClickedDay,
  getDataSelector,
  getSubMenuDataSelector,
  getTimeFormat,
} from '../../../../redux/selectors/timeLineSelector';
import { IActivities, IActivitiesSetGroup, IErrorPopUpParam, IShifts } from '../../../../redux/ts/intrefaces/timeLine';
import { IAgentTimeline } from '../../../../redux/ts/intrefaces/timeLine/IAgentTimeline';
import Button from '../../../ReusableComponents/button';
import CheckboxBig from '../../../ReusableComponents/Checkbox';
import Checkbox from '../../../ReusableComponents/CheckboxStyled';
import InputTime, { ITimeLimit } from '../../../ReusableComponents/InputTime';
import Spiner from '../../../ReusableComponents/spiner';
import AgentInfo from '../common/AgentInfo';
import { ReactComponent as Bearing } from './bearing.svg';
import InputSearch from './InputSearch';
import styles from './menu.module.scss';
import { Cross } from '../../../../static/svg';
import AgentTime from '../common/AgentTime';
import { store } from '../../../../redux/store';

export interface IScheduleMenuProps {
  close: (...args: any[]) => void;
  buildAgentDayInSnapshot: (data: IAgentTimeline[], autoInsertMealBreaks?: boolean, ignoreWarnings?: boolean) => any;
  selectedAgent?: IAgentTimeline | null;
  activeDate: string;
}

export interface IMainState {
  loading: boolean;
  viewState: number;
  startTime: string;
  endTime: string;
  showAll: boolean;
  nextEndDay: boolean;
  previousStartDay: boolean;
  autoInsertMealBreaks: boolean;
  showActivitiesSecSkills: boolean;
  shifts: IShifts[];
  filteredShifts: IShifts[];
  selectedShift: number;
  activities: IActivities[];
  checkedActivities: number[];
  activitiesSet: IActivitiesSetGroup[];
  checkedActivitiesSets: number[];
  openActivities: boolean;
  isSearchActive: boolean;
  searchData: IActivitiesSetGroup[];
  snapshotId: string;
}

const NewShiftMenu = (props: IScheduleMenuProps) => {
  const activeDate = useSelector(getActiveDateSelector);
  const clickedDay = useSelector(getClickedDay);
  const subMenuData = useSelector(getSubMenuDataSelector);

  const [mainState, setMainState, mainStateRef] = useStateRef<IMainState>({
    loading: true,
    viewState: 1,
    startTime: SchUtils.getStartTimeForTimepicker(subMenuData),
    endTime: SchUtils.getEndTimeForTimepicker(subMenuData),
    showAll: false,
    nextEndDay: SchUtils.getStartTimeForTimepicker(subMenuData) > SchUtils.getEndTimeForTimepicker(subMenuData),
    previousStartDay: false,
    autoInsertMealBreaks: true,
    showActivitiesSecSkills: false,
    shifts: [],
    filteredShifts: [],
    selectedShift: -1,
    activities: [],
    activitiesSet: [],
    checkedActivities: [],
    checkedActivitiesSets: [],
    searchData: [],
    openActivities: false,
    isSearchActive: false,
    snapshotId: '',
  });

  const timeFormat = useSelector(getTimeFormat);
  const getShiftTime = useCallback(
    (el: IShifts) => {
      if (timeFormat === '12hours') {
        return el.shiftTitle;
      }
      const [start, end] = el.shiftTitle.split('-');
      const startIn24 = DateUtils.convertTimeTo24h(start);
      const endIn24 = DateUtils.convertTimeTo24h(end);
      return `${startIn24} - ${endIn24}`;
    },
    [timeFormat],
  );
  const [searchValue, setSearchValue] = useState('');
  const dispatch = useAppDispatch();
  const timeLineData = useSelector(getDataSelector);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [isValid, setIsValid] = useState<boolean>(true);
  const [limits, setLimits] = useStateRef<ITimeLimit>({});
  const [datesShifts, setDatesShifts] = useState<any>({});
  const [isDisabledButtons, setIsDisabledButtons] = useState<boolean>(true);

  useEffect(() => {
    setLimits({
      isNextEndDay: mainState.nextEndDay,
      isPreviousStartDay: mainState.previousStartDay,
    });
  }, [isValid]);

  useEffect(() => {
    if (mainState.viewState === 1 && mainState.shifts.length === 0) {
      if (!props.selectedAgent) return;

      const siteId = props.selectedAgent.siteId;
      const showDates = getDatesFromTime(props.activeDate, '00:00', '24:00', true);
      const dates = getDatesFromTime(props.activeDate);
      // const promises = [];
      const promises = dates.map(date => {
        const payload = {
          siteId,
          date,
        };
        return Api.getAgentShifts(payload);
      });
      Promise.all(promises)
        .then(resp => {
          const _datesShifts = datesShifts;
          const data: IShifts[] = [];
          const showAllData: IShifts[] = [];
          resp.forEach((r, i) => {
            if (r.status.code === 0) {
              if (i === resp.length - 1) {
                showAllData.push(...r.data);
              }
              const newIds = r.data.map(d => d.id);
              const existingIds = data.map(d => d.id);
              if (Array.isArray(_datesShifts[dates[i]])) {
                _datesShifts[dates[i]] = [...datesShifts[dates[i]], ...newIds];
              } else {
                _datesShifts[dates[i]] = [...newIds];
              }
              const _data = r.data.filter(d => !existingIds.includes(d.id));
              setDatesShifts(_datesShifts);
              if (showDates.includes(dates[i])) {
                data.push(..._data);
              }
            }
          });
          const currentAgent = store
            .getState()
            .TimeLine.history.past[0]?.data.find(x => x.agentId === props.selectedAgent?.agentId);
          multipleChange({
            loading: false,
            shifts: showAllData,
            filteredShifts: getFilteredShifts(
              data,
              currentAgent ? currentAgent?.contracts : props.selectedAgent?.contracts ?? [],
            ),
          });
        })
        .catch(err => {
          logger.error(err);
        }).finally(() => {
        setIsDisabledButtons(false);
      });
    }
    if (mainState.viewState === 2) {
      handleChange('loading', true);

      const selectedAgent = props.selectedAgent;
      if (!selectedAgent) return;

      const payload = {
        buId: selectedAgent.buId,
        siteId: selectedAgent.siteId,
        teamId: selectedAgent.teamId,
        contractId: selectedAgent.contracts.map(c => c.id),
        agentId: selectedAgent.agentId,
        enableSecondarySkills: mainState.showActivitiesSecSkills,
        date: clickedDay ? clickedDay.split('T')[0] : activeDate,
        snapshotId: mainState.snapshotId,
      };

      setMainState({
        ...mainStateRef.current,
        loading: true,
      });
      Api.getActivities(payload)
        .then(respActivity => {
          if (respActivity.status.code === 0) {
            const activityIds = respActivity.data.map((a: { id: number } & object) => a.id);

            Api.getActivitySet({
              siteId: selectedAgent.siteId,
              buId: selectedAgent.buId,
              activityId: activityIds,
            }).then(respActivitySet => {
              const activitiesSetStruct = SchActivitySet.groupActivities(
                respActivity.data,
                respActivitySet.data,
                ActivitySetType.ALL,
              );
              multipleChange({ loading: false, ...activitiesSetStruct });
            });
          }
        })
        .catch(err => {
          logger.error(err);
        }).finally(() => {
          setIsDisabledButtons(false);
      });
    }
  }, [mainState.viewState]);

  const getDatesFromTime = (
    activeDate: string,
    startTime: string | null = null,
    endTime: string | null = null,
    isWithoutNextDays = false,
  ): string[] => {
    if (!props.selectedAgent) return [activeDate];
    const tzSelectOffset =
      props.selectedAgent._TZ_INTERNAL_USAGE.tzSelected.timezoneId === 0
        ? props.selectedAgent._TZ_INTERNAL_USAGE.tzSite.currentOffset
        : props.selectedAgent._TZ_INTERNAL_USAGE.tzSelected.currentOffset;
    const tzSiteOffset = props.selectedAgent._TZ_INTERNAL_USAGE.tzSite.currentOffset;
    const tzLocalOffset = new Date().getTimezoneOffset();
    const tzOffset = (tzSelectOffset - tzSiteOffset + tzLocalOffset) * 60000;
    const _start = new Date(`${activeDate}T${startTime ?? '00:00'}`);
    if (mainStateRef.current.previousStartDay && !isWithoutNextDays) _start.setDate(_start.getDate() - 1);
    const startDate = new Date(_start.getTime() - tzOffset).toISOString().split('T')[0];
    const _end = new Date(`${activeDate}T${endTime ?? '24:00'}`);
    _end.setMinutes(_end.getMinutes() - 1);
    if (mainStateRef.current.nextEndDay && !isWithoutNextDays) _end.setDate(_end.getDate() + 1);
    const endDate = new Date(_end.getTime() - tzOffset).toISOString().split('T')[0];

    let idx = 0;
    let _date;
    const dates = [];
    do {
      _date = new Date(startDate);
      _date.setDate(_date.getDate() + idx);
      _date = _date.toISOString().split('T')[0];
      dates.push(_date);
      idx++;
    } while (_date !== endDate);

    return dates;
  };

  const onChangeSearchInput = (value: string) => {
    searchTimeoutRef.current && clearTimeout(searchTimeoutRef.current);
    if (mainState.isSearchActive) {
      setMainState({ ...mainState, isSearchActive: false, searchData: [] });
    }

    const matchActivityByName = (activities: any, name: string) => {
      return activities.filter((activity: IActivitiesSetGroup | IActivities) => {
        if ('activities' in activity && activity.activities) {
          const nestedActivity = matchActivityByName(activity.activities, name);
          if (nestedActivity.length > 0) {
            activity.activities = nestedActivity;
            activity.open = true;
            return true;
          }
        }

        return !!Utils.findMatch(activity.name, name);
      });
    };
    setSearchValue(value);

    if (!value) return;
    searchTimeoutRef.current = setTimeout(() => {
      setMainState({
        ...mainState,
        isSearchActive: true,
        searchData: matchActivityByName(clone(mainState.activitiesSet), value),
      });
    }, 700);
  };

  const handleChange = (name: string, value: any) => {
    const _limits: ITimeLimit = clone(limits);
    if (!value && name === 'showAll') {
      handleChange('selectedShift', -1);
    }
    switch (name) {
      case 'nextEndDay':
        _limits.isPreviousStartDay = false;
        _limits.isNextEndDay = value;
        setLimits(_limits);
        break;
      case 'previousStartDay':
        _limits.isPreviousStartDay = value;
        _limits.isNextEndDay = false;
        setLimits(_limits);
        break;
    }
    setMainState(prevState => ({
      ...prevState,
      previousStartDay: _limits.isPreviousStartDay ?? false,
      nextEndDay: _limits.isNextEndDay ?? false,
      [name]: value,
    }));
  };

  const multipleChange = (data: any) => {
    setMainState(prevState => ({
      ...prevState,
      ...data,
    }));
  };

  const changeChackedActivitiesSet = (id: number) => {
    const index = mainState.checkedActivitiesSets.findIndex(el => el === id);
    const newCheckedAct = [];
    if (index === -1) {
      newCheckedAct.push(
        ...SchUtils.isActivityFromOneFamily(
          mainStateRef.current.activitiesSet,
          mainStateRef.current.checkedActivitiesSets,
          id,
        ),
      );
    } else {
      newCheckedAct.push(...mainState.checkedActivitiesSets);
      newCheckedAct.splice(index, 1);
    }
    multipleChange({ checkedActivitiesSets: newCheckedAct });
  };

  const changeStartTime = (value: string) => handleChange('startTime', value);

  const changeEndTime = (value: string) => handleChange('endTime', value);

  const selectShift = (index: number) => {
    if (mainStateRef.current.selectedShift === index) {
      handleChange('selectedShift', -1);
    } else {
      handleChange('selectedShift', index);

      const shifts = mainStateRef.current.showAll ? mainStateRef.current.shifts : mainStateRef.current.filteredShifts;
      const selectedShift = shifts[index];

      let { start, end } = SchUtils.getShiftTimeFromTimestamp(selectedShift);
      let isNextDay = false;
      if (props.selectedAgent && clickedDay) {
        const { tzSite, tzSelected } = props.selectedAgent._TZ_INTERNAL_USAGE;
        isNextDay = SchUtils.getIsNextDay(
          selectedShift.earliestStartTime || 0,
          (selectedShift.earliestStartTime || 0) + (selectedShift.minDuration || 0),
          tzSite,
          tzSelected,
        );

        start = SchUtils.convertTimeToSelectedTz(start, clickedDay, '24hours', tzSite, tzSelected);
        end = SchUtils.convertTimeToSelectedTz(end, clickedDay, '24hours', tzSite, tzSelected);
      }
      changeStartTime(start);
      changeEndTime(end);
      handleChange('nextEndDay', isNextDay);
    }
  };
  const changeState = (index: number) => {
    if (mainState.selectedShift > -1) {
      handleChange('viewState', index);
    }
  };

  const setCheckedAllActivities = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();

    const selectedActivitySet = mainState.activitiesSet.find(activity => activity.id === id);
    if (!selectedActivitySet) return;

    let newCheckedActivitySet: Set<number> | number[];
    const ids = selectedActivitySet.activities.map(item => item.id);
    if (isAllSetsChecked(id)) {
      newCheckedActivitySet = mainState.checkedActivitiesSets.filter(id => !ids.includes(id));
    } else {
      newCheckedActivitySet = new Set([...ids]);
    }

    setMainState({
      ...mainState,
      checkedActivitiesSets: [...newCheckedActivitySet],
    });
  };

  const togleActivitiesSet = (index: number, val: boolean) => {
    const data = mainState.isSearchActive ? mainState.searchData : mainState.activitiesSet;
    setMainState(prevState => {
      const newSet = [...data];
      newSet[index].open = val;
      return {
        ...prevState,
        [mainState.isSearchActive ? 'searchData' : 'activitiesSet']: newSet,
      };
    });
  };

  const getsetElements = (index: number) => {
    const data = mainState.isSearchActive ? mainState.searchData : mainState.activitiesSet;

    return data[index].activities.map((jelement, jndex) => {
      return (
        <div
          className={styles.listBody}
          key={jndex}
          data-test={`activity-item-name-${jelement.name.toLowerCase().replaceAll(' ', '-')}`}
        >
          <div
            className={`${styles.listBodyItem} ${styles.listBodySubItem}`}
            onClick={() => changeChackedActivitiesSet(jelement.id)}
          >
            <Bearing />
            <span title={jelement.name}>
              {ReactHtmlParser(Utils.markPartOfString(jelement.name, searchValue))}
              {DateUtils.getActivityTime(jelement)}
            </span>
            <CheckboxBig checked={mainState.checkedActivitiesSets.indexOf(jelement.id) > -1} />
          </div>
        </div>
      );
    });
  };

  const isAllSetsChecked = (id: number) => {
    const targetEl = mainState.activitiesSet.filter(el => el.id === id);
    const idisOfSets = targetEl[0].activities.map(el => el.id);
    let counter = 0;
    for (let i = 0; i < idisOfSets.length; i++) {
      if (mainState.checkedActivitiesSets.indexOf(idisOfSets[i]) > -1) {
        counter++;
      }
    }
    return idisOfSets.length === counter;
  };

  const onValidate = (msg: string | null): void => {
    setIsValid(!msg);
  };

  const isValidateFindShift = () => {
    const dates = getDatesFromTime(props.activeDate, mainStateRef.current.startTime, mainStateRef.current.endTime);
    const shifts = mainStateRef.current.showAll ? mainStateRef.current.shifts : mainStateRef.current.filteredShifts;
    return dates.every(
      d =>
        Array.isArray(datesShifts[d]) &&
        mainStateRef.current.selectedShift !== -1 &&
        datesShifts[d].includes(shifts[mainStateRef.current.selectedShift].id),
    );
  };

  const saveChanges = () => {
    if (!props.selectedAgent || mainState.checkedActivitiesSets.length === 0) return;
    const preparedData: IAgentTimeline[] = SchAgent.prepareDataForNewShift(
      props.selectedAgent,
      mainStateRef.current,
      props.activeDate,
      // mainStateRef.current.autoInsertMealBreaks,
    );

    const applyInsert = () => {
      try {
        SchDay.validateDay(preparedData[0].days[0], props.selectedAgent ?? undefined);
        const _newAgent = timeLineData.find(d => d?.agentId === props.selectedAgent?.agentId);
        if (_newAgent) {
          props.buildAgentDayInSnapshot(preparedData, mainStateRef.current.autoInsertMealBreaks);
          onClose();
        }
      } catch (err: any) {
        const exceptionParams: IErrorPopUpParam = {
          isOpen: true,
          data: '',
        };
        exceptionParams.data = err.message;
        dispatch(openErrorPopUp(exceptionParams));
      }
    };

    if (!isValidateFindShift()) {
      const exceptionParams = {
        isOpen: true,
        data: 'The shift is set to be unavailable on those days of the week. Would you like to paste anyway?',
        agents: [props.selectedAgent],
        onApplyAction: applyInsert,
      };
      dispatch(openWarningPopUp(exceptionParams));
    } else {
      applyInsert();
    }
  };

  const onClose = () => {
    props.close();
  };

  const getFilteredShifts = (shifts: IShifts[], contracts: IContract[]): IShifts[] =>
    shifts.filter(
      shift =>
        !contracts.length || contracts.find(item => item.id === shift.shiftContracts.find(el => el.id === item.id)?.id),
    );

  const getView1 = () => {
    return (
      <div>
        <div className={styles.type}>{props.selectedAgent && <AgentInfo agentInfo={props.selectedAgent} />}</div>
        <div className={styles.subHeader}>
          <span>Select shift</span>
        </div>
        <div className={styles.tableWrapper}>
          {mainState.loading ? (
            <Spiner />
          ) : (
            <>
              <div className={styles.tableSubWrapper}>
                <table>
                  <thead>
                    <tr>
                      <td>Shift</td>
                      <td>Hours</td>
                    </tr>
                  </thead>
                  <tbody>
                    {((mainState.showAll ? mainState.shifts : mainState.filteredShifts) ?? []).map((el, index) => {
                      return (
                        <tr
                          key={index}
                          onClick={() => {
                            selectShift(index);
                          }}
                          className={`${mainStateRef.current.selectedShift === index ? styles.selected : ''}`}
                        >
                          <td>
                            <span title={el.name} className={styles.firstTd}>
                              {el.name}
                            </span>
                          </td>
                          <td>
                            <span title={getShiftTime(el)} className={styles.secTd}>
                              {getShiftTime(el)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div data-test={'shift-show-all'} className={styles.checkBoxWrap4}>
                <Checkbox
                  checked={mainState.showAll}
                  onClick={() => handleChange('showAll', !mainState.showAll)}
                  style={{ width: '10px', height: '10px', border: '#BCC4C8 solid 1px' }}
                />
                <span>Show all</span>
              </div>
            </>
          )}
        </div>
        <div className={styles.data}>
          <div className={styles.dataStart}>
            {props.selectedAgent && clickedDay && (
              <AgentTime
                timeStart={mainState.startTime}
                timeEnd={mainState.endTime}
                agent={props.selectedAgent}
                date={clickedDay}
              />
            )}
            <div className={timeFormat === '12hours' ? styles.dataStartTMWrapperBigger : styles.dataStartTMWrapper}>
              <InputTime
                limits={limits}
                onValidate={onValidate}
                onChangeStartTime={changeStartTime}
                onChangeEndTime={changeEndTime}
                startTime={mainStateRef.current.startTime}
                endTime={mainStateRef.current.endTime}
                format={timeFormat}
              />
            </div>
          </div>
          <div className={styles.checkBoxWrap3} data-test={'next-day-end-checkbox'}>
            <Checkbox
              checked={mainState.nextEndDay}
              onClick={() => handleChange('nextEndDay', !mainState.nextEndDay)}
              style={{ height: '10px', width: '10px' }}
            />
            <span onClick={() => handleChange('nextEndDay', !mainState.nextEndDay)}>End next day</span>
          </div>
          <div className={styles.checkBoxWrap3} data-test={'previous-day-start-checkbox'}>
            <Checkbox
              checked={mainState.previousStartDay}
              onClick={() => handleChange('previousStartDay', !mainState.previousStartDay)}
              style={{ height: '10px', width: '10px' }}
            />
            <span onClick={() => handleChange('previousStartDay', !mainState.previousStartDay)}>
              Start on previous day
            </span>
          </div>

          <div className={styles.checkBoxWrap3} data-test={'automatically-insert-items'}>
            <Checkbox
              checked={mainState.autoInsertMealBreaks}
              onClick={() => handleChange('autoInsertMealBreaks', !mainState.autoInsertMealBreaks)}
              style={{ width: '10px', height: '10px' }}
            />
            <span onClick={() => handleChange('autoInsertMealBreaks', !mainState.autoInsertMealBreaks)}>
              Automatically Insert Meal and Breaks
            </span>
          </div>
          <div className={styles.checkBoxWrap3} data-test={'match-activities-skills'}>
            <Checkbox
              checked={mainState.showActivitiesSecSkills}
              onClick={() => handleChange('showActivitiesSecSkills', !mainState.showActivitiesSecSkills)}
              style={{ width: '10px', height: '10px' }}
            />
            <span onClick={() => handleChange('showActivitiesSecSkills', !mainState.showActivitiesSecSkills)}>
              Show activities that match the secondary skills
            </span>
          </div>
        </div>
      </div>
    );
  };
  const getView2 = () => {
    const data = mainState.isSearchActive ? mainState.searchData : mainState.activitiesSet;

    return (
      <>
        <div className={styles.subHeader}>
          <span>Select Activity Set</span>
        </div>

        <div className={styles.inputSearch}>
          <InputSearch placeholder={'Search activities'} onChange={onChangeSearchInput} value={searchValue} />
        </div>

        <div className={`${styles.tableWrapper} ${styles.tableWrapperHeight}`}>
          {mainState.loading ? (
            <Spiner />
          ) : (
            <div className={styles.listWrapper}>
              <div className={styles.listHeader}>
                <span>Choose item to insert</span>
              </div>
              {data.map((elment, index) => {
                const group = mainState.activitiesSet.find(group => {
                  return group.id === elment.id;
                });
                const checkedActivitiesInThisGroup = group?.activities?.filter(ac => {
                  return mainState.checkedActivitiesSets.includes(ac.id);
                });

                const isIndeterminate =
                  checkedActivitiesInThisGroup &&
                  group?.activities &&
                  checkedActivitiesInThisGroup?.length > 0 &&
                  checkedActivitiesInThisGroup?.length !== group?.activities?.length;
                return (
                  <div key={index}>
                    {elment.activities.length !== 0 && (
                      <div className={styles.listBody}>
                        <div
                          className={`${styles.listBodyItem}`}
                          onClick={() => togleActivitiesSet(index, !elment.open)}
                        >
                          <Bearing />
                          <span title={elment.name}>
                            {ReactHtmlParser(Utils.markPartOfString(elment.name, searchValue))} (
                            {elment.activities.length})
                          </span>
                          <CheckboxBig
                            indeterminate={isIndeterminate}
                            checked={isAllSetsChecked(elment.id)}
                            onClick={e => setCheckedAllActivities(e, elment.id)}
                          />
                        </div>
                      </div>
                    )}
                    {elment.open ? getsetElements(index) : ''}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </>
    );
  };

  const isSaveDisabled =
    mainStateRef.current.checkedActivitiesSets.length === 0 || mainStateRef.current.viewState !== 2;
  usePopUpHotkeys({ onSubmit: [saveChanges, { enabled: !isSaveDisabled }], onCancel: [onClose] });

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <div className={styles.header}>
          <span>Insert shift</span>
          <Cross onClick={onClose} />
        </div>
        <div className={styles.body}>{mainState.viewState === 1 ? getView1() : getView2()}</div>

        <div className={styles.footer}>
          <div className={styles.buttonWrap1} data-test={'modal-cancel-button'}>
            <Button
              innerText={'Cancel'}
              click={() => {
                onClose();
              }}
              style={{ background: '#FFFFFF', color: '#0183F5', border: '0.5px solid #0183F5', borderRadius: '5px' }}
            />
          </div>

          {mainState.viewState === 1 ? (
            <div className={styles.buttonWrap3} data-test={'modal-next-button'}>
              <Button
                innerText={'Next >'}
                click={() => {
                  setIsDisabledButtons(true);
                  changeState(2);
                }}
                disable={mainStateRef.current.selectedShift === -1 || !isValid || isDisabledButtons}
                type={'primary'}
              />
            </div>
          ) : (
            <div className={styles.buttonWrap5} data-test={'modal-previous-button'}>
              <Button
                innerText={'< Previous'}
                click={() => {
                  changeState(1);
                }}
                disable={mainStateRef.current.selectedShift === -1 || isDisabledButtons}
                type={'primary'}
              />
            </div>
          )}

          <div className={styles.buttonWrap2} data-test={'modal-save-changes-button'}>
            <Button
              innerText={'Save changes'}
              click={saveChanges}
              disable={isSaveDisabled || isDisabledButtons}
              style={{ background: '#0183F5', color: '#FFFFFF', borderRadius: '5px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = (state: any) => {
  return {
    selectedAgent: getAgentById(state),
    activeDate: getActiveDateSelector(state),
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    close: () => dispatch(closeNewShiftbMenu()),
    buildAgentDayInSnapshot: (data: IAgentTimeline[], scheduleShiftItems?: boolean) =>
      dispatch(buildAgentDayInSnapshot({ agentDays: data }, scheduleShiftItems)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(NewShiftMenu);
