import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { MainPath } from '../../common/constants';
import { loginAction } from '../../redux/actions/loginActions';
import { useAppDispatch } from '../../redux/hooks';
import { authorizedSelector } from '../../redux/selectors/loginSelector';
import Button from '../ReusableComponents/button';
import { ReactComponent as Eye } from './eye.svg';
import styles from './Login.module.scss';
import { ReactComponent as OpenEye } from './openeye.svg';

const Login = () => {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);

  const authorized = useSelector(authorizedSelector);

  useEffect(() => {
    if (authorized) {
      navigate(`${MainPath}/schedule`);
    }
  }, [authorized]);

  const onSubmit = () => {
    if (formRef.current) {
      const inputUsername = formRef.current.elements[0] as HTMLInputElement;
      const inputPassword = formRef.current.elements[1] as HTMLInputElement;
      dispatch(
        loginAction({
          userName: inputUsername.value,
          password: inputPassword.value,
        }),
      );
    }
  };

  return (
    <div className={styles.loginContainer}>
      <>
        <div className={styles.logoWrapper}></div>
        <div className={styles.wrapper}>
          <div className={styles.header}>
            <span className={styles.row1}>Welcome</span>
            <span className={styles.row2}>log in to your account</span>
          </div>
          <div className={styles.form_wrapper}>
            <form ref={formRef}>
              <div className={styles.container}>
                <div className={styles.input_wrapper}>
                  <input
                    className={styles.input}
                    type="text"
                    name="userName"
                    autoComplete="on"
                    value={userName}
                    onChange={e => {
                      setUserName(e.target.value);
                    }}
                  />
                  <span className={styles.placeholder}>Login</span>
                </div>
                <div className={styles.input_wrapper}>
                  <input
                    className={styles.input}
                    type={!showPassword ? 'password' : 'text'}
                    name="password"
                    autoComplete="on"
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                    }}
                  />
                  <span className={styles.placeholder}>Password</span>
                  {!showPassword ? (
                    <Eye
                      onClick={() => {
                        setShowPassword(!showPassword);
                      }}
                    />
                  ) : (
                    <OpenEye
                      onClick={() => {
                        setShowPassword(!showPassword);
                      }}
                    />
                  )}
                </div>
              </div>
            </form>
          </div>
          <div className={styles.buttonsWrapper}>
            <div className={styles.buttonWrapper}>
              <Button
                innerText={'Login'}
                click={() => {
                  onSubmit();
                }}
              />
            </div>
            <div className={styles.buttonWrapperSmall}>
              <Button
                innerText={'Sign up'}
                click={() => {
                  onSubmit();
                }}
                style={{
                  background: '#FFFFFF',
                  color: '#006FCF',
                  boxShadow: '0px 2.50833px 2.50833px rgba(223, 223, 224, 0.7)',
                }}
              />
            </div>
          </div>
        </div>
      </>
    </div>
  );
};

export default Login;
