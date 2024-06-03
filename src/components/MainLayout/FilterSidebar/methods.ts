import { isEmpty, isNil, omit, pathOr } from 'ramda';

import { IActivity, IAgent, IBusinessUnit, IBusinessUnits, ISite, ITeam } from '../../../common/interfaces/config';
import Utils from '../../../helper/utils';
import { ActiveTab } from './FilterTabs';
import { SearchOptions } from './SearchSettings';

class FilterMethods {
  clickBUCheckbox(
    checkedItems: IBusinessUnits,
    isSearchActive: boolean,
    searchOption: SearchOptions,
    searchData: IBusinessUnits,
    fetchedData: IBusinessUnits,
    buId: string | number,
  ) {
    const bu: any = this.getOrCreateBU(checkedItems, buId);
    const fetchedBu: any = this.getBU(fetchedData, buId);

    bu.isChecked = !bu.isChecked;
    if (!bu.isChecked) {
      return this.removeBU(checkedItems, buId);
    } else {
      this.uncheckOtherBu(fetchedData, checkedItems, bu);
    }

    // const fetchedSite = this.getSite(fetchedData, buId, siteId);
    // for (const id in fetchedSite.activities) {
    //   const otherActivity = this.getOrCreateActivity(checkedItems, buId, siteId, id);
    //     otherActivity.isChecked = true;
    // }

    const isAllChecked = !isSearchActive || searchOption === 'businessUnits';
    bu.isActivityChecked = bu.isChecked;
    bu.isAllChecked = isAllChecked;
    bu.isAllActivitiesChecked = isAllChecked;

    if (isSearchActive) {
      const fetchedBu = this.getBU(searchData, buId);
      const isAllSitesChecked = searchOption === 'businessUnits' || searchOption === 'sites';
      this.toggleSites(checkedItems, fetchedBu, isAllSitesChecked, searchOption === 'teams');
    } else {
      for (const id in fetchedBu.sites) {
        const otherSite = this.getOrCreateSite(checkedItems, buId, id);
        otherSite.isChecked = true;
        otherSite.isAllChecked = true;
        otherSite.isAllActivitiesChecked = true;
      }
    }
    // this.checkItems(bu, fetchedBu, null, null, null, null);
  }

  togleBUCheckbox(
    checkedItems: IBusinessUnits,
    isSearchActive: boolean,
    searchOption: SearchOptions,
    searchData: IBusinessUnits,
    fetchedData: IBusinessUnits,
    buId: string | number,
  ) {
    const bu: any = this.getOrCreateBU(checkedItems, buId);

    bu.isChecked = true;
    bu.isActivityChecked = true;
    bu.isAllChecked = true;
    bu.isAllActivitiesChecked = true;
  }

