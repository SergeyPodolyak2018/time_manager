import React, { useEffect, useRef, useState } from 'react';
import styles from './chartTargetDropdown.module.scss';
import {
  getFilterData,
  getFilterLoading,
  getCheckedItems as treeCheckedItems,
} from '../../../redux/selectors/filterSelector';
import { getCheckedItems, getMSAuse } from '../../../redux/selectors/chartSelector';
import { setChecked, togleMSAaction, addChartDataAction } from '../../../redux/actions/ChartActions';

import { useSelector } from 'react-redux';
import CheckBox from '../../ReusableComponents/Checkbox';
import FilterItems from '../../MainLayout/FilterSidebar/FilterItems';
import { SearchOptions } from '../../MainLayout/FilterSidebar/SearchSettings';
import { ActiveTab } from '../../MainLayout/FilterSidebar/FilterTabs';
import { IActivity, IAgent, IBusinessUnit, IBusinessUnits, ISite, ITeam } from '../../../common/interfaces/config';
import { clone, isEmpty } from 'ramda';
import fltMtd from '../../MainLayout/FilterSidebar/methods';
import { getNameByIdAndType, getTypeAndId, targetType } from '../../../helper/chart';
import { ItemType } from '../../MainLayout/FilterSidebar';
import { useAppDispatch } from '../../../redux/hooks';
import { ReactComponent as BuIcon } from './icons/buIcon.svg';
import { ReactComponent as SiteIcon } from './icons/siteIcon.svg';
import { ReactComponent as ActivIcon } from './icons/activities.svg';
import Search from '../../ReusableComponents/search';
import Button from '../../ReusableComponents/button';
import { getIsAnyMenuOpen, targetMenuIsOpen } from '../../../redux/selectors/timeLineSelector';
import { changeTargetMenuVisibility, closeAllMenu } from '../../../redux/actions/timeLineAction';
import classnames from 'classnames';
import { useOutsideClick } from '../../../hooks';

const typeIcon = {
  3: <BuIcon />,
  2: <SiteIcon />,
  0: <ActivIcon />,
};

