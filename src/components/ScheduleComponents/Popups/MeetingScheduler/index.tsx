import React, { useEffect } from 'react';
import useStateRef from 'react-usestateref';
import { useSelector } from 'react-redux';

import styles from './meetingScheduler.module.scss';
import { getActiveDateSelector, getSelectedTzSelector } from '../../../../redux/selectors/controlPanelSelector';
import { IBusinessUnits } from '../../../../common/interfaces/config';

import {
  getAgentsSchedule,
  setOpenMeetingSchedulerAction,
  changeMeetingListVisible,
  changeMeetingCalendarVisible,
  openErrorPopUp,
} from '../../../../redux/actions/timeLineAction';
import Button from '../../../ReusableComponents/button';
import SchUtils from '../../../../helper/schedule/SchUtils';
import Utils from '../../../../helper/utils';
import { getCheckedItems, getFilterData } from '../../../../redux/selectors/filterSelector';

import SchMeetingScheduler from '../../../../helper/schedule/SchMeetingScheduler';
import { useAppDispatch } from '../../../../redux/hooks';

import restApi from '../../../../api/rest';

import { addGlobalError } from '../../../../redux/actions/globalErrorActions';

import { ITimezone } from '../../../../common/interfaces/config/ITimezone';
import { IResponseGetMeetingFromSnapshotData } from '../../../../api/ts/interfaces/getMeetingtFromSnapshot';

import View1Meetings from './view/meetingsList';
import View2SelectAgents from './view/selectAgents';
import View3SelectDate from './view/selectDate';
import View4CreateMeetingForm from './view/createMeetingForm';
import { IFindShiftItemsPayload } from '../../../../api/ts/interfaces/config.payload';
import { IPayloadInserNewMeeting } from '../../../../api/ts/interfaces/insertNewMeeting';
import { IPayloadScheduleMeeting, IResponseScheduleMeeting } from '../../../../api/ts/interfaces/scheduleMeeting';
import { ICfgException } from '../../../../common/models/cfg.exeption';
import ReviewWarnings from './view/reviewWarnings';
import { IResponseFindAgentsFromSnapshotData } from '../../../../api/ts/interfaces/findAgentsFromSnapshot';
import logger from '../../../../helper/logger';
import { Cross } from '../../../../static/svg';
import { IErrorPopUpParam } from '../../../../redux/ts/intrefaces/timeLine';
import SchMultipleItems from '../../../../helper/schedule/SchMultipleItems';

export interface IMainStateForm {
  name: string;
  localTz: ITimezone;
  activeException: ICfgException | null;
  dateFrom: string;
  dateTo: string;
  includeLastDay: boolean;
  weekDays: boolean[];
  startTime: string;
  endTime: string;
  duration: string;
  groupingAgents: boolean[];
  minNumberGroups: number;
  minGroupSize: number;
  minPercentageAttendees: number | string;
  maxNumberOfGroups: number;
  maxGroupSize: number;
}

export interface IMainState {
  loading: boolean;
  viewState: number;
  createNewMeeting: boolean;
  showMeetingParticipants: boolean;
  autoCommitChanges: boolean;
  dateRange: string[];
  meetings: IResponseGetMeetingFromSnapshotData[];
  selectedMeetingId: number;
  rangeOrSingle: boolean;
  agentSnapshot: string;
  agentSnapshotCount: number;
  agentFromSnapshot: IResponseFindAgentsFromSnapshotData[];
  meetingSnapshot: string;
  agentSnapshot2: string;
  localCheckedItems: IBusinessUnits;
  emptySites:number[];
  exceptions: ICfgException[];
  agentsData: any[];
  agentsErrors: any[];
  mainError: string[];
  cachedRequest: any;
  form: IMainStateForm;
}

export interface IFormValidation {
  name: boolean;
  activeException: boolean;
  dateFrom: boolean;
  dateTo: boolean;
  includeLastDay: boolean;
  weekDays: boolean;
  startTime: boolean;
  endTime: boolean;
  duration: boolean;
  minNumberGroups: boolean;
  minGroupSize: boolean;
  minPercentageAttendees: boolean;
  maxNumberOfGroups: boolean;
  maxGroupSize: boolean;
}