  clickSiteCheckbox(
    items: IBusinessUnits,
    isSearchActive: boolean,
    selectedSearchOption: SearchOptions,
    activeTab: ActiveTab,
    searchData: IBusinessUnits,
    fetchedData: IBusinessUnits,
    buId: number | string,
    siteId: number | string,
  ) {
    const bu: IBusinessUnit = this.getOrCreateBU(items, buId);
    const fetchedBu = this.getBU(fetchedData, buId);
    const site = this.getOrCreateSite(items, buId, siteId);
    const siteIsChecked = bu.isAllChecked || site.isChecked;
    const fetchedSite = this.getSite(fetchedData, buId, siteId);

    // const activityIsChecked = bu.isAllActivitiesChecked || site.isAllActivitiesChecked;

    if (siteIsChecked) {
      if (bu.isAllChecked || bu.isAllActivitiesChecked) {
        for (const id in fetchedBu.sites) {
          if (+siteId !== +id) {
            const otherSite = this.getOrCreateSite(items, buId, id);
            otherSite.isChecked = true;
            otherSite.isAllChecked = bu.isAllChecked;
            otherSite.isAllActivitiesChecked = bu.isAllActivitiesChecked || otherSite.isAllActivitiesChecked;
          }
        }
        bu.isAllChecked = false;
        bu.isAllActivitiesChecked = false;
      }

      this.removeSite(items, buId, siteId);
    } else {
      // if(bu.isChecked && !bu.isAllActivitiesChecked){
      //   site.isChecked = false;
      //   site.isAllChecked = false;
      //   site.isAllActivitiesChecked = false;
      //   site.isActivityChecked = false;
      //   bu.isChecked = false;
      //   bu.isActivityChecked = false
      // }
      // else{
      // }
      site.isChecked = true;
      site.isAllChecked = true;
      site.isAllActivitiesChecked = true;
      site.isActivityChecked = true;
      bu.isChecked = true;

      for (const id in fetchedSite.activities) {
        const otherActivity = this.getOrCreateActivity(items, buId, siteId, id);
        otherActivity.isChecked = true;
      }

      this.uncheckOtherBu(fetchedData, items, bu);

      if (!site.isChecked) {
        for (const id in fetchedSite.teams) {
          const otherTeam = this.getOrCreateTeam(items, buId, siteId, id);
          otherTeam.isChecked = true;
          otherTeam.isAllChecked = true;
        }
        site.isAllChecked = true;
        site.isChecked = true;
      }

      bu.isActivityChecked = true;
      site.isActivityChecked = true;

      this.uncheckOtherBu(fetchedData, items, bu);
      if (isSearchActive) {
        const siteInSearch = this.getSite(searchData, buId, siteId);
        if (activeTab === 'Activities') {
          site.isAllChecked = true;
          site.isAllActivitiesChecked = false;
          this.toggleActivities(items, siteInSearch);
        } else {
          site.isAllChecked = selectedSearchOption === 'sites' || selectedSearchOption === 'businessUnits';
          site.isAllActivitiesChecked = true;
          this.toggleTeams(
            items,
            siteInSearch,
            selectedSearchOption === 'sites' || selectedSearchOption === 'businessUnits',
          );
        }
      }
      this.checkItems(bu, fetchedBu, site, fetchedSite, null, null);
    }
  }

  togleSiteCheckbox(
    items: IBusinessUnits,
    isSearchActive: boolean,
    selectedSearchOption: SearchOptions,
    activeTab: ActiveTab,
    searchData: IBusinessUnits,
    fetchedData: IBusinessUnits,
    buId: number | string,
    siteId: number | string,
  ) {
    const bu: IBusinessUnit = this.getOrCreateBU(items, buId);
    const fetchedBu = this.getBU(fetchedData, buId);
    const fetchedSite = this.getSite(fetchedData, buId, siteId);
    const site = this.getOrCreateSite(items, buId, siteId);
    const siteIsChecked = bu.isAllChecked || site.isChecked;

    if (siteIsChecked) {
      if (bu.isAllChecked || bu.isAllActivitiesChecked) {
        for (const id in fetchedBu.sites) {
          if (+siteId !== +id) {
            const otherSite = this.getOrCreateSite(items, buId, id);
            otherSite.isChecked = true;
            otherSite.isAllChecked = bu.isAllChecked;
            otherSite.isAllActivitiesChecked = bu.isAllActivitiesChecked || otherSite.isAllActivitiesChecked;
          }
        }
        bu.isAllChecked = false;
        bu.isAllActivitiesChecked = false;
      }

      // if(Object.keys(Array.from([items[buId].sites])).length !== 1){
      this.removeSite(items, buId, siteId);
      //}
      //this.removeSite(items, buId, siteId);
    } else {
      site.isChecked = true;
      site.isAllChecked = true;
      site.isAllActivitiesChecked = true;
      site.isActivityChecked = true;
      bu.isChecked = true;

      for (const id in fetchedSite.activities) {
        const otherActivity = this.getOrCreateActivity(items, buId, siteId, id);
        otherActivity.isChecked = true;
      }

      if (isSearchActive) {
        const siteInSearch = this.getSite(searchData, buId, siteId);
        if (activeTab === 'Activities') {
          site.isAllChecked = true;
          site.isAllActivitiesChecked = false;
          this.toggleActivities(items, siteInSearch);
        } else {
          site.isAllChecked = selectedSearchOption === 'sites' || selectedSearchOption === 'businessUnits';
          site.isAllActivitiesChecked = true;
          this.toggleTeams(
            items,
            siteInSearch,
            selectedSearchOption === 'sites' || selectedSearchOption === 'businessUnits',
          );
        }
      }
      this.checkItems(bu, fetchedBu, null, null, null, null);
    }
  }

