import { clone, isEmpty } from 'ramda';
import React, { useEffect, useRef, useState } from 'react';
import { connect, useSelector } from 'react-redux';
import useStateRef from 'react-usestateref';

import { commonElementLimits } from '../../../common/constants';
import { IActivity, IAgent, IBusinessUnit, IBusinessUnits, ISite, ITeam } from '../../../common/interfaces/config';
import StorageMediator from '../../../helper/storageMediator';
import Utils from '../../../helper/utils';
import {
  buildTreeWithAgents,
  buildTreeWithBuAndSites,
  buildTreeWithTeamByBuAndSiteId,
  buildTreeWithTeams,
  changeSidebar,
  searchAgents,
  setCheckedItems,
  setInitCheckedItems,
  setSearchActive,
  setSearchData,
} from '../../../redux/actions/filterAction';
import {
  getColorsAction
} from '../../../redux/actions/getColorsAction';
import {
  changeDisplaySettingsVisibility,
  changeSearchSettingsVisibility,
  clearBuffer,
  getAgentsSchedule,
  openSaveConfirm,
  setIsModified,
  toggleLoader,
} from '../../../redux/actions/timeLineAction';
import { useAppDispatch } from '../../../redux/hooks';
import {
  getFilterData,
  getFilterLoading,
  getInitCheckedItems,
  getIsSearchActive,
  getSearchData,
  getSidebar,
} from '../../../redux/selectors/filterSelector';
import { subNameSelector } from '../../../redux/selectors/loginSelector';
import {
  displaySettingsIsOpen,
  getBuffer,
  getIsModifiedData,
  isLoadingSelector,
  searchSettingsIsOpen,
} from '../../../redux/selectors/timeLineSelector';
import { IFilterSidebarState } from '../../../redux/ts/intrefaces/filter';
import FilterItems from './FilterItems';
import styles from './FilterSidebar.module.scss';
import FilterTabs, { ActiveTab } from './FilterTabs';
import Input from './Input';
import fltMtd from './methods';
import SearchSettings, { SearchOptions } from './SearchSettings';
import DisplaySettings, { DisplayMultiplySettings, DisplayNameSettings } from './SettingsView';
import { ReactComponent as CollapseArrow } from './sidebarCollapseArrow.svg';

export enum ItemType {
  'businessUnits' = 'businessUnits',
  'sites' = 'sites',
  'teams' = 'teams',
  'agents' = 'agents',
  'activities' = 'activities',
  // 'contracts' = 'contracts',
}

export enum ContractItemType {
  'businessUnits' = 'businessUnits',
  'sites' = 'sites',
  'contracts' = 'contracts',
}

export interface IMultiplyDisplaySettings {
  showEmpty: boolean;
  showCounter: boolean;
}

