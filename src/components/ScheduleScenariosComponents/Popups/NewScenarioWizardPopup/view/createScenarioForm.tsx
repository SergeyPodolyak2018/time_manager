import classnames from 'classnames';
import React, { FC } from 'react';

import { ICfgException } from '../../../../../common/models/cfg.exeption';
import DatePickerPopups from '../../../../ReusableComponents/CalendarAndDatePicker/DatePickerPopups';
import Checkbox from '../../../../ReusableComponents/CheckboxStyled';
import InputText from '../../../../ReusableComponents/inputText';
import Spiner from '../../../../ReusableComponents/spiner';
import UniversalListById from '../../../../ReusableComponents/UniversalListById';
import datePickerStyles from '../../../../ScheduleComponents/Popups/NewMultipleWizardMenu/multipleStates/EditMultiple/datePicker.module.scss';
import { IFormValidation, IMainState } from '../index';
import styles from '../scenarioScheduler.module.scss';

interface IView2SetTime {
  changeState: (...args: any[]) => void;
  externalState: IMainState;
  formValidator: IFormValidation;
}

const View1CreateScenarioForm: FC<IView2SetTime> = ({ changeState, externalState, formValidator }) => {
  const changeOutState = (name: string, value: any) => {
    changeState(name, typeconverter[name as keyof typeof typeconverter](value));
  };

  const typeconverter = {
    name: (text: string) => text,
    activeException: (data: ICfgException) => data,
    dateFrom: (text: string) => text,
    dateTo: (text: string) => text,
    extendedDateTo: (text: string) => text,
    comments: (text: string) => text,
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
              <span>General Parameters</span>
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
                <label className={styles.insertScheduleView1__checkboxContainer__text} htmlFor={'scenarioName'}>
                  Scenario Name:
                </label>
                <InputText
                  id={'scenarioName'}
                  change={name => {
                    changeOutState('name', name);
                  }}
                  value={externalState.form.name}
                  removeSpecialCharacters={true}
                  placeHolder={'Input a Scenario Name'}
                  style={{ width: '327px', marginLeft: '8px' }}
                  notValid={!formValidator.name}
                />
              </div>
              <div
                className={classnames({
                  [styles.insertScheduleView1__text]: true,
                  [styles.insertScheduleView1__checkboxContainer]: true,
                })}
              >
                <label className={styles.insertScheduleView1__checkboxContainer__text} htmlFor={'scenarioName'}>
                  Based on:
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
                    notValid={!formValidator.activeException}
                  />
                </div>
              </div>
              <div className={styles.insertScheduleView1__checkboxContainer}>
                <Checkbox
                  checked={externalState.form.shared}
                  onClick={() => changeState('shared', !externalState.form.shared)}
                  style={{ width: '16px', height: '16px' }}
                />
                <label
                  htmlFor={'createNewScenario'}
                  onClick={() => changeState('shared', !externalState.form.shared)}
                  style={{ marginLeft: '8px' }}
                >
                  Shared
                </label>
              </div>
            </div>
          </div>
          {/*=================Second layer=======================*/}
          <div className={styles.fieldsContainer} style={{ height: '101px' }}>
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
              </div>
              <div
                className={classnames({
                  [styles.insertScheduleView1__text]: true,
                  [styles.insertScheduleView1__checkboxContainer]: true,
                })}
              >
                <label
                  className={styles.insertScheduleView1__checkboxContainer__text}
                  htmlFor={'extendedDateTo'}
                  style={{ marginRight: '8px' }}
                >
                  Extended date to:
                </label>

                <DatePickerPopups
                  id={'extendedDateTo'}
                  disabled={false}
                  className={datePickerStyles.datePicker}
                  containerClassName={`${datePickerStyles.datePicker__container} ${datePickerStyles.datePicker__container__small}`}
                  inputClass={classnames({
                    [datePickerStyles.datePicker__input]: true,
                    [datePickerStyles.datePicker__input__small]: true,
                    [datePickerStyles.datePicker__input__valid]: !formValidator.extendedDateTo,
                  })}
                  value={externalState.form.extendedDateTo}
                  onChange={date => {
                    date && changeOutState('extendedDateTo', date.toString());
                  }}
                />
              </div>
            </div>
          </div>
          {/*=================Third layer=======================*/}
          <div className={styles.fieldsContainer} style={{ height: '250px' }}>
            <div className={styles.fieldsContainer__Header}>
              <span>Comments</span>
            </div>
            <div
              className={classnames({
                [styles.fieldsContainer__Body]: true,
                [styles.height40]: true,
                [styles.grid4]: true,
              })}
            >
              <div className={styles.commentWrap}>
                <div className={styles.commentContainer}>
                  <textarea name="comment" placeholder="Your comment" onChange={e => {
                    changeOutState('comments', e.target.value);
                  }} />
                </div>
              </div>
            </div>
          </div>
          <div className={styles.fieldsContainer} style={{ height: '60px' }}>
            <div
              className={classnames({
                [styles.fieldsContainer__Body]: true,
                [styles.height40]: true,
                [styles.grid3]: true,
              })}
            >
              <div className={styles.insertScheduleView1__checkboxContainer}>
                <Checkbox
                  checked={externalState.form.useForecastData}
                  onClick={() => changeState('useForecastData', !externalState.form.useForecastData)}
                  style={{ width: '16px', height: '16px' }}
                />
                <label
                  htmlFor={'createNewScenario'}
                  onClick={() => changeState('useForecastData', !externalState.form.useForecastData)}
                  style={{ marginLeft: '8px' }}
                >
                  Use forecast data for forecast scenario
                </label>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default View1CreateScenarioForm;
