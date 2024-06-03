import React, { FC } from 'react';
import styles from './menu.module.scss';
import Popup from 'reactjs-popup';
import {
  warningsSubmenuBtn,
  WarningsSubmenuOptions,
} from '../../../../../../../common/constants/schedule/submenu/common';

export interface IWarningsSubMenuProps {
  setActiveMenuOption: (data: WarningsSubmenuOptions) => void;
  closeSubMenu: () => void;
  left?: number;
  top?: number;
}

const Submenu: FC<IWarningsSubMenuProps> = ({ left, top, setActiveMenuOption, closeSubMenu }) => {
  const onClickMenuOption = (option: WarningsSubmenuOptions) => {
    setActiveMenuOption(option);
  };
  const contentStyle = { zIndex: 10004 };

  return (
    <Popup trigger={<div className={styles.popUpContainer}></div>} arrow={false} open={!!top} onClose={closeSubMenu} {...{ contentStyle }}>
      <div className={styles.container} style={{ left: `${left}px`, top: `${top}px` }}>
        {warningsSubmenuBtn.map((btn, index) => {
          return (
            <div
              key={index}
              className={`${styles.popup} ${styles.regular}`}
              onClick={() => {
                // e.stopPropagation();
                // e.preventDefault();
                onClickMenuOption(btn.submenuOption);
                closeSubMenu();
              }}
            >
              <span>{btn.name}</span>
            </div>
          );
        })}
      </div>
    </Popup>
  );
};

export default Submenu;
