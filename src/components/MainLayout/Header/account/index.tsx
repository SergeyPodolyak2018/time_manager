import React from 'react';
import styles from './account.module.scss';
import { ReactComponent as KeyReturn } from './KeyReturn.svg';
import Avatar from 'react-avatar';
// import restApi from '../../../../api/rest';
// import logger from '../../../../helper/logger';
import { useSelector } from 'react-redux';
import { switchToClassicOpen } from '../../../../redux/selectors/timeLineSelector';
import { useAppDispatch } from '../../../../redux/hooks';
import { changeSwitchToClassicVisibility } from '../../../../redux/actions/timeLineAction';

export interface IButtonProps extends React.HTMLProps<HTMLElement> {
  innerText: string;
  imgUrl: string | null | undefined;
  navigate: (...args: any[]) => void;
}

const Account = (props: IButtonProps) => {
  // const [isMenuShow, togleMenu] = useState(false);
  const isSwitchToClassicMenuOpen = useSelector(switchToClassicOpen);
  const dispatch = useAppDispatch();
  // const [versionApi, setVersionApi] = useState('');
  const { innerText, navigate } = props;
  // useEffect(() => {
  //   restApi
  //     .helthCheck()
  //     .then(data => {
  //       setVersionApi(data.version);
  //     })
  //     .catch(err => {
  //       logger.error(err);
  //     });
  // }, []);

  return (
    <div
      className={styles.wrapper}
      onClick={() => {
        dispatch(changeSwitchToClassicVisibility(!isSwitchToClassicMenuOpen));
      }}
    >
      <Avatar className={styles.face} name={innerText} size="50" />
      <div className={styles.name}>{innerText}</div>
      {isSwitchToClassicMenuOpen ? (
        <div className={styles.dropdown}>
          <div
            className={styles.navButton}
            onClick={() => {
              navigate();
              dispatch(changeSwitchToClassicVisibility(false));
            }}
          >
            <KeyReturn />
            <div id="switch-to-classic-ui" className={styles.buttonName}>
              Switch to classic UI
            </div>
          </div>
          {/* <div className={styles.versionHolder}>
            Version: UI - {process.env.REACT_APP_BUILD_VERSION || 'local'}, API - {versionApi || 'local'}
          </div> */}
        </div>
      ) : (
        ''
      )}
    </div>
  );
};

const customComparator = (prevProps: IButtonProps, nextProps: IButtonProps) => {
  if (nextProps.innerText !== prevProps.innerText) return false;
  return true;
};

export default React.memo(Account, customComparator);
