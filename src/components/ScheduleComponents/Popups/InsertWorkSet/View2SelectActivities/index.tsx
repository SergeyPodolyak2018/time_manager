import React, {Dispatch, FC, SetStateAction} from 'react';
import classnames from 'classnames';

import styles from './View2SelectActivities.module.scss';
import SelectActivities, { ISelectActivitiesState } from '../../common/SelectActivities';
import { ActivitySetType } from '../../../../../common/constants/schedule';

interface IView2SelectActivitiesProps {
  setState: Dispatch<SetStateAction<ISelectActivitiesState>>;
  state: ISelectActivitiesState;
  setIsLoadingCallback: (isLoading: boolean) => void;
}

const View2SelectActivities: FC<IView2SelectActivitiesProps> = ({ setState, state , setIsLoadingCallback}) => {
  return (
    <div className={classnames([styles.insertWorkSetView2])}>
      <SelectActivities setState={setState} state={state} type={ActivitySetType.ALL} setIsLoadingCallback={setIsLoadingCallback} />
    </div>
  );
};

export default View2SelectActivities;