  clickTeamCheckBox(
    items: any,
    isSearchActive: boolean,
    searchData: IBusinessUnits,
    fetchedData: IBusinessUnits,
    item: ITeam,
    searchOption: SearchOptions,
  ) {
    const bu = this.getOrCreateBU(items, item.buId);
    const site = this.getOrCreateSite(items, item.buId, item.siteId);
    const fetchedBu = this.getBU(fetchedData, item.buId);
    const fetchedSite = this.getSite(fetchedData, item.buId, item.siteId);
    const team: any = this.getOrCreateTeam(items, item.buId, item.siteId, item.teamId);
    const siteIsChecked = bu.isAllChecked || site.isAllChecked;
    // const isAllActivitiesChecked = bu.isAllActivitiesChecked || site.isAllActivitiesChecked;
    const teamIsChecked = bu.isAllChecked || site.isAllChecked || team.isChecked;

    if (teamIsChecked) {
      if (bu.isAllChecked) {
        for (const id in fetchedBu.sites) {
          if (+item.siteId !== +id) {
            const otherSite = this.getOrCreateSite(items, item.buId, id);
            otherSite.isChecked = true;
            otherSite.isAllChecked = true;
            otherSite.isAllActivitiesChecked = true;
          }
        }
      }

      // check other teams
      if (siteIsChecked) {
        for (const id in fetchedSite.teams) {
          if (+item.teamId !== +id) {
            const otherTeam = this.getOrCreateTeam(items, item.buId, item.siteId, id);
            otherTeam.isChecked = true;
            otherTeam.isAllChecked = true;
          }
        }
        bu.isAllChecked = false;
        site.isAllChecked = false;
        // site.isAllActivitiesChecked = false;
        // site.isActivityChecked = false
        site.isChecked = true;
      }

      //toggle activities
      // if (!isAllActivitiesChecked) {
      //   for (const id in fetchedSite.activities) {
      //     const otherActivity = this.getOrCreateActivity(items, item.buId, item.siteId, id);
      //     otherActivity.isChecked = false;
      //     // otherActivity.isActivityChecked = false;
      //     // otherActivity.isAllChecked = false;
      //     // otherActivity.isAllActivitiesChecked = false;
      //   }
      //
      //   site.isActivityChecked = true;
      // }

      this.removeTeam(items, item.buId, item.siteId, item.teamId);

      if (bu.isAllChecked || bu.isAllActivitiesChecked) {
        for (const id in fetchedBu.sites) {
          if (+site.siteId !== +id) {
            const otherSite = this.getOrCreateSite(items, item.buId, id);
            otherSite.isChecked = true;
            otherSite.isAllActivitiesChecked = bu.isAllActivitiesChecked || otherSite.isAllActivitiesChecked;
          }
        }
      }

      if (Object.keys(site.teams).length === 0) {
        bu.isAllChecked = false;
        bu.isAllActivitiesChecked = false;
      }
    } else {
      this.uncheckOtherBu(fetchedData, items, bu);

      if (!site.isChecked) {
        for (const id in fetchedSite.activities) {
          const otherActivity = this.getOrCreateActivity(items, item.buId, item.siteId, id);
          otherActivity.isChecked = true;
        }
        site.isActivityChecked = true;
      }

      team.isChecked = true;
      bu.isChecked = true;
      site.isChecked = true;
      team.isAllChecked =
        searchOption === 'teams' || searchOption === 'businessUnits' || searchOption === 'sites' || !isSearchActive;

      if (isSearchActive) {
        const teamInSearch = this.getTeam(searchData, item);
        this.toggleAgents(items, teamInSearch);
      }
      (!isSearchActive || searchOption === 'businessUnits') &&
        this.checkItems(bu, fetchedBu, site, fetchedSite, null, null);
    }
  }

