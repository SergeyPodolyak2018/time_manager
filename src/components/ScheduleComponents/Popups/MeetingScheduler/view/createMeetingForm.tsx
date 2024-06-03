import React, { FC } from 'react';

import styles from '../meetingScheduler.module.scss';
import classnames from 'classnames';
import Checkbox from '../../../../ReusableComponents/CheckboxStyled';
import InputRadio from '../../../../ReusableComponents/InputRadio';
import InputText from '../../../../ReusableComponents/inputText';
import InputNumber from '../../../../ReusableComponents/inputNumber';
import UniversalListById from '../../../../ReusableComponents/UniversalListById';
import TimeZoneList from '../../../../ReusableComponents/TimeZoneList';
import { IMainState, IFormValidation } from '..';
import { useSelector } from 'react-redux';
import { getTimezonesSelector } from '../../../../../redux/selectors/controlPanelSelector';
import datePickerStyles from '../../NewMultipleWizardMenu/multipleStates/EditMultiple/datePicker.module.scss';
import DatePickerPopups from '../../../../ReusableComponents/CalendarAndDatePicker/DatePickerPopups';
import { dayNameLocalFull } from '../../../../../common/constants';
import InputTimeShort from '../../../../ReusableComponents/InputTimeChort';
import { getTimeFormat } from '../../../../../redux/selectors/timeLineSelector';
import { ICfgException } from '../../../../../common/models/cfg.exeption';
import Spiner from '../../../../ReusableComponents/spiner';

interface IView2SetTime {
  changeState: (...args: any[]) => void;
  externalState: IMainState;
  formValidator: IFormValidation;
}

