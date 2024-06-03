import React, { useEffect, useRef, useState } from 'react';
import styles from './FilterSidebar.module.scss';
import Input from '../../MainLayout/FilterSidebar/Input';
import FilterItems from '../../MainLayout/FilterSidebar/FilterItems';
import Spinner from '../spiner';
import { clone, isEmpty } from 'ramda';
import restApi from '../../../api/rest';
import fltMtd from '../../MainLayout/FilterSidebar/methods';
import { useSelector, connect } from 'react-redux';
import { buildTreeWithTeamByBuAndSiteId, changeSidebar, mergeData } from '../../../redux/actions/filterAction';
import { getFilterLoading, getSearchData, getSidebar } from '../../../redux/selectors/filterSelector';
import { ITeam, ISite, IBusinessUnit, IAgent, IBusinessUnits, IActivity } from '../../../common/interfaces/config';
import SearchSettings, { SearchOptions } from '../../MainLayout/FilterSidebar/SearchSettings';
import { useAppDispatch } from '../../../redux/hooks';
import FilterTabs, { ActiveTab } from './FilterTabs';
import DisplaySettings, {
  DisplayMultiplySettings,
  DisplayNameSettings,
} from '../../MainLayout/FilterSidebar/SettingsView';
import Utils from '../../../helper/utils';
import { IFilterSidebarState } from '../../../redux/ts/intrefaces/filter';
import classnames from 'classnames';
import { FetchAgents } from '../../../api/ts/interfaces/config.payload';

export enum ItemType {
  'businessUnits' = 'businessUnits',
  'sites' = 'sites',
  'teams' = 'teams',
  'agents' = 'agents',
  'activities' = 'activities',
}

