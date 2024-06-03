import '../../NewShiftMenu/TimePicker.css';

import { clone } from 'ramda';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactHtmlParser from 'react-html-parser';
import { useSelector } from 'react-redux';
import useStateRef from 'react-usestateref';

import Api from '../../../../../api/rest';
import { FindShifts } from '../../../../../api/ts/interfaces/config.payload';
import { ActivitySetType } from '../../../../../common/constants/schedule';
import { IBusinessUnits } from '../../../../../common/interfaces/config';
import { ITimezone } from '../../../../../common/interfaces/config/ITimezone';
import dateUtils from '../../../../../helper/dateUtils';
import logger from '../../../../../helper/logger';
import SchActivitySet from '../../../../../helper/schedule/SchActivitySet';
import SchMultipleItems from '../../../../../helper/schedule/SchMultipleItems';
import SchUtils from '../../../../../helper/schedule/SchUtils';
import Utils from '../../../../../helper/utils';
import { openErrorPopUp } from '../../../../../redux/actions/timeLineAction';
import { useAppDispatch } from '../../../../../redux/hooks';
import {
    getActiveDateSelector, getTimezonesSelector
} from '../../../../../redux/selectors/controlPanelSelector';
import { getFilterData } from '../../../../../redux/selectors/filterSelector';
import { getTimeFormat } from '../../../../../redux/selectors/timeLineSelector';
import {
    IActivities, IActivitiesSetGroup, IShifts
} from '../../../../../redux/ts/intrefaces/timeLine';
import { Cross } from '../../../../../static/svg';
import Button from '../../../../ReusableComponents/button';
import CheckboxBig from '../../../../ReusableComponents/Checkbox';
import Checkbox from '../../../../ReusableComponents/CheckboxStyled';
import InputTime, { ITimeLimit } from '../../../../ReusableComponents/InputTime';
import Spiner from '../../../../ReusableComponents/spiner';
import { ReactComponent as Bearing } from '../../NewShiftMenu/bearing.svg';
import InputSearch from '../../NewShiftMenu/InputSearch';
import styles from '../../NewShiftMenu/menu.module.scss';
import styles2 from '../menu.module.scss';

export interface IScheduleMenuProps {
  close: (...args: any[]) => void;
  return: (...args: any[]) => void;
  apply: (...args: any[]) => void;
  checkedItems: IBusinessUnits;
  activeDate: string[];
  insertOnlyErrorsOrWarning: boolean;
  showWarnings: boolean;
  snapshotId?: string;
  selectedTz: ITimezone;
  loading: boolean;
  visible: boolean;
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
}

