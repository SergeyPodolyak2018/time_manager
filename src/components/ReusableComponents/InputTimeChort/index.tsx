import React, { useEffect, useRef, useState } from 'react';
import styles from './inputTime.module.scss';
import InputMask from 'react-input-mask';
import classnames from 'classnames';
import DateUtils, { formatTime } from '../../../helper/dateUtils';
import { ReactComponent as ErrorSign } from '../InputTime/assets/sign_error.svg';

export interface IInputTimeShortProps extends React.HTMLProps<HTMLElement> {
  onChange: (e: any) => void;
  onChangeEnd?: (e: any) => void;
  defaultTime: string;
  defaultTime2?: string;
  format?: string;
  isEndTime?: boolean;
  disabled?: boolean;
  classNames?: string[];
  dataTest?:string;
  onValidate?: (msg: string | null) => void;
  is0Forbidden?: boolean;
}

const settingsByFormat = {
  '12hours': {
    mask: '99:99 aa',
    placeholder: '00:00 PM',
    validationRegex: /^((0[0-9])|(1[0-2])):[0-5][0-9] [PA]M$/i,
    style: styles.inputTimeBigger,
    disabledStyle: styles.disabled_inputTimeBigger,
  },
  '24hours': {
    mask: '99:99',
    placeholder: '00:00',
    validationRegex: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    style: styles.inputTime,
    disabledStyle: styles.disabled_inputTime,
  },
};

const InputTimeShort = (props: IInputTimeShortProps) => {
  const { onChange, format, defaultTime, disabled, classNames, onValidate, is0Forbidden, dataTest = 'specify-paid-hours-input'} = props;
  const timeFormat = format ?? '24hours';
  const errorMessageRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const errorMessages = {
    notZeroValue: `The paid hours must be more then 0`,
  };
  useEffect(() => {
    if (onValidate) onValidate(errorMessage);
  }, [errorMessage]);

  useEffect(() => {
    validateValues();
  });

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

  const validateValues = (): void => {
    if (disabled) return setErrorMessageWrapper(null);
    if (is0Forbidden && (defaultTime === '00:00' || defaultTime === '0:00'))
      return setErrorMessageWrapper(errorMessages.notZeroValue);
    return setErrorMessageWrapper(null);
  };

  const beforeMaskedStateChange = ({ nextState, previousState }: any) => {
    let { value } = nextState;
    if (!previousState) return nextState;
    value = value.toUpperCase();
    if (!settingsByFormat[timeFormat as keyof typeof settingsByFormat].validationRegex.test(value)) {
      value = previousState.value;
      nextState.selection.start = previousState.selection.start;
      nextState.selection.end = previousState.selection.end;
    }
    return { ...nextState, value };
  };

  return (
    <>
      <InputMask
        data-test={dataTest}
        mask={settingsByFormat[timeFormat as keyof typeof settingsByFormat].mask}
        className={classnames([...(classNames || [])], {
          [settingsByFormat[timeFormat as keyof typeof settingsByFormat].disabledStyle]: disabled,
          [settingsByFormat[timeFormat as keyof typeof settingsByFormat].style]: !disabled,
        })}
        value={timeFormatting(defaultTime, timeFormat)}
        maskPlaceholder={settingsByFormat[timeFormat as keyof typeof settingsByFormat].placeholder}
        onChange={e => onChange(DateUtils.convertTo24h(e.currentTarget.value))}
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
    </>
  );
};

const timeFormatting = (time: string, format: string) => {
  const formattedTime = formatTime[format as keyof typeof formatTime](time);
  return ('0' + formattedTime?.split(':')[0]).slice(-2) + ':' + formattedTime?.split(':')[1];
};

export default InputTimeShort;