const ChartTargetDropdown = () => {
  const dispatchHook = useAppDispatch();
  // const [listState, setListState] = useState(false);

  const [highlightedValue] = useState('');
  const [openedItems, setOpenedItems] = useState({});
  const [foundedOpenedItems, setFoundedOpenedItems] = useState({});
  const [selectedSearchOption] = useState<SearchOptions>('activities');
  const [activeTab] = useState<ActiveTab>('Activities');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [businessUnits, setBusinessUnits] = useState<IBusinessUnits>({});
  const isTargetMenuOpen = useSelector(targetMenuIsOpen);

  //display settings
  const [multiplyDisplaySettings] = useState({
    showEmpty: true,
    showCounter: true,
  });

  const fetchedData: IBusinessUnits = useSelector(getFilterData);
  const loading = useSelector(getFilterLoading);
  const checkedItems = useSelector(getCheckedItems);
  const initCheckedItems = useSelector(treeCheckedItems);
  const multiSiteUse = useSelector(getMSAuse);
  const isAnyMenuOpen = useSelector(getIsAnyMenuOpen);

  const data = getTypeAndId(checkedItems);
  const isDisabled =
    data.type !== targetType.BUSINESS_UNIT
      ? data.type !== targetType.SITE && data.siteId !== -1
        ? data.type !== targetType.SITE && data.siteId !== -1
        : data.type === targetType.SITE && data.siteId === -1
      : data.type !== targetType.BUSINESS_UNIT;

  useEffect(() => {
    setBusinessUnits(filterData(fetchedData));
  }, [fetchedData, initCheckedItems]);

  const openPopUp = () => {
    if (isAnyMenuOpen) {
      dispatchHook(closeAllMenu());
    }
    dispatchHook(changeTargetMenuVisibility(!isTargetMenuOpen));
  };

  const filterData = (data: IBusinessUnits) => {
    const activeBu = Object.keys(initCheckedItems)[0];
    if (activeBu) {
      return { [activeBu]: data[activeBu] };
    }
    return {};
  };
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

      if (!fetchedBu?.isUploaded && !isNotNeedToUploadBU) {
        const sites: any = {};
        Object.keys(item.sites).map(siteId => (sites[siteId] = { buId: item.buId, siteId }));
        fltMtd.setIsUploaded(isSearchActive ? allOpenedItems : newOpenedItems, item);
      }
    }

    if (type === ItemType.sites && 'siteId' in item && 'teams' in item) {
      if (loading.isTeamLoading) return;
      const isOpenedWhenSearchActive = isSearchActive
        ? !!fltMtd.getSite(searchData, item.buId, item.siteId)
        : isSiteOpen;
      fltMtd.openSite(newOpenedItems, item, isOpenedWhenSearchActive);
      const openedSite = fltMtd.getOrCreateSite(allOpenedItems, item.buId, item.siteId);

      const isNotNeedToUpload =
        isSearchActive &&
        (selectedSearchOption === 'agentName' ||
          selectedSearchOption === 'agentId' ||
          selectedSearchOption === 'teams');
      if (!openedSite.isUploaded && !isNotNeedToUpload) {
        // const teamIds = Object.keys(item.teams).map(teamId => +teamId);
        fltMtd.setIsUploaded(isSearchActive ? allOpenedItems : newOpenedItems, item);
      }
    }

    if (type === ItemType.teams && 'teamId' in item) {
      if (loading.isAgentsLoading) return;
      fltMtd.openTeam(newOpenedItems, isTeamOpen, item);
    }

    isSearchActive ? setFoundedOpenedItems(newOpenedItems) : setOpenedItems(newOpenedItems);
    isSearchActive && setOpenedItems(allOpenedItems);
  };

  const onApply = () => {
    dispatchHook(addChartDataAction());
    dispatchHook(changeTargetMenuVisibility(!isTargetMenuOpen));
  };

  const handleClickCheckbox = async (
    e: React.MouseEvent,
    item: IBusinessUnit | ITeam | ISite | IAgent | IActivity,
    type: ItemType,
  ) => {
    e.stopPropagation();
    if (!item || !type) return;

    const newItems: IBusinessUnits = clone(checkedItems);
    if (type === ItemType.businessUnits) {
      fltMtd.clickBUCheckbox(newItems, isSearchActive, selectedSearchOption, searchData, fetchedData, item.buId);
    } else {
      if (multiSiteUse) {
        dispatchHook(togleMSAaction());
      }
    }

    if (type === ItemType.sites && 'siteId' in item)
      fltMtd.togleSiteCheckbox(
        newItems,
        isSearchActive,
        selectedSearchOption,
        activeTab,
        searchData,
        fetchedData,
        item.buId,
        item.siteId,
      );
    //if ('agents' in item) fltMtd.clickTeamCheckBox(newItems, isSearchActive, searchData, fetchedData, item);
    //if ('agentId' in item) fltMtd.clickAgentCheckbox(newItems, isSearchActive, fetchedData, item);
    if (type === ItemType.activities && 'siteId' in item && 'activityId' in item) {
      fltMtd.togleActivityCheckbox(newItems, isSearchActive, fetchedData, item.buId, item.siteId, item.activityId);
    }
    //if (Object.keys(newItems).length !== 0) {
    dispatchHook(setChecked(newItems));
    //}
  };

  const getHeader = () => {
    if (Object.keys(checkedItems).length === 0) {
      return <div className={styles.default}>Select target</div>;
    } else {
      const data = getTypeAndId(checkedItems);
      const name = getNameByIdAndType(data, fetchedData);
      return (
        <div className={classnames(styles.default, styles.default__headerTitle)}>
          {typeIcon[data.type as keyof typeof typeIcon]}
          <span>{name}</span>
        </div>
      );
    }
  };

  const changeUseMSA = () => {
    const data = getTypeAndId(checkedItems);
    if (
      !(data.type !== targetType.BUSINESS_UNIT
        ? data.type !== targetType.SITE && data.siteId !== -1
          ? data.type !== targetType.SITE && data.siteId !== -1
          : data.type === targetType.SITE && data.siteId === -1
        : data.type !== targetType.BUSINESS_UNIT)
    ) {
      dispatchHook(togleMSAaction());
    }
  };

  const isButtonDisable = (data: any) => {
    return Object.keys(data).length === 0;
  };

  const buCheckedCorrector = (items: IBusinessUnits): IBusinessUnits => {
    const checkedItems = clone(items);
    const buKeys = Object.keys(checkedItems);
    for (const i of buKeys) {
      const siteKeys = Object.keys(checkedItems[i].sites);
      const allActivityCheckedSites = [];
      for (const j of siteKeys) {
        if (checkedItems[i].sites[j].isAllActivitiesChecked) {
          allActivityCheckedSites.push(j);
        }
      }
      if (allActivityCheckedSites.length === Object.keys(fetchedData[i].sites).length) {
        checkedItems[i].isAllActivitiesChecked = true;
      }
    }
    return checkedItems;
  };

  const targetDropdownRef = useOutsideClick(() => {
    dispatchHook(changeTargetMenuVisibility(false));
  });

  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const [searchValue, setSearchValue] = useState('');
  const [searchData, setSearchData] = useState({});
  const [dataIsLoading, setDataIsLoading] = useState(false);
  const onChangeSearchField = (value: string) => {
    const lowCaseVal = value.toLowerCase();
    lowCaseVal.trim();

    timerRef.current && clearTimeout(timerRef.current);
    setSearchValue(value);
    resetSearch();

    if (!isEmpty(searchData) && !value) {
      setFoundedOpenedItems({});
    }
    if (!value || value.length < 3) {
      setDataIsLoading(false);
      return null;
    }

    setDataIsLoading(true);
    timerRef.current = setTimeout(() => {
      setDataIsLoading(false);
      startSearch(value);
    }, 1000);
  };

  const startSearch = (value: string) => {
    setIsSearchActive(true);
    fltMtd.findActivity(businessUnits, value, result => setSearchData(result));
  };

  const resetSearch = () => {
    setIsSearchActive(false);
    setSearchValue('');
    setFoundedOpenedItems({});
    setSearchData({});
  };

  return (
    <div
      className={styles.container}
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        openPopUp();
      }}
      ref={targetDropdownRef}
    >
      {getHeader()}
      <div className={`${styles.arrow} ${isTargetMenuOpen ? styles.rotate : ''}`}></div>

      {isTargetMenuOpen ? (
        <div
          className={styles.tzContainer}
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className={styles.tzElementContainer}>
            <div className={`${styles.tzElement} ${styles.tzElementNotHover} ${styles.targetSearch}`}>
              <Search change={onChangeSearchField} removeSpecialCharacters={true} loading={dataIsLoading} />
            </div>
          </div>
          <div className={styles.tzElementContainer}>
            <div className={`${styles.tzElement} ${styles.tzElementNotHover} ${styles.infoElement}`}>
              <span>Select target</span>
            </div>
          </div>
          <div className={`${styles.tzElementContainer} ${styles.tzElementContainerBig}`}>
            <div className={`${styles.tzElement} ${styles.tzElementNotHover} ${styles.treeElement}`}>
              <FilterItems
                onClickItem={handleClickItem}
                onClickCheckbox={handleClickCheckbox}
                items={businessUnits}
                isSearchActive={isSearchActive}
                searchData={searchData}
                openedItems={isSearchActive ? foundedOpenedItems : openedItems}
                activeTab={'Activities'}
                searchOption={'activities'}
                activeView={'fullName'}
                searchValue={searchValue}
                checkedItems={buCheckedCorrector(checkedItems)}
                multiplyDisplaySettings={multiplyDisplaySettings}
                highlightedValue={highlightedValue}
                doNotRenderUnselected={true}
                initializedCheckedItems={initCheckedItems}
              />
            </div>
          </div>
          {/*<div className={styles.tzElementContainer}>*/}
          {/*  <div className={`${styles.tzElement} ${styles.tzElementNotHover} ${styles.beforeEndElement}`}></div>*/}
          {/*</div>*/}
          <div className={styles.tzElementContainer}>
            <div className={`${styles.tzElement} ${styles.tzElementNotHover} ${styles.checkBoxContainer}`}>
              <span className={isDisabled ? styles.disabledText : styles.defaultText}>Use Multi-site Activities</span>
              <CheckBox checked={multiSiteUse} onClick={changeUseMSA} />
            </div>
          </div>
          <div className={styles.tzElementContainer}>
            <div
              className={`${styles.tzElement} ${styles.tzElementNotHover} ${styles.checkBoxContainer} ${styles.buttonMainContainer}`}
            >
              <div className={styles.buttonContainer}>
                <Button
                  innerText={'Apply'}
                  click={onApply}
                  type={'primary'}
                  classNames={[styles.button]}
                  disable={isButtonDisable(checkedItems)}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        ''
      )}
    </div>
  );
};

export default ChartTargetDropdown;
