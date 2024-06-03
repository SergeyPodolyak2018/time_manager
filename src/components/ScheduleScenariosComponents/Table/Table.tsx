import classnames from 'classnames/bind';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import {
    getScheduleScenarios, setSelectedScenarioAction, sortScenariosAction
} from '../../../redux/actions/scheduleScenariosActions';
import { useAppDispatch } from '../../../redux/hooks';
import {
    isScenariosSortedSelector, scenariosSelector, selectedScenarioIndexSelector
} from '../../../redux/selectors/scheduleScenariosSelector';
import { CheckIcon } from '../../../static/svg';
import { ReactComponent as NoData } from './static/noData.svg';
import { ReactComponent as SortDirectionArrow } from './static/sortDirectionArrow.svg';
import s from './table.module.scss';

const formatDateDDMMYY = (date: string | undefined) => {
  if (!date) return '';
  const dateObj = new Date(date);
  const day = dateObj.getDate();
  const month = dateObj.getMonth() + 1;
  const year = dateObj.getFullYear() % 100;
  return `${day < 10 ? '0' + day : day}.${month < 10 ? '0' + month : month}.${year}`;
};

const cx = classnames.bind(s);
export const ScheduleScenariosTable = () => {
  const scenarios = useSelector(scenariosSelector);
  const isScenariosSorted = useSelector(isScenariosSortedSelector);

  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(getScheduleScenarios());
  }, []);

  const scenarioClassnames = cx({
    scenarioColumn: true,
    sorted: isScenariosSorted,
  });
  const renderHead = () => (
    <thead>
      <tr>
        <th
          className={scenarioClassnames}
          onClick={() => {
            dispatch(sortScenariosAction());
          }}
          style={{
            width: '26.41%',
          }}
        >
          <span>
            <div>Scenario</div>
            <SortDirectionArrow />
          </span>
        </th>
        <th
          style={{
            width: '10.34%',
          }}
        >
          Start Date
        </th>
        <th
          style={{
            width: '10.34%',
          }}
        >
          End Date
        </th>
        <th
          style={{
            width: '10.34%',
          }}
        >
          Ext. End
        </th>
        <th
          style={{
            width: '18.03%',
          }}
        >
          Owner
        </th>
        <th
          style={{
            width: '6.34%',
          }}
        >
          Shared
        </th>
        <th
          style={{
            width: '18.03%',
          }}
        >
          Comments
        </th>
      </tr>
    </thead>
  );

  const selectedIndex = useSelector(selectedScenarioIndexSelector);
  const renderShared = (shared: boolean) => (shared ? <CheckIcon /> : null);

  const renderBody = () => {
    if (!scenarios.length)
      return (
        <div className={s.noData}>
          <NoData />
          <span>There are no Rows to display</span>
        </div>
      );
    return (
      <tbody>
        {scenarios.map((item, index) => {
          const rowClassName = cx({
            active: index === selectedIndex,
          });
          const userName = item.userInfo?.user || '';
          return (
            <tr
              onClick={() => {
                dispatch(setSelectedScenarioAction(index));
              }}
              key={index}
              className={rowClassName}
            >
              <td>{item.name}</td>
              <td>{formatDateDDMMYY(item.startDate)}</td>
              <td>{formatDateDDMMYY(item.endDate)}</td>
              <td>{formatDateDDMMYY(item.endDateExt)}</td>
              <td>{userName}</td>
              <td>{renderShared(item.type === 1)}</td>
              <td>{item.comments}</td>
            </tr>
          );
        })}
      </tbody>
    );
  };

  const tableClassName = cx({
    table: true,
    fullHeight: scenarios.length === 0,
  });

  return (
    <div className={s.tableWrapper}>
      <table className={tableClassName}>
        {renderHead()}
        {renderBody()}
      </table>
    </div>
  );
};
