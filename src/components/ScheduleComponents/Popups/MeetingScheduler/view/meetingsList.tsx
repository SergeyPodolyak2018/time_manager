import React, { FC } from 'react';
import { useSelector } from 'react-redux';

import { IMainState } from '..';
import { dayNameLocal } from '../../../../../common/constants';
import { formatTime } from '../../../../../helper/dateUtils';
import { getTimeFormat } from '../../../../../redux/selectors/timeLineSelector';
//import classnames from 'classnames';
import Checkbox from '../../../../ReusableComponents/CheckboxStyled';
import InputRadio from '../../../../ReusableComponents/InputRadio';
import Spiner from '../../../../ReusableComponents/spiner';
import styles from '../meetingScheduler.module.scss';

interface IView2SetTime {
  changeState: (...args: any[]) => void;
  externalState: IMainState;
}

interface ITimeForStartEnd {
  hours: number;
  minutes: number;
}

const View1Meetings: FC<IView2SetTime> = ({ changeState, externalState }) => {
  const timeFormat = useSelector(getTimeFormat);

  const getTimeAndDate = (date: number, time: ITimeForStartEnd): string => {
    const dateString = new Date(date).toISOString().split('T')[0];
    const timeString = timeFormatting(`${time.hours}:${time.minutes}`, timeFormat);

    return `${dateString} ${timeString}`;
  };
  const timeFormatting = (time: string, format: string) => {
    const formattedTime = formatTime[format as keyof typeof formatTime](time);
    return ('0' + formattedTime?.split(':')[0]).slice(-2) + ':' + ('0' + formattedTime?.split(':')[1]).slice(-2);
  };

  return (
    <>
      <div className={styles.subHeader}>
        <span>Please select meeting from the list</span>
      </div>
      <div className={styles.data}>
        <div className={styles.insertScheduleView1__checkboxContainer} style={{ marginLeft: '24px' }}>
          <InputRadio
            id={'createNewMeeting'}
            onClick={() => {
              changeState('selectedMeetingId', -1)
              changeState('createNewMeeting', !externalState.createNewMeeting)}
            }
            checked={externalState.createNewMeeting}
          />
          <label
            htmlFor={'createNewMeeting'}
            onClick={() => {
              changeState('selectedMeetingId', -1)
              changeState('createNewMeeting', !externalState.createNewMeeting)
            }}
            style={{ marginLeft: '8px' }}
          >
            Create new meeting
          </label>
        </div>
        <div className={styles.insertScheduleView1__checkboxContainer} style={{ marginLeft: '10px' }}>
          <InputRadio
            id={'existingMeeting'}
            onClick={() => {
              changeState('selectedMeetingId', -1)
              changeState('createNewMeeting', !externalState.createNewMeeting)
            }}
            checked={!externalState.createNewMeeting}
          />
          <label
            htmlFor={'existingMeeting'}
            onClick={() => {
              changeState('selectedMeetingId', -1)
              changeState('createNewMeeting', !externalState.createNewMeeting)
            }}
            style={{ marginLeft: '8px' }}
          >
            Use existing meeting
          </label>
        </div>
      </div>
      <div className={styles.tableWrapper} style={{ width: '970px', height: '397px' }}>
        {externalState.loading ? (
          <Spiner />
        ) : (
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <td style={{ maxWidth: 'none' }}>
                  <span>Meeting</span>
                </td>
                <td>
                  <span>Earliest Start</span>
                </td>
                <td>
                  <span>Latest End</span>
                </td>
                <td>
                  <span>Duration</span>
                </td>
                <td>
                  <span>Days of the Week</span>
                </td>
              </tr>
            </thead>
            <tbody>
              {externalState.meetings.map((item, index) => {
                const start = getTimeAndDate(item.startDate, item.startTime);
                const end = getTimeAndDate(item.endDate, item.endTime);
                return (
                  <tr
                    key={index}
                    onClick={() => !externalState.createNewMeeting ? changeState('selectedMeetingId', item.id) : null}
                    className={`${item.id === externalState.selectedMeetingId ? styles.selected : ''}`}
                  >
                    <td>
                      <span title={item.name} className={styles.firstTd}>
                        {item.name}
                      </span>
                    </td>
                    <td>
                      <span title={start}>{start}</span>
                    </td>
                    <td>
                      <span title={end}>{end}</span>
                    </td>
                    <td>
                      <span title={`${item.duration}`}>{item.duration}</span>
                    </td>
                    <td>
                      <span>
                        {item.weekDays.map((item, index) => {
                          if (item) return `${dayNameLocal[index]}, `;
                        })}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <div className={styles.data} style={{ marginTop: '10px' }}>
        <div className={styles.checkBoxWrap3} data-test={'show-meeting-participants'}>
          <Checkbox
            checked={externalState.showMeetingParticipants}
            disabled={externalState.createNewMeeting}
            onClick={() => {!externalState.createNewMeeting && changeState('showMeetingParticipants', !externalState.showMeetingParticipants)}}
            style={{ width: '16px', height: '16px' }}
          />
          <span onClick={() => changeState('showMeetingParticipants', !externalState.showMeetingParticipants)}>
            Show meeting’s participants
          </span>
        </div>
      </div>
    </>
  );
};

export default View1Meetings;
