import { clone } from 'ramda';
import React, { FC, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import useStateRef from 'react-usestateref';

import restApi from '../../../../api/rest';
import { IBusinessUnits } from '../../../../common/interfaces/config';

import { usePopUpHotkeys } from '../../../../hooks';
import {
  getAgentsDaysList,
  getAgentsSchedule,
  openSuccessPopUp,
  setOpenMultipleCleanupPopUp,
  toggleLoader,
} from '../../../../redux/actions/timeLineAction';
import { useAppDispatch } from '../../../../redux/hooks';
import { getCheckedItems, getFilterData } from '../../../../redux/selectors/filterSelector';
import Button from '../../../ReusableComponents/button';
import AgentTree from '../../../ReusableComponents/FilterTree';
import Spiner from '../../../ReusableComponents/spiner';

import styles from './index.module.scss';
import SelectDate from './SelectDate';
import SchUtils, { ISelected } from '../../../../helper/schedule/SchUtils';
import DateUtils from '../../../../helper/dateUtils';
import { Cross } from '../../../../static/svg';
import { setConfirmPopupData } from '../../../../redux/actions/confirmPopupActions';
import Checkbox from '../../../ReusableComponents/CheckboxStyled';
import { setActivData } from '../../../../redux/actions/controlPanelActions';
import { getSelectedTzSelector } from '../../../../redux/selectors/controlPanelSelector';
import Utils from '../../../../helper/utils';

export interface IMainState {
  rangeOrSingle: boolean;
  dateRange: string[];
  loading: boolean;
  viewState: number;
  localCheckedItems: IBusinessUnits;
  navigateAfter: boolean;
  blockButtons: boolean;
}

const MultipleCleanupPopUp: FC = () => {
  const dispatch = useAppDispatch();
  const initChecked = useSelector(getCheckedItems);
  const [mainState, setMainState, mainStateRef] = useStateRef<IMainState>({
    viewState: 1,
    dateRange: [],
    localCheckedItems: initChecked,
    loading: false,
    rangeOrSingle: true,
    navigateAfter: false,
    blockButtons: false,
  });
  const [showSuccessMsg, setShowSuccessMsg] = useState<{ agentCount: number; dayCount: number } | null>(null);
  const fetchedData: IBusinessUnits = useSelector(getFilterData);
  const selectedTZ = useSelector(getSelectedTzSelector);

  useEffect(() => {
    if (!showSuccessMsg) return;
    if (showSuccessMsg.agentCount && showSuccessMsg.dayCount) {
      const message = `Successfully cleared shifts of ${showSuccessMsg.agentCount} agent${
        showSuccessMsg.agentCount === 1 ? '' : 's'
      } in ${showSuccessMsg.dayCount} day${showSuccessMsg.dayCount === 1 ? '' : 's'}`;
      dispatch(openSuccessPopUp({ isOpen: true, data: message }));
    }
    onClose();
  }, [showSuccessMsg]);

  const setLoadingCB = (isLoading: boolean) => {
    singleChange('loading', isLoading);
  };

  const singleChange = (name: string, value: any) => {
    setMainState(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const changeState = (index: number) => {
    singleChange('viewState', index);
  };

  const onClose = () => {
    dispatch(setOpenMultipleCleanupPopUp(false));
    dispatch(toggleLoader(false));
  };

  const setLocalCheckedItems = (newItems: IBusinessUnits) => {
    setMainState(prevState => {
      return {
        ...prevState,
        localCheckedItems: newItems,
      };
    });
  };

  const isSomeChecked = (localCheckedItems: IBusinessUnits) => {
    const selected = SchUtils.getSelectedElements(localCheckedItems, fetchedData);
    if (selected.buId.length < 2 && !mainStateRef.current.blockButtons) {
      if (
        selected.siteId.length > 0 ||
        selected.teamId.length > 0 ||
        selected.agentId.length > 0 ||
        selected.buId.length > 0
      ) {
        return true;
      }
    }
    return false;
  };

  const getDateRanges = (dates: string[]): string[][] => {
    return clone(dates)
      .reduce((acc: string[][], d) => {
        const _acc = clone(acc);
        const lastRange = acc.slice(-1)[0];
        if (!Array.isArray(lastRange)) {
          _acc.push([d]);
          return _acc;
        }

        const lastDate = lastRange.slice(-1)[0];
        if (lastDate === d) {
          return _acc;
        }

        if (DateUtils.getNextDay(lastDate) !== d) {
          _acc.push([d]);
          return _acc;
        }

        _acc[_acc.length - 1].push(d);
        return _acc;
      }, [])
      .map(d => [d.slice(0)[0], d.slice(-1)[0]]);
  };

  const saveChanges = async () => {
    const checkedItems = mainStateRef.current.localCheckedItems;
    const dateRange = mainStateRef.current.dateRange;

    if (!dateRange || !dateRange.length) return;

    singleChange('loading', true);

    const agentFilter = SchUtils.getSelectedElements(checkedItems, fetchedData);
    const dateRanges = getDateRanges(dateRange);
    const responseList: any[] = [];
    for (let i = 0; i < dateRanges.length; i++) {
      const [startDateTime, endDateTime] = dateRanges[i];
      const response = await restApi.deleteAgentDay({
        startDateTime,
        endDateTime,
        agentFilter,
      });
      responseList.push({ response, startDateTime, endDateTime });
    }

    const firstDate = Array.isArray(dateRanges) ? (dateRanges[0] ?? [])[0] ?? null : null;
    if (mainStateRef.current.navigateAfter && typeof firstDate === 'string') {
      dispatch(setActivData(dateRanges[0][0]));
    }
    await dispatch(getAgentsSchedule());
    if (responseList.some(r => r.response.data?.data?.success ?? false)) {
      countAgents(agentFilter, selectedTZ.timezoneId, dateRange[0], dateRange.slice(-1)[0]).then(agentsCount => {
        const dayCount = responseList.reduce(
          (acc: number, r) =>
            r.response.data?.data?.success ?? false ? acc + countDays(r.startDateTime, r.endDateTime) : acc,
          0,
        ) as number;
        setShowSuccessMsg({ agentCount: agentsCount, dayCount });
        singleChange('loading', false);
      });
    } else {
      onClose();
    }
  };

  const countDays = (startDateTime: string, endDateTime: string): number =>
    Math.round((new Date(endDateTime).getTime() - new Date(startDateTime).getTime()) / (24 * 3600000)) + 1;

  const countAgents = async (
    agentFilter: ISelected,
    timezoneId: number,
    startDate: string,
    endDate: string,
  ): Promise<number> => {
    const agents = await dispatch(getAgentsDaysList(agentFilter, selectedTZ.timezoneId, startDate, endDate));
    return (agents ?? []).length;
  };

  const handleClickSubmit = () => {
    dispatch(
      setConfirmPopupData({
        isOpen: true,
        onConfirm: async () => {
          await saveChanges();
        },
        onDiscard: () => {
          singleChange('blockButtons', false);
        },
        onClose: () => {
          singleChange('blockButtons', false);
        },
        title: 'Confirm cleanup',
        text: 'The data of these agents will be cleared',
      }),
    );
    singleChange('blockButtons', true);
  };

  usePopUpHotkeys({
    onSubmit: [saveChanges, { enabled: isSomeChecked(mainState.localCheckedItems) }],
    onCancel: [onClose],
  });

  const filteredFetchData = () => {
    const selected: ISelected = {
      agentId: [],
      buId: Object.keys(initChecked).map(k => Number(k)),
      siteId: [],
      teamId: [],
      activities: [],
    };
    return Utils.getFilteredSelectAgentsList(fetchedData, selected);
  };

  return (
    <div className={styles.container}>
      {mainState.loading ? (
        <div className={styles.spinnerWrapper}>
          <Spiner />
        </div>
      ) : (
        ''
      )}

      <div className={styles.formWrapper}>
        <div className={styles.header}>
          <span>Cleanup Master Schedule Wizard</span>
          <Cross onClick={onClose} />
        </div>
        <div className={styles.body}>
          {mainState.viewState === 1 ? (
            <SelectDate singleChange={singleChange} mainStateRef={mainStateRef} />
          ) : (
            <>
              <div className={styles.containerAgentSelect}>
                <AgentTree
                  useSelectedAgents={true}
                  isWithoutFilterTabs={true}
                  setLocalCheckedItems={setLocalCheckedItems}
                  localCheckedItems={mainState.localCheckedItems}
                  fetchedData={filteredFetchData()}
                  excludeSearchType={['businessUnits']}
                  setLoadingCallback={setLoadingCB}
                />
              </div>
              <div className={styles.containerNavigateAfterCleanup}>
                <span onClick={() => singleChange('navigateAfter', !mainState.navigateAfter)}>
                  Navigate after cleanup to first selected day
                </span>
                <Checkbox
                  checked={mainState.navigateAfter}
                  onClick={() => singleChange('navigateAfter', !mainState.navigateAfter)}
                  disabled={false}
                  isGrayAsDefault={true}
                />
              </div>
            </>
          )}
        </div>
        <div className={styles.footer}>
          <div className={styles.buttonWrap1} data-test={'modal-cancel-button'}>
            <Button
              innerText={'Cancel'}
              click={() => onClose()}
              style={{ background: '#FFFFFF', color: '#0183F5', border: '0.5px solid #0183F5', borderRadius: '5px' }}
              disable={mainState.loading}
            />
          </div>
          {mainState.viewState === 1 ? (
            <div className={styles.buttonWrap2} data-test={'modal-next-button'}>
              <Button
                innerText={'Next >'}
                click={() => {
                  changeState(2);
                }}
                disable={
                  !(
                    (mainStateRef.current.rangeOrSingle && mainStateRef.current.dateRange[1]) ||
                    (!mainStateRef.current.rangeOrSingle && mainStateRef.current.dateRange[0])
                  ) || mainState.loading
                }
                type={'primary'}
              />
            </div>
          ) : (
            <div className={styles.buttonWrap3} data-test={'modal-previous-button'}>
              <Button
                innerText={'< Previous'}
                click={() => {
                  changeState(1);
                }}
                disable={mainState.loading}
                type={'primary'}
              />
            </div>
          )}
          {mainState.viewState === 2 ? (
            <div className={styles.buttonWrap2} data-test={'modal-save-changes-button'}>
              <Button
                innerText={'Cleanup'}
                click={handleClickSubmit}
                disable={!isSomeChecked(mainState.localCheckedItems) || mainState.loading}
                style={{ background: '#0183F5', color: '#FFFFFF', borderRadius: '5px' }}
                isSaveButton={true}
              />
            </div>
          ) : (
            ''
          )}
        </div>
      </div>
    </div>
  );
};

export default MultipleCleanupPopUp;
