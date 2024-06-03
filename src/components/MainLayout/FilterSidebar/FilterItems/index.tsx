import React from 'react';
import styles from './filterItems.module.scss';
import FilterItem from './filterItem';
import { isEmpty, isNil } from 'ramda';
import { ItemType } from '../index';
import { IActivity, IBusinessUnit, IBusinessUnits, ISite, ITeam } from '../../../../common/interfaces/config';
import { DisplayNameSettings, IMultiplyDisplaySettings } from '../SettingsView';
import { SearchOptions } from '../SearchSettings';
import { ActiveTab } from '../FilterTabs';
import { useSelector } from 'react-redux';
import { getFilterLoading } from '../../../../redux/selectors/filterSelector';
import Utils from '../../../../helper/utils';

export interface IFilterItems extends React.HTMLProps<HTMLElement> {
  items: IBusinessUnits;
  onClickItem: (item: IBusinessUnit | ISite | ITeam | IActivity, type: ItemType) => void;
  onClickCheckbox: (e: React.MouseEvent, item: any, type: ItemType) => void;
  openedItems: any;
  searchData: IBusinessUnits;
  checkedItems: any;
  isSearchActive: boolean;
  activeTab: ActiveTab;
  searchOption: SearchOptions;
  activeView: DisplayNameSettings;
  searchValue: string;
  multiplyDisplaySettings: IMultiplyDisplaySettings;
  highlightedValue: string;
  doNotRenderUnselected?: boolean;
  initializedCheckedItems?: IBusinessUnits;
}

