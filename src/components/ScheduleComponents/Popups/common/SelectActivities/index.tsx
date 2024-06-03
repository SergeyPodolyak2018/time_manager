import classnames from 'classnames';
import React, { Dispatch, FC, SetStateAction, useEffect, useRef, useState } from 'react';
import ReactHtmlParser from 'react-html-parser';
import { useSelector } from 'react-redux';
import useStateRef from 'react-usestateref';

import Api from '../../../../../api/rest';
import { ActivitySetType } from '../../../../../common/constants/schedule';
import { ISchActivity } from '../../../../../common/interfaces/schedule/IAgentSchedule';
import logger from '../../../../../helper/logger';
import SchActivitySet from '../../../../../helper/schedule/SchActivitySet';
import SchMultipleItems from '../../../../../helper/schedule/SchMultipleItems';
import SchUtils from '../../../../../helper/schedule/SchUtils';
import Utils from '../../../../../helper/utils';
import { getActiveDateSelector } from '../../../../../redux/selectors/controlPanelSelector';
import { getSelectedAgentSelector } from '../../../../../redux/selectors/timeLineSelector';
import { IActivities, IActivitiesSetGroup } from '../../../../../redux/ts/intrefaces/timeLine';
import CheckboxBig from '../../../../ReusableComponents/Checkbox';
import CheckboxStyled from '../../../../ReusableComponents/CheckboxStyled';
import Spiner from '../../../../ReusableComponents/spiner';
import { ReactComponent as Bearing } from '../../NewShiftMenu/bearing.svg';
import InputSearch from '../../NewShiftMenu/InputSearch';
import styles from './SelectActivities.module.scss';

export interface ISelectActivitiesState {
  groupedActivities: IActivitiesSetGroup[];
  checkedActivitiesSets: number[];
  allActivities: ISchActivity[];
  searchData: IActivitiesSetGroup[];
  isValid: boolean;
}

interface ISelectActivitiesProps {
  setState: Dispatch<SetStateAction<ISelectActivitiesState>>;
  state: ISelectActivitiesState;
  type: ActivitySetType;
  setIsLoadingCallback?: (isLoading: boolean) => void;
}