  clickActivityCheckbox(
    items: IBusinessUnits,
    isSearchActive: boolean,
    fetchedData: IBusinessUnits,
    buId: number | string,
    siteId: number | string,
    activityId: number | string,
    revertChecked?: boolean,
  ) {
    const bu = this.getOrCreateBU(items, buId);
    const site = this.getOrCreateSite(items, buId, siteId);
    const activity: any = this.getOrCreateActivity(items, buId, siteId, activityId);

    const fetchedBu = this.getBU(fetchedData, buId);
    const fetchedSite = this.getSite(fetchedData, buId, siteId);

    const siteIsChecked = bu.isAllActivitiesChecked || site.isAllActivitiesChecked;
    const activityIsChecked = bu.isAllActivitiesChecked || site.isAllActivitiesChecked || activity.isChecked;

    if (activityIsChecked) {
      if (bu.isAllActivitiesChecked) {
        for (const id in fetchedBu.sites) {
          if (+siteId !== +id) {
            const otherSite = this.getOrCreateSite(items, buId, id);
            otherSite.isActivityChecked = true;
            otherSite.isAllActivitiesChecked = true;
          }
        }
        site.isActivityChecked = true;
      }

      //check other teams
      if (siteIsChecked) {
        for (const id in fetchedSite.activities) {
          if (+activityId !== +id) {
            const otherActivity = this.getOrCreateActivity(items, buId, siteId, id);
            otherActivity.isChecked = true;
          }
        }

        for (const id in fetchedSite.teams) {
          const otherTeam = this.getOrCreateTeam(items, buId, siteId, id);
          otherTeam.isChecked = true;
          otherTeam.isAllChecked = true;
        }

        bu.isAllActivitiesChecked = false;
        site.isAllActivitiesChecked = false;
      }

      this.removeActivity(items, buId, siteId, activityId);
    } else {
      this.uncheckOtherBu(fetchedData, items, bu);

      if (!site.isChecked && !revertChecked) {
        for (const id in fetchedSite.teams) {
          const otherTeam = this.getOrCreateTeam(items, buId, siteId, id);
          otherTeam.isChecked = true;
          otherTeam.isAllChecked = true;
        }
        site.isAllChecked = true;
        site.isChecked = true;
      }

      activity.isChecked = true;
      bu.isActivityChecked = true;
      site.isActivityChecked = true;

      this.checkItems(bu, fetchedBu, site, fetchedSite, null, null);
    }
  }

  togleActivityCheckbox(
    items: any,
    isSearchActive: boolean,
    fetchedData: IBusinessUnits,
    buId: number | string,
    siteId: number | string,
    activityId: number | string,
  ) {
    const bu = this.getOrCreateBU(items, buId);
    const site = this.getOrCreateSite(items, buId, siteId);
    const activity: any = this.getOrCreateActivity(items, buId, siteId, activityId);

    const fetchedBu = this.getBU(fetchedData, buId);
    const fetchedSite = this.getSite(fetchedData, buId, siteId);

    for (const id in fetchedBu.sites) {
      if (+siteId !== +id) {
        const otherSite = this.getOrCreateSite(items, buId, id);
        otherSite.isChecked = false;
        otherSite.isAllChecked = false;
        otherSite.isAllActivitiesChecked = false;
        otherSite.isActivityChecked = false;
        for (const id2 in otherSite.activities) {
          const otherActivity = this.getOrCreateActivity(items, buId, id, id2);
          otherActivity.isChecked = false;
        }
      }
    }
    bu.isAllChecked = false;
    bu.isAllActivitiesChecked = false;

    for (const id in fetchedSite.activities) {
      if (+activityId !== +id) {
        const otherActivity = this.getOrCreateActivity(items, buId, siteId, id);
        otherActivity.isChecked = false;
      }
    }
    activity.isChecked = true;
    bu.isActivityChecked = true;
    site.isActivityChecked = true;

    this.checkItems(bu, fetchedBu, site, fetchedSite, null, null);
  }