const MeetingScheduler = () => {
  const initChecked = useSelector(getCheckedItems);
  const fetchedData: IBusinessUnits = useSelector(getFilterData);
  const selectedTZ = useSelector(getSelectedTzSelector);
  const activeDate = useSelector(getActiveDateSelector);

  const dispatch = useAppDispatch();

  const [, setMainState, mainStateRef] = useStateRef<IMainState>({
    loading: true,
    viewState: 1,
    createNewMeeting: false,
    showMeetingParticipants: true,
    autoCommitChanges: true,
    dateRange: [],
    meetings: [],
    selectedMeetingId: -1,
    rangeOrSingle: true,
    agentSnapshot: '',
    agentSnapshotCount: 0,
    agentFromSnapshot: [],
    meetingSnapshot: '',
    agentSnapshot2: '',
    localCheckedItems: initChecked,
    emptySites:[],
    exceptions: [],
    agentsData: [],
    agentsErrors: [],
    mainError: [],
    cachedRequest: {},
    form: {
      name: '',
      localTz: selectedTZ,
      activeException: null,
      dateFrom: activeDate,
      dateTo: activeDate,
      includeLastDay: true,
      weekDays: [true, true, true, true, true, true, true],
      startTime: '00:00',
      endTime: '00:00',
      duration: '00:00',
      groupingAgents: [false, true, false],
      minNumberGroups: 0,
      minGroupSize: 0,
      minPercentageAttendees: '',
      maxNumberOfGroups: 0,
      maxGroupSize: 0,
    },
  });

  const [, setValid, valideRef] = useStateRef<IFormValidation>({
    name: true,
    activeException: true,
    dateFrom: true,
    dateTo: true,
    includeLastDay: true,
    weekDays: true,
    startTime: true,
    endTime: true,
    duration: true,
    minNumberGroups: true,
    minGroupSize: true,
    minPercentageAttendees: true,
    maxNumberOfGroups: true,
    maxGroupSize: true,
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
      // @ts-ignore
      newValidatRes[i] = validator[i as keyof typeof validator](mainStateRef.current.form[i as keyof typeof validator]);
    }
    setValid(prevState => ({
      ...prevState,
      ...newValidatRes,
    }));
  };

  const validator = {
    minNumberGroups: (val: number): boolean => {
      if (mainStateRef.current.form.groupingAgents[2]) {
        return +val <= mainStateRef.current.form.maxNumberOfGroups && +val > 0;
      }
      return true;
    },
    minGroupSize: (val: number): boolean => {
      if (mainStateRef.current.form.groupingAgents[2]) {
        return (+val <= mainStateRef.current.form.maxGroupSize && +val > 0);
      }
      return true;
    },
    minPercentageAttendees: (val: number): boolean => {
      if (mainStateRef.current.form.groupingAgents[1]) {
        const _val = !val ? 100 : val;
        return +_val > 0;
      }
      return true;
    },
    maxNumberOfGroups: (val: number): boolean => {
      if (mainStateRef.current.form.groupingAgents[2]) {
        return mainStateRef.current.form.minNumberGroups <= +val && +val > 0;
      }
      return true;
    },
    maxGroupSize: (val: number): boolean => {
      if (mainStateRef.current.form.groupingAgents[2]) {
        return mainStateRef.current.form.minGroupSize <= +val && +val > 0;
      }
      return true;
    },
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
    startTime: (val: string): boolean => {
      if(isMultidate(mainStateRef.current.form.dateFrom,mainStateRef.current.form.dateTo) && SchMeetingScheduler.toMinutes(val)===0 && SchMeetingScheduler.toMinutes(mainStateRef.current.form.endTime)===0){
        return true;
      }
      return SchMeetingScheduler.toMinutes(val) < SchMeetingScheduler.toMinutes(mainStateRef.current.form.endTime);
    },
    endTime: (val: string): boolean => {
      if(isMultidate(mainStateRef.current.form.dateFrom,mainStateRef.current.form.dateTo) && SchMeetingScheduler.toMinutes(val)===0 && SchMeetingScheduler.toMinutes(mainStateRef.current.form.startTime)===0){
        return true;
      }
      return SchMeetingScheduler.toMinutes(val) > SchMeetingScheduler.toMinutes(mainStateRef.current.form.startTime);
    },
    duration: (val: string): boolean => {
      if (SchMeetingScheduler.toMinutes(val) === 0) return false;
      if(isMultidate(mainStateRef.current.form.dateFrom,mainStateRef.current.form.dateTo) && SchMeetingScheduler.toMinutes(mainStateRef.current.form.endTime)===0 && SchMeetingScheduler.toMinutes(mainStateRef.current.form.startTime)===0){
        return true;
      }
      return (
        SchMeetingScheduler.toMinutes(mainStateRef.current.form.endTime) -
          SchMeetingScheduler.toMinutes(mainStateRef.current.form.startTime) >=
        SchMeetingScheduler.toMinutes(val)
      );
    },
    weekDays: (val: boolean[]): boolean => {
      return val.filter(el => el).length !== 0;
    },
  };

  useEffect(() => {
    if (mainStateRef.current.viewState === 1 && mainStateRef.current.meetings.length === 0) {
      singleChange('loading', true);
      const checkedItems = SchUtils.getSelectedElementsSyncForMultipleFilter(
        mainStateRef.current.localCheckedItems,
        fetchedData,
      );

      const payloadSnapshot = SchMeetingScheduler.prepareDataForOpenAgentSnapshot(checkedItems, activeDate);

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
        .then(meetingSnapshot => {
          singleChange('meetingSnapshot', meetingSnapshot.snapshotId);
          const payloadMeetingFromSnapshot = SchMeetingScheduler.prepareDataForGetMeetingFromSnapshot(
            meetingSnapshot.snapshotId,
            meetingSnapshot.totalCount,
          );
          return restApi.getMeetingFromSnapshot(payloadMeetingFromSnapshot);
        })
        .then(resp => {
          if (resp.data) {
            return resp.data;
          } else {
            return Promise.reject('Can not get meetings');
          }
        })
        .then(meetings => {
          setMainState(prevState => ({
            ...prevState,
            meetings: meetings,
            loading: false,
          }));
          return Promise.resolve();
        })
        .then(() => {
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
            const emptySites= SchMultipleItems.getEmptySite(fetchedData,initChecked,agentFromSnapshot.data);
            singleChange('agentFromSnapshot', agentFromSnapshot.data);
            singleChange('emptySites', emptySites);

            return Promise.resolve();
          } else {
            return Promise.reject('Can not get agent snapshotId');
          }
        })
        .catch(err => {
          logger.error(err);
        })
        .finally(() => singleChange('loading', false));
    }
    if (mainStateRef.current.viewState === 4 && mainStateRef.current.exceptions.length === 0) {
      singleChange('loading', true);
      const checkedItems = SchUtils.getSelectedElementsSyncForMultipleFilter(
        mainStateRef.current.localCheckedItems,
        fetchedData,
      );
      const payload = {
        agentId: checkedItems.agentId,
        siteId: checkedItems.siteId,
        teamId: checkedItems.teamId,
        useAgentFilter: true,
      };
      restApi
        .findExceptions(payload as IFindShiftItemsPayload)
        .then(resp => {
          if (resp.data) {
            return resp.data;
          } else {
            return Promise.reject('Can not get exceptions');
          }
        })
        .then(exceptions => {
          const filteredExceptions = exceptions.filter(el => el.isUsedInMeeting);
          setMainState(prevState => ({
            ...prevState,
            exceptions: filteredExceptions,
          }));
        })
        .catch(err => {
          logger.error(err);
        }).finally(() => singleChange('loading', false));
    }
  }, [mainStateRef.current.viewState]);

  const changeState = (direction: boolean) => {
    if (mainStateRef.current.viewState > 1 && !direction) {
      if (mainStateRef.current.viewState === 2) {
        singleChange('viewState', 1);
        return false;
      }
      if (mainStateRef.current.viewState === 3 && !mainStateRef.current.showMeetingParticipants) {
        singleChange('viewState', 1);
        return false;
      }
      if (mainStateRef.current.viewState === 3 && mainStateRef.current.showMeetingParticipants) {
        singleChange('viewState', 2);
        return false;
      }
      if (mainStateRef.current.viewState === 4 && mainStateRef.current.showMeetingParticipants) {
        singleChange('viewState', 2);
        return false;
      }
      if (mainStateRef.current.viewState === 4 && !mainStateRef.current.showMeetingParticipants) {
        singleChange('viewState', 1);
        return false;
      }
    }
    if (direction) {
      let state = 1;
      if (mainStateRef.current.viewState === 1 && mainStateRef.current.showMeetingParticipants) {
        state = 2;
      }
      if (
        mainStateRef.current.viewState === 1 &&
        !mainStateRef.current.showMeetingParticipants &&
        mainStateRef.current.selectedMeetingId !== -1 &&
        !mainStateRef.current.createNewMeeting
      ) {
        state = 3;
      }
      if (
        mainStateRef.current.viewState === 2 &&
        mainStateRef.current.selectedMeetingId !== -1 &&
        !mainStateRef.current.createNewMeeting
      ) {
        state = 3;
      }
      if (
        mainStateRef.current.viewState === 2 &&
        mainStateRef.current.showMeetingParticipants &&
        mainStateRef.current.createNewMeeting
      ) {
        state = 4;
      }
      if (
        mainStateRef.current.viewState === 1 &&
        !mainStateRef.current.showMeetingParticipants &&
        mainStateRef.current.createNewMeeting
      ) {
        state = 4;
      }
      singleChange('viewState', state);
    }
  };

  const isNextDisable = () => {
    if (mainStateRef.current.viewState !== 1) {
      if (mainStateRef.current.viewState === 2) {
        if(Object.keys(mainStateRef.current.localCheckedItems).length===0) return true;
        return false;
      }
      if (mainStateRef.current.viewState === 3) {
        return true;
      }
    } else {
      if (mainStateRef.current.createNewMeeting) return false;
      if (!mainStateRef.current.createNewMeeting && mainStateRef.current.selectedMeetingId !== -1) return false;
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
    if (mainStateRef.current.viewState === 3 && mainStateRef.current.dateRange.length > 1) return false;
    if (mainStateRef.current.viewState === 4) {
      if (mainStateRef.current.loading) return true;
      return false;
    }
    return true;
  };
  const isMultidate = (start:string, end:string):boolean=>{
    const to = new Date(start).getTime();
    const from = new Date(end).getTime();
    return from !== to;
  }

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
    singleChange('loading', true);
    await closeSnapshots();
    singleChange('loading', true);
    dispatch(setOpenMeetingSchedulerAction(false));
    getData && await dispatch(getAgentsSchedule());
  };

  const onApplyScheduleMeeting = async () => {
    const payload: IPayloadScheduleMeeting = {
      scheduleId: 0,
      meetingId: mainStateRef.current.selectedMeetingId,
      startDate: mainStateRef.current.dateRange[0],
      endDate: mainStateRef.current.dateRange[mainStateRef.current.dateRange.length - 1],
      ignoreWarnings: true,
      autoCommit: true,
    };
    try {
      singleChange('loading', true);
      const resp = await restApi.scheduleMeeting(payload);
      onCheckWarnings(resp, payload);
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
    } finally {
      singleChange('loading', false);
    }
  };

  const closeSnapshots = async () => {
    return Promise.all([
      restApi.closeAgentDaySnapshot({ snapshotId: mainStateRef.current.agentSnapshot }),
      restApi.closeAgentDaySnapshot({ snapshotId: mainStateRef.current.meetingSnapshot }),
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
    singleChange('loading', true);
    const checkedItems = SchUtils.getSelectedElements(mainStateRef.current.localCheckedItems, fetchedData, true, true);

    if (checkedItems.agentId.length === 0) {
      checkedItems.agentId.push(...mainStateRef.current.agentFromSnapshot.map(el => el.agentId));
    }
    const payload: IPayloadInserNewMeeting = {
      meeting: {
        id: 0,
        name: mainStateRef.current.form.name,
        buId: checkedItems.buId[0],
        siteId: checkedItems.siteId,
        exceptionTypeId: mainStateRef.current.form.activeException?.id || 0,
        startDate: mainStateRef.current.form.dateFrom,
        startTime: {
          hours: Number.parseInt(mainStateRef.current.form.startTime.split(':')[0]),
          minutes: Number.parseInt(mainStateRef.current.form.startTime.split(':')[1]),
        },
        endDate: mainStateRef.current.form.dateTo,
        endTime: {
          hours: Number.parseInt(mainStateRef.current.form.endTime.split(':')[0]),
          minutes: Number.parseInt(mainStateRef.current.form.endTime.split(':')[1]),
        },
        duration: SchMeetingScheduler.toMinutes(mainStateRef.current.form.duration),
        weekDays: mainStateRef.current.form.weekDays,
        isUseMinmaxGroup: mainStateRef.current.form.groupingAgents[2],
        isIndividual: mainStateRef.current.form.groupingAgents[0],
        recurrenceType: 0,
        timezoneId: mainStateRef.current.form.localTz.timezoneId,
        maxShortagePerc: 0,
        maxSurplusPerc: 0,
        isUseTotalMinutes: false,
        totalMinutes: 0,
        minGroup: Utils.stringChecker(mainStateRef.current.form.minGroupSize),
        maxGroup: Utils.stringChecker(mainStateRef.current.form.maxGroupSize),
        minAttendeesPerc: Utils.stringChecker(mainStateRef.current.form.minPercentageAttendees || 100), //Min Percentage Attendees:
        occurences: 0,
        recurrenceMultiplier: 0,
        minOccurences: Utils.stringChecker(mainStateRef.current.form.minNumberGroups),
        maxOccurences: Utils.stringChecker(mainStateRef.current.form.maxNumberOfGroups),
        meetingAgents: checkedItems.agentId,
        timestamp: 0,
      },
      ignoreWarnings: false,
    };
    try {
      const response = await restApi.setNewMeeting(payload);
      if (response.data && response.data.success) {
        const payload: IPayloadScheduleMeeting = {
          scheduleId: 0,
          meetingId: response.data.id,
          startDate: mainStateRef.current.form.dateFrom,
          endDate: mainStateRef.current.form.dateTo,
          ignoreWarnings: false,
          autoCommit: true,
        };
        const scheduleResp = await restApi.scheduleMeeting(payload);
        await onCheckWarnings(scheduleResp, payload);
      }
    } catch (e: any) {
      if (e.response && e.response.data && e.response.data.status && e.response.data.status.details) {
        const exceptionParams: IErrorPopUpParam = {
          isOpen: true,
          data: '',
        };

        exceptionParams.data = e.response.data.status.details.map((d: any) => d.message ? d.message : d).join('\n');
        if (!exceptionParams.data.length) {
          exceptionParams.data = e.response.data.status.details[0];
        }
        dispatch(openErrorPopUp(exceptionParams));
      } else {
        dispatch(
          addGlobalError({
            message: 'Internal error',
          }),
        );
      }
    } finally {
      singleChange('loading', false);
    }
  };

  const onCheckWarnings = async (response: IResponseScheduleMeeting, previousPayload: IPayloadScheduleMeeting) => {
    if (
      response?.data?.success &&
      response?.errors?.validations &&
      (response?.errors?.validations.length > 0 || response.errors.warnings.length > 0)
    ) {
      singleChange('loading', true);
      const data: any[] = response.errors.validations;
      const errorAgentsId = data.map((el: any) => el.agentId);
      const checkedItems = SchUtils.getSelectedElementsSyncForMultipleFilter(
        mainStateRef.current.localCheckedItems,
        fetchedData,
      );
      try {
        const agentsResponse = await restApi.findAgents({
          buId: checkedItems.buId,
          siteId: checkedItems.siteId,
          teamId: checkedItems.teamId,
          agentId: errorAgentsId,
        });
        const agentsData = agentsResponse.data.filter((el: any) => errorAgentsId.includes(el.agentId));
        setMainState(prevState => ({
          ...prevState,
          viewState: 10,
          agentsData,
          agentsErrors: data,
          mainError: response.errors.warnings || [],
          cachedRequest: previousPayload,
        }));
      } finally {
        singleChange('loading', false);
      }
      return;
    }
    const repeat = activeDate === previousPayload.startDate || activeDate === previousPayload.endDate;
    onClose(repeat);
  };

  const isDisabledButtons = () => mainStateRef.current.loading;

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
          <span>Meeting Scheduler</span>
          <Cross
            onClick={() => {
              onClose();
            }}
          />
        </div>
        <div className={styles.body}>
          {mainStateRef.current.viewState === 1 && (
            <View1Meetings externalState={mainStateRef.current} changeState={singleChange} />
          )}
          {mainStateRef.current.viewState === 2 && (
            <View2SelectAgents
              mainState={mainStateRef.current}
              singleChange={singleChange}
              fetchedData={fetchedData}
              initChecked={mainStateRef.current.localCheckedItems}
              snapshotId={mainStateRef.current.agentSnapshot}
              blockChecking={!mainStateRef.current.createNewMeeting}
            />
          )}
          {mainStateRef.current.viewState === 3 && (
            <View3SelectDate mainStateRef={mainStateRef} singleChange={singleChange} />
          )}
          {mainStateRef.current.viewState === 4 && (
            <View4CreateMeetingForm
              externalState={mainStateRef.current}
              changeState={changeForm}
              formValidator={valideRef.current}
            />
          )}
          {mainStateRef.current.viewState === 10 && (
            <ReviewWarnings
              agentsErrors={mainStateRef.current.agentsErrors}
              agentsData={mainStateRef.current.agentsData}
              mainErrors={mainStateRef.current.mainError}
            />
          )}
          {/*{mainState.viewState === 3 && getView3()}*/}
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
                disable={isDisabledButtons()}
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
                disable={isDisabledButtons()}
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
                  disable={isNextDisable() || isDisabledButtons()}
                  type={'primary'}
                />
              </div>
            )}
          {mainStateRef.current.viewState !== 10 && (
            <div className={styles.buttonWrap2} data-test={'modal-save-changes-button'}>
              <Button
                innerText={'Apply'}
                click={() => {
                  mainStateRef.current.viewState === 3 ? onApplyScheduleMeeting() : onApplyWithBlock();
                }}
                disable={isSaveDisable() || isDisabledButtons()}
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
                disable={isDisabledButtons()}
                style={{ background: '#0183F5', color: '#FFFFFF', borderRadius: '5px' }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetingScheduler;
