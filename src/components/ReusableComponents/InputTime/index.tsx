import React, { useEffect, useRef, useState } from 'react';
import styles from './inputTime.module.scss';
import InputMask from 'react-input-mask';
import { ReactComponent as ErrorSign } from './assets/sign_error.svg';
import classnames from 'classnames';
import DateUtils, { formatTime } from '../../../helper/dateUtils';

export interface ITimeLimit {
  start?: string;
  end?: string;
  isNextStartDay?: boolean;
  isNextEndDay?: boolean;
  isPreviousStartDay?: boolean;
}

export interface IInputTimeProps extends React.HTMLProps<HTMLElement> {
  onChangeStartTime: (e: any) => void;
  onChangeEndTime: (e: any) => void;
  onChange?: (e: any) => void;
  startTime: string;
  endTime: string;
  format: string;
  disabled?: boolean;
  limits?: ITimeLimit;
  className?: string;
  onValidate?: (msg: string | null) => void;
  disabledEndTime?: string;
}

const settingsByFormat: { [key: string]: any } = {
  '12hours': {
    mask: 'From 99:99 aa to 99:99 aa',
    placeholder: 'From 00:00 AM to 00:00 PM',
    validationRegex: /^From ((0[0-9])|(1[0-2])):[0-5][0-9] [PA]M to ((0[0-9])|(1[0-2])):[0-5][0-9] [PA]M$/,
    style: styles.inputTimeBigger,
    disabledStyle: styles.disabled_inputTimeBigger,
    valueRegex: /\d{2}:\d{2} .{2}/gi,
    hoursRegex: /^1[3-9]$/,
    reducedHours: '1',
    disableEnd: styles.inputWrapper__disableEnd12H,
  },
  '24hours': {
    mask: 'From 99:99 to 99:99',
    placeholder: 'From 00:00 to 00:00',
    validationRegex: /^From ([0-1]?[0-9]|2[0-3]):[0-5][0-9] to ([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    style: styles.inputTime,
    disabledStyle: styles.disabled_inputTime,
    valueRegex: /\d{2}:\d{2}/g,
    hoursRegex: /^2[4-9]$/,
    reducedHours: '2',
    disableEnd: styles.inputWrapper__disableEnd24H,
  },
};

const InputTime = (props: IInputTimeProps) => {
  const {
    onChangeStartTime,
    onChangeEndTime,
    format,
    startTime,
    endTime,
    disabled,
    limits,
    onValidate,
    className,
    onChange = () => {},
    disabledEndTime,
  } = props;
  const errorMessageRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const errorMessages = {
    overlappingStart: `Start time is outside of working hours`,
    overlappingEnd: `End time is outside of working hours`,
    overlappingStartEnd: `Start and End time is outside of working hours`,
    startMoreEnd: `Start time can't be more End time`,
    durationMore36h: `Duration can't be more than 36 hours`,
    // startTimeNextDay: `Start time can't be more than ${timeFormatting('12:00', format)} in the next day`,
    // endTimeNextDay: `End time can't be more than ${timeFormatting('12:00', format)} in the next day`,
  };

  useEffect(() => {
    if (onValidate) onValidate(errorMessage);
  }, [errorMessage]);

  useEffect(() => {
    validateValues(startTime, endTime);
  });

  const beforeMaskedStateChange = ({ nextState, previousState }: any) => {
    let { value } = nextState;
    const { enteredString } = nextState;
    const times = [...value.matchAll(settingsByFormat[format].valueRegex)];
    times.map(time => {
      const [hours, minutes] = time[0].split(':');
      if (settingsByFormat[format].hoursRegex.test(hours) && enteredString === settingsByFormat[format].reducedHours) {
        time[0] = `${settingsByFormat[format].reducedHours}0:${minutes}`;
      }
    });
    const secondTime = disabledEndTime ? timeFormatting(disabledEndTime, format) : times[1][0].toUpperCase();
    value = `From ${times[0][0].toUpperCase()} to ${secondTime}`;
    if (!previousState) {
      value = nextState.value;
    }
    if (previousState && !settingsByFormat[format].validationRegex.test(value)) {
      value = previousState.value;
      nextState.selection.start = previousState.selection.start;
      nextState.selection.end = previousState.selection.end;
    }
    return { ...nextState, value };
  };

  const changeStartSelection = (e: any) => {
    const firstEnd = e.currentTarget.value.split(' to ')[0].length;
    const secondStart = firstEnd + 4;
    if (e.currentTarget.selectionStart < 6) e.currentTarget.setSelectionRange(5, 5);
    if (e.currentTarget.selectionStart < secondStart && e.currentTarget.selectionStart > firstEnd)
      e.currentTarget.setSelectionRange(secondStart, secondStart);
  };

  const onKeyDown = (e: any) => {
    if (e.currentTarget.selectionStart < 6) e.currentTarget.setSelectionRange(5, 5);
    const firstEnd = e.currentTarget.value.split(' to ')[0].length;
    const secondStart = firstEnd + 4;
    if (e.currentTarget.selectionStart < secondStart && e.currentTarget.selectionStart > firstEnd) {
      if (e.key === 'ArrowLeft') {
        e.currentTarget.setSelectionRange(firstEnd, firstEnd);
      } else if (e.key === 'ArrowRight') {
        e.currentTarget.setSelectionRange(secondStart, secondStart);
      }
    }
  };

  let currentTimeout: any = null;

  const setErrorMessageWrapper = (message: string | null) => {
    if (errorMessageRef && errorMessageRef.current) {
      const errStyle = (errorMessageRef.current as HTMLDivElement).style;
      if (message && message !== errorMessage) {
        errStyle.opacity = '1.0';
        if (currentTimeout !== null) {
          clearTimeout(currentTimeout);
          currentTimeout = null;
        }
        currentTimeout = setTimeout(() => {
          errStyle.opacity = '';
        }, 1750);
      } else if (!message) {
        errStyle.opacity = '';
      }
    }
    setErrorMessage(message);
  };

  const validateValues = (start: string, end: string): void => {
    if (props.disabled) return setErrorMessageWrapper(null);
    const minutesInDay = 1440;

    let _start = limits?.isNextStartDay
      ? DateUtils.convertTimeToMinutes(start) + minutesInDay
      : DateUtils.convertTimeToMinutes(start);
    const _end =
      limits?.isNextEndDay || limits?.isPreviousStartDay
        ? DateUtils.convertTimeToMinutes(end) + minutesInDay
        : DateUtils.convertTimeToMinutes(end);
    if (_start >= _end && !disabledEndTime) return setErrorMessageWrapper(errorMessages.startMoreEnd);
    // if (limits?.isNextStartDay && _start > minutesInDay + minutesInDay / 2) {
    //   return setErrorMessageWrapper(errorMessages.startTimeNextDay);
    // }
    // if (limits?.isNextEndDay && _end > minutesInDay + minutesInDay / 2) {
    //   return setErrorMessageWrapper(errorMessages.endTimeNextDay);
    // }

    if (limits && limits.start && limits.end) {
      const _startLimit = DateUtils.convertTimeToMinutes(DateUtils.convertTo24h(limits.start));
      let _endLimit = DateUtils.convertTimeToMinutes(DateUtils.convertTo24h(limits.end));
      if (_startLimit > _endLimit) {
        _endLimit = _endLimit + 1440;
        if (!limits?.isNextEndDay && !limits?.isPreviousStartDay) {
          _start += 1440;
        }
      }
      const isStartValid = _start >= _startLimit;
      const isEndValid = _end <= _endLimit;

      if (!isStartValid && !isEndValid && !disabledEndTime)
        return setErrorMessageWrapper(errorMessages.overlappingStartEnd);
      if (!isStartValid) return setErrorMessageWrapper(errorMessages.overlappingStart);
      if (!isEndValid && !disabledEndTime) return setErrorMessageWrapper(errorMessages.overlappingEnd);
    }
    if (_end - _start > 1440 + 720 && !disabledEndTime) return setErrorMessageWrapper(errorMessages.durationMore36h);

    return setErrorMessageWrapper(null);
  };

  return (
    <div
      className={classnames([styles.inputWrapper], {
        [settingsByFormat[format].disableEnd]: disabledEndTime,
        [styles.inputWrapper__bigger]: format === '12hours',
      })}
    >
      <InputMask
        onKeyUp={onKeyDown}
        onClick={changeStartSelection}
        onFocus={changeStartSelection}
        data-test={'shift-time-range'}
        mask={settingsByFormat[format as keyof typeof settingsByFormat].mask}
        className={classnames(
          {
            [settingsByFormat[format as keyof typeof settingsByFormat].disabledStyle]: disabled,
            [settingsByFormat[format as keyof typeof settingsByFormat].style]: !disabled,
          },
          className,
        )}
        // defaultValue={`From ${timeFormatting(startTime, format)} to ${timeFormatting(endTime, format)}`}
        maskPlaceholder={settingsByFormat[format as keyof typeof settingsByFormat].placeholder}
        onChange={e => {
          onChange(e);
          const times = [
            ...e.currentTarget.value.matchAll(settingsByFormat[format as keyof typeof settingsByFormat].valueRegex),
          ];
          const [newStartTime, newEndTime] = [DateUtils.convertTo24h(times[0][0]), DateUtils.convertTo24h(times[1][0])];
          if (newStartTime !== startTime) {
            onChangeStartTime(newStartTime);
          } else if (newEndTime !== endTime) {
            onChangeEndTime(newEndTime);
          }
        }}
        value={`From ${timeFormatting(startTime, format)} to ${timeFormatting(endTime, format)}`}
        alwaysShowMask={true}
        beforeMaskedStateChange={beforeMaskedStateChange}
        disabled={disabled}
      />
      <div className={styles.warningSign} style={{ display: errorMessage ? 'flex' : 'none' }}>
        <div ref={errorMessageRef} className={styles.error}>
          <span>{errorMessage}</span>
        </div>
        <ErrorSign width={15} height={15} />
      </div>
    </div>
  );
};

const timeFormatting = (time: string, format: string) => {
  const formattedTime = formatTime[format as keyof typeof formatTime](time);
  // @ts-ignore
  return ('0' + formattedTime.split(':')[0]).slice(-2) + ':' + formattedTime.split(':')[1];
};

export default InputTime;
