import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useClickAway } from '../../../hooks';
import {
    toggleFilterItemAction, toggleFilterMenuAction
} from '../../../redux/actions/scheduleScenariosActions';
import { useAppDispatch } from '../../../redux/hooks';
import { filterMenuCheckedIdsSelector } from '../../../redux/selectors/scheduleScenariosSelector';
import styles from './columnsMenu.module.scss';
import {
    AllStatuses, BiddingClosed, BiddingOpen, BiddingPending, Imported, New, ProfilesAssigned,
    Published, Scheduled, SchWithProfiles
} from './icons';

export const columnsForFilter = [
  {
    id: 'allStatuses',
    icon: <AllStatuses />,
    name: 'All statuses',
  },
  {
    id: 'new',
    icon: <New />,
    name: 'New',
  },
  {
    id: 'imported',
    icon: <Imported />,
    name: 'Imported',
  },
  {
    id: 'scheduled',
    icon: <Scheduled />,
    name: 'Scheduled',
  },
  {
    id: 'scheduledWithProfiles',
    icon: <SchWithProfiles />,
    name: 'Scheduled with profiles',
  },
  {
    id: 'biddingPending',
    icon: <BiddingPending />,
    name: 'Bidding pending',
  },
  {
    id: 'biddingOpen',
    icon: <BiddingOpen />,
    name: 'Bidding open',
  },
  {
    id: 'biddingClosed',
    icon: <BiddingClosed />,
    name: 'Bidding closed',
  },
  {
    id: 'profilesAssigned',
    icon: <ProfilesAssigned />,
    name: 'Profiles assigned',
  },
  {
    id: 'published',
    icon: <Published />,
    name: 'Published',
  },
];

export const FilterMenu = () => {
  const dispatch = useAppDispatch();

  const handleClickOutside = useCallback(() => {
    dispatch(toggleFilterMenuAction());
  }, [dispatch]);

  const outsideRef = useClickAway(handleClickOutside);

  const checkedIds = useSelector(filterMenuCheckedIdsSelector);
  const getName = (id: string) => {
    const index = columnsForFilter.findIndex((element: any) => {
      return id === element.id;
    });
    return columnsForFilter[index].name;
  };

  const setColumn = (e: any, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleFilterItemAction(id));
  };

  return (
    <div className={styles.container} ref={outsideRef}>
      <div className={styles.header}>
        <span>Statuses options</span>
      </div>
      {columnsForFilter.map(element => {
        const active = checkedIds.includes(element.id);
        const showSplitter = element.id === 'allStatuses';
        return (
          <div
            className={`${styles.selectContainer}${showSplitter ? ` ${styles.splitter}` : ''}`}
            key={element.id}
            onClick={e => {
              setColumn(e, element.id);
            }}
          >
            {element.icon}
            <div className={styles.buttonName}>{getName(element.id)}</div>
            <div
              data-test={`${element.id}-checkbox`}
              className={`${styles.roundButton} ${active ? styles.active : ''}`}
            />
          </div>
        );
      })}
    </div>
  );
};
