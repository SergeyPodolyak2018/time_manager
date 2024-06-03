import React, {useEffect, useRef, useState} from 'react';
import styles from '../../ReviewWarningsPopup/index.module.scss';
import styles2 from '../menu.module.scss';
import classnames from 'classnames';
import Button from '../../../../ReusableComponents/button';
import { useSelector } from 'react-redux';
import useStateRef from 'react-usestateref';
import { ReactComponent as WarningIcon } from '../../ReviewWarningsPopup/assets/warning.svg';
import { ReactComponent as ErrorIcon } from '../../ReviewWarningsPopup/assets/error.svg';
import { IBusinessUnits } from '../../../../../common/interfaces/config';
import { getFilterData } from '../../../../../redux/selectors/filterSelector';
import { IResponseInsertStateErrorsValidations } from '../../../../../api/ts/interfaces/insertState';

// export interface IAgentErrors {
//   agentId: number;
//   date: number;
//   messages: string[];
//   siteId: number;
// }

export interface IAgentsData {
  agentId: number;
  email: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  buId: number;
  carpoolId: number;
  contractId: number;
  endDate: number;
  seniority: number;
  siteId: number;
  startDate: number;
  teamId: number;
  teamName: string;
}

export interface IReviewWarningsMenuProps {
  publishDisabled?: boolean;
  onClose: (...args: any[]) => void;
  onReturn: (...args: any[]) => void;
  apply: (...args: any[]) => void;
  agentsErrors: IResponseInsertStateErrorsValidations[];
  agentsData: IAgentsData[];
  disableReturn?: boolean;
  loading: boolean;
}

const ReviewWarningsPopup = (props: IReviewWarningsMenuProps) => {
  const fetchedData: IBusinessUnits = useSelector(getFilterData);
  const tableRef = useRef<HTMLTableSectionElement>(null);
  const [isDisabledButton, setIsDisabledButton] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (event: any) => {
      if (event.ctrlKey && event.code === 'KeyA') {
        event.preventDefault();
        event.stopPropagation();
        selectElementContents(tableRef.current as HTMLTableSectionElement);
      }
      if (event.ctrlKey && event.code === 'KeyC') {
        const text = document.getSelection()?.getRangeAt(0).toString();
        if (text) {
          if ('clipboard' in navigator && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text);
          } else {
            document.execCommand('Copy');
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const selectElementContents = (el: HTMLTableSectionElement) => {
    let range;
    let sel;
    if (document.createRange && window.getSelection) {
      range = document.createRange();
      sel = window.getSelection();
      sel ? sel.removeAllRanges() : null;
      try {
        range.selectNode(el);
        sel ? sel.addRange(range) : null;
      } catch (e) {
        range.selectNode(el);
        sel ? sel.addRange(range) : null;
      }
    }
  };
  const getAllData = (errors: IResponseInsertStateErrorsValidations[], data: IAgentsData[], tree: IBusinessUnits) => {
    return errors.map(el => {
      const targetAgentIndex = data.findIndex(element => element.agentId === el.agentId);
      const agent = data[targetAgentIndex];

      if (targetAgentIndex > -1) {
        return {
          id: el.agentId,
          messages: el.messages,
          errors: el.errors,
          name: agent.firstName + ' ' + agent.lastName,
          team: agent.teamName || tree[agent.buId].sites[agent.siteId].teams[agent.teamId]?.name || '',
        };
      }
    });
  };
  const [agentsData, ,] = useStateRef(getAllData(props.agentsErrors, props.agentsData, fetchedData));

  const isDisabledButtons = () => {
    return props.loading || isDisabledButton
  };

  return (
    <div className={styles.reviewWarnings__popup} style={{ width: '740px', height: '721px' }}>
      <div className={styles.reviewWarnings__header}>
        <h3 className={styles.reviewWarnings__title}>Review Warnings</h3>
      </div>
      <div className={styles2.reviewWarnings__content}>
        <table className={styles.reviewWarnings__table} style={{ gridTemplateColumns: '200px 480px' }}>
          <thead>
            <tr className={classnames([styles2.reviewWarnings__tableRow, styles.reviewWarnings__tableRowHeader])}>
              <td className={classnames([styles.reviewWarnings__tableColumn, styles.reviewWarnings__tableHeader])}>
                Agent
              </td>
              <td
                className={classnames([styles.reviewWarnings__tableColumn, styles.reviewWarnings__tableHeader])}
                style={{ padding: '5px 10px' }}
              >
                Warning
              </td>
            </tr>
          </thead>

          <tbody ref={tableRef}>
            {agentsData.length > 0 &&
              agentsData.map((agent, index) => {
                if (!agent) return;
                if (!agent.messages.length && !agent.errors.length) return;

                return (
                  <tr key={index} className={classnames([styles2.reviewWarnings__tableRow])}>
                    <td className={styles.reviewWarnings__tableColumn}>
                      {agent.team && <div className={styles.reviewWarnings__text}>Team: {agent.team}</div>}
                      <div className={styles.reviewWarnings__text}>Agent: {agent.name}</div>
                    </td>
                    <td className={styles.reviewWarnings__tableColumn} style={{ padding: '5px 10px' }}>
                      {agent.messages.length > 0 && (
                        <div className={styles.reviewWarnings__warningsContainer}>
                          {<WarningIcon className={styles2.reviewWarnings__svg} />}
                          <div className={styles.reviewWarnings__warnings} style={{ width: '430px' }}>
                            {agent.messages?.map((warning, index) => (
                              <div key={agent.id + index}>
                                {index + 1}. {warning}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {agent.errors.length > 0 && (
                        <div className={styles.reviewWarnings__warningsContainer}>
                          {<ErrorIcon className={styles2.reviewWarnings__svg} />}
                          <div className={styles.reviewWarnings__warnings} style={{ width: '430px' }}>
                            {agent.errors?.map((err, index) => (
                              <div key={agent.id + index + 'err'}>
                                {index + 1}. {err}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      <div className={styles2.footer}>
        <div className={styles2.buttonWrap1}>
          <Button
            innerText={'Cancel'}
            click={() => {
              if (isDisabledButtons()) return;
              props.onClose();
            }}
            type={'secondary_active'}
            disable={isDisabledButtons()}
          />
        </div>
        <div className={styles2.buttonWrap5}>
          {!props.disableReturn && (
            <Button
              innerText={'< Return'}
              click={() => {
                if (isDisabledButtons()) return;
                setIsDisabledButton(true);
                props.onReturn(2);
              }}
              type={'primary'}
              disable={isDisabledButtons()}
            />
          )}
        </div>

        <div className={styles2.buttonWrap2}>
          <Button
            innerText={'Publish'}
            click={() => {
              if (isDisabledButtons()) return;
              setIsDisabledButton(true);
              props.apply();
            }}
            disable={props.publishDisabled || isDisabledButtons()}
            style={{ background: '#0183F5', color: '#FFFFFF', borderRadius: '5px' }}
            isSaveButton={true}
          />
        </div>
      </div>
    </div>
  );
};

export default ReviewWarningsPopup;
