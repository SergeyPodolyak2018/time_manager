import '../../NewShiftMenu/TimePicker.css';

import { clone } from 'ramda';
import React, { useEffect, useRef, useState } from 'react';
import ReactHtmlParser from 'react-html-parser';
import { useSelector } from 'react-redux';
import useStateRef from 'react-usestateref';

import Api from '../../../../../api/rest';
import { ActivitySetType } from '../../../../../common/constants/schedule';
import { ITimezone } from '../../../../../common/interfaces/config/ITimezone';
import {
    CfgMarkedTimeType, IMarkedTime
} from '../../../../../common/interfaces/schedule/IAgentSchedule';
import logger from '../../../../../helper/logger';
import SchActivitySet from '../../../../../helper/schedule/SchActivitySet';
import SchMultipleItems from '../../../../../helper/schedule/SchMultipleItems';
import SchUtils, { ISelected } from '../../../../../helper/schedule/SchUtils';
import Utils from '../../../../../helper/utils';
import { getActiveDateSelector } from '../../../../../redux/selectors/controlPanelSelector';
import { IActivities, IActivitiesSetGroup } from '../../../../../redux/ts/intrefaces/timeLine';
import { Cross } from '../../../../../static/svg';
import Button from '../../../../ReusableComponents/button';
import CheckboxBig from '../../../../ReusableComponents/Checkbox';
import Checkbox from '../../../../ReusableComponents/CheckboxStyled';
import InputRadio from '../../../../ReusableComponents/InputRadio';
import { ITimeLimit } from '../../../../ReusableComponents/InputTime';
import Spiner from '../../../../ReusableComponents/spiner';
import SelectTime, { ISelectTimeState, SelectTimeType } from '../../common/SelectTime';
import styles4 from '../../InsertExceptionMenu/menu.module.scss';
import styles3 from '../../InsertWorkSet/View1SetTime/View1SetTime.module.scss';
import { ReactComponent as Bearing } from '../../NewShiftMenu/bearing.svg';
import InputSearch from '../../NewShiftMenu/InputSearch';
import styles from '../../NewShiftMenu/menu.module.scss';
import styles2 from '../menu.module.scss';

export interface IWorkSetProps {
  onClose: (...args: any[]) => void;
  onReturn: (...args: any[]) => void;
  apply: (...args: any[]) => void;
  checkedItems: ISelected;
  dateRange: string[];
  insertOnlyErrorsOrWarning: boolean;
  showWarnings: boolean;
  siteId: number;
  buId: number;
  siteTzId: number;
  isDelete?: boolean;
  showNextBtn?: boolean;
  itemsStartTime?: string;
  itemsEndTime?: string;
  itemsNextEndDay?: boolean;
  snapshotId: string;
  selectedTz: ITimezone;
  loading: boolean;
  visible: boolean;
}

export interface IMainState {
  loading: boolean;
  viewState: number;
  showActivitiesSecSkills: boolean;
  activities: IActivities[];
  checkedActivities: number[];
  activitiesSet: IActivitiesSetGroup[];
  checkedActivitiesSets: number[];
  openActivities: boolean;
  isSearchActive: boolean;
  searchData: IActivitiesSetGroup[];
  useExistingActivities: boolean;
  useMarkedTime: boolean;
  markedTimeId: number;
  markedTimes: IMarkedTime[];
}

