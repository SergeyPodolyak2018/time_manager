import { useSelector } from 'react-redux';

import {
  setOpenNewScenarioWizardAction,
  toggleDeleteScenarioPopup,
  toggleFilterMenuAction,
} from '../../../redux/actions/scheduleScenariosActions';
import { closeAllMenu } from '../../../redux/actions/timeLineAction';
import { useAppDispatch } from '../../../redux/hooks';
import { filterMenuOpenSelector, isNewScenarioWizardOpen } from '../../../redux/selectors/scheduleScenariosSelector';
import IconButton from '../../ReusableComponents/IconButton';
import { Tooltip } from '../../ReusableComponents/Tooltip/Tooltip';
import { FilterMenu } from '../FilterMenu';
import styles from './scenario.module.scss';

export const ScenarioBar = () => {
  const dispatch = useAppDispatch();

  const isNewScenarioWizardOpenSelector = useSelector(isNewScenarioWizardOpen);
  const filterMenuOpen = useSelector(filterMenuOpenSelector);

  const clickOnIconButton = (type: string) => {
    dispatch(closeAllMenu());
    if (type === 'create') {
      dispatch(setOpenNewScenarioWizardAction(!isNewScenarioWizardOpenSelector));
    } else if (type === 'delete') {
      dispatch(toggleDeleteScenarioPopup());
    }
  };
  const togglefilterMenu = () => dispatch(toggleFilterMenuAction());
  return (
    <>
      <div className={styles.container}>
        <div className={styles.headerContainer}>
          <div>Schedule scenario</div>
        </div>
        <div className={styles.buttonContainer}>
          <Tooltip text="Create">
            <IconButton
              type={'create'}
              active={isNewScenarioWizardOpenSelector}
              click={() => {
                clickOnIconButton('create');
              }}
            />
          </Tooltip>
          <Tooltip text="Create base on...">
            <IconButton
              type={'createBaseOn'}
              active={false}
              click={() => {
                clickOnIconButton('createBaseOn');
              }}
            />
          </Tooltip>
          <Tooltip text="Open">
            <IconButton
              type={'open'}
              active={false}
              click={() => {
                clickOnIconButton('open');
              }}
            />
          </Tooltip>
          <Tooltip text="Close">
            <IconButton
              type={'close'}
              active={false}
              click={() => {
                clickOnIconButton('close');
              }}
            />
          </Tooltip>
          <Tooltip text="Publish">
            <IconButton
              type={'publish'}
              active={false}
              click={() => {
                clickOnIconButton('publish');
              }}
            />
          </Tooltip>
          <Tooltip text="Extract from master">
            <IconButton
              type={'extract'}
              active={false}
              click={() => {
                clickOnIconButton('extract');
              }}
            />
          </Tooltip>
          <Tooltip text="Delete">
            <IconButton
              type={'delete'}
              active={false}
              click={() => {
                clickOnIconButton('delete');
              }}
            />
          </Tooltip>
          <Tooltip text="Mark as shared">
            <IconButton
              type={'shared'}
              active={false}
              click={() => {
                clickOnIconButton('shared');
              }}
            />
          </Tooltip>
          <Tooltip text="Mark as not shared">
            <IconButton
              type={'notShared'}
              active={false}
              click={() => {
                clickOnIconButton('notShared');
              }}
            />
          </Tooltip>
          <Tooltip text="Schedule Scenario Display Options">
            <IconButton type={'setup'} active={filterMenuOpen} click={togglefilterMenu} />
          </Tooltip>
          {filterMenuOpen ? <FilterMenu /> : ''}
        </div>
      </div>
    </>
  );
};