function FilterSidebar(props: any) {
  const dispatchHook = useAppDispatch();
  const userId = useSelector(subNameSelector) || '';
  const isLoading = useSelector(isLoadingSelector);
  const [searchValue, setSearchValue] = useStateRef('');
  const [highlightedValue, setHighlightedValue] = useStateRef('');
  const [openedItems, setOpenedItems] = useStateRef({});
  const [foundedOpenedItems, setFoundedOpenedItems] = useStateRef({});
  const [selectedSearchOption, setSelectedSearchOption, selectedSearchOptionRef] = useStateRef<SearchOptions>(
    StorageMediator.getFromStorageByName(userId, 'filterTree', 'selectedSearchOption') ?? 'agentName',
  );
  const [isConventionalSearch, setIsConventionalSearch, isConventionalSearchRef] = useStateRef<any>(
    StorageMediator.getFromStorageByName(userId, 'filterTree', 'isConventionalSearch') ?? false,
  );
  const [activeTab, setActiveTab, activeTabRef] = useStateRef<ActiveTab>(
    StorageMediator.getFromStorageByName(userId, 'filterTree', 'activeTab') ?? 'Agents',
  );

  //input search
  const [words, setWords] = useStateRef<string[]>([]);

  //display settings
  const [activeView, setActiveView, activeViewRef] = useStateRef<DisplayNameSettings>(
    StorageMediator.getFromStorageByName(userId, 'filterTree', 'activeView') ?? 'fullName',
  );
  const [multiplyDisplaySettings, setMultiplyDisplaySettings, multiplyDisplaySettingsRef] =
    useStateRef<IMultiplyDisplaySettings>(
      StorageMediator.getFromStorageByName(userId, 'filterTree', 'multiplyDisplaySettings') ?? {
        showEmpty: true,
        showCounter: true,
      },
    );

  const [isTagsDropdownOpen, setIsTagsDropdownOpen]: [boolean, (val: boolean) => void] = useState(false);
  const fetchedData: IBusinessUnits = useSelector(getFilterData);
  const searchData: IBusinessUnits = useSelector(getSearchData);
  const isUnsavedChanges = useSelector(getIsModifiedData);
  const loading = useSelector(getFilterLoading);
  const isSearchActive = useSelector(getIsSearchActive);
  const checkedItems = useSelector(getInitCheckedItems);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const isDisplaySettingsOpen = useSelector(displaySettingsIsOpen);
  const isSearchSettingsOpen = useSelector(searchSettingsIsOpen);
  const buffer = useSelector(getBuffer);

  const beforeUnLoad = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    const payload = {
      selectedSearchOption: selectedSearchOptionRef.current,
      isConventionalSearch: isConventionalSearchRef.current,
      activeTab: activeTabRef.current,
      activeView: activeViewRef.current,
      multiplyDisplaySettings: multiplyDisplaySettingsRef.current,
    };
    StorageMediator.saveToStorageByName(userId, payload, 'filterTree');
  };

  useEffect(() => {
    window.addEventListener('beforeunload', beforeUnLoad);

    return () => {
      window.removeEventListener('beforeunload', beforeUnLoad);
    };
  }, []);

  useEffect(() => {
    dispatchHook(buildTreeWithBuAndSites({}));
  }, [dispatchHook]);

  useEffect(() => {
    const onClickWindow = (e: any) => {
      if (e.target.id !== 'searchBtn') {
        dispatchHook(changeSearchSettingsVisibility(false));
        dispatchHook(changeDisplaySettingsVisibility(false));
      }
    };
    window.addEventListener('click', onClickWindow);

    return () => {
      window.removeEventListener('click', onClickWindow);
    };
  }, []);

  const handleClickItem = (item: IBusinessUnit | ISite | ITeam | IActivity, type: ItemType) => {
    const newOpenedItems: IBusinessUnits = clone(isSearchActive ? foundedOpenedItems : openedItems);
    const allOpenedItems: IBusinessUnits = clone(openedItems);

    const isNotNeedToUploadBU = isSearchActive && selectedSearchOption !== 'businessUnits';
    const isBuOpen = isSearchActive && selectedSearchOption !== 'businessUnits';
    const isSiteOpen = isBuOpen && selectedSearchOption !== 'sites';
    const isTeamOpen = isSiteOpen && selectedSearchOption !== 'teams';

    if (type === ItemType.businessUnits && 'sites' in item) {
      fltMtd.openBU(newOpenedItems, item, isBuOpen);
      const fetchedBu = fltMtd.getBU(allOpenedItems, item.buId);

      if (!fetchedBu?.isOpen && !isNotNeedToUploadBU) {
        const sites: any = {};
        Object.keys(item.sites).map(siteId => (sites[siteId] = { buId: item.buId, siteId }));
        if (isEmpty(sites)) return;
        dispatchHook(buildTreeWithTeamByBuAndSiteId({ sites }));
        fltMtd.setIsUploaded(isSearchActive ? allOpenedItems : newOpenedItems, item);
      }
    }

    // site
    if (type === ItemType.sites && 'siteId' in item && 'teams' in item) {
      if (loading.isTeamLoading) return;
      const isOpenedWhenSearchActive = isSearchActive
        ? !!fltMtd.getSite(newOpenedItems, item.buId, item.siteId)?.isOpen
        : isSiteOpen;
      fltMtd.openSite(newOpenedItems, item, isOpenedWhenSearchActive);
      const openedSite = fltMtd.getOrCreateSite(allOpenedItems, item.buId, item.siteId);

      const isNotNeedToUpload =
        isSearchActive &&
        (selectedSearchOption === 'agentName' ||
          selectedSearchOption === 'agentId' ||
          selectedSearchOption === 'teams');
      if (!openedSite?.isOpen && !isNotNeedToUpload) {
        const teamIds = Object.keys(item.teams).map(teamId => +teamId);
        dispatchHook(buildTreeWithAgents({ buId: item.buId, siteId: item.siteId, teamId: teamIds }));
        fltMtd.setIsUploaded(isSearchActive ? allOpenedItems : newOpenedItems, item);
      }
    }

    if (type === ItemType.teams && 'teamId' in item) {
      if (loading.isAgentsLoading) return;
      const isOpenedWhenSearchActive = isSearchActive ? !!fltMtd.getTeam(newOpenedItems, item)?.isOpen : isTeamOpen;
      fltMtd.openTeam(newOpenedItems, isOpenedWhenSearchActive, item);
    }

    isSearchActive ? setFoundedOpenedItems(newOpenedItems) : setOpenedItems(newOpenedItems);
    isSearchActive && setOpenedItems(allOpenedItems);
  };

  const handleClickCheckbox = async (
    e: React.MouseEvent,
    item: IBusinessUnit | ITeam | ISite | IAgent | IActivity,
    type: ItemType,
  ) => {
    e.stopPropagation();
    if (!item || !type) return;

    const newItems = clone(checkedItems);
    const _fetchedData = multiplyDisplaySettings.showEmpty
      ? fetchedData
      : fltMtd.removeEmptyObjects(fetchedData, activeTab, openedItems);
    const param = typeof item.buId  === 'string' ? Number.parseInt(item.buId) : item.buId
    dispatchHook(getColorsAction({buId:param}))
    if (type === ItemType.businessUnits && 'sites' in item) {
      fltMtd.clickBUCheckbox(newItems, isSearchActive, selectedSearchOption, searchData, _fetchedData, item.buId);
    }
    if (type === ItemType.sites && 'siteId' in item) {
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
    }
    if ('agents' in item) {
      fltMtd.clickTeamCheckBox(newItems, isSearchActive, searchData, _fetchedData, item, selectedSearchOption);
    }
    if ('agentId' in item)
      fltMtd.clickAgentCheckbox(newItems, isSearchActive, _fetchedData, item, selectedSearchOption);
    if (type === ItemType.activities && 'siteId' in item && 'activityId' in item)
      fltMtd.clickActivityCheckbox(newItems, isSearchActive, _fetchedData, item.buId, item.siteId, item.activityId);
    dispatchHook(setInitCheckedItems(newItems));
  };

  const onChangeSearchField = (value: string) => {
    const lowCaseVal = value.toLowerCase();
    lowCaseVal.trim();

    timerRef.current && clearTimeout(timerRef.current);
    setSearchValue(value);
    !value && isSearchActive && dispatchHook(setSearchActive(false));

    if (!isEmpty(searchData) && !value) {
      setFoundedOpenedItems({});
      dispatchHook(setSearchData({}));
    }
    if (!value || value.length < 3) return null;

    timerRef.current = setTimeout(() => startSearch(value), 1000);
  };

  const findBU = (data: IBusinessUnits, name: string) => {
    const foundedBUs: IBusinessUnits = {};
    for (const buId in data) {
      const isMatch = Utils.findMatch(data[buId].name, name);
      if (isMatch) foundedBUs[buId] = data[buId];
    }
    dispatchHook(setSearchData(foundedBUs));
  };
  const findSite = (data: IBusinessUnits, name: string) => {
    const siteIds: any = {};

    const foundedBUs: any = {};
    for (const buId in data) {
      const fetchedBu: IBusinessUnit = data[buId];
      for (const siteId in data[buId].sites) {
        if (Utils.findMatch(data[buId].sites[siteId].name, name)) {
          siteIds[siteId] = { siteId: siteId, buId };

          if (!foundedBUs[buId]) foundedBUs[buId] = { name: fetchedBu.name, buId: fetchedBu.buId, sites: {} };
          foundedBUs[buId].sites[siteId] = fetchedBu.sites[siteId];
        }
      }
    }

    dispatchHook(setSearchData(foundedBUs));
    if (!isEmpty(siteIds)) dispatchHook(buildTreeWithTeamByBuAndSiteId({ sites: siteIds, isSearch: true }));
  };
  const startSearch = (value: string) => {
    if (selectedSearchOption === 'businessUnits') {
      dispatchHook(buildTreeWithBuAndSites({ isSearch: true })).then((res: any) => {
        if (!res.payload?.data) return res;
        findBU(res.payload.data, value);
        return res;
      });
    }
    if (selectedSearchOption === 'sites') {
      dispatchHook(buildTreeWithBuAndSites({ isSearch: true })).then((res: any) => {
        if (!res.payload?.data) return res;
        findSite(res.payload.data, value);
        return res;
      });
    }

    if (selectedSearchOption === 'activities') {
      dispatchHook(buildTreeWithBuAndSites({ isSearch: true })).then((res: any) => {
        if (!res.payload?.data) return res;
        fltMtd.findActivity(res.payload.data, value, result => dispatchHook(setSearchData(result)));
        return res;
      });
    }

    if (selectedSearchOption === 'teams') {
      dispatchHook(buildTreeWithTeams({ firstName: `${Utils.removeTrailingComma(value)}`, isSearch: true }));
    }
    if (selectedSearchOption === 'agentName') {
      const { firstNames, lastNames } = Utils.splitNames(value);

      dispatchHook(
        searchAgents({
          firstName: `${Utils.escapeRegExp(Utils.removeTrailingComma(firstNames.toLowerCase()))}`,
          lastName: `${Utils.escapeRegExp(Utils.removeTrailingComma(lastNames.toLowerCase()))}`,
        }),
      );
    }
    if (selectedSearchOption === 'agentId')
      dispatchHook(searchAgents({ employeeId: `${Utils.removeTrailingComma(value)}` }));
    dispatchHook(setSearchActive(true));
  };

  //click in popup settings checkbox
  const handleClickSettingsCheckbox = (type: SearchOptions, conventional?: boolean) => {
    setIsConventionalSearch(conventional || false);
    setSelectedSearchOption(type);
    if (selectedSearchOption !== type) resetSearch();
    if (selectedSearchOption === type && selectedSearchOption === 'agentId') resetOnlySearchValue();
    dispatchHook(changeSearchSettingsVisibility(false));
    // setIsSettingsSearchOpen(false);
  };

  const handleClickDisplaySettingsRadio = (type: DisplayNameSettings) => {
    setActiveView(type);
    dispatchHook(changeDisplaySettingsVisibility(false));
    // setIsSettingsDisplayOpen(false);
  };

  const handleClickDisplaySettingsCheckbox = (type: DisplayMultiplySettings) => {
    const value = !multiplyDisplaySettings[type];
    // if (type === 'showEmpty') {
    //   dispatchHook(showEmpty(value));
    // }
    setMultiplyDisplaySettings({
      ...multiplyDisplaySettings,
      [type]: value,
    });
  };

  // click in input search settings btn
  const handleClickSettingsBtn = () => {
    dispatchHook(changeSearchSettingsVisibility(!isSearchSettingsOpen));
    if (isDisplaySettingsOpen) {
      dispatchHook(changeDisplaySettingsVisibility(false));
    }
    setIsTagsDropdownOpen(false);
  };

  // click in input display settings btn
  const handleClickDisplaySettingsBtn = () => {
    if (activeTab === 'Activities') return;
    dispatchHook(changeDisplaySettingsVisibility(!isDisplaySettingsOpen));
    if (isSearchSettingsOpen) {
      dispatchHook(changeSearchSettingsVisibility(false));
    }
    setIsTagsDropdownOpen(false);
  };

  // click in input search settings btn
  const handleTagsDropdownBtn = () => {
    setIsTagsDropdownOpen(!isTagsDropdownOpen);
    if (isSearchSettingsOpen) {
      dispatchHook(changeSearchSettingsVisibility(false));
    }
    if (isDisplaySettingsOpen) {
      dispatchHook(changeDisplaySettingsVisibility(false));
    }
  };

  const clearCopyBuffer = () => {
    if (buffer && buffer.elements) dispatchHook(clearBuffer());
  };

  const handleClickSubmit = () => {
    if (isLoading) return;
    dispatchHook(toggleLoader(true));
    if (isUnsavedChanges) {
      dispatchHook(
        openSaveConfirm({
          onResult: result => {
            if (result === 'save' || result === 'discard') {
              clearCopyBuffer();
              dispatchHook(setIsModified(false));
              dispatchHook(setCheckedItems(checkedItems));
              dispatchHook(getAgentsSchedule());
            }
          },
        }),
      );
    } else {
      clearCopyBuffer();
      dispatchHook(setIsModified(false));
      dispatchHook(setCheckedItems(checkedItems));
      dispatchHook(getAgentsSchedule());
    }
  };

  const handleClickTab = (val: ActiveTab) => {
    resetSearch();
    if (val !== activeTab) {
      setSelectedSearchOption(val === 'Activities' ? 'activities' : 'agentName');
    }
    setActiveTab(val);
  };

  const resetSearch = () => {
    isSearchActive && dispatchHook(setSearchActive(false));
    setWords([]);
    setSearchValue('');
    setHighlightedValue('');
    setFoundedOpenedItems({});
    dispatchHook(setSearchData({}));
  };

  const resetOnlySearchValue = () => {
    const values = searchValue.split(',');
    if (/^C?0{6,8}$/.test(values.slice(-1)[0])) {
      setSearchValue(`${values.slice(0, -1).join(',')},`);
    }
  };

  const refSidebar = useRef<HTMLInputElement | null>(null);
  const refResize = useRef<HTMLInputElement | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(props.sidebar.isCollapsed);

  useEffect(() => {
    const resizeableEl = refSidebar.current;
    const controlEl = refResize.current;
    if (!resizeableEl || !controlEl) return;

    const bodyStyle = document.body.style;
    const styles = window.getComputedStyle(resizeableEl);
    const minWidth = commonElementLimits.filterSidebarMinWidth;
    const maxWidth = commonElementLimits.filterSidebarMaxWidth;
    const startWidth: number = parseInt(styles.width, 10);
    let startX: number, width: number;

    const onMoveResize = (event: MouseEvent) => {
      width = startWidth + (event.clientX - startX);
      if (width < minWidth) width = minWidth;
      if (width > maxWidth) width = maxWidth;
      props.changeSidebar({ width, isCollapsed: false });
      resizeableEl.style.width = `${width}px`;
    };
    const onEndResize = () => {
      bodyStyle.userSelect = '';
      bodyStyle.cursor = '';
      document.removeEventListener('mousemove', onMoveResize);
      document.removeEventListener('mouseup', onEndResize);
    };
    const onStartResize = (event: MouseEvent) => {
      if (isCollapsed) return;
      startX = event.clientX;
      bodyStyle.userSelect = 'none';
      bodyStyle.cursor = 'col-resize';
      document.addEventListener('mousemove', onMoveResize);
      document.addEventListener('mouseup', onEndResize);
    };

    controlEl.addEventListener('mousedown', onStartResize);

    return () => {
      controlEl.removeEventListener('mousedown', onStartResize);
    };
  }, [props.sidebar]);

  const onCollapse = () => {
    const _isCollapsed = !isCollapsed;
    setIsCollapsed(_isCollapsed);
    props.changeSidebar({ ...props.sidebar, isCollapsed: _isCollapsed });
  };

  const dropDownIsClosed = () => {
    return !isSearchSettingsOpen && !isDisplaySettingsOpen;
  };

  return (
    <div
      className={styles.filterSidebar}
      ref={refSidebar}
      style={{
        width: !isCollapsed ? `${props.sidebar.width}px` : `0`,
      }}
    >
      {!isCollapsed ? (
        <>
          <div className={styles.filterSidebarContainer__wrapper}>
            <div className={styles.filterSidebarContainer}>
              <div className={styles.filterSidebar__searchWrapper}>
                <Input
                  loading={loading.isSearch || loading.isLoading}
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
                  isConventionalSearch={!!isConventionalSearch}
                />

                {isSearchSettingsOpen && (
                  <SearchSettings
                    selectedOption={selectedSearchOption}
                    activeTab={activeTab}
                    onClickSettingsCheckbox={handleClickSettingsCheckbox}
                    isConventionalSearch={!!isConventionalSearch}
                  />
                )}

                {isDisplaySettingsOpen && (
                  <DisplaySettings
                    onClickReset={() => {
                      resetSearch();
                      dispatchHook(setInitCheckedItems({}));
                    }}
                    activeView={activeView}
                    onClickRadio={handleClickDisplaySettingsRadio}
                    onClickCheckbox={handleClickDisplaySettingsCheckbox}
                    multiplyDisplaySettings={multiplyDisplaySettings}
                  />
                )}
              </div>

              <FilterTabs activeTab={activeTab} setActiveTab={handleClickTab} />

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
                checkedItems={checkedItems}
                multiplyDisplaySettings={multiplyDisplaySettings}
                highlightedValue={highlightedValue}
              />
              {/*</FloatName>*/}
            </div>
          </div>
          <div className={styles.footerSidebarContainer}>
            <button disabled={isEmpty(checkedItems)} id="get-data" className={isEmpty(checkedItems) ? styles.filterSidebar__buttonDisabled : styles.filterSidebar__button} onClick={handleClickSubmit}>
              Get data
            </button>
          </div>
          <div className={styles.resizeController} ref={refResize}></div>
        </>
      ) : null}
      <div
        className={[styles.collapseController, isCollapsed ? styles.isCollapsed : ''].join(' ')}
        onClick={onCollapse}
      >
        <CollapseArrow />
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
