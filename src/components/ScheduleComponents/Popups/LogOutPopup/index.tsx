import React from 'react';
import Button from '../../../ReusableComponents/button';
import styles from './logOutPopup.module.scss';
import { useAppDispatch } from '../../../../redux/hooks';
import { useHotkeys } from 'react-hotkeys-hook';
import { Key } from 'ts-key-enum';
import restApi from '../../../../api/rest';
import { notAuthorizedAction, userLogOutAction } from '../../../../redux/actions/loginActions';
import Utils, { NODE_ENV_TYPE } from '../../../../helper/utils';
import { Cross } from '../../../../static/svg';

const LogOutPopup = () => {
  const dispatch = useAppDispatch();

  const onClose = () => {
    dispatch(userLogOutAction());
  };
  const onLogoutClick = async () => {
    if (Utils.NODE_ENV === NODE_ENV_TYPE.PROD) {
      await restApi.userLogoutProd();
    } else {
      await restApi.userLogout().then(() => {
        dispatch(notAuthorizedAction());
      });
    }
  };

  useHotkeys([Key.Escape, Key.Enter], onClose, { preventDefault: true }, [onClose]);

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <div className={styles.header}>
          <span>{`Warning`}</span>
          <Cross onClick={onClose} />
        </div>
        <div className={styles.body}>
          <div className={styles.itemsWrapper}>
            <div className={styles.wrapper}>
              <div className={styles.errorIcon}></div>
              <div className={styles.mainSpan}>
                Warning: Logging out from customer+ will also log you out of customer Web. Clicking proceed <i className={styles.mainSpanNote}>requires you to then close all</i> open customer windows manually.
              </div>
            </div>
          </div>
        </div>
        <div className={styles.footer}>
          <div className={styles.buttonWrap1}>
            <Button
              innerText={'Cancel'}
              click={onClose}
              style={{ background: '#FFFFFF', color: '#5D6472', border: '0.5px solid #BCC4C8', borderRadius: '4px' }}
            />
          </div>
          <div className={styles.buttonWrap1}>
            <Button
              innerText={'Proceed'}
              click={onLogoutClick}
              style={{
                background: '#006fcf',
                color: 'rgb(255 255 255)',
                border: '0.5px solid #BCC4C8',
                borderRadius: '4px',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogOutPopup;
