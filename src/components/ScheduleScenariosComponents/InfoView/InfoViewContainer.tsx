import classnames from 'classnames/bind';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { TDeleteScenarioParams, TGetSitesParams } from '../../../api/ts/interfaces/scenario';
import { components } from '../../../api/ts/customer_api.types';
import {
  deleteScenarioAction,
  findScenariosAction,
  getScheduleScenarios,
  getSitesAction,
  openForecastScenarioSnapshotAction,
  saveChangedScenarioAction,
  toggleDeleteScenarioPopup,
} from '../../../redux/actions/scheduleScenariosActions';
import { useAppDispatch } from '../../../redux/hooks';
import {
  forecastScenarioInfoSelector,
  forecastScenariosIdsSelector,
  forecastScenariosSelector,
  selectedScenarioSelector,
  sitesSelector,
} from '../../../redux/selectors/scheduleScenariosSelector';
import { CheckIcon } from '../../../static/svg';
import Checkbox from '../../ReusableComponents/CheckboxStyled';
import { GeneralButton } from '../../ReusableComponents/GeneralButton/GeneralButton';
import { GeneralPopup } from '../../ReusableComponents/Popup/GeneralPopup';
import { Label } from '../Label/Label';
import { DeleteScenarioPopup } from '../Popups/DeleteScenario';
import { EditText } from './EditText';
import s from './InfoViewContainer.module.scss';
import { ReactComponent as DotsThree } from './static/DotsThree.svg';

export type TChangedScenarioParams = {
  name?: string;
  comments?: string;
  scenarioId?: number;
};

const cx = classnames.bind(s);
const getScenarioStatusString = (status?: components['schemas']['SchScenarioSiteStatus']['status']) => {
  // ScenarioSiteStatusType * UNKNOWN = -1 * NEW = 0 * SCHEDULED = 1 * IMPORTED = 2 * PUBLISHED = 3 * SCHEDULED_WITH_PROFILES = 4 * BIDDING_PENDING = 5 * BIDDING_OPEN = 6 * BIDDING_CLOSED = 7 * PROFILES_ASSIGNED = 8

  switch (status) {
    case 0:
      return 'New';
    case 1:
      return 'Scheduled';
    case 2:
      return 'Imported';
    case 3:
      return 'Published';
    case 4:
      return 'Scheduled with profiles';
    case 5:
      return 'Bidding pending';
    case 6:
      return 'Bidding open';
    case 7:
      return 'Bidding closed';
    case 8:
      return 'Profiles assigned';
    default:
      return '';
  }
};
const getShared = (shared: boolean) => {
  return shared ? <CheckIcon /> : <span />;
};
const formatDateDDMMYYYY = (date: string | undefined | number) => {
  if (!date || (typeof date === 'number' && date < 0)) return '';
  const dateObj = new Date(date);
  const day = dateObj.getDate();
  const month = dateObj.getMonth() + 1;
  const year = dateObj.getFullYear();
  return `${day < 10 ? '0' + day : day}.${month < 10 ? '0' + month : month}.${year}`;
};
const formatDateDDMMYYYYHHMM = (date: string | undefined | number) => {
  if (!date || (typeof date === 'number' && date < 0)) return '';
  const dateObj = new Date(date);
  const day = dateObj.getDate();
  const month = dateObj.getMonth() + 1;
  const year = dateObj.getFullYear();
  const hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();
  const time = `${hours < 10 ? '0' + hours : hours}:${minutes < 10 ? '0' + minutes : minutes}`;
  return `${day < 10 ? '0' + day : day}.${month < 10 ? '0' + month : month}.${year} ${time}`;
};
const getDateString = (from: string | undefined, to: string | undefined) => {
  if (!from || !to) return '';
  return [formatDateDDMMYYYY(from), formatDateDDMMYYYY(to)];
};

