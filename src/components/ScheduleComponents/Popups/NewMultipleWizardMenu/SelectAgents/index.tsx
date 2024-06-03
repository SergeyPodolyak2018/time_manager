import React, {FC, useState} from 'react';
import { WizardType } from '../../../../../redux/ts/intrefaces/timeLine/WizardType';
import { ICatalog3 } from '../../../../../common/constants/schedule/timelineColors';
import styles from '../menu.module.scss';
import AgentTree from '../../../../ReusableComponents/FilterTree';
import Checkbox from '../../../../ReusableComponents/Checkbox';
import { IMainState } from '../index';
import { IBusinessUnits } from '../../../../../common/interfaces/config';
import { clone } from 'ramda';
import { IDataByType } from '../dataByType';
import classnames from 'classnames';
import SchMultipleItems from '../../../../../helper/schedule/SchMultipleItems';
import Spiner from '../../../../ReusableComponents/spiner';
import { useSelector } from 'react-redux';
import { getIsUseCustomColors } from '../../../../../redux/selectors/timeLineSelector';
import { getColorByID } from '../../../../../redux/selectors/colorsSelector';
import { SchStateType } from '../../../../../common/constants/schedule';
//import { IResponseFindAgentsFromSnapshotData } from '../../../../../api/ts/interfaces/findAgentsFromSnapshot';

interface ISelectAgents {
  mainState: IMainState;
  fetchedData: IBusinessUnits;
  initChecked: IBusinessUnits;
  setMainState: React.Dispatch<React.SetStateAction<IMainState>>;
  dataByType: IDataByType;
  singleChange: (name: string, value: any) => void;
  isDelete?: boolean;
  snapshotId:string;
  externalSearch?:string
  externalSearchChange?:(val:string) => void;
}

