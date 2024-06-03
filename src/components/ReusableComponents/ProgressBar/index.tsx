import React, { FC, useEffect, useRef, useState } from 'react';

import { ReactComponent as DoneIcon } from './icons/iconDone.svg';
import { ReactComponent as ErrorIcon } from './icons/iconError.svg';
import { ReactComponent as WarningIcon } from './icons/iconWarning.svg';
import styles from './index.module.scss';
import classnames from 'classnames';

export enum ProgressBarStatus {
  NONE,
  IN_PROGRESS,
  DONE,
  ERROR,
  WARNING,
}

export enum ProgressBarType {
  FIXED,
  INLINE,
}

export interface ProgressBarState {
  status: ProgressBarStatus;
  errorMessage?: string;
  message?: string;
}

interface IProgressBarProps {
  state: ProgressBarState;
  onClose: () => void;
  type: ProgressBarType;
}

const ProgressBar: FC<IProgressBarProps> = ({ state, type, onClose }) => {
  const [progress, setProgress] = useState(0);

  const getProgressWidth = (): string => {
    if (progress === 100) return `492px`;
    return `${progress * 4.92}px`;
  };
  const getStatusIcon = () => {
    if (state.status === ProgressBarStatus.IN_PROGRESS) return <></>;
    if (state.status === ProgressBarStatus.DONE) {
      return <DoneIcon />;
    }
    if (state.status === ProgressBarStatus.ERROR) {
      return <ErrorIcon />;
    }
    if (state.status === ProgressBarStatus.WARNING) {
      return <WarningIcon />;
    }
  };

  const intervalRef = useRef<any>();
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setProgress(prevProgress => {
        if (prevProgress < 100) {
          if (prevProgress + 10 === 90 && state.status !== ProgressBarStatus.DONE) {
            clearInterval(intervalRef.current);
            return prevProgress;
          }
          return prevProgress + 10;
        } else {
          clearInterval(intervalRef.current);
          return prevProgress;
        }
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (state.status === ProgressBarStatus.DONE) {
      clearInterval(intervalRef.current);
      setProgress(100);
      onClose();
    }
  }, [state.status]);

  return (
    <div
      className={classnames(styles.container, {
        [styles.container__fixed]: type === ProgressBarType.FIXED,
      })}
    >
      <div className={styles.content}>
        <div className={styles.infoBlock}>
          <span className={styles.label}>Progress: </span>
          <span className={styles.value}>{state.message}</span>
        </div>
        <div className={styles.progressBlock}>
          <span className={styles.progressValue__text}>{progress}%</span>
          <div className={styles.progressValue} style={{ width: getProgressWidth() }}></div>
        </div>
        <div className={styles.infoBlock_inline}>
          <div className={styles.statusIcon}>{getStatusIcon()}</div>
          {/*<span className={styles.notification}>{state.message}</span>*/}
        </div>
        <div className={styles.infoBlock_error}>
          <span className={styles.notification}>{state.errorMessage}</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
