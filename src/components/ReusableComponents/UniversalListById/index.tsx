import styles from './universalList.module.scss';
import classnames from 'classnames';
import { useAppDispatch } from '../../../redux/hooks';
import { changeMeetingListVisible } from '../../../redux/actions/timeLineAction';
import { meetingSchedulerListIsOpen } from '../../../redux/selectors/timeLineSelector';
import { useSelector } from 'react-redux';

export interface IUniversalList {
  list: any[];
  clickOn: (id: string | number) => void;
  active: any;
  notValid?: boolean;
  placeHolder?: string;
}

const UniversalList = (props: IUniversalList) => {
  // const [listState, setListState] = useState(false);
  const dispatch = useAppDispatch();
  const { list, active, placeHolder } = props;
  const isVisible = useSelector(meetingSchedulerListIsOpen);

  const clickOn = (name: string) => {
    props.clickOn(name);
  };

  return (
    <div
      className={classnames({
        [styles.container]: true,
        [styles.valid]: props.notValid,
      })}
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        dispatch(changeMeetingListVisible(!isVisible));
      }}
    >
      <div className={styles.default}>{active ? active.name : ''}</div>
      <div className={`${styles.arrow} ${isVisible ? styles.rotate : ''}`}></div>
      {isVisible ? (
        <div className={styles.tzContainer}>
          {list.map((element, index) => {
            return (
              <div
                className={`${styles.tzElementContainer} ${active && element.id === active.id ? styles.active : ''}`}
                key={index}
              >
                <div
                  className={styles.tzElement}
                  onClick={() => {
                    clickOn(element);
                  }}
                >
                  {element.name}
                </div>
              </div>
            );
          })}
        </div>
      ) : !active ? (
        <div className={styles.placeHolderWrapper}>
          <span>{placeHolder}</span>
        </div>
      ) : (
        ''
      )}
    </div>
  );
};

export default UniversalList;