  clickAgentCheckbox(
    items: IBusinessUnits,
    isSearchActive: boolean,
    fetchedData: IBusinessUnits,
    item: IAgent,
    searchOption: SearchOptions,
  ) {
    const bu = this.getOrCreateBU(items, item.buId);
    const site = this.getOrCreateSite(items, item.buId, item.siteId);
    const team = this.getOrCreateTeam(items, item.buId, item.siteId, item.teamId);
    const fetchedBu = this.getBU(fetchedData, item.buId);
    const fetchedSite = this.getSite(fetchedData, item.buId, item.siteId);
    const fetchedTeam = this.getTeam(fetchedData, item);
    const agent: any = this.getOrCreateAgent(items, item.buId, item.siteId, item.teamId, item.agentId);
    const siteIsChecked = bu.isAllChecked || site.isAllChecked || site.isChecked;
    const teamIsChecked = bu.isAllChecked || site.isAllChecked || team.isAllChecked;
    const agentIsChecked = bu.isAllChecked || site.isAllChecked || team.isAllChecked || agent.isChecked;
    if (!fetchedBu) return;
    if (agentIsChecked) {
      if (bu.isAllChecked) {
        for (const id in fetchedBu.sites) {
          if (+item.siteId !== +id) {
            const otherSite = this.getOrCreateSite(items, item.buId, id);
            otherSite.isChecked = true;
            if (!isSearchActive) {
              otherSite.isAllChecked = true;
              otherSite.isAllActivitiesChecked = true;
            }
          }
          for (const teamId in fetchedBu.sites[id].teams) {
            if (+item.teamId !== +teamId) {
              const otherTeam = this.getOrCreateTeam(items, item.buId, id, teamId);
              otherTeam.isChecked = true;
              otherTeam.isAllChecked = true;
              otherTeam.isAllActivitiesChecked = true;
            }
          }
        }
      }

      if (teamIsChecked) {
        for (const id in fetchedTeam.agents) {
          if (+item.agentId !== +id) {
            const otherAgent = this.getOrCreateAgent(items, item.buId, item.siteId, item.teamId, id);
            otherAgent.isChecked = true;
          }
        }

        bu.isAllChecked = false;
        site.isAllChecked = false;
        team.isAllChecked = false;
        team.isChecked = true;
        site.isChecked = true;
      }
      site.isActivityChecked = !siteIsChecked;
      site.isAllActivitiesChecked = this.checkIsAllActivitiesInSiteChecked(site);
      bu.isAllActivitiesChecked = bu.isAllChecked && this.checkIsAllActivitiesInBuChecked(bu);

      this.removeAgent(items, item.buId, item.siteId, item.teamId, item.agentId);
    } else {
      this.uncheckOtherBu(fetchedData, items, bu);

      // check activities if site uncheck
      site.isActivityChecked = !siteIsChecked;
      site.isAllActivitiesChecked = this.checkIsAllActivitiesInSiteChecked(site);
      bu.isAllActivitiesChecked = (bu.isAllChecked || this.isAllSitesChecked(bu, fetchedData)) && this.checkIsAllActivitiesInBuChecked(bu);

      agent.isChecked = true;
      bu.isChecked = true;
      site.isChecked = true;
      team.isChecked = true;
      // if (this.checkIsAllActivitiesCheckedSite(bu)) {
      //   bu.isAllActivitiesChecked = true;
      // }

      if (!isSearchActive || searchOption === 'businessUnits') {
        this.checkItems(bu, fetchedBu, site, fetchedSite, team, fetchedTeam);
      }
    }
  }

  checkItems(
    bu?: IBusinessUnit | null,
    fetchedBu?: IBusinessUnit | null,
    site?: ISite | null,
    fetchedSite?: ISite | null,
    team?: ITeam | null,
    fetchedTeam?: ITeam | null,
  ) {
    if (team && fetchedTeam) {
      if (Object.keys(team.agents).length === Object.keys(fetchedTeam.agents).length) {
        const id = Object.keys(team.agents).find(id => !team.agents[id].isChecked);
        team.isAllChecked = !id;
        team.isAllActivitiesChecked = !id;
      }
    }

    if (site && fetchedSite) {
      if (Object.keys(site.activities).length === Object.keys(fetchedSite.activities).length) {
        const activityId = Object.keys(site.activities).find(id => !site.activities[id].isChecked);
        site.isAllActivitiesChecked = !activityId;
      }
      if (Object.keys(site.teams).length === Object.keys(fetchedSite.teams).length) {
        const id = Object.keys(site.teams).find(id => !site.teams[id].isAllChecked);
        site.isAllChecked = !id;
      }
    }

    if (bu && fetchedBu) {
      if (Object.keys(bu.sites).length === Object.keys(fetchedBu.sites).length) {
        const id = Object.keys(bu.sites).find(id => !bu.sites[id].isAllChecked);
        const activityId = Object.keys(bu.sites).find(id => !bu.sites[id].isAllActivitiesChecked);
        bu.isAllChecked = !id;
        bu.isAllActivitiesChecked = !activityId;
      }
    }
  }

