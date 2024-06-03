import React from 'react';
import styles from './Auth.module.scss';
import Button from '../../components/ReusableComponents/button';
import Utils from '../../helper/utils';
import { ErrorIcon } from '../../static/svg';
import { useAppDispatch } from '../../redux/hooks';
import { checkIsUserAuthorizedAction } from '../../redux/actions/loginActions';

const Auth = () => {
  const dispatch = useAppDispatch();
  const onClickRetry = () => {
    dispatch(checkIsUserAuthorizedAction());
  };

  const onClickBack = () => {
    window.location.href = window.location.origin + Utils.customerApiPrefix;
  };
  return (
    <div className={styles.container}>
      <div className={styles.logoWrapper}></div>
      <div className={styles.content}>
        <div className={styles.content__titleWrapper}>
          <ErrorIcon />
          <h5 className={styles.content__title}>Failed to connect to customer Server</h5>
        </div>

        <div className={styles.content__btns}>
          <Button
            classNames={[styles.content__btn]}
            type={'secondary'}
            innerText={'Back to classic ui'}
            click={onClickBack}
          />
          <Button classNames={[styles.content__btn]} type={'primary'} innerText={'Retry'} click={onClickRetry} />
        </div>
      </div>
    </div>
  );
};

export default Auth;