const SelectActivities: FC<ISelectActivitiesProps> = ({ state, setState, type , setIsLoadingCallback}) => {
  const selectedAgents = useSelector(getSelectedAgentSelector);
  const currentDate = useSelector(getActiveDateSelector);

  const [searchValue, setSearchValue] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [, setIsLoading, isLoadingRef] = useStateRef(true);

  useEffect(() => {
    if (typeof setIsLoadingCallback === 'function') {
      setIsLoadingCallback(isLoadingRef.current);
    }
  }, [isLoadingRef.current]);

  useEffect(() => {
    setState(prevState => ({
      ...prevState,
      isValid: !!state.checkedActivitiesSets.length,
    }));
    if (state.allActivities.length > 0) return setIsLoading(false);

    const selectedAgent = selectedAgents[0];

    const payload = {
      buId: selectedAgent.buId,
      siteId: selectedAgent.siteId,
      teamId: selectedAgent.teamId,
      contractId: selectedAgent.contracts.map(c => c.id),
      agentId: selectedAgent.agentId,
      enableSecondarySkills: true,
      date: currentDate,
      snapshotId: '',
    };

    const snapshotPayload = SchMultipleItems.payloadOpenScheduleAgentSnapshotNewItem(
      selectedAgent.agentId,
      selectedAgent.siteId,
      currentDate,
    );

    Api.openScheduleAgentSnapshot(snapshotPayload)
      .then(resp => {
        if (resp?.data?.snapshotId) {
          return resp.data.snapshotId;
        } else {
          return Promise.reject(new Error('Can not get snapshot id'));
        }
      })
      .then(snapshotId => {
        payload.snapshotId = snapshotId;
        return Api.getActivities(payload);
      })
      .then(respActivity => {
        if (respActivity.status.code === 0) {
          const activityIds = respActivity.data.map((a: { id: number } & object) => a.id);

          Api.getActivitySet({
            siteId: selectedAgent.siteId,
            buId: selectedAgent.buId,
            activityId: activityIds,
          }).then(respActivitySet => {
            const activitiesSetStruct = SchActivitySet.groupActivities(respActivity.data, respActivitySet.data, type);
            setState(prevState => ({
              ...prevState,
              groupedActivities: activitiesSetStruct.activitiesSet,
              allActivities: activitiesSetStruct.activities,
            }));
          });
        }
      })
      .then(() => {
        return Api.closeAgentDaySnapshot({ snapshotId: payload.snapshotId });
      })
      .catch(err => {
        logger.error(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const toggleActivitiesSet = (index: number, val: boolean) => {
    const data = isSearchActive ? state.searchData : state.groupedActivities;
    if (!data) return;
    const newSet = [...data];
    newSet[index].open = val;
    isSearchActive ? setState({ ...state, searchData: newSet }) : setState({ ...state, groupedActivities: newSet });
  };

  const isAllSetsChecked = (id: number) => {
    const targetEl = state.groupedActivities?.find(el => el.id === id);
    if (!targetEl) return;

    const idsOfSets = targetEl?.activities.map(el => el.id);
    let counter = 0;
    for (let i = 0; i < idsOfSets.length; i++) {
      if (state.checkedActivitiesSets.indexOf(idsOfSets[i]) > -1) {
        counter++;
      }
    }
    return idsOfSets.length === counter;
  };

  const setCheckedAllActivities = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();

    const selectedActivitySet = state.groupedActivities?.find(activity => activity.id === id);

    if (!selectedActivitySet) return;

    let newCheckedActivitySet: Set<number> | number[];
    const ids = selectedActivitySet.activities.map(item => item.id);
    if (isAllSetsChecked(id)) {
      newCheckedActivitySet = state.checkedActivitiesSets.filter(id => !ids.includes(id));
    } else {
      newCheckedActivitySet = new Set([...ids]);
    }
    const checkedItems: number[] = [...newCheckedActivitySet];

    setState({
      ...state,
      checkedActivitiesSets: checkedItems,
      isValid: !!checkedItems.length,
    });
  };

  const changeCheckedActivitiesSet = (id: number) => {
    const index = state.checkedActivitiesSets.findIndex(el => el === id);
    const newCheckedAct = [];
    if (index === -1) {
      newCheckedAct.push(...SchUtils.isActivityFromOneFamily(state.groupedActivities, state.checkedActivitiesSets, id));
    } else {
      newCheckedAct.push(...state.checkedActivitiesSets);
      newCheckedAct.splice(index, 1);
    }
    setState({
      ...state,
      checkedActivitiesSets: newCheckedAct,
      isValid: !!newCheckedAct.length,
    });
  };

  const getSetElements = (index: number) => {
    const data = isSearchActive ? state.searchData : state.groupedActivities;
    if (!data || !data[index]) return;

    return data[index].activities.map((el, index) => {
      const checked = state.checkedActivitiesSets.indexOf(el.id) > -1;
      return (
        <div
          title={el.name}
          className={classnames([
            styles.selectActivities__activityItem2,
            styles.selectActivities__activityItem,
            checked ? styles.checked : '',
          ])}
          onClick={() => changeCheckedActivitiesSet(el.id)}
          key={index}
          data-test={`activity-item-name-${el.name.toLowerCase().replaceAll(' ', '-')}`}
        >
          <Bearing />
          <span>{ReactHtmlParser(Utils.markPartOfString(el.name, searchValue))}</span>
          <CheckboxBig checked={checked} />
        </div>
      );
    });
  };

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const onChangeSearch = (value: string) => {
    searchTimeoutRef.current && clearTimeout(searchTimeoutRef.current);
    if (isSearchActive) {
      setState({ ...state, searchData: [] });
      setIsSearchActive(false);
    }
    setSearchValue(value);
    if (!value) return;

    searchTimeoutRef.current = setTimeout(() => {
      setState({
        ...state,
        searchData: matchActivityByName(state.groupedActivities, value),
      });
      setIsSearchActive(true);
    }, 700);
  };

  const matchActivityByName = (activities: any[], name: string) => {
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

  return (
    <div className={classnames([styles.selectActivities])}>
      {isLoadingRef.current ? (
        <Spiner />
      ) : (
        <div className={styles.selectActivities__content}>
          <h4 className={classnames([styles.selectActivities__titleH4, styles.selectActivities__titleWrapper])}>
            Choose item to insert
          </h4>
          <InputSearch
            classNames={[styles.selectActivities__inputSearch]}
            placeholder={'Search activities'}
            onChange={onChangeSearch}
            value={searchValue}
          />
          <div className={styles.selectActivities__activities}>
            {(isSearchActive ? state.searchData : state.groupedActivities)?.map((el, index) => {
              const group = state.groupedActivities.find(group => {
                return group.id === el.id;
              });
              const checkedActivitiesInThisGroup = group?.activities?.filter(ac => {
                return state.checkedActivitiesSets.includes(ac.id);
              });

              const isIndeterminate =
                checkedActivitiesInThisGroup &&
                group?.activities &&
                checkedActivitiesInThisGroup?.length > 0 &&
                checkedActivitiesInThisGroup?.length !== group?.activities?.length;
              const checked = isAllSetsChecked(el.id);
              return (
                <div key={index} className={styles.selectActivities__activitySet}>
                  <div
                    className={`${styles.selectActivities__activityItem}${checked ? ' ' + styles.checked : ''}`}
                    onClick={() => toggleActivitiesSet(index, !el.open)}
                  >
                    <Bearing />
                    <span title={el.name}>
                      {ReactHtmlParser(Utils.markPartOfString(el.name, searchValue))}
                      <span>{el?.activities ? ` (${el.activities.length})` : ''}</span>
                    </span>

                    <CheckboxStyled
                      checked={checked}
                      onClick={e => setCheckedAllActivities(e, el.id)}
                      indeterminate={isIndeterminate}
                    />
                  </div>
                  {el.open && getSetElements(index)}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectActivities;
