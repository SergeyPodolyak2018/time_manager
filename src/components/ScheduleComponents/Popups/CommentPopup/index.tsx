import '../NewShiftMenu/TimePicker.css';

import { clone } from 'ramda';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import SchAgent from '../../../../helper/schedule/SchAgent';
import {
    closeEditCommentMenu, setAgentData, setIsModified
} from '../../../../redux/actions/timeLineAction';
import { useAppDispatch } from '../../../../redux/hooks';
import { getActiveDateSelector } from '../../../../redux/selectors/controlPanelSelector';
import { getSelectedActivitySelector } from '../../../../redux/selectors/timeLineSelector';
import { IEditCommentMenu } from '../../../../redux/ts/intrefaces/timeLine';
import Button from '../../../ReusableComponents/button';
import styles from './menu.module.scss';
import { Cross } from '../../../../static/svg';

const EditCommentMenu = (props: IEditCommentMenu) => {
  const dispatch = useAppDispatch();
  const selectedActivities = useSelector(getSelectedActivitySelector);
  const [memo, setMemo] = useState<string>('');
  const [initialized, setInitialized] = useState(false);
  const agentName = selectedActivities[0]?.agentName;
  const currentDate = useSelector(getActiveDateSelector);
  const [previousComment, setPreviousComment] = useState<string>('');

  const Initialize = () => {
    if (initialized) return;

    setInitialized(true);
    const agent = clone(props.agent);
    let localComment;
    for (let i = 0; i < agent.days.length; i++) {
      if (SchAgent.activityIsInCurrentDay(currentDate, agent.days[i], agent)) {
        localComment = agent.days[i].comments ? agent.days[i].comments : '';
        break;
      }
    }
    if (localComment) {
      setMemo(localComment);
      setPreviousComment(localComment);
    }
  };
  Initialize();
  const applyChanges = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const textArea = document.getElementById('text-area-id');
    const agent = clone(props.agent);
    const newDays = agent.days.map(day => {
      if (SchAgent.activityIsInCurrentDay(currentDate, day, agent)) {
        const comments = textArea instanceof HTMLTextAreaElement ? textArea.value : '';
        return { ...day, isModified: true, comments };
      }
      return day;
    });

    dispatch(setAgentData({ agent: { ...agent, days: newDays, isModified: true } }));
    dispatch(setIsModified(true));
    onClose();
  };

  const onClose = () => {
    dispatch(closeEditCommentMenu());
  };

  const getView = () => {
    return (
      <div>
        <div className={styles.memoWrap}>
          <div className={styles.subHeader}>
            <span>Agent: {agentName}</span>
          </div>
          <div className={styles.memoContainer}>
            <textarea
              value={memo}
              id={'text-area-id'}
              name="memo"
              placeholder="Your comment"
              onChange={e => {
                setMemo(e.target.value);
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <div className={styles.header}>
          <span>{`Edit Comments`}</span>
          <Cross onClick={onClose} data-test={'modal-edit-cancel-button'} />
        </div>
        <div className={styles.body}>{getView()}</div>

        <div className={styles.footer}>
          <div className={styles.buttonWrap1}>
            <Button
              innerText={'Cancel'}
              click={onClose}
              style={{ background: '#FFFFFF', color: '#5D6472', border: '0.5px solid #BCC4C8', borderRadius: '4px' }}
            />
          </div>

          <div className={styles.buttonWrap3}>
            <Button
              innerText={'Apply'}
              click={applyChanges}
              disable={memo === previousComment}
              style={{ background: '#0183F5', color: '#FFFFFF', border: '0.5px solid #0183F5', borderRadius: '4px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCommentMenu;
