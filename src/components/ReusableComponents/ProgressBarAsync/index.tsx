import React, { FC, useEffect, useState } from 'react';
import useStateRef from 'react-usestateref';

import { ReactComponent as DoneIcon } from './icons/iconDone.svg';
import { ReactComponent as ErrorIcon } from './icons/iconError.svg';
import { ReactComponent as WarningIcon } from './icons/iconWarning.svg';
import styles from './index.module.scss';
import classnames from 'classnames';
import Button from '../button';


export enum ProgressBarAsyncStatus {
  NONE,
  IN_PROGRESS,
  DONE,
  ERROR,
  WARNING,
}

export enum ProgressBarAsyncType {
  FIXED,
  INLINE,
}

export interface IProgressBarAsyncState {
  isOpen: boolean;
  progress: number;
  status: ProgressBarAsyncStatus;
  errorMessage?: string;
  message?: string;
}

export interface IProgressBarAsyncStateDiff {
  isOpen?: boolean;
  progress?: number;
  status?: ProgressBarAsyncStatus;
  errorMessage?: string;
  message?: string;
}

interface IProgressBarAsyncProps {
  isOpen: boolean;
  timeout: number
  onChange: (state: IProgressBarAsyncState) => Promise<IProgressBarAsyncStateDiff>;
  statusRequestFn: (currentState: IProgressBarAsyncState) => Promise<IProgressBarAsyncStateDiff>;
  type: ProgressBarAsyncType;
  onCancel?: (e?: React.MouseEventHandler<HTMLDivElement>) => any;
}

const defaultState: IProgressBarAsyncState = {
  isOpen: false,
  progress: 0,
  status: ProgressBarAsyncStatus.NONE,
}

const ProgressBarAsync: FC<IProgressBarAsyncProps> = ({isOpen, timeout, onChange, statusRequestFn, type, onCancel }) => {
  const [, setProgressBarState, progressBarStateRef] = useStateRef<IProgressBarAsyncState>({...defaultState, isOpen});
  const [tick, setTick] = useState<boolean>(true);
  const [timerHandle, setTimerHandle] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!tick || progressBarStateRef.current.status === ProgressBarAsyncStatus.DONE) return;
    const getStatusCB = () => {
      statusRequestFn(progressBarStateRef.current).then(result => {
        let hasChanges = false;
        if (result.progress !== progressBarStateRef.current.progress
            || result.status !== progressBarStateRef.current.status
            || result.errorMessage || result.message) {
          hasChanges = true
        }
        setProgressBarState({ ...progressBarStateRef.current, ...result });
        return hasChanges;
      }).then((hasChanges) => {
        if (hasChanges) return onChange(progressBarStateRef.current);
      }).then(result => {
        if (!result) return ;
        setProgressBarState({ ...progressBarStateRef.current, ...result });
      }).finally(() => setTick(true));
    };
    setTimerHandle(setTimeout(getStatusCB, timeout));
    setTick(false);
  }, [tick, progressBarStateRef.current.status, isOpen]);

  const getProgressWidth = (): string => {
    if (progressBarStateRef.current.progress === 100) return `492px`;
    return `${progressBarStateRef.current.progress * 4.92}px`;
  };

  const getStatusIcon = () => {
    if (progressBarStateRef.current.status === ProgressBarAsyncStatus.IN_PROGRESS) return <></>;
    if (progressBarStateRef.current.status === ProgressBarAsyncStatus.DONE) {
      return <DoneIcon />;
    }
    if (progressBarStateRef.current.status === ProgressBarAsyncStatus.ERROR) {
      return <ErrorIcon />;
    }
    if (progressBarStateRef.current.status === ProgressBarAsyncStatus.WARNING) {
      return <WarningIcon />;
    }
  };

  const isShowButton = () => {
    return typeof onCancel === 'function'
  }

  const onCancelHandler = (e: React.MouseEventHandler<HTMLDivElement>) => {
    if (!onCancel) return;
    if (timerHandle !== null) {
      clearTimeout(timerHandle);
      setTimerHandle(null);
    }

    return onCancel(e);
  }

  return isOpen ? (
    <div className={classnames(styles.container, { [styles.container__fixed]: type === ProgressBarAsyncType.FIXED })}>
      <div className={styles.content}>
        <div className={styles.infoBlock}>
          <span className={styles.label}>Progress: </span>
          <span className={styles.value}>{progressBarStateRef.current.message}</span>
        </div>
        <div className={styles.progressBlock}>
          <span className={styles.progressValue__text}>{progressBarStateRef.current.progress <= 100 ? progressBarStateRef.current.progress : 100}%</span>
          <div className={styles.progressValue} style={{ width: getProgressWidth() }}></div>
        </div>
        <div className={styles.infoBlock_inline}>
          <div className={styles.statusIcon}>{getStatusIcon()}</div>
        </div>
        <div className={styles.infoBlock_error}>
          <span className={styles.notification}>{progressBarStateRef.current.errorMessage}</span>
        </div>
        { isShowButton() ? (
          <div className={styles.buttonBlock}>
            <Button
              innerText={'Cancel'}
              click={onCancelHandler}
              disable={false}
              type={'primary'}
            />
          </div>
        ) : null }
      </div>
    </div>
  ) : null;
};

export default ProgressBarAsync;
