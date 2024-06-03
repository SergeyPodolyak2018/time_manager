import React from 'react';
import styles from './columnsMenu.module.scss';
import { ReactComponent as Insert } from './icons/insert.svg';
import { ReactComponent as Edit } from './icons/edit.svg';
import { ReactComponent as Delete } from './icons/delete.svg';
import { useAppDispatch } from '../../../redux/hooks';
import { setOpenMultipleWizardAction } from '../../../redux/actions/timeLineAction';

const menuItems = [
  {
    name: 'Delete multiple',
    icon: <Delete />,
    type: 'delete',
  },
];

menuItems.unshift({
  name: 'Insert multiple',
  icon: <Insert />,
  type: 'insert',
},
{
  name: 'Edit multiple',
  icon: <Edit />,
  type: 'edit',
});

const MultipleWizardActions = () => {
  const dispatch = useAppDispatch();
  return (
    <div className={styles.container}>
      {menuItems.map(element => {
        return (
          <div
            className={styles.selectContainer}
            key={element.type}
            onClick={() => {
              dispatch(setOpenMultipleWizardAction({ value: true, type: element.type }));
            }}
          >
            {element.icon}
            <div className={styles.buttonName}>{element.name}</div>
          </div>
        );
      })}
    </div>
  );
};

export default MultipleWizardActions;
