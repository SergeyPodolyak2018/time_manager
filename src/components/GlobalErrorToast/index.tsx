import React, { FC } from 'react';
import styles from './errorPopup.module.scss';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../redux/hooks';
import { getGlobalErrors } from '../../redux/selectors/errorSelector';
import { removeGlobalError } from '../../redux/actions/globalErrorActions';
import { ReactComponent as Cross } from './icons/cross.svg';
import classnames from 'classnames';

const GlobalErrorSnackBar: FC = () => {
  const dispatch = useAppDispatch();
  const globalErrors = useSelector(getGlobalErrors);

  const latestError = globalErrors[globalErrors.length - 1];

  const onClose = () => {
    dispatch(removeGlobalError(latestError?.id));
  };

  const asyncCloseTimeOut = () => {
    if (!latestError) return;
    setTimeout(() => {
      onClose();
      // also this number should match with animation time in scss
    }, 5000);
  };

  asyncCloseTimeOut();

  return (
    <div className={styles.errorWrapper}>
      {globalErrors.map(error => (
        <div
          key={error.id}
          className={classnames(styles.wrapper, {
            [styles.wrapper__warn]: error?.type === 'Warn',
          })}
        >
          <div className={styles.container}>
            {error?.type === 'Warn' ? <div className={styles.warnIcon} /> : <div className={styles.errorIcon} />}
            <div className={styles.textWrapper}>
              <span>{`${error?.type === 'Warn' ? 'Warning' : 'Error'}${error?.code ? `: ${error.code}` : ''}`}</span>
              <div className={styles.errorSpan}>{error?.message}</div>
            </div>
            <div className={styles.errorContainer}>
              <div className={styles.errorButton} onClick={onClose}>
                <Cross />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GlobalErrorSnackBar;