const FilterItems = (props: IFilterItems) => {
  const {
    items,
    searchData,
    onClickItem,
    onClickCheckbox,
    openedItems,
    searchOption,
    activeTab,
    activeView,
    isSearchActive,
    searchValue,
    highlightedValue,
    checkedItems,
    multiplyDisplaySettings,
    doNotRenderUnselected,
    initializedCheckedItems,
  } = props;
  const isSearchData = !isEmpty(searchData);
  const loading = useSelector(getFilterLoading);

  return (
    <div className={styles.filterItemsWrapper} id="filterItems">
      {/*BUs*/}
      {Utils.sortObjectByName(items).map(buId => {
        const bu: IBusinessUnit = items[buId];
        const foundedBu: IBusinessUnit = searchData[buId];
        //checked logic
        const checkedBU = checkedItems[buId];
        const isBuChecked = checkedBU?.isChecked;
        const isActivityChecked = checkedBU?.isActivityChecked;
        const isAllSitesChecked = checkedBU?.isAllChecked;

        //visible logic
        const isBuVisible: boolean =
          !!foundedBu || isBuChecked || !isSearchActive || (checkedBU && !isEmpty(checkedBU.sites));
        if (!isBuVisible) return false;

        //opening logic
        const isBuOpen = openedItems[bu.buId]?.isOpen;
        const isBUOpenWhenFounded = foundedBu && searchOption !== ItemType.businessUnits && isNil(isBuOpen);
        const isFounded = foundedBu && searchOption === ItemType.businessUnits;

        const countSitesInBu = Object.keys(foundedBu ? foundedBu.sites : bu.sites).length;
        if (!multiplyDisplaySettings.showEmpty && countSitesInBu === 0) return false;

        let buName: string = bu.name;
        if (isFounded) {
          buName = Utils.markPartOfString(buName, searchValue);
        }

        const isBuLoading = loading.buId?.includes(parseInt(buId));

        return (
          <div style={{ width: '100%' }} key={buId + 'key'}>
            {/* business units */}
            {
              <FilterItem
                key={buId}
                content={`${buName}`}
                type={ItemType.businessUnits}
                counter={`${multiplyDisplaySettings.showCounter ? ` (${countSitesInBu})` : ''}`}
                checked={isBuChecked || isActivityChecked}
                isFounded={isFounded}
                isAllChecked={activeTab === 'Agents' ? checkedBU?.isAllChecked : checkedBU?.isAllActivitiesChecked}
                onClick={() => onClickItem(bu, ItemType.businessUnits)}
                onClickCheckbox={(e: React.MouseEvent) => onClickCheckbox(e, bu, ItemType.businessUnits)}
                loading={isBuLoading}
              />
            }

            {/*sites*/}
            {(isBuOpen || isBUOpenWhenFounded) &&
              Utils.sortObjectByName(bu.sites).map(siteId => {
                const site: ISite = items[buId].sites[siteId];
                const foundedSite = searchData[buId]?.sites[siteId];

                //checked logic
                const checkedSite = checkedBU && checkedBU?.sites && checkedBU.sites[siteId];
                const isSiteChecked = isAllSitesChecked || checkedSite?.isChecked;
                const isActivityChecked = checkedSite?.isActivityChecked;
                const isAllSiteActivitiesChecked =
                  checkedBU?.isAllActivitiesChecked || checkedSite?.isAllActivitiesChecked;
                const isAllTeamsChecked = checkedBU?.isAllChecked || checkedSite?.isAllChecked;

                //visible logic
                const activeTabVisible = activeTab === 'Agents' ? isAllSitesChecked : isAllSiteActivitiesChecked;
                const isSiteVisible: boolean =
                  !isSearchActive ||
                  !!foundedSite ||
                  activeTabVisible ||
                  checkedSite?.isChecked ||
                  (checkedSite && !isEmpty(checkedSite.teams));
                if (!isSiteVisible) return false;

                //opening logic
                const isTeamsOpen = openedItems[site.buId]?.sites[siteId]?.isOpen;
                const isActivitiesOpenWhenSearch =
                  foundedSite && searchOption === ItemType.activities && isNil(isTeamsOpen);
                const isTeamsOpenWhenSearch =
                  foundedSite &&
                  (searchOption === ItemType.teams || searchOption === 'agentName' || searchOption === 'agentId') &&
                  isNil(isTeamsOpen);

                const isFounded = isSearchData && searchOption === 'sites' && foundedSite;

                const countTeamsInSite = Object.keys(
                  foundedSite && isEmpty(site.teams) ? foundedSite.teams : site.teams,
                ).length;
                const countActivities = Object.keys(
                  foundedSite && isEmpty(site.activities) ? foundedSite.activities : site.activities,
                ).length;
                const counter = activeTab === 'Activities' ? countActivities : countTeamsInSite;

                if (!multiplyDisplaySettings.showEmpty && counter === 0 && !isSearchActive) return false;

                //add mark tag for searched value
                let siteName: string = site.name;
                if (!!isFounded) {
                  siteName = Utils.markPartOfString(siteName, searchValue);
                }

                const isSiteLoading = Utils.searchValue(loading.siteId, parseInt(siteId));
                if (initializedCheckedItems)
                  if (
                    doNotRenderUnselected &&
                    !isSiteChecked &&
                    initializedCheckedItems[buId].sites[siteId] === undefined
                  )
                    return;
                return (
                  <div style={{ width: '100%' }} key={`${buId}${siteId}key`}>
                    <FilterItem
                      key={`${buId}${siteId}`}
                      content={`${siteName}`}
                      counter={`${multiplyDisplaySettings.showCounter ? `(${counter})` : ''}`}
                      type={ItemType.sites}
                      isFounded={!!isFounded}
                      checked={activeTab === 'Agents' ? isSiteChecked : isActivityChecked}
                      isAllChecked={activeTab === 'Activities' ? isAllSiteActivitiesChecked : isAllTeamsChecked}
                      onClick={() => onClickItem(site, ItemType.sites)}
                      onClickCheckbox={e => onClickCheckbox(e, site, ItemType.sites)}
                      loading={isSiteLoading}
                    />

                    {/*Activities*/}
                    {activeTab === 'Activities' &&
                      (isTeamsOpen || isActivitiesOpenWhenSearch) &&
                      Utils.sortObjectByName(site.activities).map(activityId => {
                        const activity: IActivity = site.activities[activityId];
                        const checkedActivity =
                          isAllSiteActivitiesChecked ||
                          (checkedSite?.activities && checkedSite.activities[activityId]?.isChecked);

                        const foundedActivity = searchData[buId]?.sites[siteId]?.activities[activityId];
                        const isFounded = isSearchData && searchOption === 'activities' && !!foundedActivity;

                        //visible logic
                        const isActivityVisible: boolean =
                          !isSearchActive ||
                          !!foundedActivity ||
                          checkedSite?.isAllActivitiesChecked ||
                          checkedSite?.activities[activityId]?.isChecked;
                        if (!isActivityVisible) return false;

                        let activityName = activity.name;
                        if (isFounded) {
                          activityName = Utils.markPartOfString(activityName, searchValue);
                        }

                        return (
                          <div style={{ width: '100%' }} key={`${activityId}key`}>
                            <FilterItem
                              content={activityName}
                              type={ItemType.activities}
                              isAllChecked={checkedActivity}
                              isFounded={isFounded}
                              onClick={e =>
                                onClickCheckbox(
                                  e,
                                  { ...activity, buId: site.buId, siteId: site.siteId },
                                  ItemType.activities,
                                )
                              }
                              onClickCheckbox={e =>
                                onClickCheckbox(
                                  e,
                                  { ...activity, buId: site.buId, siteId: site.siteId },
                                  ItemType.activities,
                                )
                              }
                            />
                          </div>
                        );
                      })}

                    {/*Teams*/}
                    {activeTab === 'Agents' &&
                      (isTeamsOpen || isTeamsOpenWhenSearch) &&
                      Utils.sortObjectByName(site.teams).map(teamId => {
                        const team = items[buId].sites[siteId].teams[teamId];
                        const foundedTeam = searchData[buId]?.sites[siteId]?.teams[teamId];
                        const isFounded = isSearchData && searchOption === 'teams' && !!foundedTeam;

                        //opened items
                        const isAgentsOpen =
                          openedItems[bu.buId]?.sites[siteId]?.teams[teamId] &&
                          openedItems[bu.buId].sites[siteId].teams[teamId]?.isOpen;
                        const isAgentsOpenWhenSearch =
                          isSearchData &&
                          (searchOption === 'agentId' || searchOption === 'agentName') &&
                          isNil(isAgentsOpen);

                        // checkboxes
                        const checkedTeam = checkedSite && checkedSite.teams && checkedSite.teams[teamId];
                        const isTeamChecked = isAllSitesChecked || isAllTeamsChecked || checkedTeam?.isChecked;
                        const isAllAgentsChecked = isAllSitesChecked || isAllTeamsChecked || checkedTeam?.isAllChecked;

                        //visible logic
                        const isTeamVisible: boolean =
                          !isSearchActive || isFounded || !!foundedTeam || checkedSite?.isAllChecked || isTeamChecked;
                        if (!isTeamVisible) return false;

                        const countAgentsInTeam = Object.keys(foundedTeam ? foundedTeam.agents : team.agents).length;

                        if (!multiplyDisplaySettings.showEmpty && countAgentsInTeam === 0 && !isSearchActive)
                          return false;

                        let teamName = team.name;
                        if (isFounded) {
                          teamName = Utils.markPartOfString(teamName, searchValue);
                        }

                        return (
                          <div style={{ width: '100%' }} key={`${buId}${siteId}${teamId}key`}>
                            <FilterItem
                              key={`${buId}${siteId}${teamId}`}
                              content={`${teamName}`}
                              type={ItemType.teams}
                              counter={multiplyDisplaySettings.showCounter ? `(${countAgentsInTeam})` : ''}
                              isFounded={isFounded}
                              checked={isTeamChecked}
                              isAllChecked={isAllAgentsChecked}
                              onClick={() => onClickItem(team, ItemType.teams)}
                              onClickCheckbox={e =>
                                onClickCheckbox(e, foundedTeam ? foundedTeam : team, ItemType.teams)
                              }
                            />

                            {/*Agents*/}
                            {(isAgentsOpen || isAgentsOpenWhenSearch) &&
                              !isEmpty(team.agents) &&
                              Utils.sortObjectByName(team.agents).map(agentId => {
                                const agent = team.agents[agentId];
                                const foundedAgent = searchData[buId]?.sites[siteId]?.teams[teamId]?.agents[agentId];
                                const isFounded =
                                  foundedAgent && (searchOption === 'agentId' || searchOption === 'agentName');

                                //Checked logic
                                const checkedAgent = checkedTeam?.agents && checkedTeam.agents[agentId];
                                const isAgentChecked =
                                  isAllSitesChecked ||
                                  isAllTeamsChecked ||
                                  isAllAgentsChecked ||
                                  checkedAgent?.isChecked;

                                //visible logic
                                const isAgentVisible: boolean =
                                  !isSearchActive || checkedAgent?.isChecked || isAgentChecked || foundedAgent;
                                // if(isAgentVisible) isAgentVisible = (isSearchActive ? !!foundedAgent : true)
                                if (!isAgentVisible) return false;

                                //The logic of highlighting part of the name
                                let agentName: string;
                                if (activeView === 'fullName') {
                                  agentName = `${agent.firstName} ${agent.lastName}`;
                                } else if (activeView === 'fullNameAndEmployeeId') {
                                  agentName = `«${agent.employeeId}» ${agent.firstName} ${agent.lastName}`;
                                } else {
                                  agentName = `«${agent.employeeId}»`;
                                }
                                if (!agent.firstName && !agent.lastName) {
                                  agentName = `«${agent.employeeId}»`;
                                }

                                //add mark tag for searched value
                                if (isFounded) {
                                  if (searchValue && searchValue > highlightedValue) {
                                    agentName = Utils.markPartOfString(agentName, searchValue);
                                  } else if (highlightedValue)
                                    agentName = Utils.markPartOfString(agentName, highlightedValue);
                                }

                                return (
                                  <FilterItem
                                    key={agent.agentId}
                                    content={agentName}
                                    type={ItemType.agents}
                                    isFounded={isFounded}
                                    isAllChecked={isAgentChecked}
                                    onClick={e => onClickCheckbox(e, agent, ItemType.agents)}
                                    onClickCheckbox={e => onClickCheckbox(e, agent, ItemType.agents)}
                                  />
                                );
                              })}
                          </div>
                        );
                      })}
                  </div>
                );
              })}
          </div>
        );
      })}
    </div>
  );
};

export default FilterItems;
