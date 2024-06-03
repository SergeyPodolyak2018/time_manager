import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import useStateRef from 'react-usestateref';

import restApi from '../../../../api/rest';
import {
    IResponseFindAgentsFromSnapshotData
} from '../../../../api/ts/interfaces/findAgentsFromSnapshot';
import { TCreateScenarioParams } from '../../../../api/ts/interfaces/scenario';
import { IBusinessUnits } from '../../../../common/interfaces/config';
import { ITimezone } from '../../../../common/interfaces/config/ITimezone';
import { ICfgException } from '../../../../common/models/cfg.exeption';
import DateUtils from '../../../../helper/dateUtils';
import logger from '../../../../helper/logger';
import SchScenario from '../../../../helper/scenario/SchScenario';
import SchMeetingScheduler from '../../../../helper/schedule/SchMeetingScheduler';
import SchUtils from '../../../../helper/schedule/SchUtils';
import { addGlobalError } from '../../../../redux/actions/globalErrorActions';
import {
    getScheduleScenarios, setOpenNewScenarioWizardAction
} from '../../../../redux/actions/scheduleScenariosActions';
import {
    changeMeetingCalendarVisible, changeMeetingListVisible, getAgentsSchedule, openErrorPopUp
} from '../../../../redux/actions/timeLineAction';
import { useAppDispatch } from '../../../../redux/hooks';
import {
    getActiveDateSelector, getTimezonesSelector
} from '../../../../redux/selectors/controlPanelSelector';
import { getCheckedItems, getFilterData } from '../../../../redux/selectors/filterSelector';
import { IErrorPopUpParam } from '../../../../redux/ts/intrefaces/timeLine';
import { Cross } from '../../../../static/svg';
import Button from '../../../ReusableComponents/button';
import styles from './scenarioScheduler.module.scss';
import View1CreateScenarioForm from './view/createScenarioForm';
import View2SelectActivities from './view/selectActivities';
import View3SelectAgents from './view/selectAgents';

export interface ICfgBaseOn {
  id: number;
  name: string;
}

const basedOnProperties : ICfgBaseOn[] = [
  {
    id: 0,
    name: 'None'
  },
  {
    id: 1,
    name: 'Master Schedule'
  }
]

export interface IMainStateForm {
  name: string;
  shared: boolean;
  activeException: ICfgBaseOn | null;
  dateFrom: string;
  dateTo: string;
  extendedDateTo: string;
  groupingAgents: boolean[];
  useForecastData: boolean;
  comments: string;
}

export interface IMainState {
  loading: boolean;
  viewState: number;
  autoCommitChanges: boolean;
  dateRange: string[];
  rangeOrSingle: boolean;
  agentSnapshot: string;
  agentSnapshotCount: number;
  agentFromSnapshot: IResponseFindAgentsFromSnapshotData[];
  agentSnapshot2: string;
  localCheckedItems: IBusinessUnits;
  exceptions: ICfgBaseOn[];
  agentsData: any[];
  mainError: string[];
  cachedRequest: any;
  form: IMainStateForm;
}

export interface IFormValidation {
  name: boolean;
  activeException: boolean;
  dateFrom: boolean;
  dateTo: boolean;
  extendedDateTo: boolean;
  useForecastData: boolean;
}