  isAllSitesChecked = (bu: IBusinessUnit, allData?: IBusinessUnits): boolean | undefined => {
    if (allData) {
      return Object.keys(allData[bu.buId].sites).length === Object.keys(bu.sites).length &&
        Object.keys(bu.sites).every(siteId => bu.sites[siteId].isAllActivitiesChecked);
    }
  }

  checkIsAllActivitiesInSiteChecked(site: ISite) {
    const activityId = Object.keys(site.activities).find(id => !site.activities[id].isChecked);
    return !activityId;
  }

  checkIsAllActivitiesInBuChecked(bu: IBusinessUnit) {
    if (!bu.sites) return false;
    const isAllChecked = Object.keys(bu.sites).every(siteId =>
      this.checkIsAllActivitiesInSiteChecked(bu.sites[siteId]),
    );
    return isAllChecked;
  }

  checkIsAllActivitiesCheckedSite(bu: IBusinessUnit) {
    const siteId = Object.keys(bu.sites).find(id => !bu.sites[id].isAllActivitiesChecked);
    return !siteId;
  }

  toggleAgents(items: IBusinessUnits, team: ITeam) {
    for (const agentId in team.agents) {
      const agent = this.getOrCreateAgent(items, team.buId, team.siteId, team.teamId, agentId);
      agent.isChecked = true;
    }
  }

  toggleTeams(items: IBusinessUnits, site: ISite, isAllChecked: boolean) {
    for (const teamId in site.teams) {
      const team = this.getOrCreateTeam(items, site.buId, site.siteId, teamId);
      team.isChecked = true;
      team.isAllChecked = isAllChecked;
      this.toggleAgents(items, site.teams[teamId]);
    }
  }

  toggleActivities(items: IBusinessUnits, site: ISite, isAllSitesChecked?: boolean) {
    const _bu = this.getSite(items, site.buId, site.siteId);
    const _site = this.getSite(items, site.buId, site.siteId);
    for (const activityId in site.activities) {
      const activity = this.getOrCreateActivity(items, site.buId, site.siteId, activityId);
      activity.isChecked = true;
    }
    _site.isAllActivitiesChecked = isAllSitesChecked || this.checkIsAllActivitiesInSiteChecked(site);
    _bu.isAllActivitiesChecked = isAllSitesChecked || this.checkIsAllActivitiesInBuChecked(_bu);
  }

  toggleSites(items: IBusinessUnits, bu: IBusinessUnit, isAllSitesChecked: boolean, isAllTeamsCheckedChecked: boolean) {
    this.getOrCreateBU(items, bu.buId);

    for (const siteId in bu.sites) {
      const site = this.getOrCreateSite(items, bu.buId, siteId);
      site.isChecked = true;
      site.isActivityChecked = true;
      site.isAllChecked = isAllSitesChecked;

      this.toggleTeams(items, bu.sites[siteId], isAllTeamsCheckedChecked);
      this.toggleActivities(items, bu.sites[siteId], isAllSitesChecked);
    }
  }

  getSite(items: IBusinessUnits, buId: number | string, siteId: number | string) {
    const site: any = pathOr(null, [buId, 'sites', siteId], items);
    return site;
  }

  getTeam(items: IBusinessUnits, item: ITeam | IAgent) {
    const team: any = pathOr(null, [item.buId, 'sites', item.siteId, 'teams', item.teamId], items);
    return team;
  }

  getAgent(
    items: IBusinessUnits,
    buId: number | string,
    siteId: number | string,
    teamId: number | string,
    agentId: number | string,
  ) {
    const agent: any = pathOr(null, [buId, 'sites', siteId, 'teams', teamId, 'agents', agentId], items);
    return agent;
  }

