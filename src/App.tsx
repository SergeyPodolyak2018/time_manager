import './App.scss';

import React, { FC, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';

import { MainPath } from './common/constants';
import GlobalErrorSnackBar from './components/GlobalErrorToast';
import Login from './components/Login';
import MainLayout from './components/MainLayout';
import Adherence from './containers/adherence';
import Automation from './containers/automation';
import Schedule from './containers/schedule';
import { ScheduleScenario } from './containers/scheduleScenario';
import { checkIsUserAuthorizedAction, saveUserInfoAction } from './redux/actions/loginActions';
import { useAppDispatch } from './redux/hooks';
import { authorizedSelector, isLoadingSelector } from './redux/selectors/loginSelector';
import Utils, { NODE_ENV_TYPE } from './helper/utils';
import Auth from './containers/auth';
import customerSpinner from './components/ReusableComponents/customerSpinner';

const getBetaRoutes = () => {
  const isBeta = process.env.REACT_APP_BETA_FEATURES_ENABLED === 'true';
  if (!isBeta) {
    return [];
  }

  return [
    <Route
      key="schedule-scenarios"
      path={`${MainPath}/schedule-scenarios`}
      element={
        <MainLayout type={'scenario'}>
          <ScheduleScenario />
        </MainLayout>
      }
    />,
  ];
};

const App: FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const loading = useSelector(isLoadingSelector);
  const authorized = useSelector(authorizedSelector);

  const beforeUnLoad = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(saveUserInfoAction());
  };

  const preventDefaultDrag = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    window.addEventListener('beforeunload', beforeUnLoad);
    window.addEventListener('dragover', preventDefaultDrag);

    return () => {
      window.removeEventListener('beforeunload', beforeUnLoad);
      window.removeEventListener('dragover', preventDefaultDrag);
    };
  }, []);

  useEffect(() => {
    if (!authorized && !loading) {
      if (Utils.NODE_ENV !== NODE_ENV_TYPE.PROD) {
        navigate(`${MainPath}/login`);
      } else {
        navigate(`${MainPath}/auth`);
        // window.location.href = window.location.origin + Utils.customerApiPrefix;
      }
    }
    if (authorized) {
      navigate(`${MainPath}/schedule`);
    }
  }, [authorized, loading]);

  useEffect(() => {
    dispatch(checkIsUserAuthorizedAction());
  }, []);

  if (loading) return <customerSpinner />;

  if (!authorized && Utils.NODE_ENV === NODE_ENV_TYPE.PROD) {
    return (
      <>
        <Routes>
          <Route path={`${MainPath}/auth`} element={<Auth />} />
        </Routes>
        <GlobalErrorSnackBar />
      </>
    );
  }

  if (!authorized && Utils.NODE_ENV !== NODE_ENV_TYPE.PROD) {
    return (
      <>
        <Routes>
          <Route path={`${MainPath}/login`} element={<Login />} />
        </Routes>
        <GlobalErrorSnackBar />
      </>
    );
  }

  return (
    <div className="container">
      <>
        <Routes>
          {getBetaRoutes()}
          <Route path={'/'} element={<Navigate replace to={`${MainPath}/schedule`} />} />
          <Route path={`${MainPath}/login`} element={<Login />} />
          <Route path={`${MainPath}/auth`} element={<Auth />} />

          <Route path={MainPath} element={<Navigate replace to={`${MainPath}/schedule`} />} />
          <Route
            path={`${MainPath}/schedule`}
            element={
              <MainLayout>
                <Schedule />
              </MainLayout>
            }
          />
          <Route
            path={`${MainPath}/adherence`}
            element={
              <MainLayout>
                <Adherence />
              </MainLayout>
            }
          />
          <Route
            path={`${MainPath}/automation`}
            element={
              <MainLayout>
                <Automation />
              </MainLayout>
            }
          />
          <Route path="*" element={<div>404</div>} />
        </Routes>
        <GlobalErrorSnackBar />
      </>
    </div>
  );
};

export default App;
