import React, { FC, useEffect, useState } from 'react';
import { ReactComponent as ErrorSign } from './icons/sign_error.svg';
import styles from './index.module.scss';
import {IScheduleRebuildWizardPageProps, ISelectOptionsData, TimeZoneSelectorCurrentTimeZone} from '../interfaces';
import { ReOptimizationType } from '../../../../../api/ts/interfaces/config.payload';
import { DateObject, Value } from 'react-multi-date-picker';
import Checkbox from '../../../../ReusableComponents/CheckboxStyled';
import Switch from '../../../../ReusableComponents/Switch';
import TimeZoneSelector from './TimeZoneSelector';
import InputTimeShort from '../../../../ReusableComponents/InputTimeChort';
import useStateRef from 'react-usestateref';
import { TimePickerValue } from 'react-time-picker';
import { useSelector } from 'react-redux';
import { getTimeFormat } from '../../../../../redux/selectors/timeLineSelector';
import { clone } from 'ramda';
import { siteLocalTz } from '../constants';
import { ITimezone } from '../../../../../common/interfaces/config/ITimezone';
import CalendarPopups from '../../../../ReusableComponents/CalendarAndDatePicker/CalendarPopups';
import DateUtils from '../../../../../helper/dateUtils';

const SelectOptionsPage: FC<IScheduleRebuildWizardPageProps> = props => {
  const timeFormat = useSelector(getTimeFormat);
  const [optionState, setOptionState] = useState<ISelectOptionsData>(props.initState.data.selectOptionsPage);
  const [isShowErrorMessage, setIsShowErrorMessage] = useState<boolean>(!!optionState.rangeDate.length || !optionState.isRangeMode);
  const [, setStartTime, startTimeRef] = useStateRef<string>(props.initState.data.selectOptionsPage.startTime);

  useEffect(() => {
    props.onChangeState('selectOptionsPage', optionState);
  }, []);

  const onChangeState = (fieldName: keyof ISelectOptionsData, value: any) => {
    const _optionState = clone(optionState);
    //@ts-ignore
    _optionState[fieldName] = value;

    props.onChangeState('selectOptionsPage', _optionState);
    setOptionState(_optionState);
  };

  const isCheckedRangeMode = () => optionState.isRangeMode;

  const onChangeCalendar = (date: Value) => {
    if (!date || !Array.isArray(date)) return;

    const convertDate = (d: string | number | Date | DateObject) =>
      typeof d === 'string' ? new Date(d).getTime() : d.valueOf();

    const _rangeDate = date
      .sort((a, b) => convertDate(a) - convertDate(b))
      .map(d => DateUtils.convertDateObjectToDate(d.toString()));
    const rangeDate =
      _rangeDate.length === 2 && _rangeDate[0] !== _rangeDate[1] && isCheckedRangeMode()
        ? DateUtils.getDateListFromRange(_rangeDate[0], _rangeDate[_rangeDate.length - 1])
        : _rangeDate;

    setIsShowErrorMessage(true);
    onChangeState('rangeDate', rangeDate);
  };

  const onCheckRadioOptions = (option: ReOptimizationType) => {
    onChangeState('option', option);
  };

  const isCheckedRadioOptions = (option: ReOptimizationType): boolean => optionState.option === option;

  const isDisabledAffectingShiftOptions = (): boolean => optionState.option !== ReOptimizationType.SHIFTS;

  const onCheckedAffectingShiftOptions = (optionName: keyof ISelectOptionsData) => {
    if (isDisabledAffectingShiftOptions()) return;
    onChangeState(optionName, !optionState[optionName]);
  };

  const onCheckedOptions = (optionName: keyof ISelectOptionsData) => {
    onChangeState(optionName, !optionState[optionName]);
  };

  const isCheckedOptions = (optionName: keyof ISelectOptionsData): boolean => !!optionState[optionName];

  const onStartTime = (value: TimePickerValue) => {
    const strValue = value.toString();

    onChangeState('startTime', strValue);
    setStartTime(strValue);
  };

  const onSelectTimeZone = (selectedTz: ITimezone) => {
    onChangeState('selectedTz', selectedTz);
  };

  const getTZSelector = () => {
    return props.initState.data.selectSitesPage.filter(site => site.isChecked).length > 1 ?
        TimeZoneSelectorCurrentTimeZone.ctz_BU : TimeZoneSelectorCurrentTimeZone.ctz_LOCAL;
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.calendarAndTzWrapper}>
        <div className={styles.calendarContainer}>
          <CalendarPopups
            multiple={!isCheckedRangeMode()}
            range={isCheckedRangeMode()}
            value={optionState.rangeDate}
            onChange={onChangeCalendar}
            className={styles.customCalendar}
          />
        </div>
        <div className={styles.timeZoneWrapper}>
          <TimeZoneSelector
            initSelectedTZ={optionState.selectedTz}
            siteLocalTz={siteLocalTz}
            onChangeState={onSelectTimeZone}
            currentTimeZone={getTZSelector()}
          />
        </div>
      </div>
      <div className={styles.switchWrapper}>
        <div className={styles.switcher}>
          <Switch checked={isCheckedRangeMode()} onClick={() => onCheckedOptions('isRangeMode')} />
          <span>
            Range mode <i>(Ctrl)</i>
          </span>
          {isShowErrorMessage && !props.initState.isValidate ? (
            <div className={styles.validationError}>
              <span>{props.initState.errorMessage}</span>
              <ErrorSign width={15} height={15} />
            </div>
          ) : null}
        </div>
        <div className={styles.startTimeWrapper}>
          <span>Start time</span>
          <div className={styles.dataSpecifyTMWrapper}>
            <span>From</span>
            <InputTimeShort
              onChange={onStartTime}
              defaultTime={startTimeRef.current}
              format={timeFormat}
              isEndTime={true}
              disabled={false}
            />
          </div>
        </div>
      </div>
      <div className={styles.blockWrapper}>
        <div className={styles.blockTitle}>Rescheduling options</div>
        <div className={styles.checkBoxWrap} data-test={'move-schedule-items-checkbox'}>
          <Checkbox
            checked={isCheckedRadioOptions(ReOptimizationType.BREAKS)}
            onClick={() => onCheckRadioOptions(ReOptimizationType.BREAKS)}
          />
          <span onClick={() => onCheckRadioOptions(ReOptimizationType.BREAKS)} style={{ cursor: 'pointer' }}>
            Reschedule breaks only
          </span>
        </div>
        <div className={styles.checkBoxWrap} data-test={'move-schedule-items-checkbox'}>
          <Checkbox
            checked={isCheckedRadioOptions(ReOptimizationType.BREAKS_MEALS)}
            onClick={() => onCheckRadioOptions(ReOptimizationType.BREAKS_MEALS)}
          />
          <span onClick={() => onCheckRadioOptions(ReOptimizationType.BREAKS_MEALS)} style={{ cursor: 'pointer' }}>
            Reschedule breaks and meals only
          </span>
        </div>
        <div className={styles.checkBoxWrap} data-test={'move-schedule-items-checkbox'}>
          <Checkbox
            checked={isCheckedRadioOptions(ReOptimizationType.ACTIVITIES)}
            onClick={() => onCheckRadioOptions(ReOptimizationType.ACTIVITIES)}
          />
          <span onClick={() => onCheckRadioOptions(ReOptimizationType.ACTIVITIES)} style={{ cursor: 'pointer' }}>
            Reschedule activities, activity sets, or task sequences only
          </span>
        </div>
        <div className={styles.checkBoxWrap} data-test={'move-schedule-items-checkbox'}>
          <Checkbox
            checked={isCheckedRadioOptions(ReOptimizationType.BREAKS_MEALS_ACTIVITIES)}
            onClick={() => onCheckRadioOptions(ReOptimizationType.BREAKS_MEALS_ACTIVITIES)}
          />
          <span
            onClick={() => onCheckRadioOptions(ReOptimizationType.BREAKS_MEALS_ACTIVITIES)}
            style={{ cursor: 'pointer' }}
          >
            Reschedule breaks, meals, activities, activity sets, or task sequences without affecting shift start/end
            times
          </span>
        </div>
        <div className={styles.checkBoxWrap} data-test={'move-schedule-items-checkbox'}>
          <Checkbox
            checked={isCheckedRadioOptions(ReOptimizationType.SHIFTS)}
            onClick={() => onCheckRadioOptions(ReOptimizationType.SHIFTS)}
          />
          <span onClick={() => onCheckRadioOptions(ReOptimizationType.SHIFTS)} style={{ cursor: 'pointer' }}>
            Reschedule breaks, meals, activities, activity sets, task sequences. Shift start and/or end times might
            change
          </span>
        </div>
      </div>
      <div className={styles.blockWrapper_inline}>
        <div className={styles.checkBoxWrap} data-test={'move-schedule-items-checkbox'}>
          <Checkbox
            checked={isCheckedOptions('isShiftStartFixed')}
            onClick={() => onCheckedAffectingShiftOptions('isShiftStartFixed')}
            disabled={isDisabledAffectingShiftOptions()}
          />
          <span
            onClick={() => onCheckedAffectingShiftOptions('isShiftStartFixed')}
            style={isDisabledAffectingShiftOptions() ? { color: '#bcc4c8' } : { cursor: 'pointer' }}
          >
            Shift start time is fixed
          </span>
        </div>
        <div className={styles.checkBoxWrap} data-test={'move-schedule-items-checkbox'}>
          <Checkbox
            checked={isCheckedOptions('isShiftEndFixed')}
            onClick={() => onCheckedAffectingShiftOptions('isShiftEndFixed')}
            disabled={isDisabledAffectingShiftOptions()}
          />
          <span
            onClick={() => onCheckedAffectingShiftOptions('isShiftEndFixed')}
            style={isDisabledAffectingShiftOptions() ? { color: '#bcc4c8' } : { cursor: 'pointer' }}
          >
            Shift end time is fixed
          </span>
        </div>
        <div className={styles.checkBoxWrap} data-test={'move-schedule-items-checkbox'}>
          <Checkbox
            checked={isCheckedOptions('isPaidDurationFixed')}
            onClick={() => onCheckedAffectingShiftOptions('isPaidDurationFixed')}
            disabled={isDisabledAffectingShiftOptions()}
          />
          <span
            onClick={() => onCheckedAffectingShiftOptions('isPaidDurationFixed')}
            style={isDisabledAffectingShiftOptions() ? { color: '#bcc4c8' } : { cursor: 'pointer' }}
          >
            Paid duration is fixed
          </span>
        </div>
      </div>
      <div className={styles.blockWrapper}>
        <div className={styles.checkBoxWrap} data-test={'move-schedule-items-checkbox'}>
          <Checkbox
            checked={isCheckedOptions('isAdditionallyFilterAgents')}
            onClick={() => onCheckedOptions('isAdditionallyFilterAgents')}
          />
          <span
            style={{ cursor: 'pointer' }}
            onClick={() => onCheckedOptions('isAdditionallyFilterAgents')}
          >
            Additionally filter agents by contracts
          </span>
        </div>
      </div>
    </div>
  );
};

export default SelectOptionsPage;
