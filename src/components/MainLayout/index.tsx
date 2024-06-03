import React, { FC } from 'react';
import FilterSidebar from './FilterSidebar';
import ScenarioSidebar from './ScenarioSidebar';
import Header from './Header';
import styles from './mainLayout.module.scss';
import { useSelector } from 'react-redux';
import { logOutSelector } from '../../redux/selectors/loginSelector';
import LogOutPopUp from '../ScheduleComponents/Popups/LogOutPopup'

export type SidebarType =
  | 'schedule'
  | 'scenario';

export interface IMainLayout {
  children?: React.ReactNode;
  type?: SidebarType;
}
const MainLayout: FC<IMainLayout> = ({ children, type }) => {
  const isLogOutOpen = useSelector(logOutSelector);
  return (
    <div className={styles.mainLayout}>
      <Header />
      <div className={styles.mainLayout__wrapper}>
        {type === 'scenario' ? <ScenarioSidebar /> : <FilterSidebar />}
        <>{children}</>
        {isLogOutOpen && <LogOutPopUp/>}
      </div>
    </div>
  );
};

export default MainLayout;