function FilterSidebar(props: any) {
  const {
    localCheckedItems,
    setLocalCheckedItems,
    fetchedData,
    isWithoutFilterTabs,
    initActiveTab,
    snapshotId,
    externalStyle = {},
    revertCheckActivityBehaviour = false,
    excludeSearchType = [],
    externalSearchValue,
    externalSearchChange,
    contractId,
    setLoadingCallback,
    blockUpload = false,
  } = props;
  const dispatchHook = useAppDispatch();

  const getInitSelectedSearchOption = () => {
    switch (initActiveTab) {
      case 'Agents':
        return 'agentName';
      case 'Activities':
        return 'activities';
      default:
        return 'agentName';
    }
  };

  const [searchValue, setSearchValue] = useState(externalSearchValue ? externalSearchValue : '');
  const [highlightedValue, setHighlightedValue] = useState('');
  const [openedItems, setOpenedItems] = useState({});
  const [foundedOpenedItems, setFoundedOpenedItems] = useState({});
  const [selectedSearchOption, setSelectedSearchOption] = useState<SearchOptions>(getInitSelectedSearchOption());
  const [isConventionalSearch, setIsConventionalSearch] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>(
    ['Agents', 'Activities'].includes(initActiveTab) ? initActiveTab : 'Agents',
  );

  //input search
  const [words, setWords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  //display settings
  const [activeView, setActiveView] = useState<DisplayNameSettings>('fullName');
  const [multiplyDisplaySettings, setMultiplyDisplaySettings] = useState({
    showEmpty: false,
    showCounter: true,
  });
  const [isSettingsSearchOpen, setIsSettingsSearchOpen]: [boolean, (val: boolean) => void] = useState(false);
  const [isSettingsDisplayOpen, setIsSettingsDisplayOpen]: [boolean, (val: boolean) => void] = useState(false);
  const [isTagsDropdownOpen, setIsTagsDropdownOpen]: [boolean, (val: boolean) => void] = useState(false);

  //const [localCheckedItems, setLocalCheckedItems] = useState(props.useSelectedAgents?useSelector(getCheckedItems):{});
  const [isSearchActive, setSearchActive] = useState(false);
  const [searchData, setSearchData] = useState(props.useSelectedAgents ? useSelector(getSearchData) : {});

  // const isUnsavedChanges = useSelector(getIsModifiedData);
  const loading = useSelector(getFilterLoading);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const timerExtRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (typeof setLoadingCallback === 'function') {
      setLoadingCallback(isLoading);
    }
  }, [isLoading]);

  useEffect(() => {
    if (props.useSelectedAgents) return;
    setLocalCheckedItems({});
  }, [props.useSelectedAgents]);

  useEffect(() => {
    if (props.externalSearchValue !== undefined) {
      timerExtRef.current && clearTimeout(timerExtRef.current);
      setSearchValue(props.externalSearchValue);
      !props.externalSearchValue && isSearchActive && setSearchActive(false);

      if (!isEmpty(searchData)) {
        setFoundedOpenedItems({});
        setSearchData({});
      }
      if (props.externalSearchValue && props.externalSearchValue.length > 3) {
        timerExtRef.current = setTimeout(() => startSearch(props.externalSearchValue), 1000);
      }
    }
  }, [props.externalSearchValue]);

  useEffect(() => {
    const onClickWindow = (e: any) => {
      if (e.target.id !== 'searchBtn') {
        setIsSettingsSearchOpen(false);
        setIsSettingsDisplayOpen(false);
      }
    };
    window.addEventListener('click', onClickWindow);

    return () => {
      window.removeEventListener('click', onClickWindow);
    };
  }, []);

  const handleClickItem = async (item: IBusinessUnit | ISite | ITeam | IActivity, type: ItemType) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const newOpenedItems: IBusinessUnits = clone(isSearchActive ? foundedOpenedItems : openedItems);
      const allOpenedItems: IBusinessUnits = clone(openedItems);

      const isNotNeedToUploadBU = isSearchActive && selectedSearchOption !== 'businessUnits';
      const isBuOpen = isSearchActive && selectedSearchOption !== 'businessUnits';
      const isSiteOpen = isBuOpen && selectedSearchOption !== 'sites';
      const isTeamOpen = isSiteOpen && selectedSearchOption !== 'teams';

      if (type === ItemType.businessUnits && 'sites' in item) {
        fltMtd.openBU(newOpenedItems, item, isBuOpen);
        const fetchedBu = fltMtd.getBU(allOpenedItems, item.buId);

        if (!fetchedBu?.isUploaded && !isNotNeedToUploadBU) {
          const sites: any = {};
          Object.keys(item.sites).map(siteId => (sites[siteId] = { buId: item.buId, siteId }));
          const result = await restApi.buildTreeWithTeamByBuAndSiteId({ sites, snapshotId });
          dispatchHook(mergeData(result.data));
          //dispatchHook(fetchTeams({ sites }));
          fltMtd.setIsUploaded(isSearchActive ? allOpenedItems : newOpenedItems, item);
        }
      }

      if (type === ItemType.sites && 'siteId' in item && 'teams' in item) {
        if (loading.isTeamLoading) return;
        fltMtd.openSite(newOpenedItems, item, isSiteOpen);
        const openedSite = fltMtd.getOrCreateSite(allOpenedItems, item.buId, item.siteId);

        const isNotNeedToUpload =
          isSearchActive &&
          (selectedSearchOption === 'agentName' ||
            selectedSearchOption === 'agentId' ||
            selectedSearchOption === 'teams');
        if (!openedSite.isUploaded && !isNotNeedToUpload && !blockUpload) {
          const teamIds = Object.keys(item.teams).map(teamId => +teamId);
          const payload: FetchAgents = {
            buId: item.buId,
            siteId: item.siteId,
            teamId: teamIds,
            snapshotId,
          };
          if (contractId) {
            payload.contractId = contractId;
          }
          const result = await restApi.buildTreeWithAgents(payload);
          dispatchHook(mergeData(result.data));
          //dispatchHook(fetchAgents({ buId: item.buId, siteId: item.siteId, teamId: teamIds }));
          fltMtd.setIsUploaded(isSearchActive ? allOpenedItems : newOpenedItems, item);
        }
      }

      if (type === ItemType.teams && 'teamId' in item) {
        if (loading.isAgentsLoading) return;
        fltMtd.openTeam(newOpenedItems, isTeamOpen, item);
      }

      isSearchActive ? setFoundedOpenedItems(newOpenedItems) : setOpenedItems(newOpenedItems);
      isSearchActive && setOpenedItems(allOpenedItems);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClickCheckbox = async (
    e: React.MouseEvent,
    item: IBusinessUnit | ITeam | ISite | IAgent | IActivity,
    type: ItemType,
  ) => {
    e.stopPropagation();
    if (isLoading) return;
    if (!item || !type) return;

    const newItems: any = clone(localCheckedItems);
    if (type === ItemType.businessUnits)
      fltMtd.clickBUCheckbox(newItems, isSearchActive, selectedSearchOption, searchData, fetchedData, item.buId);
    if (type === ItemType.sites && 'siteId' in item)
      fltMtd.clickSiteCheckbox(
        newItems,
        isSearchActive,
        selectedSearchOption,
        activeTab,
        searchData,
        fetchedData,
        item.buId,
        item.siteId,
      );
    if ('agents' in item)
      fltMtd.clickTeamCheckBox(newItems, isSearchActive, searchData, fetchedData, item, selectedSearchOption);
    if ('agentId' in item) fltMtd.clickAgentCheckbox(newItems, isSearchActive, fetchedData, item, selectedSearchOption);
    if (type === ItemType.activities && 'siteId' in item && 'activityId' in item)
      fltMtd.clickActivityCheckbox(
        newItems,
        isSearchActive,
        fetchedData,
        item.buId,
        item.siteId,
        item.activityId,
        revertCheckActivityBehaviour,
      );
    setLocalCheckedItems(newItems);
  };

  const onChangeSearchField = (value: string) => {
    const lowCaseVal = value.toLowerCase();
    lowCaseVal.trim();
    if (typeof externalSearchChange !== 'function' && !externalSearchValue) {
      timerRef.current && clearTimeout(timerRef.current);
      setSearchValue(value);
      !value && isSearchActive && setSearchActive(false);

      if (!isEmpty(searchData)) {
        setFoundedOpenedItems({});
        setSearchData({});
      }
      if (!value || value.length < 3) return null;
      timerRef.current = setTimeout(() => startSearch(value), 1000);
    } else {
      externalSearchChange(value);
    }
  };

  const startSearch = async (value: string) => {
    setSearchActive(true);
    if (selectedSearchOption === 'businessUnits') {
      const foundedBUs: any = {};
      for (const buId in fetchedData) {
        const isMatch = Utils.findMatch(fetchedData[buId].name, value);
        if (isMatch) foundedBUs[buId] = fetchedData[buId];
      }
      setSearchData(foundedBUs);
    }

    if (selectedSearchOption === 'sites') {
      const siteIds: any = {};

      const foundedBUs: any = {};
      for (const buId in fetchedData) {
        const fetchedBu: IBusinessUnit = fetchedData[buId];

        for (const siteId in fetchedBu.sites) {
          if (Utils.findMatch(fetchedBu.sites[siteId].name, value)) {
            siteIds[siteId] = { siteId: siteId, buId };

            if (!foundedBUs[buId]) foundedBUs[buId] = { name: fetchedBu.name, buId: fetchedBu.buId, sites: {} };
            foundedBUs[buId].sites[siteId] = fetchedBu.sites[siteId];
          }
        }
      }

      setSearchData(foundedBUs);
      if (!isEmpty(siteIds)) {
        dispatchHook(buildTreeWithTeamByBuAndSiteId({ sites: siteIds }));
      }
    }

    if (selectedSearchOption === 'activities') {
      const foundedBUs: any = {};

      for (const buId in fetchedData) {
        const fetchedBu: IBusinessUnit = fetchedData[buId];

        for (const siteId in fetchedBu.sites) {
          const fetchedSite: ISite = fetchedBu.sites[siteId];

          for (const activityId in fetchedSite.activities) {
            const activity = fetchedSite.activities[activityId];
            if (Utils.findMatch(activity.name, value)) {
              const site = fltMtd.getOrCreateSite(foundedBUs, buId, siteId, {
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

      setSearchData(foundedBUs);
    }

    if (selectedSearchOption === 'teams') {
      const result = await restApi.buildTreeWithTeams({ firstName: `${Utils.removeTrailingComma(value)}` });
      setSearchData(result.data);
      dispatchHook(mergeData(result.data));
    }
    if (selectedSearchOption === 'agentName') {
      const { firstNames, lastNames } = Utils.splitNames(value);
      const result = await restApi.searchAgents({
        firstName: `${Utils.escapeRegExp(Utils.removeTrailingComma(firstNames.toLowerCase()))}`,
        lastName: `${Utils.escapeRegExp(Utils.removeTrailingComma(lastNames.toLowerCase()))}`,
      });
      setSearchData(result.data);
      dispatchHook(mergeData(result.data));
    }
    if (selectedSearchOption === 'agentId') {
      const result = await restApi.searchAgents({ employeeId: `${Utils.removeTrailingComma(value)}` });
      setSearchData(result.data);
      dispatchHook(mergeData(result.data));
    }
    setSearchActive(false);
  };

  //click in popup settings checkbox
  const handleClickSettingsCheckbox = (type: SearchOptions, conventional?: boolean) => {
    setIsConventionalSearch(conventional || false);
    setSelectedSearchOption(type);
    if (selectedSearchOption !== type) resetSearch();
    setIsSettingsSearchOpen(false);
  };

  const handleClickDisplaySettingsRadio = (type: DisplayNameSettings) => {
    setActiveView(type);
    setIsSettingsDisplayOpen(false);
  };

  const handleClickDisplaySettingsCheckbox = (type: DisplayMultiplySettings) => {
    setMultiplyDisplaySettings({
      ...multiplyDisplaySettings,
      [type]: !multiplyDisplaySettings[type],
    });
  };

  // click in input search settings btn
  const handleClickSettingsBtn = () => {
    setIsSettingsSearchOpen(!isSettingsSearchOpen);
    setIsSettingsDisplayOpen(false);
    setIsTagsDropdownOpen(false);
  };

  // click in input display settings btn
  const handleClickDisplaySettingsBtn = () => {
    if (activeTab === 'Activities') return;
    setIsSettingsDisplayOpen(!isSettingsDisplayOpen);
    setIsSettingsSearchOpen(false);
    setIsTagsDropdownOpen(false);
  };

  // click in input search settings btn
  const handleTagsDropdownBtn = () => {
    setIsTagsDropdownOpen(!isTagsDropdownOpen);
    setIsSettingsSearchOpen(false);
    setIsSettingsDisplayOpen(false);
  };

  const handleClickTab = (val: ActiveTab) => {
    resetSearch();
    if (val !== activeTab) {
      setSelectedSearchOption(val === 'Activities' ? 'activities' : 'agentName');
    }
    setActiveTab(val);
  };

  const resetSearch = () => {
    isSearchActive && setSearchActive(false);
    setWords([]);
    setSearchValue('');
    if (externalSearchChange && typeof externalSearchChange === 'function') {
      externalSearchChange('');
    }
    setHighlightedValue('');
    setFoundedOpenedItems({});
    setSearchData({});
  };

  const dropDownIsClosed = () => {
    return !isSettingsSearchOpen && !isSettingsDisplayOpen;
  };
  return (
    <div
      className={classnames({
        [styles.filterSidebar]: true,
        [styles.withoutFilter]: isWithoutFilterTabs,
      })}
    >
      {(loading.isLoading || loading.isSearch) && <Spinner />}
      {!isWithoutFilterTabs ? <FilterTabs activeTab={activeTab} setActiveTab={handleClickTab} /> : null}
      <div
        className={classnames({
          [styles.filterSidebarContainer__wrapper]: true,
          [styles.withoutFilter]: isWithoutFilterTabs,
        })}
        style={externalStyle}
      >
        <div className={styles.filterSidebarContainer}>
          <div className={styles.filterSidebar__searchWrapper}>
            <Input
              loading={loading.isSearch || isSearchActive}
              words={words}
              setWords={setWords}
              activeTab={activeTab}
              value={searchValue}
              searchOption={selectedSearchOption}
              dropDownIsClosed={dropDownIsClosed()}
              onChange={onChangeSearchField}
              onClickSettingsView={handleClickSettingsBtn}
              onClickSettings={handleClickDisplaySettingsBtn}
              onClickTagsDropdown={handleTagsDropdownBtn}
              isTagsDropdownOpen={isTagsDropdownOpen}
              setHighlightedValue={setHighlightedValue}
              startSearch={startSearch}
              isConventionalSearch={isConventionalSearch}
            />

            {isSettingsSearchOpen && (
              <SearchSettings
                selectedOption={selectedSearchOption}
                activeTab={activeTab}
                onClickSettingsCheckbox={handleClickSettingsCheckbox}
                isConventionalSearch={isConventionalSearch}
                excludeType={excludeSearchType}
              />
            )}

            {isSettingsDisplayOpen && (
              <DisplaySettings
                onClickReset={() => {
                  resetSearch();
                  setLocalCheckedItems({});
                }}
                activeView={activeView}
                onClickRadio={handleClickDisplaySettingsRadio}
                onClickCheckbox={handleClickDisplaySettingsCheckbox}
                multiplyDisplaySettings={multiplyDisplaySettings}
              />
            )}
          </div>
          <div className={styles.treeContainer}>
            {/*<FloatName>*/}
            <FilterItems
              onClickItem={handleClickItem}
              onClickCheckbox={handleClickCheckbox}
              items={fetchedData}
              isSearchActive={isSearchActive}
              searchData={searchData}
              // openedItems={openedItems}
              openedItems={isSearchActive ? foundedOpenedItems : openedItems}
              activeTab={activeTab}
              searchOption={selectedSearchOption}
              activeView={activeView}
              searchValue={searchValue}
              // checkedItems={isSearchActive ? foundedCheckedItems : checkedItems}
              checkedItems={localCheckedItems}
              multiplyDisplaySettings={multiplyDisplaySettings}
              highlightedValue={highlightedValue}
            />
            {/*</FloatName>*/}
          </div>
        </div>
      </div>
    </div>
  );
}

const mapStateToProps = (state: any) => {
  return {
    sidebar: getSidebar(state),
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    changeSidebar: (state: IFilterSidebarState) => dispatch(changeSidebar(state)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(FilterSidebar);