const View4CreateMeetingForm: FC<IView2SetTime> = ({ changeState, externalState, formValidator }) => {
  const timezones = useSelector(getTimezonesSelector);
  const timeFormat = useSelector(getTimeFormat);

  const changeOutState = (name: string, value: any) => {
    changeState(name, typeconverter[name as keyof typeof typeconverter](value));
  };

  const stringNumberParser = (val: string | number): number => (typeof val === 'number' ? val : parseInt(val));

  const typeconverter = {
    minNumberGroups: stringNumberParser,
    minGroupSize: stringNumberParser,
    minPercentageAttendees: stringNumberParser,
    maxNumberOfGroups: stringNumberParser,
    maxGroupSize: stringNumberParser,
    name: (text: string) => text,
    activeException: (data: ICfgException) => data,
    dateFrom: (text: string) => text,
    dateTo: (text: string) => text,
    startTime: (text: string) => text,
    endTime: (text: string) => text,
    duration: (text: string) => text,
  };

  const changeWeekday = (index: number) => {
    const newDays = [...externalState.form.weekDays];
    newDays[index] = !externalState.form.weekDays[index];
    changeState('weekDays', newDays);
  };
  const changeGroup = (index: number) => {
    const newDays = [false, false, false];
    if (!externalState.form.groupingAgents[index]) {
      newDays[index] = true;
      changeState('groupingAgents', newDays);
    }
  };

  return (
    <>
      {externalState.loading ? (
        <Spiner />
      ) : (
        <>
          {/*=================First layer=======================*/}
          <div className={styles.fieldsContainer} style={{ height: '101px' }}>
            <div className={styles.fieldsContainer__Header}>
              <span>Properties</span>
            </div>
            <div
              className={classnames({
                [styles.fieldsContainer__Body]: true,
                [styles.height40]: true,
                [styles.grid1]: true,
              })}
            >
              <div
                className={classnames({
                  [styles.insertScheduleView1__text]: true,
                  [styles.insertScheduleView1__checkboxContainer]: true,
                })}
              >
                <label
                  className={styles.insertScheduleView1__checkboxContainer__text}
                  htmlFor={'meetingName'}
                  onClick={() => changeState('createNewMeeting', !externalState.createNewMeeting)}
                >
                  Meeting Name:
                </label>
                <InputText
                  id={'meetingName'}
                  change={name => {
                    changeOutState('name', name);
                  }}
                  value={externalState.form.name}
                  removeSpecialCharacters={true}
                  placeHolder={'Input a Meeting Name'}
                  style={{ width: '200px', marginLeft: '8px' }}
                  notValid={!formValidator.name}
                />
              </div>
              <div
                className={classnames({
                  [styles.insertScheduleView1__text]: true,
                  [styles.insertScheduleView1__checkboxContainer]: true,
                })}
              >
                <label
                  className={styles.insertScheduleView1__checkboxContainer__text}
                  htmlFor={'meetingName'}
                  onClick={() => changeState('createNewMeeting', !externalState.createNewMeeting)}
                >
                  Exception Type:
                </label>
                <div
                  className={classnames({
                    [styles.listContainer]: true,
                  })}
                  style={{ width: '200px', marginLeft: '6px' }}
                >
                  <UniversalListById
                    list={externalState.exceptions}
                    active={externalState.form.activeException}
                    clickOn={exception => {
                      changeOutState('activeException', exception);
                    }}
                    placeHolder={'Select Exception Type'}
                    notValid={!formValidator.activeException}
                  />
                </div>
              </div>
              <div
                className={classnames({
                  [styles.insertScheduleView1__text]: true,
                  [styles.insertScheduleView1__checkboxContainer]: true,
                })}
              >
                <div className={styles.listContainer}>
                  <TimeZoneList
                    allTimezones={timezones}
                    activeTimeZone={externalState.form.localTz}
                    setTimezone={data => changeState('localTz', data)}
                  />
                </div>
              </div>
            </div>
          </div>
          {/*=================Second layer=======================*/}
          <div className={styles.fieldsContainer} style={{ height: '134px' }}>
            <div className={styles.fieldsContainer__Header}>
              <span>Dates and Recurrence Rules</span>
            </div>
            <div
              className={classnames({
                [styles.fieldsContainer__Body]: true,
                [styles.height40]: true,
                [styles.grid2]: true,
              })}
            >
              <div
                className={classnames({
                  [styles.insertScheduleView1__text]: true,
                  [styles.insertScheduleView1__checkboxContainer]: true,
                })}
              >
                <label
                  className={styles.insertScheduleView1__checkboxContainer__text}
                  htmlFor={'dateFrom'}
                  style={{ marginRight: '8px' }}
                >
                  Date from:
                </label>

                <DatePickerPopups
                  id={'dateFrom'}
                  disabled={false}
                  className={datePickerStyles.datePicker}
                  containerClassName={`${datePickerStyles.datePicker__container} ${datePickerStyles.datePicker__container__small}`}
                  inputClass={classnames({
                    [datePickerStyles.datePicker__input]: true,
                    [datePickerStyles.datePicker__input__small]: true,
                    [datePickerStyles.datePicker__input__valid]: !formValidator.dateFrom,
                  })}
                  value={externalState.form.dateFrom}
                  onChange={date => {
                    date && changeOutState('dateFrom', date.toString());
                  }}
                />
              </div>

              <div
                className={classnames({
                  [styles.insertScheduleView1__text]: true,
                  [styles.insertScheduleView1__checkboxContainer]: true,
                })}
              >
                <label
                  className={styles.insertScheduleView1__checkboxContainer__text}
                  htmlFor={'dateTo'}
                  style={{ marginRight: '8px' }}
                >
                  Date to:
                </label>

                <DatePickerPopups
                  id={'dateTo'}
                  disabled={false}
                  className={datePickerStyles.datePicker}
                  containerClassName={`${datePickerStyles.datePicker__container} ${datePickerStyles.datePicker__container__small}`}
                  inputClass={classnames({
                    [datePickerStyles.datePicker__input]: true,
                    [datePickerStyles.datePicker__input__small]: true,
                    [datePickerStyles.datePicker__input__valid]: !formValidator.dateTo,
                  })}
                  value={externalState.form.dateTo}
                  onChange={date => {
                    date && changeOutState('dateTo', date.toString());
                  }}
                />
                <div className={styles.insertScheduleView1__checkboxContainer} style={{ marginLeft: '16px' }}>
                  <Checkbox
                    checked={externalState.form.includeLastDay}
                    onClick={() => changeState('includeLastDay', !externalState.form.includeLastDay)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <label
                    htmlFor={'createNewMeeting'}
                    onClick={() => changeState('includeLastDay', !externalState.form.includeLastDay)}
                    style={{ marginLeft: '8px' }}
                  >
                    Include last day
                  </label>
                </div>
              </div>
            </div>
            <div
              className={classnames({
                [styles.fieldsContainer__Body]: true,
                [styles.height17]: true,
                [styles.grid3]: true,
              })}
            >
              <span>Days of the week:</span>
              {externalState.form.weekDays.map((element, index) => {
                return (
                  <div
                    className={styles.insertScheduleView1__checkboxContainer}
                    key={`${dayNameLocalFull[index]}_${index}`}
                  >
                    <Checkbox
                      id={`weekDay_${dayNameLocalFull[index]}`}
                      checked={element}
                      onClick={() => changeWeekday(index)}
                      style={{ width: '16px', height: '16px' }}
                      error={!formValidator.weekDays}
                    />
                    <label
                      htmlFor={`weekDay_${dayNameLocalFull[index]}`}
                      onClick={() => changeWeekday(index)}
                      style={{ marginLeft: '8px' }}
                    >
                      {dayNameLocalFull[index]}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
          {/*=================Third layer=======================*/}
          <div className={styles.fieldsContainer} style={{ height: '103px' }}>
            <div className={styles.fieldsContainer__Header}>
              <span>Time and Duration</span>
            </div>
            <div
              className={classnames({
                [styles.fieldsContainer__Body]: true,
                [styles.height40]: true,
                [styles.grid4]: true,
              })}
            >
              <div
                className={classnames({
                  [styles.insertScheduleView1__text]: true,
                  [styles.insertScheduleView1__checkboxContainer]: true,
                })}
              >
                <label
                  className={styles.insertScheduleView1__checkboxContainer__text}
                  htmlFor={'startTime'}
                  style={{ marginRight: '8px' }}
                >
                  Earliest Start Time:
                </label>

                <InputTimeShort
                  id={'startTime'}
                  classNames={[styles.timePicker, !formValidator.startTime ? styles.notValid : styles.focusMain]}
                  onChange={val => changeState('startTime', val)}
                  defaultTime={externalState.form.startTime}
                  format={timeFormat}
                  isEndTime={false}
                  disabled={false}
                  dataTest={'meeting-scheduler-start-time'}
                />
              </div>
              <div
                className={classnames({
                  [styles.insertScheduleView1__text]: true,
                  [styles.insertScheduleView1__checkboxContainer]: true,
                })}
              >
                <label
                  className={styles.insertScheduleView1__checkboxContainer__text}
                  htmlFor={'endTime'}
                  style={{ marginRight: '8px' }}
                >
                  Latest End Time:
                </label>

                <InputTimeShort
                  id={'endTime'}
                  classNames={[styles.timePicker, !formValidator.startTime ? styles.notValid : styles.focusMain]}
                  onChange={val => changeState('endTime', val)}
                  defaultTime={externalState.form.endTime}
                  format={timeFormat}
                  isEndTime={false}
                  disabled={false}
                  dataTest={'meeting-scheduler-end-time'}
                />
              </div>
              <div
                className={classnames({
                  [styles.insertScheduleView1__text]: true,
                  [styles.insertScheduleView1__checkboxContainer]: true,
                })}
              >
                <label
                  className={styles.insertScheduleView1__checkboxContainer__text}
                  htmlFor={'duration'}
                  style={{ marginRight: '8px' }}
                >
                  Meeting Duration:
                </label>

                <InputTimeShort
                  id={'duration'}
                  classNames={[
                    styles.timePicker,
                    styles.timePicker2,
                    !formValidator.duration ? styles.notValid : styles.focusMain,
                  ]}
                  onChange={val => changeState('duration', val)}
                  defaultTime={externalState.form.duration}
                  format={'24hours'}
                  isEndTime={false}
                  disabled={false}
                  dataTest={'meeting-scheduler-duration'}
                />
              </div>
            </div>
          </div>
          {/*=================Fourth layer=======================*/}
          <div className={styles.fieldsContainer} style={{ height: '173px', borderBottom: 'none' }}>
            <div className={styles.fieldsContainer__Header}>
              <span>Meeting Type</span>
            </div>
            <div
              className={classnames({
                [styles.fieldsContainer__Body]: true,
                [styles.height17]: true,
                [styles.grid5]: true,
              })}
            >
              <div
                className={classnames({
                  [styles.insertScheduleView1__text]: true,
                  [styles.insertScheduleView1__checkboxContainer]: true,
                })}
              >
                <InputRadio
                  id={'singleAgent'}
                  onClick={() => changeGroup(0)}
                  checked={externalState.form.groupingAgents[0]}
                />
                <label style={{ marginLeft: '5px' }} htmlFor={'singleAgent'} onClick={() => changeGroup(0)}>
                  Single Agent
                </label>
              </div>
              <div
                className={classnames({
                  [styles.insertScheduleView1__text]: true,
                  [styles.insertScheduleView1__checkboxContainer]: true,
                })}
              >
                <InputRadio
                  id={'singleGroup'}
                  onClick={() => changeGroup(1)}
                  checked={externalState.form.groupingAgents[1]}
                />
                <label style={{ marginLeft: '5px' }} htmlFor={'singleGroup'} onClick={() => changeGroup(1)}>
                  Single Group
                </label>
              </div>
              <div
                className={classnames({
                  [styles.insertScheduleView1__text]: true,
                  [styles.insertScheduleView1__checkboxContainer]: true,
                })}
              >
                <InputRadio
                  id={'multipleGroups'}
                  onClick={() => changeGroup(2)}
                  checked={externalState.form.groupingAgents[2]}
                />
                <label style={{ marginLeft: '5px' }} htmlFor={'multipleGroups'} onClick={() => changeGroup(2)}>
                  Multiple Groups
                </label>
              </div>
            </div>
            <div
              className={classnames({
                [styles.fieldsContainer__Body]: true,
                [styles.height92]: true,
                [styles.grid6]: true,
              })}
            >
              <div
                className={classnames({
                  [styles.insertScheduleView1__text]: true,
                  [styles.insertScheduleView1__checkboxContainer]: true,
                })}
              >
                <label
                  className={classnames([styles.insertScheduleView1__checkboxContainer__text], {
                    [styles.insertScheduleView1__checkboxContainer__textDisabled]:
                      !externalState.form.groupingAgents[2],
                  })}
                  htmlFor={'minNumberGroups'}
                >
                  Min Number of Groups:
                </label>
                <InputNumber
                  id={'minNumberGroups'}
                  change={num => {
                    changeOutState('minNumberGroups', num);
                  }}
                  value={externalState.form.minNumberGroups}
                  removeSpecialCharacters={true}
                  style={{ width: '63px', marginLeft: '12px' }}
                  disabled={!externalState.form.groupingAgents[2]}
                  min={0}
                  max={10000}
                  valid={formValidator.minNumberGroups}
                />
              </div>
              <div
                className={classnames({
                  [styles.insertScheduleView1__text]: true,
                  [styles.insertScheduleView1__checkboxContainer]: true,
                })}
              >
                <label
                  className={classnames([styles.insertScheduleView1__checkboxContainer__text], {
                    [styles.insertScheduleView1__checkboxContainer__textDisabled]:
                      !externalState.form.groupingAgents[2],
                  })}
                  htmlFor={'minGroupSize'}
                >
                  Min Group Size:
                </label>
                <InputNumber
                  id={'minGroupSize'}
                  change={num => {
                    changeOutState('minGroupSize', num);
                  }}
                  value={externalState.form.minGroupSize}
                  removeSpecialCharacters={true}
                  style={{ width: '63px', marginLeft: '8px' }}
                  disabled={!externalState.form.groupingAgents[2]}
                  min={0}
                  max={10000}
                  valid={formValidator.minGroupSize}
                />
              </div>
              <div
                className={classnames({
                  [styles.insertScheduleView1__text]: true,
                  [styles.insertScheduleView1__checkboxContainer]: true,
                })}
              >
                <label
                  className={classnames([styles.insertScheduleView1__checkboxContainer__text], {
                    [styles.insertScheduleView1__checkboxContainer__textDisabled]:
                      !externalState.form.groupingAgents[1],
                  })}
                  htmlFor={'minPercentageAttendees'}
                >
                  Min Percentage Attendees:
                </label>
                <InputNumber
                  id={'minPercentageAttendees'}
                  change={num => {
                    changeOutState('minPercentageAttendees', Number.parseInt(num));
                  }}
                  placeholder={'100'}
                  value={externalState.form.minPercentageAttendees}
                  removeSpecialCharacters={true}
                  style={{ width: '63px', marginLeft: '8px' }}
                  disabled={!externalState.form.groupingAgents[1]}
                  min={0}
                  max={100}
                  valid={formValidator.minPercentageAttendees}
                />
              </div>
              <div
                className={classnames({
                  [styles.insertScheduleView1__text]: true,
                  [styles.insertScheduleView1__checkboxContainer]: true,
                })}
              >
                <label
                  className={classnames([styles.insertScheduleView1__checkboxContainer__text], {
                    [styles.insertScheduleView1__checkboxContainer__textDisabled]:
                      !externalState.form.groupingAgents[2],
                  })}
                  htmlFor={'maxNumberOfGroups'}
                >
                  Max Number of Groups:
                </label>
                <InputNumber
                  id={'maxNumberOfGroups'}
                  change={num => {
                    changeOutState('maxNumberOfGroups', num);
                  }}
                  value={externalState.form.maxNumberOfGroups}
                  removeSpecialCharacters={true}
                  style={{ width: '63px', marginLeft: '8px' }}
                  disabled={!externalState.form.groupingAgents[2]}
                  min={0}
                  max={10000}
                  valid={formValidator.maxNumberOfGroups}
                />
              </div>
              <div
                className={classnames({
                  [styles.insertScheduleView1__text]: true,
                  [styles.insertScheduleView1__checkboxContainer]: true,
                })}
              >
                <label
                  className={classnames([styles.insertScheduleView1__checkboxContainer__text], {
                    [styles.insertScheduleView1__checkboxContainer__textDisabled]:
                      !externalState.form.groupingAgents[2],
                  })}
                  htmlFor={'maxGroupSize'}
                >
                  Max Group Size:
                </label>
                <InputNumber
                  id={'maxGroupSize'}
                  change={num => {
                    changeOutState('maxGroupSize', num);
                  }}
                  value={externalState.form.maxGroupSize}
                  removeSpecialCharacters={true}
                  style={{ width: '63px', marginLeft: '8px' }}
                  disabled={!externalState.form.groupingAgents[2]}
                  min={0}
                  max={10000}
                  valid={formValidator.maxGroupSize}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default View4CreateMeetingForm;