const SelectAgents: FC<ISelectAgents> = ({ mainState, fetchedData, singleChange, setMainState, dataByType, isDelete, snapshotId, externalSearch, externalSearchChange}) => {
  //const [cloneChecked] = useState(SchMultipleItems.updateCheckedItems(JSON.parse(JSON.stringify(mainState.localCheckedActivities)),mainState.acceptableAgentsFromSnapshot));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const customColorsTriger = useSelector(getIsUseCustomColors)
  const colorsFromApi = useSelector(getColorByID(Number(Object.keys(fetchedData)?.[0]) || 0));

  const disableByType = (type: WizardType, el: ICatalog3) => {
    if (type === 'insert' || type === 'delete')
      return SchMultipleItems.isMultisite(mainState.localCheckedItems) && el.disableIfMultisite;
    if (type === 'edit') return el.editDisable;
  };

  const indicatorChange = (index: number) => {
    if (dataByType.type === 'edit' || dataByType.type === 'delete') {
      setMainState(prevState => ({
        ...prevState,
        indicators: prevState.indicators.map((indicator, i) => {
          if (i === index) return { ...indicator, checked: !indicator.checked };
          return indicator;
        }),
      }));
    }

    if (dataByType.type === 'insert') {
      const newIndicator = { ...mainState.indicators[index] };
      newIndicator.checked = !mainState.indicators[index].checked;
      const indicators = mainState.indicators.map(el => {
        el.checked = false;
        return el;
      });
      indicators[index] = newIndicator;
      setMainState(prevState => ({
        ...prevState,
        indicators,
      }));
    }
  };

  const setLocalCheckedItems = (newItems: IBusinessUnits) => {
    setMainState(prevState => {
      const newIndicators = clone(prevState.indicators);
      if (SchMultipleItems.isMultisite(newItems)) {
        newIndicators.forEach((el: any) => {
          if (el.disableIfMultisite && el.checked) {
            el.checked = false;
          }
        });
      }
      return {
        ...prevState,
        localCheckedItems: newItems,
        indicators: newIndicators,
      };
    });
  };

  const setLoadingCB = (isLoadingValue: boolean) => {
    singleChange('loading', isLoadingValue);
    setIsLoading(isLoadingValue);
  }

  return (
    <>
      {isLoading && (<Spiner></Spiner>)}
      <div className={styles.subHeader}>
        <span>Select agents</span>
      </div>

      <div
        className={classnames({
          [styles.agentWrapper]: dataByType.type !== 'edit',
          [styles.agentWrapperEditWizard]: dataByType.type === 'edit',
        })}
      >
        <AgentTree
          useSelectedAgents={(mainState.passedView.indexOf(mainState.viewState)>-1)?true:mainState.useCurrentSelectedAgents}
          setLocalCheckedItems={setLocalCheckedItems}
          localCheckedItems={mainState.localCheckedItems}
          fetchedData={fetchedData}
          isWithoutFilterTabs={true}
          snapshotId={snapshotId}
          excludeSearchType={['businessUnits']}
          externalSearchValue={externalSearch}
          externalSearchChange={externalSearchChange}
          setLoadingCallback={setLoadingCB}
          blockUpload={true}
        />
      </div>
      <div
        className={classnames({
          [styles.agentFooterWrapper]: true,
          [styles.agentFooterWrapper__editWizard]: dataByType.type === 'edit',
        })}
      >
        <div
          className={styles.checkBoxWrap6}
          data-test={'match-activities-skills'}
          style={{ width: '280px', height: '16px' }}
        >
          <Checkbox
            checked={mainState.insertOnlyErrorsOrWarning}
            onClick={() => singleChange('insertOnlyErrorsOrWarning', !mainState.insertOnlyErrorsOrWarning)}
            style={{ width: '10px', height: '10px' }}
          />
          <span onClick={() => singleChange('insertOnlyErrorsOrWarning', !mainState.insertOnlyErrorsOrWarning)}>
            {dataByType.checkboxText1}
          </span>
        </div>
        <div
          className={styles.checkBoxWrap6}
          data-test={'match-activities-skills'}
          style={{ width: '107px', height: '16px' }}
        >
          <Checkbox
            checked={mainState.showWarnings}
            onClick={() => singleChange('showWarnings', !mainState.showWarnings)}
            style={{ width: '10px', height: '10px' }}
          />
          <span onClick={() => singleChange('showWarnings', !mainState.showWarnings)}>Show warnings</span>
        </div>
      </div>
      <div
        className={classnames({
          [styles.typesWrapper]: true,
          [styles.typesWrapper__editWizard]: dataByType.type === 'edit',
        })}
      >
        <div className={styles.typesWrapperHeader}>{dataByType.selectType}</div>
        <div className={styles.typesWrapperContainer}>
          {mainState.indicators.map((el, index) => {
            if ((isDelete && !el.canDelete) || (dataByType.type === 'edit' && disableByType(dataByType.type, el)))
              return;
            return (
              <div
                className={`${styles.checkBoxWrap6} ${styles.checkBoxWrapCorrector1}`}
                key={index}
                data-test={`${dataByType.type}-${el.testName}-type`}
                style={{ width: '111px', height: '16px' }}
              >
                <Checkbox
                  checked={el.checked}
                  onClick={() => indicatorChange(index)}
                  style={{ width: '10px', height: '10px' }}
                  disable={disableByType(dataByType.type, el)}
                />
                <span>{el.name}</span>
                <div className={styles.typeColor}>
                  <span style={{
                    width: '10px',
                    height: '10px',
                    backgroundColor: customColorsTriger && colorsFromApi
                      ? colorsFromApi[SchStateType[el.type !== SchStateType.SHIFT ? el.type : SchStateType.ACTIVITY] as keyof typeof colorsFromApi]?.color
                        ?  colorsFromApi[SchStateType[el.type !== SchStateType.SHIFT ? el.type : SchStateType.ACTIVITY] as keyof typeof colorsFromApi]?.color
                        : el.color
                      : el.color,
                    borderRadius: '2px'
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default SelectAgents;
