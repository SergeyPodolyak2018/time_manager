import React, { FC, useEffect } from 'react';
import { useAppDispatch } from '../../../../redux/hooks';
import {
  buildAgentDayInSnapshot,
  openErrorPopUp,
  toggleSetActivitiesForPopup,
} from '../../../../redux/actions/timeLineAction';
import useStateRef from 'react-usestateref';
import InsertPopupLayout from '../common/InsertPopupLayout';
import SelectActivities, { ISelectActivitiesState } from '../common/SelectActivities';
import styles from './setActivitiesFor.module.scss';
import { useSelector } from 'react-redux';
import {
  getSelectedActivitySelector,
  getSelectedAgents,
  getSetActivitiesFor,
} from '../../../../redux/selectors/timeLineSelector';
import { SetActivitiesFor } from '../../../../redux/ts/intrefaces/timeLine';
import { ActivitySetType, WORK_ID } from '../../../../common/constants/schedule';
import SchAgent from '../../../../helper/schedule/SchAgent';
import { equals } from 'ramda';

const SetActivitiesForPopup: FC = () => {
  const dispatch = useAppDispatch();

  const setActivitiesFor = useSelector(getSetActivitiesFor);
  const selectedAgents = useSelector(getSelectedAgents);
  const selectedActivities = useSelector(getSelectedActivitySelector);

  const [, setInitialCheckedActivitySetsIds, initialCheckedActivitySetsIdsRef] = useStateRef<number[]>([]);
  const [, setSelectActivities, selectActivitiesRef] = useStateRef<ISelectActivitiesState>({
    checkedActivitiesSets: [],
    allActivities: [],
    groupedActivities: [],
    isValid: true,
    searchData: [],
  });

  useEffect(() => {
    if (
      selectActivitiesRef.current.allActivities.length &&
      selectedActivities.length &&
      setActivitiesFor === SetActivitiesFor.ACTIVITY_SET
    ) {
      setSelectActivities({
        ...selectActivitiesRef.current,
        groupedActivities: selectActivitiesRef.current.groupedActivities.filter(
          item => item.id === selectedActivities[0].stateId,
        ),
      });
    }
  }, [selectActivitiesRef.current.allActivities, selectedActivities]);

  useEffect(() => {
    if (selectActivitiesRef.current.allActivities.length && selectedActivities.length) {
      const checkedActivitiesSets = selectedActivities[0].activities
        ? selectedActivities[0].activities
            .filter(activity =>
              setActivitiesFor === SetActivitiesFor.WORK
                ? activity.setId === WORK_ID
                : activity.setId === selectedActivities[0].stateId,
            )
            .map(activity => activity.id)
        : [];
      setInitialCheckedActivitySetsIds(checkedActivitiesSets);
      setSelectActivities({
        ...selectActivitiesRef.current,
        checkedActivitiesSets,
      });
    }
  }, [selectActivitiesRef.current.groupedActivities.length, selectedActivities]);

  const onClose = () => {
    dispatch(toggleSetActivitiesForPopup(SetActivitiesFor.NONE));
  };

  const handleSave = () => {
    if (isDisabledSave()) return;
    const agent = selectedAgents[0];
    const newActivities = selectActivitiesRef.current.allActivities.filter(activity =>
      selectActivitiesRef.current.checkedActivitiesSets.includes(activity.id),
    );

    try {
      const newAgent = SchAgent.updateAgentActivity(agent, newActivities, selectedActivities, setActivitiesFor);
      dispatch(buildAgentDayInSnapshot({ modifiedAgentDays: [newAgent] }, false, true)).then(() => {
        onClose();
      });
    } catch (e: any) {
      dispatch(
        openErrorPopUp({
          isOpen: true,
          data: e.message,
        }),
      );
    }
  };

  const isDisabledSave = () => equals(selectActivitiesRef.current.checkedActivitiesSets, initialCheckedActivitySetsIdsRef.current)

  return (
    <InsertPopupLayout
      classNames={[styles.setActivitiesFor__popup]}
      onClose={onClose}
      isPrevVisible={false}
      handleSave={handleSave}
      disableSave={isDisabledSave()}
      isApply={true}
      title={`Set Activities For ${setActivitiesFor}`}
    >
      <SelectActivities
        setState={setSelectActivities}
        state={selectActivitiesRef.current}
        type={
          setActivitiesFor === SetActivitiesFor.WORK || setActivitiesFor === SetActivitiesFor.WORK_SET
            ? ActivitySetType.WORK
            : ActivitySetType.ACTIVITY_SET
        }
      />
    </InsertPopupLayout>
  );
};

export default SetActivitiesForPopup;