  getBU(items: IBusinessUnits, buId: number | string) {
    const bu: any = pathOr(null, [buId], items);
    return bu;
  }

  getOrCreateBU(items: IBusinessUnits, buId: number | string, value?: any) {
    let bu: IBusinessUnit | null = pathOr(null, [buId], items);
    if (!bu) bu = items[buId] = value || { isChecked: false, isAllChecked: false, sites: {}, buId };
    return bu as IBusinessUnit;
  }

  getOrCreateSite(items: IBusinessUnits, buId: number | string, siteId: number | string, value?: any) {
    const bu = this.getOrCreateBU(items, buId);
    let site: ISite | null = pathOr(null, ['sites', siteId], bu);
    if (!site)
      site = items[buId].sites[siteId] = value || {
        activities: {},
        isAllChecked: false,
        teams: {},
        isChecked: false,
        buId,
        siteId,
      };

    return site as ISite;
  }

  getOrCreateTeam(
    items: IBusinessUnits,
    buId: number | string,
    siteId: number | string,
    teamId: number | string,
    value?: any,
  ) {
    let team: any = pathOr(null, [buId, 'sites', siteId, 'teams', teamId], items);
    if (!team)
      team = items[buId].sites[siteId].teams[teamId] = value || {
        agents: {},
        isAllChecked: false,
        isChecked: false,
        buId,
        siteId,
        teamId,
      };
    return team as ITeam;
  }

  getOrCreateActivity(items: any, buId: number | string, siteId: number | string, activityId: number | string) {
    let activity: any = pathOr(null, [buId, 'sites', siteId, 'activities', activityId], items);
    if (!activity)
      activity = items[buId].sites[siteId].activities[activityId] = { isChecked: false, buId, siteId, activityId };
    return activity as IActivity;
  }

  getOrCreateAgent(
    items: any,
    buId: number | string,
    siteId: number | string,
    teamId: number | string,
    agentId: number | string,
    value?: any,
  ) {
    let agent: IAgent | null = pathOr(null, [buId, 'sites', siteId, 'teams', teamId, 'agents', agentId], items);
    if (!agent)
      agent = items[buId].sites[siteId].teams[teamId].agents[agentId] = value || {
        isChecked: false,
        buId,
        siteId,
        teamId,
        agentId,
      };
    return agent as IAgent;
  }

  removeBU(items: any, buId: number | string) {
    delete items[buId];
  }

  removeSite(items: any, buId: number | string, siteId: number | string) {
    delete items[buId].sites[siteId];
    const bu = this.getBU(items, buId);
    bu.isAllChecked = false;
    if (isEmpty(items[buId].sites)) this.removeBU(items, buId);
  }

  removeTeam(items: any, buId: number | string, siteId: number | string, teamId: number | string) {
    delete items[buId].sites[siteId].teams[teamId];
    const site = this.getSite(items, buId, siteId);
    site.isAllChecked = false;
    if (isEmpty(items[buId].sites[siteId].teams)) this.removeSite(items, buId, siteId);
  }

  removeActivity(items: any, buId: number | string, siteId: number | string, activityId: number | string) {
    delete items[buId].sites[siteId].activities[activityId];
    const site = this.getSite(items, buId, siteId);
    site.isAllActivitiesChecked = false;

    if (isEmpty(items[buId].sites[siteId].activities)) {
      this.removeSite(items, buId, siteId);
    } else {
      site.isActivityChecked = true;
    }
  }

  removeAgent(
    items: any,
    buId: number | string,
    siteId: number | string,
    teamId: number | string,
    agentId: number | string,
  ) {
    delete items[buId].sites[siteId].teams[teamId].agents[agentId];
    if (isEmpty(items[buId].sites[siteId].teams[teamId].agents)) this.removeTeam(items, buId, siteId, teamId);
  }

  openBU(items: IBusinessUnits, item: IBusinessUnit, isOpen: boolean) {
    const bu = this.getOrCreateBU(items, item.buId, { isOpen: isOpen, sites: {} });
    bu.isOpen = !bu.isOpen;
    if (!bu.isOpen) this.removeBU(items, item.buId);
    return bu;
  }