export const ScheduleScenariosInfoView = () => {
  const [isDataTab, setIsDataTab] = useState(true);
  const [forecastOpen, setForecastOpen] = useState(false);
  const forecastScenariosIds = useSelector(forecastScenariosIdsSelector);
  const forecastScenarioInfo = useSelector(forecastScenarioInfoSelector);

  const sites = useSelector(sitesSelector);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(
      findScenariosAction({
        scenarioIds: forecastScenariosIds,
      }),
    );
  }, [forecastScenariosIds]);

  useEffect(() => {
    const payload: TGetSitesParams = {};
    if (sites.length === 0) dispatch(getSitesAction(payload));
  }, [sites]);

  const selectedScenario = useSelector(selectedScenarioSelector);
  const dataTabClassNames = cx({
    tab: true,
    active: isDataTab,
  });

  const statusesTabClassNames = cx({
    tab: true,
    active: !isDataTab,
  });
  const [editedData, setEditedData] = useState<TChangedScenarioParams>({
    scenarioId: -1,
    comments: '',
    name: '',
  });

  const changed = useMemo(() => {
    return editedData.comments !== selectedScenario?.comments || editedData.name !== selectedScenario?.name || false;
  }, [editedData, selectedScenario]);

  useEffect(() => {
    setEditedData({
      name: selectedScenario?.name,
      comments: selectedScenario?.comments,
      scenarioId: selectedScenario?.scheduleId,
    });
  }, [selectedScenario]);

  const updateEditedData = (keyVal: Partial<TChangedScenarioParams>) => {
    setEditedData({
      ...editedData,
      ...keyVal,
    });
  };
  const renderFirstTabContent = useMemo(() => {
    const disabled = selectedScenario === undefined;
    const dataTabClassNames = cx({
      dataTab: true,
      disabled,
    });

    const dateStrings = getDateString(selectedScenario?.startDate, selectedScenario?.endDate);

    const deletePayload: TDeleteScenarioParams = {
      id: selectedScenario?.scheduleId,
    };

    return (
      <div className={dataTabClassNames}>
        <DeleteScenarioPopup
          onOk={() => {
            dispatch(deleteScenarioAction(deletePayload)).then(() => {
              dispatch(toggleDeleteScenarioPopup());
              dispatch(getScheduleScenarios());
            });
          }}
          onCancel={() => {
            dispatch(toggleDeleteScenarioPopup());
          }}
          scenario={selectedScenario}
        />
        <Label
          className={s.scenarioPropertiesLabel}
          value={'Scenario Properties: ' + (selectedScenario ? selectedScenario?.name : '')}
        />
        <section>
          <Label value="Scenario Name:" />
          <EditText
            disabled={disabled}
            initialValue={selectedScenario?.name}
            width="full"
            value={editedData.name}
            onChange={e => {
              updateEditedData({ name: e.target.value });
            }}
            placeHolder={'Input a Scenario Name'}
          />
        </section>
        <section className={s.dateSection}>
          <Label value="Date:" />
          <span className={s.joinedEditLikeSpan}>
            From
            <span>{dateStrings[0]}</span>
            to
            <span>{dateStrings[1]}</span>
          </span>
          <Label value="Extended End Date:" />
          <EditText
            inactive
            disabled={disabled}
            initialValue={formatDateDDMMYYYY(selectedScenario?.endDateExt)}
            width="full"
          />
        </section>
        <section className={s.ownerSection}>
          <Label value="Owner:" />
          <EditText
            disabled={disabled}
            inactive
            initialValue={selectedScenario?.userInfo?.user}
            width="full"
            placeHolder="Input a Scenario Name"
          />
          <span className={s.sharedGroup}>
            <Checkbox disabled={true} checked={true} />
            <Label value="Shared" />
          </span>
        </section>

        <section className={s.createdSection}>
          <Label value="Created:" />
          <EditText
            disabled={disabled}
            inactive
            initialValue={formatDateDDMMYYYYHHMM(selectedScenario?.createDateTime)}
            width="full"
          />
          <Label value="Modified:" />
          <EditText
            disabled={disabled}
            inactive
            initialValue={formatDateDDMMYYYYHHMM(selectedScenario?.updateDateTime)}
            width="auto"
          />
        </section>
        <section className={s.forecast}>
          <Label value="Forecast:" />
          <EditText
            disabled={disabled}
            placeHolder="Choose forecast"
            inactive
            initialValue={forecastScenarioInfo?.name || ''}
          />
          <GeneralButton
            onClick={() => {
              setForecastOpen(true);
              dispatch(openForecastScenarioSnapshotAction());
              // todo: close snapshot
            }}
            icon={DotsThree}
            p="8px 15px"
            shadow
            borderColor="rgba(0, 49, 96, 0.08)"
          />
        </section>
        <Label className={s.commentsLabel} value="Comments: " />
        <section className={s.comments}>
          <textarea
            value={editedData.comments}
            onChange={e => {
              updateEditedData({ comments: e.target.value });
            }}
            placeholder="Your comment"
          ></textarea>
        </section>
        <section className={s.buttonsSection}>
          <GeneralButton
            text="Cancel"
            onClick={() => {
              setEditedData({
                comments: selectedScenario?.comments,
                name: selectedScenario?.name,
              });
            }}
          />
          <GeneralButton
            text="Save"
            type="primary"
            disabled={!changed}
            onClick={() => {
              dispatch(saveChangedScenarioAction(editedData));
            }}
          />
        </section>
      </div>
    );
  }, [isDataTab, selectedScenario, editedData]);

  const renderSecondTabContent = useMemo(() => {
    return (
      <div className={s.statusesTab}>
        <table>
          <thead>
            <tr>
              <th>Site</th>
              <th>Status</th>
              <th>Bidding Start</th>
              <th>Bidding End</th>
              <th>Ranking used</th>
              <th>Last published</th>
            </tr>
          </thead>
          <tbody>
            {selectedScenario?.siteStatus.map((status, index) => {
              const siteName = sites.find(site => site.id === status.siteId)?.name || '';
              return (
                <tr key={index}>
                  <td>{siteName}</td>
                  <td>{getScenarioStatusString(status.status)}</td>
                  <td>{status.status !== 0 ? formatDateDDMMYYYY(status.bidStartDateTime) : ''}</td>
                  <td>{status.status !== 0 ? formatDateDDMMYYYY(status.bidEndDateTime) : ''}</td>
                  <td>{status.rankingSystem !== 0 ? `${status.rankingSystem}` : ''}</td>
                  <td>{status.status !== 0 ? formatDateDDMMYYYYHHMM(status.publishDateTime) : ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }, [isDataTab, selectedScenario, sites]);

  const renderTabContent = isDataTab ? renderFirstTabContent : renderSecondTabContent;

  const forecastScenarios = useSelector(forecastScenariosSelector);
  if (!selectedScenario) return null;
  return (
    <div className={s.container}>
      <GeneralPopup
        title="Forecast Scenario"
        width={857}
        onClose={() => setForecastOpen(false)}
        open={forecastOpen}
        customContentColor="rgb(249, 252, 255)"
        justifyFooter="center"
        footerGap={16}
        footerButtons={[
          {
            text: 'Cancel',
            onClick: () => {
              setForecastOpen(false);
            },
          },
          {
            text: 'Apply',
            type: 'primary',
            onClick: () => {
              setForecastOpen(false);
            },
          },
        ]}
      >
        {[
          <span className={s.forecastScenarioTitle} key={1}>
            Select the Forecast Scenario
          </span>,
          <section key={2} className={s.forecastScenarioTableWrapper}>
            <table className={s.forecastScenarioTable}>
              <thead>
                <tr>
                  <th style={{ width: '266px' }}>Scenario</th>
                  <th
                    style={{
                      width: '71px',
                    }}
                  >
                    Start Date
                  </th>
                  <th
                    style={{
                      width: '71px',
                    }}
                  >
                    End Date
                  </th>
                  <th
                    style={{
                      width: '118px',
                    }}
                  >
                    Owner
                  </th>
                  <th
                    style={{
                      width: '45px',
                    }}
                    className={s.sharedCell}
                  >
                    Shared
                  </th>
                  <th
                    style={{
                      width: '118px',
                    }}
                  >
                    Comments
                  </th>
                </tr>
              </thead>
              <tbody>
                {forecastScenarios.map((scenario, index) => {
                  return (
                    <tr key={index}>
                      <td>{scenario.name}</td>
                      <td>{formatDateDDMMYYYY(scenario.startDate)}</td>
                      <td>{formatDateDDMMYYYY(scenario.endDate)}</td>

                      <td>{scenario.user}</td>
                      <td className={s.check}>{getShared(scenario.type === 1)}</td>

                      <td>{scenario.comments}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>,
        ]}
      </GeneralPopup>
      <div className={s.tabs}>
        <div onClick={() => setIsDataTab(true)} className={dataTabClassNames}>
          Data
        </div>
        <div onClick={() => setIsDataTab(false)} className={statusesTabClassNames}>
          Statuses
        </div>
        <div className={s.line}></div>
      </div>
      <div className={s.content}>{renderTabContent}</div>
    </div>
  );
};
