import classnames from 'classnames';
import React, { FC, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import useStateRef from 'react-usestateref';

import { WarningsSubmenuOptions } from '../../../../common/constants/schedule/submenu/common';
import DateUtils from '../../../../helper/dateUtils';
import SchAgent from '../../../../helper/schedule/SchAgent';
import { useOutsideClick, usePopUpHotkeys } from '../../../../hooks';
import {
  saveAgentDay,
  setAgentData,
  setIsModified,
  setSaveWarnings,
  setSelectedActivity,
  validateAndSaveAgentDay,
} from '../../../../redux/actions/timeLineAction';
import { useAppDispatch } from '../../../../redux/hooks';
import { getActiveDateSelector } from '../../../../redux/selectors/controlPanelSelector';
import { getSaveParams, getSaveWarnings } from '../../../../redux/selectors/timeLineSelector';
import { IAgentTimeline } from '../../../../redux/ts/intrefaces/timeLine/IAgentTimeline';
import Button from '../../../ReusableComponents/button';
import { ReactComponent as WarningIcon } from './assets/warning.svg';
import { ReactComponent as ErrorIcon } from './assets/iconError.svg';
import Dropdown, { DropdownOption } from './Dropdown/Dropdown';
import styles from './index.module.scss';
import WarningsTimelineContainer from './WarningsTimelineContainer/WarningsTimelineContainer';
import { ISelectedActivity } from '../../../../redux/ts/intrefaces/timeLine';
import { Cross } from '../../../../static/svg';
import Spiner from '../../../ReusableComponents/spiner';

/**
 * 'short' - without timeline and disable fix later
 * 'full' - with timeline
 * @returns {string} - full | short
 */
export type ReviewWarningsType = 'full' | 'short';

interface IReviewWarningsProps {
  warningsType: ReviewWarningsType;
}

const ReviewWarningsPopup: FC<IReviewWarningsProps> = ({ warningsType }) => {
  const dispatch = useAppDispatch();

  const agentsWithWarnings = useSelector(getSaveWarnings);
  const { allOrNothing, checkTimestamp } = useSelector(getSaveParams);
  const [openedMenuItem, setOpenedMenuItem] = useState<WarningsSubmenuOptions | null>(null);
  const [, setSelectedActivities, selectedActivitiesRef] = useStateRef<ISelectedActivity[]>([]);
  const [, setIsAlreadyApplied, isAlreadyAppliedRef] = useStateRef(false);

  const [, setModifiedAgents, modifiedAgentsRef] = useStateRef<IAgentTimeline[]>([]);

  const currentDate = useSelector(getActiveDateSelector);
  const tableRef = useRef<HTMLTableSectionElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: any) => {
      if (event.ctrlKey && event.code==='KeyA') {
        event.preventDefault();
        event.stopPropagation();
        selectElementContents(tableRef.current as HTMLTableSectionElement);
      }
      if (event.ctrlKey && event.code==='KeyC') {
        let text = document.getSelection()?.getRangeAt(0).toString();
        if(text){
          const r = document.getSelection()?.getRangeAt(0);
          const fragm = r?.cloneContents();
            const selectableElements = fragm?.querySelectorAll('.selectable');
            let tempText = '';
            if (selectableElements){
              for (const el of selectableElements){
                tempText = tempText + el.textContent;
              }
            }
            if(tempText){
              text=tempText;
            }
          if('clipboard' in navigator && navigator.clipboard.writeText){
            navigator.clipboard.writeText(text);
          }else{
            // in HTTP navigator.clipboard not woking
            // so we create come div with text area then append to document
            // copy it and then remove
            const parent = document.createElement('div');
            const child = document.createElement('input');
            child.setAttribute('type', 'textarea');
            child.value = text;
            parent.style.cssText='width:1px; height:1px; visibility: hidden';
            parent.appendChild(child);
            document.body.appendChild(parent);
            child.select();
            document.execCommand('Copy');
            document.body.removeChild(parent);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const selectElementContents = (el:HTMLTableSectionElement)=>{
    let range;
    let sel;
    if (document.createRange && window.getSelection) {
      range = document.createRange();
      sel = window.getSelection();
      sel?sel.removeAllRanges():null;
      try {
        range.selectNode(el);
        sel?sel.addRange(range):null;
      } catch (e) {
        range.selectNode(el);
        sel?sel.addRange(range):null;
      }
    }
  };

  useEffect(() => {
    // this added because if we have focus on timeline item
    // and press anter to handle this submit
    // we will have error because edit item hotkey will be triggered
    dispatch(setSelectedActivity([]));
  }, []);

  const handleSubmit = () => {
    setIsAlreadyApplied(true);

    const agentWithErrors = agentsWithWarnings.filter(agent => agent.warnings?.errors?.length);
    const agentForSave = modifiedAgentsRef.current.filter(
      agent => !agent.isFixLater && agent.isSave !== false && !agentWithErrors.includes(agent),
    );
    const modifiedAgents = SchAgent.removeTimeStampInNullState(agentForSave);
    const { edited, ignored } = SchAgent.getEditedInReviewWarnings(modifiedAgents);

    dispatch(
      saveAgentDay({
        agents: ignored,
        ignoreWarnings: true,
        checkTimestamp,
        reviewWarningsType: warningsType,
        refreshSchedule: edited.length === 0,
        allOrNothing,
      }),
    )
      .finally(() => {
        edited.length &&
          dispatch(
            validateAndSaveAgentDay({
              agents: edited.map(agent => ({ ...agent, isEditedInReviewWarning: false, isModified: true })),
              ignoreWarnings: false,
              checkTimestamp,
              reviewWarningsType: warningsType,
              refreshSchedule: ignored.length === 0,
              allOrNothing,
            }),
          );
      })
      .then(() => {
        if (edited.length !== 0) {
          dispatch(setIsModified(true));
          edited.map(agent =>
            dispatch(
              setAgentData({
                agent: { ...agent, isSave: true, isModified: true, isFixLater: false },
              }),
            ),
          );
        }
      });
  };

  useEffect(() => {
    setModifiedAgents(agentsWithWarnings);
    setIsAlreadyApplied(false);
  }, [agentsWithWarnings]);

  const handleSelect = (agent: IAgentTimeline, value: DropdownOption) => {
    if (value === DropdownOption.SAVE) {
      dispatch(
        setAgentData({
          agent: { ...agent, isSave: true, isModified: true, isFixLater: false },
          isSaveToHistory: warningsType === 'full',
        }),
      );
    }
    if (value === DropdownOption.DONT_SAVE) {
      dispatch(
        setAgentData({
          agent: { ...agent, isSave: false, isModified: false, isFixLater: false },
          isSaveToHistory: warningsType === 'full',
        }),
      );
    }
    if (value === DropdownOption.FIX_LATER) {
      dispatch(
        setAgentData({
          agent: { ...agent, isSave: false, isModified: true, isFixLater: true },
          isSaveToHistory: warningsType === 'full',
        }),
      );
    }
  };
  const onCancel = () => {
    if (isAlreadyAppliedRef.current) return;
    dispatch(setSaveWarnings([]))
  };

  usePopUpHotkeys({ onSubmit: [handleSubmit], onCancel: [onCancel] });

  const getInitialStateForDropdown = (agent: IAgentTimeline) => {
    let initialState = agent.warnings?.errors.length ? DropdownOption.DONT_SAVE : DropdownOption.SAVE;
    if (agent.isFixLater) initialState = DropdownOption.FIX_LATER;
    return initialState;
  };

  const editTimeRef = useOutsideClick(() => {
    setOpenedMenuItem(null);
  });

  return (
    <div className={styles.reviewWarnings}>
      {isAlreadyAppliedRef.current ? (
          <div className={styles.reviewWarnings_SpinnerWrapper}>
            <Spiner />
          </div>
      ) : (
          ''
      )}
      <div className={styles.reviewWarnings__popup}>
        <div className={styles.reviewWarnings__header}>
          <h3 className={styles.reviewWarnings__title}>Review Warnings</h3>
          <Cross onClick={onCancel} />
        </div>
        <div className={styles.reviewWarnings__content}>
          <table className={styles.reviewWarnings__table}>
            <thead>
              <tr
                className={classnames([styles.reviewWarnings__tableRowHeader], {
                  [styles.reviewWarnings__tableRow]: warningsType === 'full',
                  [styles.reviewWarnings__tableRowShort]: warningsType === 'short',
                })}
              >
                <td className={classnames([styles.reviewWarnings__tableColumn, styles.reviewWarnings__tableHeader])}>
                  Agent
                </td>
                <td className={classnames([styles.reviewWarnings__tableColumn, styles.reviewWarnings__tableHeader])}>
                  Warning/Error
                </td>
                {warningsType === 'full' && (
                  <td className={classnames([styles.reviewWarnings__tableColumn, styles.reviewWarnings__tableHeader])}>
                    Edit
                  </td>
                )}
                <td
                  className={classnames([styles.reviewWarnings__tableHeaderLast, styles.reviewWarnings__tableHeader])}
                >
                  Actions
                </td>
              </tr>
            </thead>

            <tbody ref={tableRef} className={styles.reviewWarnings__selectable}>
              {agentsWithWarnings.map((agent, index) => {
                const warnings = agent.warnings;
                if (!warnings) return;
                return (
                  <tr
                    key={index}
                    className={classnames({
                      [styles.reviewWarnings__tableRow]: warningsType === 'full',
                      [styles.reviewWarnings__tableRowShort]: warningsType === 'short',
                    })}
                    data-test={`review-warning-table-${agent.agentName}`}
                  >
                    <td className={classnames([styles.reviewWarnings__tableColumn, styles.reviewWarnings__selectable])}>
                      <div className={`${styles.reviewWarnings__text} selectable`}>Team: {agent.teamName}</div>
                      <div className={`${styles.reviewWarnings__text} selectable`}>Agent: {agent.agentName}</div>
                      <div className={`${styles.reviewWarnings__text} selectable`}>
                        Date: {warnings.date ? DateUtils.getDateFromString(warnings.date) : currentDate}
                      </div>
                    </td>
                    <td className={classnames([styles.reviewWarnings__tableColumn, styles.reviewWarnings__selectable])}>
                      {warnings.messages.length ? (
                        <div className={`${styles.reviewWarnings__warningsContainer}`} >
                          {<WarningIcon />}
                          <div className={styles.reviewWarnings__warnings}>
                            {warnings.messages?.map((warning, index) => (
                              <div key={agent.agentId + index} className={'selectable'}>
                                {index + 1}. {warning}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        ''
                      )}
                      {warnings.errors.length ? (
                        <div className={classnames([styles.reviewWarnings__warningsContainer])}>
                          {<ErrorIcon />}
                          <div className={styles.reviewWarnings__warnings}>
                            {warnings.errors?.map((error, index) => (
                              <div key={agent.agentId + index + error} className={'selectable'}>
                                {index + 1}. {error}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        ''
                      )}
                    </td>
                    {warningsType === 'full' && (
                      <td className={classnames([styles.reviewWarnings__tableColumn, styles.reviewWarnings__timeline, styles.reviewWarnings__preventSelect])}>
                        {/*<TimeLineItem agent={agent} parent={null}/>*/}
                        <WarningsTimelineContainer
                          setSelectedActivities={setSelectedActivities}
                          selectedActivities={selectedActivitiesRef.current}
                          agent={agent}
                          editTimeRef={editTimeRef}
                          openedMenuItem={openedMenuItem}
                          setOpenedMenuItem={setOpenedMenuItem}
                        />
                      </td>
                    )}
                    <td className={classnames([styles.reviewWarnings__tableColumn,styles.reviewWarnings__preventSelect])} onCopy={()=>false}>
                      <Dropdown
                        initialState={getInitialStateForDropdown(agent)}
                        onSelect={value => handleSelect(agent, value)}
                        hideSave={warnings?.errors.length > 0}
                        hideFixLater={warningsType == 'short'}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className={styles.reviewWarnings__footer}>
          <div className={styles.reviewWarnings__btns}>
            <div className={styles.reviewWarnings__btn}>
              <Button autoFocus={true} innerText={'Cancel'} type={'secondary'} click={onCancel} disable={isAlreadyAppliedRef.current} />
            </div>
            <div className={styles.reviewWarnings__btn}>
              <Button innerText={'Apply'} type={'primary'} click={handleSubmit} disable={isAlreadyAppliedRef.current} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewWarningsPopup;
