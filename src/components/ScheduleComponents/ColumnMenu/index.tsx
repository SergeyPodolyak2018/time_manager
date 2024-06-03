import React from 'react';
import styles from './columnsMenu.module.scss';
import { ReactComponent as Site } from './icons/site.svg';
import { ReactComponent as Overtime } from './icons/overtime.svg';
import { ReactComponent as PaidHours } from './icons/paidHours.svg';
import { ReactComponent as UseTotalHours } from './icons/useTotalHours.svg';
import { ReactComponent as ShiftStartTime } from './icons/shiftStartTime.svg';
import { ReactComponent as ShiftEndTime } from './icons/shiftEndTime.svg';
import { ReactComponent as Shift } from './icons/shift.svg';
import { ReactComponent as Comments } from './icons/comments.svg';
import { ReactComponent as TimeZone } from './icons/timeZone.svg';
import { ReactComponent as FullTimeZone } from './icons/fullTimeZone.svg';
import { ReactComponent as ShortTimeZone } from './icons/shortTimeZone.svg';
import { ReactComponent as TimeZoneDifference } from './icons/timeZoneDifference.svg';
import { ReactComponent as Pin } from './icons/pin.svg';
import { getColumns, getTimelineOptions } from '../../../redux/selectors/timeLineSelector';
import { changeColumn, toggleTimelineOption } from '../../../redux/actions/timeLineAction';
import { IPossibleColumns } from '../../../redux/ts/intrefaces/timeLine';
import { connect } from 'react-redux';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';

const columnsForTable = [
  {
    id: 'siteName',
    icon: <Site />,
  },
  // {
  //   id: 'sharedTransport',
  //   icon: <SharedTransport />,
  // },
  {
    id: 'overtime',
    icon: <Overtime />,
  },
  {
    id: 'paidHours',
    icon: <PaidHours />,
  },
  {
    id: 'useTotalHours',
    icon: <UseTotalHours />,
  },
  {
    id: 'shiftStartTime',
    icon: <ShiftStartTime />,
  },
  {
    id: 'shiftEndTime',
    icon: <ShiftEndTime />,
  },
  {
    id: 'shift',
    icon: <Shift />,
  },
  // {
  //   id: 'accessibility',
  //   icon: <Accessibility />,
  // },
  {
    id: 'comments',
    icon: <Comments />,
  },
];

const optionsColumns = {
  pinColumn: {
    name: 'Pin Columns',
    icon: <Pin />,
  },
};

const buttonWithSubOptions = [
  {
    name: 'Time Zone',
    id: 'timeZoneParent',
    icon: <TimeZone />,
    options: [
      {
        id: 'timeZone',
        icon: <FullTimeZone />,
      },
      {
        id: 'shortTimeZone',
        icon: <ShortTimeZone />,
      },
      {
        id: 'timeZoneDifference',
        icon: <TimeZoneDifference />,
      },
    ],
  },
];

interface IColumnsMenu {
  columns: IPossibleColumns[];
  chouseColumn: (columnId: string) => void;
}

const ColumnsMenu = (props: IColumnsMenu) => {
  const dispatch = useAppDispatch();

  const options = useAppSelector(getTimelineOptions);

  const getName = (id: string) => {
    const index = props.columns.findIndex((element: any) => {
      return id === element.id;
    });
    return props.columns[index].name;
  };

  const isVisible = (id: string) => {
    const index = props.columns.findIndex((element: any) => {
      return id === element.id;
    });
    return props.columns[index].visible;
  };
  const setColumn = (e: any, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    props.chouseColumn(id);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span>Column options</span>
      </div>
      {columnsForTable.map(element => {
        return (
          <div
            className={styles.selectContainer}
            key={element.id}
            onClick={e => {
              setColumn(e, element.id);
            }}
          >
            {element.icon}
            <div className={styles.buttonName}>{getName(element.id)}</div>
            <div
              data-test={`${element.id}-checkbox`}
              className={`${styles.roundButton} ${isVisible(element.id) ? styles.active : ''}`}
            />
          </div>
        );
      })}
      {buttonWithSubOptions.map(element => {
        return (
          <div
            className={styles.selectContainerParent}
            key={element.id}
            onClick={e => {
              e.stopPropagation();
            }}
          >
            <div className={styles.delimeter} />
            {element.icon}
            <div className={styles.buttonName}>{element.name}</div>
            <div className={styles.arrowButton} />
            <div
              className={styles.subcontainer}
              onClick={e => {
                e.stopPropagation();
              }}
            >
              {element.options.map(subElement => {
                return (
                  <div
                    className={styles.selectContainer}
                    key={subElement.id}
                    onClick={e => {
                      setColumn(e, subElement.id);
                    }}
                  >
                    {subElement.icon}
                    <div className={styles.buttonName}>{getName(subElement.id)}</div>
                    <div className={`${styles.roundButton} ${isVisible(subElement.id) ? styles.active : ''}`} />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {Object.keys(options).map((key: string) => {
        const value = options[key as keyof typeof options];
        const values = optionsColumns[key as keyof typeof optionsColumns];

        return (
          <div
            className={styles.selectContainer}
            key={key}
            onClick={() => {
              dispatch(toggleTimelineOption(key));
            }}
          >
            <div className={styles.delimeter} />
            {values?.icon}
            <div className={styles.buttonName}>{values?.name}</div>
            <div data-test={`${key}-checkbox`} className={`${styles.roundButton} ${value ? styles.active : ''}`} />
          </div>
        );
      })}
    </div>
  );
};

const mapStateToProps = (state: any) => {
  return {
    columns: getColumns(state),
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    chouseColumn: (columnId: string) => dispatch(changeColumn(columnId)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ColumnsMenu);