const NewMultipleShiftMenu = (props: IScheduleMenuProps) => {
  const dispatch = useAppDispatch();

  const [mainState, setMainState, mainStateRef] = useStateRef<IMainState>({
    loading: true,
    viewState: 1,
    startTime: '11:00',
    endTime: '23:00',
    showAll: true,
    nextEndDay: false,
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
  });

  const fetchedData: IBusinessUnits = useSelector(getFilterData);
  const timeFormat = useSelector(getTimeFormat);
  const activeDate = useSelector(getActiveDateSelector);
  const allTz = useSelector(getTimezonesSelector);
  const [searchValue, setSearchValue] = useState('');
  const [isValid, setIsValid] = useState<boolean>(true);
  const [limits, setLimits] = useStateRef<ITimeLimit>({});
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const getShiftTime = useCallback(
    (el: IShifts) => {
      if (timeFormat === '12hours') {
        return el.shiftTitle;
      }
      const [start, end] = el.shiftTitle.split('-');
      const startIn24 = dateUtils.convertTimeTo24h(start);
      const endIn24 = dateUtils.convertTimeTo24h(end);
      return `${startIn24} - ${endIn24}`;
    },
    [timeFormat],
  );

  useEffect(() => {
    setLimits({ ...limits, isNextEndDay: mainState.nextEndDay, isPreviousStartDay: mainState.previousStartDay });
  }, [isValid, props.visible]);

  const findSHifts = async () => {
    const payload: FindShifts = {
      siteId: SchUtils.getSiteId(props.checkedItems),
      date: props.activeDate[0],
    };

    const filteredPayload: FindShifts = {
      siteId: SchUtils.getSiteId(props.checkedItems),
      date: props.activeDate[0],
      // required to retrieve correct shifts from snapshot
      // idk why
      snapshotId: props.snapshotId,
    };

    try {
      const [resp, filteredResp] = await Promise.all([
        Api.getAgentShifts(payload),
        Api.getAgentShifts(filteredPayload),
      ]);
      if (resp.status.code === 0 && filteredResp.status.code === 0) {
        multipleChange({
          loading: false,
          shifts: resp.data,
          filteredShifts: filteredResp.data,
        });
      }
    } catch (err) {
      logger.error(err);
    }
  };

  useEffect(() => {
    if(props.visible){
      if (mainState.viewState === 1 && mainState.shifts.length === 0) {
        handleChange('loading', true);
        findSHifts().finally(() => {
          handleChange('loading', false);
        });
      }
      if (mainState.viewState === 2) {
        handleChange('loading', true);
        const selectedAgent = SchUtils.getSelectedElements(props.checkedItems, fetchedData);

        const payload = {
          buId: selectedAgent.buId,
          siteId: selectedAgent.siteId,
          teamId: selectedAgent.teamId,
          agentId: selectedAgent.agentId,
          enableSecondarySkills: mainState.showActivitiesSecSkills,
          date: props.activeDate[0],
        };

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
          })
          .finally(() => {
            handleChange('loading', true);
          });
      }
    }
    
  }, [mainState.viewState, props.visible]);

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
    setMainState(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };
  const multipleChange = (data: any) => {
    setMainState(prevState => ({
      ...prevState,
      ...data,
    }));
  };

  const onValidate = (msg: string | null): void => {
    setIsValid(!msg);
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

  const tzSite = useMemo(() => {
    const tzId = SchUtils.getSiteTz(props.checkedItems, fetchedData);
    return allTz.find(tz => tz.timezoneId === tzId);
  }, [props.checkedItems, fetchedData, allTz]);

  const selectShift = (index: number) => {
    if (mainStateRef.current.selectedShift === index) {
      handleChange('selectedShift', -1);
    } else {
      handleChange('selectedShift', index);

      const shifts = mainStateRef.current.showAll ? mainStateRef.current.shifts : mainStateRef.current.filteredShifts;
      const selectedShift = shifts[index];

      let { start, end } = SchUtils.getShiftTimeFromTimestamp(selectedShift);
      let isNextDay = false;

      if (tzSite && props.activeDate) {
        isNextDay = SchUtils.getIsNextDay(
          selectedShift.earliestStartTime || 0,
          (selectedShift.earliestStartTime || 0) + (selectedShift.minDuration || 0),
          tzSite,
          props.selectedTz,
        );

        start = SchUtils.convertTimeToSelectedTz(start, props.activeDate[0], '24hours', tzSite, props.selectedTz);
        end = SchUtils.convertTimeToSelectedTz(end, props.activeDate[0], '24hours', tzSite, props.selectedTz);
      }
      changeStartTime(start);
      changeEndTime(end);
      handleChange('nextEndDay', isNextDay);
    }
  };
  const changeState = (index: number) => {
    if (mainStateRef.current.selectedShift > -1) {
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
              {dateUtils.getActivityTime(jelement)}
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

  const saveChanges = () => {
    const filterAgents = SchUtils.getSelectedElementsSyncForMultipleFilter(props.checkedItems, fetchedData);
    const targetType = SchUtils.getTargetElements(filterAgents);
    const days = [];
    const siteId = SchUtils.getSiteId(props.checkedItems);
    const datesRange: string[] =
      props.activeDate.length === 2 && props.activeDate[0] === props.activeDate[1]
        ? [props.activeDate[0]]
        : props.activeDate;
    const siteTzId = SchUtils.getSiteTz(props.checkedItems, fetchedData);
    const repeatRequestForData = datesRange.indexOf(activeDate) > -1;
    const defaultTz = {
      currentOffset: 0,
      gswTimezoneId: -1,
      description: '',
      name: '',
      timezoneId: -1,
      value: 0,
    };

    const siteTz: ITimezone = allTz.find(el => el.timezoneId === siteTzId) || defaultTz;

    try {
      for (let i = 0; i < targetType.elements.length; i++) {
        const oneDay = SchMultipleItems.prepareDataForNewMultipleShift(
          mainStateRef.current,
          datesRange,
          siteTz,
          props.selectedTz,
          targetType.type,
          siteId,
        );
        days.push(oneDay);
      }

      const agentDays = SchMultipleItems.prepareTeamPlate(
        filterAgents,
        mainStateRef.current.autoInsertMealBreaks,
        !props.showWarnings,
        props.insertOnlyErrorsOrWarning,
        true,
        days,
        props.snapshotId,
      );

      props.apply('day', agentDays, repeatRequestForData);
    } catch (e: any) {
      dispatch(
        openErrorPopUp({
          isOpen: true,
          data: e.message,
        }),
      );
    }
  };

  const onClose = () => {
    props.close();
  };

  const getView1 = () => {
    const handleClickNextView1 = () => {
      handleChange('showAll', !mainState.showAll);
    };

    const shiftsToDisplay = mainState.showAll ? mainState.shifts : mainState.filteredShifts;
    return (
      <div>
        <div className={styles.subHeader}>
          <span>Select shift</span>
        </div>
        <div className={styles.tableWrapper} style={{ width: '680px', height: '380px' }}>
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
                    {shiftsToDisplay.map((el, index) => {
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
                  onClick={() => handleClickNextView1()}
                  style={{ width: '10px', height: '10px', border: '#BCC4C8 solid 1px' }}
                />
                <span>Show all</span>
              </div>
            </>
          )}
        </div>
        <div className={styles.data}>
          <div className={styles.dataStart}>
            <div className={timeFormat === '12hours' ? styles.dataStartTMWrapperBigger : styles.dataStartTMWrapper}>
              <InputTime
                onChangeStartTime={changeStartTime}
                onChangeEndTime={changeEndTime}
                startTime={mainState.startTime}
                endTime={mainState.endTime}
                format={timeFormat}
                limits={limits}
                onValidate={onValidate}
              />
            </div>
          </div>
          <div className={styles.checkBoxWrap3} data-test={'next-day-end-checkbox'}>
            <Checkbox
              checked={mainState.nextEndDay}
              onClick={() => {
                setLimits({
                  ...limits,
                  isNextEndDay: !mainState.nextEndDay,
                  isPreviousStartDay: !mainState.nextEndDay ? false : mainState.previousStartDay,
                });
                handleChange('nextEndDay', !mainState.nextEndDay);
              }}
              style={{ height: '10px', width: '10px' }}
            />
            <span onClick={() => handleChange('nextEndDay', !mainState.nextEndDay)}>End next day</span>
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

        <div className={styles2.inputSearch}>
          <InputSearch placeholder={'Search activities'} onChange={onChangeSearchInput} value={searchValue} />
        </div>

        <div
          className={`${styles.tableWrapper} ${styles.tableWrapperHeight}`}
          style={{ width: '680px', height: '400px' }}
        >
          {mainState.loading ? (
            <Spiner />
          ) : (
            <div className={styles.listWrapper}>
              <div className={styles.listHeader}>
                <span>Choose item to insert</span>
              </div>
              {data.map((elment, index) => {
                return (
                  <div key={index}>
                    <div className={styles.listBody}>
                      <div className={`${styles.listBodyItem}`} onClick={() => togleActivitiesSet(index, !elment.open)}>
                        <Bearing />
                        <span title={elment.name}>
                          {ReactHtmlParser(Utils.markPartOfString(elment.name, searchValue))} (
                          {elment.activities.length})
                        </span>
                        <CheckboxBig
                          checked={isAllSetsChecked(elment.id)}
                          onClick={e => setCheckedAllActivities(e, elment.id)}
                        />
                      </div>
                    </div>
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

  if (!props.visible) return null;

  return (
    <div className={styles.formWrapper} style={{ width: '740px', height: '721px' }}>
      <div className={styles.header}>
        <span>Insert Multiple Shift</span>
        <Cross onClick={onClose} />
      </div>
      <div className={styles.body}>{mainState.viewState === 1 ? getView1() : getView2()}</div>

      <div className={styles2.footer}>
        <div className={styles2.buttonWrap1} data-test={'modal-cancel-button'}>
          <Button
            innerText={'Cancel'}
            click={() => {
              onClose();
            }}
            disable={mainStateRef.current.loading || props.loading}
            style={{ background: '#FFFFFF', color: '#0183F5', border: '0.5px solid #0183F5', borderRadius: '5px' }}
          />
        </div>
        {mainState.viewState === 1 ? (
          <>
            <div className={styles2.buttonWrap2} data-test={'modal-next-button'} style={{ marginLeft: 'auto' }}>
              <Button
                innerText={'< Previous'}
                click={() => {
                  props.return();
                }}
                disable={mainState.loading || props.loading}
                type={'primary'}
              />
            </div>
            <div className={styles2.buttonWrap6} data-test={'modal-next-button'} style={{ marginLeft: '20px' }}>
              <Button
                innerText={'Next >'}
                click={() => {
                  changeState(2);
                }}
                disable={mainStateRef.current.selectedShift === -1 || !isValid || mainState.loading || props.loading}
                type={'primary'}
              />
            </div>
          </>
        ) : (
          <div className={styles2.buttonWrap2} data-test={'modal-previous-button'}>
            <Button
              innerText={'< Previous'}
              click={() => {
                changeState(1);
              }}
              disable={mainStateRef.current.selectedShift === -1 || mainState.loading || props.loading}
              type={'primary'}
            />
          </div>
        )}
        {mainState.viewState === 2 ? (
          <div className={styles2.buttonWrap6} data-test={'modal-save-changes-button'}>
            <Button
              innerText={'Publish'}
              click={saveChanges}
              disable={mainState.checkedActivitiesSets.length === 0 || mainState.loading || props.loading}
              style={{ background: '#0183F5', color: '#FFFFFF', borderRadius: '5px' }}
              isSaveButton={true}
            />
          </div>
        ) : (
          ''
        )}
      </div>
    </div>
  );
};

export default NewMultipleShiftMenu;