const NewMultipleShiftMenu = (props: IWorkSetProps) => {
  const [mainState, setMainState, mainStateRef] = useStateRef<IMainState>({
    loading: true,
    viewState: 1,
    showActivitiesSecSkills: false,
    activities: [],
    activitiesSet: [],
    checkedActivities: [],
    checkedActivitiesSets: [],
    searchData: [],
    openActivities: false,
    isSearchActive: false,
    useExistingActivities: false,
    useMarkedTime: true,
    markedTimes: [],
    markedTimeId: 0,
  });

  const [, setSelectTime, selectTimeRef] = useStateRef<ISelectTimeState>({
    isValid: true,
    timeStart: '12:00',
    timeEnd: '13:00',
    isPrevDayStart: false,
    isNextDayEnd: false,
    isNextDayStart: false,
  });

  //const fetchedData: IBusinessUnits = useSelector(getFilterData);
  //const timeFormat = useSelector(getTimeFormat);
  const activeDate = useSelector(getActiveDateSelector);
  const [searchValue, setSearchValue] = useState('');

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [isValid, setIsValid] = useState<boolean>(true);

  useEffect(() => {
    if (
      mainState.viewState === 2 &&
      mainStateRef.current.activities.length === 0 &&
      mainStateRef.current.activitiesSet.length === 0
    ) {
      handleChange('loading', true);

      const selectedAgent = props.checkedItems;

      const payload = {
        buId: selectedAgent.buId,
        siteId: selectedAgent.siteId,
        teamId: selectedAgent.teamId,
        agentId: selectedAgent.agentId,
        enableSecondarySkills: mainState.showActivitiesSecSkills,
        date: props.dateRange[0],
        snapshotId: props.snapshotId,
        timezoneId: props.selectedTz.timezoneId,
      };
      const payloadSnapshot = SchMultipleItems.prepareDataForOpenScheduleAgentSnapshotFromSnapshot(
        selectedAgent,
        props.dateRange[0],
        props.snapshotId,
      );

      Api.openScheduleAgentSnapshot(payloadSnapshot)
        .then(resp => {
          if (resp.data && resp.data.snapshotId) {
            return resp.data.snapshotId;
          } else {
            return Promise.reject('Can not get snapshotId');
          }
        })
        .then(snapshotId => {
          let localSnapshotId = snapshotId;
          payload.snapshotId = localSnapshotId;
          Api.getActivities(payload)
            .then(respActivity => {
              if (respActivity.status.code === 0) {
                const activityIds = respActivity.data.map((a: { id: number } & object) => a.id);
                Api.getActivitySet({
                  siteId: selectedAgent.siteId,
                  buId: selectedAgent.buId,
                  activityId: activityIds,
                  snapshotId: localSnapshotId,
                })
                  .then(respActivitySet => {
                    const activitiesSetStruct = SchActivitySet.groupActivities(
                      respActivity.data,
                      respActivitySet.data,
                      ActivitySetType.ALL,
                    );
                    multipleChange({ loading: false, ...activitiesSetStruct });
                  })
                  .finally(() => {
                    if (!localSnapshotId) return;
                    const snapshotId = localSnapshotId;
                    localSnapshotId = '';
                    return Api.closeAgentDaySnapshot({ snapshotId });
                  });
              }
            })
            .catch(err => {
              logger.error(err);
            })
            .finally(() => {
              if (!localSnapshotId) return;
              return Api.closeAgentDaySnapshot({ snapshotId });
            });
        })
        .catch(err => {
          logger.error(err);
        });
    }
    if (mainState.viewState === 3 && mainState.markedTimes.length === 0) {
      handleChange('loading', true);
      Api.findMarkedTimes({
        ...(props.checkedItems.agentId.length > 0 && { agentId: props.checkedItems.agentId }),
        ...(props.checkedItems.teamId.length > 0 && { teamId: props.checkedItems.teamId }),
        ...(props.checkedItems.siteId.length > 0 && { siteId: props.checkedItems.siteId }),
        ...(props.checkedItems.buId.length > 0 && { buId: props.checkedItems.buId }),
        type: 1,
      })
        .then(response => {
          multipleChange({ loading: false, markedTimes: response.data });
        })
        .catch(err => {
          logger.error(err);
        });
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

  const handleClickItem = (item: IMarkedTime) => {
    setMainState(prevState => ({ ...prevState, markedTimeId: item.id }));
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

  const changeState = (direction: boolean) => {
    if (mainStateRef.current.viewState === 1 && !direction) {
      props.onReturn(4);
    }
    if (mainStateRef.current.viewState > 1 && !direction) {
      if (mainStateRef.current.viewState === 2) {
        handleChange('viewState', 1);
        return false;
      }
      if (mainStateRef.current.viewState === 3 && !mainStateRef.current.useExistingActivities) {
        handleChange('viewState', 2);
      } else {
        handleChange('viewState', 1);
      }
    }
    if (direction) {
      if (mainStateRef.current.viewState === 1 && !mainStateRef.current.useExistingActivities) {
        handleChange('viewState', 2);
        return false;
      }
      if (mainStateRef.current.viewState < 3 && mainStateRef.current.useMarkedTime) {
        handleChange('viewState', 3);
      }
    }
  };
  const isNextDisable = () => {
    if (mainStateRef.current.viewState === 1) {
      return !isValid;
    }
    if (mainStateRef.current.viewState === 2) {
      return !(
        mainStateRef.current.checkedActivities.length > 0 || mainStateRef.current.checkedActivitiesSets.length > 0
      );
    }
  };
  const isSaveDisable = () => {
    if (mainStateRef.current.viewState === 1) {
      return !(isValid && !mainStateRef.current.useMarkedTime && mainStateRef.current.useExistingActivities);
    }
    if (mainStateRef.current.viewState === 2) {
      return !(mainStateRef.current.checkedActivitiesSets.length > 0);
    }
    if (mainStateRef.current.viewState === 3) {
      return !(mainStateRef.current.markedTimeId > 0);
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

  const toggleActivitiesSet = (index: number, val: boolean) => {
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
            <span title={jelement.name}>{ReactHtmlParser(Utils.markPartOfString(jelement.name, searchValue))}</span>
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
    const filterAgents = props.checkedItems;
    const datesFullRange: string[] =
      props.dateRange.length === 2 && props.dateRange[0] === props.dateRange[1]
        ? [props.dateRange[0]]
        : props.dateRange;

    const repeatRequestForData = datesFullRange.indexOf(activeDate) > -1;

    const formData = {
      activities: !mainStateRef.current.useExistingActivities ? mainStateRef.current.checkedActivitiesSets : [],
      markedTimeId: mainStateRef.current.useMarkedTime ? mainStateRef.current.markedTimeId : 0,
      startTime: selectTimeRef.current.timeStart,
      endTime: selectTimeRef.current.timeEnd,
      nextDayStart: selectTimeRef.current.isNextDayStart,
      nextDayEnd: selectTimeRef.current.isNextDayEnd,
      timezoneId: props.selectedTz.timezoneId,
    };

    const states = SchMultipleItems.prepareDataForNewMultipleWorkSet(formData, datesFullRange);

    const agentDays = SchMultipleItems.prepareTeamPlateInsertWorkState(
      filterAgents,
      !props.showWarnings,
      props.insertOnlyErrorsOrWarning,
      true,
      states,
    );

    props.apply('workSet', agentDays, repeatRequestForData);
  };

  const onClose = () => {
    props.onClose();
  };

  const [limits, setLimits] = useStateRef<ITimeLimit>({});

  useEffect(() => {
    setLimits({
      ...limits,
      isNextEndDay: selectTimeRef.current.isNextDayEnd,
      isPreviousStartDay: selectTimeRef.current.isPrevDayStart,
      isNextStartDay: selectTimeRef.current.isNextDayStart,
    });
  }, [selectTimeRef.current, props.visible]);

  const onValidate = (msg: string | null): void => {
    setIsValid(!msg);
  };

  const getView1 = () => {
    return (
      <div className={styles3.insertWorkSetView1}>
        <div className={styles3.insertWorkSetView1__column}>
          <div className={styles3.insertWorkSetView1__columnItem}>
            <h4 className={styles3.insertWorkSetView1__titleH4}>Specify work set parameters</h4>
          </div>
          <SelectTime
            type={[SelectTimeType.NEXT_DAY_START, SelectTimeType.NEXT_DAY_END]}
            classNames={[styles3.insertWorkSetView1__selectTime]}
            setState={setSelectTime}
            state={selectTimeRef.current}
            onValidate={onValidate}
            limits={limits}
          />
        </div>
        <div className={styles3.insertWorkSetView1__column}>
          <div className={styles3.insertWorkSetView1__checkboxContainer}>
            <InputRadio
              id={'newActivities'}
              onClick={() => setMainState({ ...mainStateRef.current, useExistingActivities: false })}
              checked={!mainStateRef.current.useExistingActivities}
            />
            <label
              htmlFor={'newActivities'}
              onClick={() => setMainState({ ...mainStateRef.current, useExistingActivities: false })}
            >
              Select new activities for the Work Set
            </label>
          </div>
          <div className={styles3.insertWorkSetView1__checkboxContainer}>
            <InputRadio
              id={'existingActivities'}
              onClick={() => setMainState({ ...mainStateRef.current, useExistingActivities: true })}
              checked={mainStateRef.current.useExistingActivities}
            />
            <label
              htmlFor={'existingActivities'}
              onClick={() => setMainState({ ...mainStateRef.current, useExistingActivities: true })}
            >
              Use existing shift activities
            </label>
          </div>
        </div>
        <div className={styles3.insertWorkSetView1__column}>
          <div className={styles3.insertWorkSetView1__checkboxContainer}>
            <Checkbox
              id={'markedTime'}
              onClick={() =>
                setMainState({ ...mainStateRef.current, useMarkedTime: !mainStateRef.current.useMarkedTime })
              }
              checked={mainStateRef.current.useMarkedTime}
            />
            <label
              htmlFor={'markedTime'}
              onClick={() =>
                setMainState({ ...mainStateRef.current, useMarkedTime: !mainStateRef.current.useMarkedTime })
              }
            >
              Mark as overtime with marked time
            </label>
          </div>
        </div>
      </div>
    );
  };

  const getView3 = () => {
    return (
      <div>
        <div className={styles.subHeader}>
          <span>Select Marked Time</span>
        </div>
        <div className={styles4.tableWrapper} style={{ width: '680px', height: '380px' }}>
          {mainStateRef.current.loading ? (
            <Spiner />
          ) : (
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <td style={{ maxWidth: 'none' }}>
                    <span>Marked</span>
                  </td>
                  <td>
                    <span>Short</span>
                  </td>
                  <td>
                    <span>Overtime</span>
                  </td>
                  <td>
                    <span>Payback</span>
                  </td>
                </tr>
              </thead>
              <tbody>
                {mainStateRef.current.markedTimes.map((item, index) => {
                  return (
                    <tr
                      key={index}
                      onClick={() => handleClickItem(item)}
                      className={`${item.id === mainStateRef.current.markedTimeId ? styles4.selected : ''}`}
                    >
                      <td>
                        <span title={item.name} className={styles4.firstTd}>
                          {item.name}
                        </span>
                      </td>
                      <td>
                        <span title={item.shortName} className={styles4.secTd}>
                          {item.shortName}
                        </span>
                      </td>
                      <td>
                        <span className={styles4.vthTd}>
                          <CheckboxBig icon={'mark'} checked={item.type === CfgMarkedTimeType.OVERTIME} />
                        </span>
                      </td>
                      <td>
                        <span className={styles4.sthTd}>
                          <CheckboxBig icon={'mark'} checked={item.type === CfgMarkedTimeType.PAYBACK} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };
  const getView2 = () => {
    const data = mainState.isSearchActive ? mainState.searchData : mainState.activitiesSet;

    return (
      <>
        <div className={styles.subHeader}>
          <span>Select Activity For Work Set</span>
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
              {data.map((element, index) => {
                return (
                  <div key={index}>
                    <div className={styles.listBody}>
                      <div
                        className={`${styles.listBodyItem}`}
                        onClick={() => toggleActivitiesSet(index, !element.open)}
                      >
                        <Bearing />
                        <span title={element.name}>
                          {ReactHtmlParser(Utils.markPartOfString(element.name, searchValue))} (
                          {element.activities.length})
                        </span>
                        <CheckboxBig
                          checked={isAllSetsChecked(element.id)}
                          onClick={e => setCheckedAllActivities(e, element.id)}
                        />
                      </div>
                    </div>
                    {element.open ? getsetElements(index) : ''}
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
        <span>Insert Multiple Work Set</span>
        <Cross onClick={onClose} />
      </div>
      <div className={styles.body}>
        {mainState.viewState === 1 && getView1()}
        {mainState.viewState === 2 && getView2()}
        {mainState.viewState === 3 && getView3()}
      </div>

      <div className={styles2.footer}>
        <div className={styles2.buttonWrap1} data-test={'modal-cancel-button'}>
          <Button
            innerText={'Cancel'}
            click={() => {
              onClose();
            }}
            disabled={props.loading}
            style={{ background: '#FFFFFF', color: '#0183F5', border: '0.5px solid #0183F5', borderRadius: '5px' }}
          />
        </div>
        <div className={styles2.buttonWrap2} data-test={'modal-previous-button'}>
          <Button
            innerText={'< Previous'}
            click={() => {
              changeState(false);
            }}
            disable={props.loading}
            type={'primary'}
          />
        </div>
        {((mainStateRef.current.viewState === 1 &&
          (mainStateRef.current.useMarkedTime || !mainStateRef.current.useExistingActivities)) ||
          (mainStateRef.current.viewState === 2 && mainStateRef.current.useMarkedTime)) && (
          <div className={styles2.buttonWrap2} data-test={'modal-next-button'} style={{ marginLeft: '20px' }}>
            <Button
              innerText={'Next >'}
              click={() => {
                changeState(true);
              }}
              disable={isNextDisable() || props.loading}
              type={'primary'}
            />
          </div>
        )}
        {((mainStateRef.current.useExistingActivities && !mainStateRef.current.useMarkedTime) ||
          (mainStateRef.current.viewState === 2 && !mainStateRef.current.useMarkedTime) ||
          mainStateRef.current.viewState === 3) && (
          <div className={styles2.buttonWrap2} data-test={'modal-save-changes-button'}>
            <Button
              innerText={'Publish'}
              click={saveChanges}
              disable={isSaveDisable() || props.loading}
              style={{ background: '#0183F5', color: '#FFFFFF', borderRadius: '5px' }}
              isSaveButton={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default NewMultipleShiftMenu;