  openSite(items: IBusinessUnits, item: ISite, isOpen?: boolean) {
    const site = this.getOrCreateSite(items, item.buId, item.siteId, {
      teams: {},
      activities: {},
      isOpen: isNil(isOpen) ? false : isOpen,
    });
    site.isOpen = !site.isOpen;

    return site;
  }

  openTeam(items: IBusinessUnits, isOpen: boolean, item: ITeam) {
    this.getOrCreateBU(items, item.buId, { sites: {}, isOpen: true });
    this.getOrCreateSite(items, item.buId, item.siteId, { teams: {}, activities: {}, isOpen: true });
    const team = this.getOrCreateTeam(items, item.buId, item.siteId, item.teamId, { agents: {}, isOpen: isOpen });
    team.isOpen = !team.isOpen;

    return team;
  }

  setIsUploaded(items: IBusinessUnits, item: IBusinessUnit | ISite | ITeam) {
    if ('sites' in item) {
      const bu = this.getOrCreateBU(items, item.buId);
      bu.isUploaded = true;
    }
    if ('teams' in item) {
      const site = this.getOrCreateSite(items, item.buId, item.siteId);
      site.isUploaded = true;
    }
    if ('agents' in item) {
      const team = this.getOrCreateTeam(items, item.buId, item.siteId, item.teamId);
      team.isUploaded = true;
    }
  }

  uncheckOtherBu(fetchedData: IBusinessUnits, items: IBusinessUnits, targetBu: IBusinessUnit) {
    for (const fetchedBuId in fetchedData) {
      if (+fetchedData[fetchedBuId].buId !== +targetBu.buId) {
        this.removeBU(items, fetchedData[fetchedBuId].buId);
      }
    }
  }

  removeEmptyObjects(data: IBusinessUnits, activeTab: ActiveTab, uploadedItems: IBusinessUnits) {
    const newData: IBusinessUnits = {};
    for (const buId in data) {
      const isBuUploaded = this.getBU(uploadedItems, buId)?.isUploaded;
      const bu = data[buId];
      const isBuEmpty = isEmpty(bu.sites);
      if (isBuEmpty) continue;
      newData[buId] = { ...omit(['sites'], bu), sites: {} };

      for (const siteId in bu.sites) {
        const site = bu.sites[siteId];
        const isSiteUploaded = this.getSite(uploadedItems, buId, siteId)?.isUploaded;
        const isSiteEmpty = isEmpty(site.teams);
        const isSiteActivityEmpty = isEmpty(site.activities);
        if (
          isBuUploaded &&
          ((activeTab === 'Agents' && isSiteEmpty) || (isSiteActivityEmpty && activeTab === 'Activities'))
        )
          continue;
        newData[buId].sites[siteId] = { ...omit(['teams'], site), teams: {}, activities: {} };

        for (const activityId in site.activities) {
          newData[buId].sites[siteId].activities[activityId] = site.activities[activityId];
        }

        for (const teamId in site.teams) {
          const team = site.teams[teamId];
          const isTeamEmpty = isEmpty(team.agents);
          if (isSiteUploaded && isTeamEmpty) continue;
          newData[buId].sites[siteId].teams[teamId] = { ...omit(['agents'], team), agents: {} };

          for (const agentId in team.agents) {
            newData[buId].sites[siteId].teams[teamId].agents[agentId] = team.agents[agentId];
          }
        }
      }
    }
    return newData;
  }

  findActivity = (data: IBusinessUnits, name: string, cb: (foundedBUs: IBusinessUnits) => void) => {
    const foundedBUs: any = {};

    for (const buId in data) {
      const fetchedBu: IBusinessUnit = data[buId];

      for (const siteId in fetchedBu.sites) {
        const fetchedSite: ISite = fetchedBu.sites[siteId];

        for (const activityId in fetchedSite.activities) {
          const activity = fetchedSite.activities[activityId];
          if (Utils.findMatch(activity.name, name)) {
            const site = this.getOrCreateSite(foundedBUs, buId, siteId, {
              buId,
              siteId,
              activities: {},
              teams: {},
            });
            site.activities[activityId] = activity;
          }
        }
      }
    }
    cb(foundedBUs);
  };
}

const filterMethods = new FilterMethods();
export default filterMethods;
