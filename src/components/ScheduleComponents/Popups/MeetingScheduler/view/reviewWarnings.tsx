import { useSelector } from 'react-redux';
import useStateRef from 'react-usestateref';

import { IBusinessUnits } from '../../../../../common/interfaces/config';
import { getFilterData } from '../../../../../redux/selectors/filterSelector';
import styles2 from '../../NewMultipleWizardMenu/menu.module.scss';
import { ReactComponent as ErrorIcon } from '../../ReviewWarningsPopup/assets/error.svg';
import { ReactComponent as WarningIcon } from '../../ReviewWarningsPopup/assets/warning.svg';
import styles from '../meetingScheduler.module.scss';
import { useEffect, useRef } from 'react';

export interface IAgentErrors {
  agentId: number;
  date: number;
  messages: string[];
  errors: string[];
  siteId: number;
}

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
  agentsErrors: IAgentErrors[];
  agentsData: IAgentsData[];
  mainErrors: string[];
}

const ReviewWarnings = (props: IReviewWarningsMenuProps) => {
  const fetchedData: IBusinessUnits = useSelector(getFilterData);
  const tableRef = useRef<HTMLTableSectionElement>(null);

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

  const getAllData = (errors: IAgentErrors[], data: IAgentsData[], tree: IBusinessUnits) => {
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

  return (
    <>
      <div className={styles.subHeader}>
        <span>Warnings</span>
      </div>
      {props.mainErrors.length > 0 && (
        <div className={styles.tableWrapper} style={{ width: '970px', height: '90px' }}>
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <td style={{ width: '100%' }}>
                  <span>Main Warnings</span>
                </td>
              </tr>
            </thead>
            <tbody>
              {props.mainErrors.map((el, id) => {
                return (
                  <tr key={id}>
                    <td>
                      <div className={styles.reviewWarnings__text}>{el}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className={styles.tableWrapper} style={{ width: '970px', height: '397px' }}>
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              <td style={{ maxWidth: 'none', width: '230px' }}>
                <span>Agent</span>
              </td>
              <td style={{ width: 'calc(100% - 230px)' }}>
                <span>Warning</span>
              </td>
            </tr>
          </thead>
          <tbody ref={tableRef}>
            {agentsData.length > 0 &&
              agentsData.map((agent, index) => {
                if (!agent) return;

                return (
                  <tr key={index}>
                    <td>
                      {agent.team && <div>Team: {agent.team}</div>}
                      <div className={styles.reviewWarnings__text}>Agent: {agent.name}</div>
                    </td>
                    <td style={{ padding: '5px 10px' }}>
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
    </>
  );
};

export default ReviewWarnings;
