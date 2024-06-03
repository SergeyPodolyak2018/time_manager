import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

//import restApi from '../../../api/rest';
import { MainPath } from '../../../common/constants';
import { firstNameSelector, secondNameSelector } from '../../../redux/selectors/loginSelector';
// import { firstNameSelector, secondNameSelector } from '../../../redux/slices/loginSlice';
import Account from './account';
import ExitButton from './exitButton';
import styles from './Header.module.scss';
import NavButton from './navigationButton';
import { useAppDispatch } from '../../../redux/hooks';
import { userLogOutAction } from '../../../redux/actions/loginActions';
import { getIsAnyMenuOpen } from '../../../redux/selectors/timeLineSelector';
import { closeAllMenu } from '../../../redux/actions/timeLineAction';
import { useState, useEffect } from 'react';
import restApi from '../../../api/rest';
import logger from '../../../helper/logger';
import Utils from '../../../helper/utils';
import { addGlobalError } from '../../../redux/actions/globalErrorActions';
import { HealthService } from '../../../api/ts/interfaces/health';
import { Tooltip } from '../../ReusableComponents/Tooltip/Tooltip';


const filterBetaFeatures = (
  initialList: {
    title: string;
    link: string;
    beta?: boolean;
    dropDown?: boolean;
  }[],
) => {
  const isBeta = process.env.REACT_APP_BETA_FEATURES_ENABLED === 'true';

  if (!isBeta) {
    return initialList.filter(item => !item.beta);
  }

  return initialList;
};

export const NAVIGATION_LIST = filterBetaFeatures([
  {
    title: 'Scenarios',
    link: `${MainPath}/schedule-scenarios`,
    beta: true,
  },
  {
    title: 'Schedule',
    link: `${MainPath}/schedule`,
    dropDown: true,
  },
]);

const Header = () => {
  const [versionApi, setVersionApi] = useState('');
  useEffect(() => {
    restApi
      .helthCheck()
      .then(data => {
        Object.keys(data.error).forEach(serviceName => {
          const key = serviceName as HealthService;
          const msg = data.error[key].message;
          const status = data.error[key].status;
          dispatch(
            addGlobalError({
              type: 'Warn',
              code: `${serviceName} status ${status}`,
              message: `${msg}`,
            }),
          );
        });
        setVersionApi(data.version);
      })
      .catch(err => {
        logger.error(err);
      });
  }, []);
  const { pathname: currentLocation } = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const userFirstName = useSelector(firstNameSelector) || '';
  const userSecondName = useSelector(secondNameSelector) || '';
  const isAnyMenuOpen = useSelector(getIsAnyMenuOpen);

  const navigator = (url: string) => {
    navigate(url);
  };
  const navigateToOldUI = () => {
    if (!!document.referrer) {
      window.open(document.referrer, '_blank')?.focus();
    } else {
      window.open(window.location.origin + '/customer', '_blank')?.focus();
    }
  };

  const displayableUserName = `${userFirstName} ${userSecondName}`;

  const onLogoutClick = async () => {
    dispatch(userLogOutAction());
  };

  return (
    <div
      className={styles.headerContainer}
      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (isAnyMenuOpen) {
          dispatch(closeAllMenu());
        }
      }}
    >
      <div className={styles.subwrapper}>
        <Tooltip text={`Version: UI - ${Utils.BUILD_VERSION}, API - ${versionApi || 'unknown'}`}>
          <a href={'/'} className={styles.logoWrapper} onClick={() => window.location.reload()}></a>
        </Tooltip>
        <div className={styles.buttonsWrapper}>
          {NAVIGATION_LIST.map((element, i) => {
            return (
              <div className={styles.buttonWrapper} key={i + 'wrap'}>
                <NavButton
                  key={i}
                  click={navigator}
                  urlCurrent={currentLocation}
                  urlTarget={element.link}
                  innerText={element.title}
                  dropdown={element.dropDown}
                />
              </div>
            );
          })}
        </div>
      </div>
      <Account innerText={displayableUserName} imgUrl={null} navigate={navigateToOldUI} />
      <ExitButton click={onLogoutClick} />
    </div>
  );
};

export default Header;
