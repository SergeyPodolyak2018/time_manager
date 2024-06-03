import React, {Dispatch, FC, SetStateAction, useEffect, useRef} from 'react';
import { IAgentTimeline } from '../../../../../redux/ts/intrefaces/timeLine/IAgentTimeline';
import { IDataByType } from '../dataByType';
import { IMainState } from '../index';
import WizardLayout from '../WizardLayout';
import styles from './errorsMultiple.module.scss';
import classnames from 'classnames';
import Agent from './Agent';

interface IErrorsMultipleWizardProps {
  onClose: () => void;
  onReturn: () => void;
  agents: IAgentTimeline[];
  dataByType: IDataByType;
  setMainState: Dispatch<SetStateAction<IMainState>>;
  mainState: IMainState;
}

const ErrorsMultipleWizard: FC<IErrorsMultipleWizardProps> = ({ onClose, onReturn, agents, dataByType, setMainState, mainState }) => {
  const [updatedAgents, setUpdatedAgents] = React.useState<IAgentTimeline[]>([]);
  const tableRef = useRef<HTMLTableSectionElement>(null);
  React.useEffect(() => {
    setUpdatedAgents(agents);
  }, [agents]);
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

  const setLoading = (isLoading: boolean) => setMainState({...mainState, loading: isLoading});

  const handleClickAgentCheckbox = () => {};
  return (
    <>
      <WizardLayout
        onClose={onClose}
        onReturn={onReturn}
        onSave={() => {}}
        isSaveDisable={true}
        dataByType={dataByType}
        setLoading={setLoading}
        loading={mainState.loading}
      >
        <>
          <div className={styles.editWizard__subTitle}>
            <span>Review Messages</span>
          </div>
          <table className={styles.editWizard__table}>
            <thead>
              <tr
                className={classnames({
                  [styles.editWizard__tableRowHeader]: true,
                })}
              >
                <th></th>
                <th>
                  <span>Date</span>
                </th>
                <th>
                  <span>Agent</span>
                </th>
                <th>
                  <span>Team</span>
                </th>
                <th>
                  <span>Message</span>
                </th>
              </tr>
            </thead>
            <tbody className={classnames([styles.editWizard__body])} ref={tableRef}>
              {updatedAgents?.map(agent => {
                return <Agent key={agent.agentId} agent={agent} handleClickAgentCheckbox={handleClickAgentCheckbox} />;
              })}
            </tbody>
          </table>
        </>
      </WizardLayout>
    </>
  );
};

export default ErrorsMultipleWizard;