const NewScenarioWizardPopup = () => {
  const initChecked = useSelector(getCheckedItems);
  const fetchedData: IBusinessUnits = useSelector(getFilterData);
  const activeDate = useSelector(getActiveDateSelector);
  const allTimezones = useSelector(getTimezonesSelector);

  const getEndDay = (currentDay: string, timezones?: ITimezone[]) => {
    const next = timezones ? new Date(DateUtils.convertUtcAccordingToLocalTz(currentDay, timezones)) : new Date(currentDay);
    next.setDate(next.getDate() + 6);
    return next.toISOString().split('T')[0];
  };

  const defaultEndDay = getEndDay(activeDate, allTimezones)

  const dispatch = useAppDispatch();

  const [, setMainState, mainStateRef] = useStateRef<IMainState>({
    loading: true,
    viewState: 1,
    autoCommitChanges: true,
    dateRange: [],
    rangeOrSingle: true,
    agentSnapshot: '',
    agentSnapshotCount: 0,
    agentFromSnapshot: [],
    agentSnapshot2: '',
    localCheckedItems: initChecked,
    exceptions: basedOnProperties,
    agentsData: [],
    mainError: [],
    cachedRequest: {},
    form: {
      name: '',
      shared: false,
      activeException: basedOnProperties[0],
      dateFrom: activeDate,
      dateTo: defaultEndDay,
      extendedDateTo: defaultEndDay,
      groupingAgents: [false, true, false],
      useForecastData: false,
      comments: '',
    },
  });

  const [, setValid, valideRef] = useStateRef<IFormValidation>({
    name: true,
    activeException: true,
    dateFrom: true,
    dateTo: true,
    extendedDateTo: true,
    useForecastData: true,
  });

  const [, setInit, initRef] = useStateRef(false);

  useEffect(() => {
    if (initRef.current) {
      validateFields();
    }
  }, [mainStateRef.current.form]);

  const validateFields = () => {
    const exceptFields = Object.keys(validator);
    const newValidatRes: any = {};

    for (const i of exceptFields) {
      newValidatRes[i] = validator[i as keyof typeof validator](mainStateRef.current.form[i as keyof typeof validator]);
    }
    setValid(prevState => ({
      ...prevState,
      ...newValidatRes,
    }));
  };

  const validator = {
    name: (val: any): boolean => {
      return val !== '';
    },
    activeException: (val: ICfgException): boolean => {
      return !!val;
    },
    dateFrom: (val: string): boolean => {
      const from = new Date(val).getTime();
      const to = new Date(mainStateRef.current.form.dateTo).getTime();
      return from <= to;
    },
    dateTo: (val: string): boolean => {
      const to = new Date(val).getTime();
      const from = new Date(mainStateRef.current.form.dateFrom).getTime();
      return from <= to;
    },
  };

  useEffect(() => {
    if (mainStateRef.current.viewState === 1) {
      const checkedItems = SchUtils.getSelectedElementsSyncForMultipleFilter(
        mainStateRef.current.localCheckedItems,
        fetchedData,
      );

      const payloadSnapshot = SchScenario.prepareDataForOpenAgentSnapshot(checkedItems, activeDate);

      restApi
        .openAgentSnapshot(payloadSnapshot)
        .then(resp => {
          if (resp.data && resp.data.snapshotId) {
            return resp.data;
          } else {
            return Promise.reject('Can not get agent snapshotId');
          }
        })
        .then(agentSnapshot => {
          singleChange('agentSnapshot', agentSnapshot.snapshotId);
          const payloadMeetingSnapshot = SchMeetingScheduler.prepareDataForOpenMeetingSnapshot(
            agentSnapshot.snapshotId,
          );
          return restApi.openMeetingSnapshot(payloadMeetingSnapshot);
        })
        .then(resp => {
          if (resp.data && resp.data.snapshotId) {
            return { snapshotId: resp.data.snapshotId, totalCount: resp.data.totalCount };
          } else {
            return Promise.reject('Can not get snapshotId');
          }
        })
        .then(() => {
          setMainState(prevState => ({
            ...prevState,
            loading: false,
          }));
          return restApi.openAgentSnapshot(payloadSnapshot);
        })
        .then(resp => {
          if (resp.data && resp.data.snapshotId) {
            return resp.data;
          } else {
            return Promise.reject('Can not get agent snapshotId');
          }
        })
        .then(agentSnapshot2 => {
          singleChange('agentSnapshot2', agentSnapshot2.snapshotId);
          return restApi.findAgentsFromSnapshot({
            snapshotId: agentSnapshot2.snapshotId,
            firstIndex: 0,
            lastIndex: agentSnapshot2.totalCount - 1,
          });
        })
        .then(agentFromSnapshot => {
          if (agentFromSnapshot.data) {
            singleChange('agentFromSnapshot', agentFromSnapshot.data);
            return Promise.resolve();
          } else {
            return Promise.reject('Can not get agent snapshotId');
          }
        })
        .catch(err => {
          logger.error(err);
        });
    }
  }, [mainStateRef.current.viewState]);

  const changeState = (direction: boolean) => {
    if (mainStateRef.current.viewState > 1 && !direction) {
      singleChange('viewState', mainStateRef.current.viewState - 1);
    }
    if (direction) {
      singleChange('viewState', mainStateRef.current.viewState + 1);
    }
  };

  const isNextDisable = () => {
    if (mainStateRef.current.viewState === 1) {
      if (mainStateRef.current.form.name) return false;
    }
    if (mainStateRef.current.viewState === 2) {
      return false;
    }
    if (mainStateRef.current.viewState === 3) {
      return true;
    }
  };

  const isFormValide = () => {
    const exceptFields = Object.keys(validator);
    for (const i of exceptFields) {
      // @ts-ignore
      const tempRes = validator[i as keyof typeof validator](mainStateRef.current.form[i as keyof typeof validator]);
      if (!tempRes) return false;
    }
    return true;
  };

  const isSaveDisable = () => {
    if (mainStateRef.current.viewState < 3) return true;
    if (mainStateRef.current.form.name) return false;
    return true;
  };

  const singleChange = (name: string, value: any) => {
    if (name === 'createNewMeeting' && value === true) {
      setMainState(prevState => ({
        ...prevState,
        ['showMeetingParticipants']: true,
        [name]: value,
      }));
    } else {
      setMainState(prevState => ({
        ...prevState,
        [name]: value,
      }));
    }
  };

  const changeForm = (name: string, value: any) => {
    setMainState(prevState => ({
      ...prevState,
      form: {
        ...prevState.form,
        [name]: value,
      },
    }));
  };

  const onClose = async (getData?: boolean) => {
    await closeSnapshots();
    dispatch(setOpenNewScenarioWizardAction(false));
    getData && dispatch(getAgentsSchedule());
  };

  const onApplyScheduleScenario = async () => {
    const checkedItems = SchUtils.getSelectedElementsSyncForMultipleFilter(
      mainStateRef.current.localCheckedItems,
      fetchedData,
    );
    const payload: TCreateScenarioParams = {
      name: mainStateRef.current.form.name,
      comments: mainStateRef.current.form.comments,
      startDate: mainStateRef.current.form.dateFrom,
      endDate: mainStateRef.current.form.dateTo,
      endDateExt: mainStateRef.current.form.extendedDateTo,
      date: activeDate,
      type: 0,
      sites: [
        {
          siteId: checkedItems.siteId[0],
          activities: checkedItems.activities,
          agents: checkedItems.agentId.map(agentId => {
            return {
              type: 0,
              siteId: 0,
              agentId: agentId,
              profileAgentId: 0,
              profileId: 0,
              quota: 0,
              seniority: 0,
              bid: 0,
              position: 0,
              teamId: 0,
              profileTeamId: 0,
            };
          }),
        },
      ],
    };
    try {
      await restApi.createScenario(payload);
      onClose();
      dispatch(getScheduleScenarios());
    } catch (e: any) {
      logger.error(e);
      if (e.response && e.response.data && e.response.data.status && e.response.data.status.details.length > 0) {
        const exceptionParams: IErrorPopUpParam = {
          isOpen: true,
          data: '',
        };

        exceptionParams.data = e.response.data.status.details.join('\n');
        dispatch(openErrorPopUp(exceptionParams));
      } else {
        dispatch(
          addGlobalError({
            message: 'Internal error',
          }),
        );
      }
      setMainState(prevState => ({
        ...prevState,
        loading: false,
      }));
    }
    await onClose()
  };

  const closeSnapshots = async () => {
    return Promise.all([
      restApi.closeAgentDaySnapshot({ snapshotId: mainStateRef.current.agentSnapshot }),
      restApi.closeAgentDaySnapshot({ snapshotId: mainStateRef.current.agentSnapshot2 }),
    ]);
  };
  const onApplyWithBlock = () => {
    if (isFormValide()) {
      onApply();
    } else {
      validateFields();
      setInit(true);
    }
  };

  const onApply = async () => {
    setMainState(prevState => ({
      ...prevState,
      loading: true,
    }));
    const checkedItems = SchUtils.getSelectedElements(mainStateRef.current.localCheckedItems, fetchedData);
    if (checkedItems.agentId.length === 0) {
      checkedItems.agentId.push(...mainStateRef.current.agentFromSnapshot.map(el => el.agentId));
    }
  };

  return (
    <div
      className={styles.container}
      onClick={() => {
        dispatch(changeMeetingListVisible(false));
        dispatch(changeMeetingCalendarVisible(false));
      }}
    >
      <div className={styles.formWrapper}>
        <div className={styles.header}>
          <span>New Schedule Scenario Wizard</span>
          <Cross
            onClick={() => {
              onClose();
            }}
          />
        </div>
        <div className={styles.body}>
          {mainStateRef.current.viewState === 1 && (
            <View1CreateScenarioForm
              externalState={mainStateRef.current}
              changeState={changeForm}
              formValidator={valideRef.current}
            />
          )}
          {mainStateRef.current.viewState === 2 && (
            <View2SelectActivities
              mainState={mainStateRef.current}
              singleChange={singleChange}
              fetchedData={fetchedData}
              initChecked={mainStateRef.current.localCheckedItems}
              snapshotId={mainStateRef.current.agentSnapshot}
            />
          )}
          {mainStateRef.current.viewState === 3 && (
            <View3SelectAgents
              mainState={mainStateRef.current}
              singleChange={singleChange}
              fetchedData={fetchedData}
              initChecked={mainStateRef.current.localCheckedItems}
              snapshotId={mainStateRef.current.agentSnapshot}
            />
          )}
        </div>

        <div className={styles.footer}>
          {mainStateRef.current.viewState !== 10 && (
            <div className={styles.buttonWrap1} data-test={'modal-cancel-button'}>
              <Button
                innerText={'Cancel'}
                click={() => {
                  onClose();
                }}
                style={{ background: '#FFFFFF', color: '#0183F5', border: '0.5px solid #0183F5', borderRadius: '5px' }}
              />
            </div>
          )}
          {mainStateRef.current.viewState > 1 && mainStateRef.current.viewState !== 10 && (
            <div className={styles.buttonWrap2} data-test={'modal-previous-button'}>
              <Button
                innerText={'< Previous'}
                click={() => {
                  changeState(false);
                }}
                disable={false}
                type={'primary'}
              />
            </div>
          )}
          {mainStateRef.current.viewState < 4 &&
            mainStateRef.current.viewState !== 10 &&
            mainStateRef.current.viewState !== 3 && (
              <div className={styles.buttonWrap2} data-test={'modal-next-button'} style={{ marginLeft: '20px' }}>
                <Button
                  innerText={'Next >'}
                  click={() => {
                    changeState(true);
                  }}
                  disable={isNextDisable()}
                  type={'primary'}
                />
              </div>
            )}
          {mainStateRef.current.viewState !== 10 && (
            <div className={styles.buttonWrap2} data-test={'modal-save-changes-button'}>
              <Button
                innerText={'Apply'}
                click={() => {
                  mainStateRef.current.viewState === 3 ? onApplyScheduleScenario() : onApplyWithBlock();
                }}
                disable={isSaveDisable()}
                style={{ background: '#0183F5', color: '#FFFFFF', borderRadius: '5px' }}
              />
            </div>
          )}
          {mainStateRef.current.viewState === 10 && (
            <div className={styles.buttonWrap2} style={{ marginLeft: 'auto' }} data-test={'modal-save-changes-button'}>
              <Button
                innerText={'Finish'}
                click={() => {
                  const repeat =
                    activeDate === mainStateRef.current.cachedRequest.startDate ||
                    activeDate === mainStateRef.current.cachedRequest.endDate;
                  onClose(repeat);
                }}
                disable={false}
                style={{ background: '#0183F5', color: '#FFFFFF', borderRadius: '5px' }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewScenarioWizardPopup;
