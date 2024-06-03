import { clone } from 'ramda';
import React, { FC } from 'react';

import {
  IReviewMessage,
  IScheduleRebuildReviewMessagesDialog,
} from '../interfaces';
import styles from './index.module.scss';
import Checkbox from '../../../../ReusableComponents/CheckboxStyled';
import useStateRef from 'react-usestateref';

const ReviewMessagesDialog: FC<IScheduleRebuildReviewMessagesDialog> = props => {
  const rebuildProgressPage = props.initState.data.rebuildProgressPage;
  const [items, setItems] = useStateRef<IReviewMessage[]>(rebuildProgressPage.reviewMessages);

  const onCheckedItem = (idx: number) => {
    const rebuildProgressPage = clone(props.initState.data.rebuildProgressPage);
    rebuildProgressPage.reviewMessages[idx].checked = !rebuildProgressPage.reviewMessages[idx].checked

    props.onChangeState('rebuildProgressPage', rebuildProgressPage);

    setItems(rebuildProgressPage.reviewMessages);
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.tableSubWrapper}>
        <table>
          <thead>
            <tr>
              <td>
                <div>Reviewed</div>
              </td>
              <td>
                <div>Site</div>
              </td>
              <td>
                <div>Message</div>
              </td>
            </tr>
          </thead>
          <tbody>
          {items.map((el, idx) => (
            <tr key={idx}>
              <td>
                <div className={styles.alignCentre}>
                  <Checkbox checked={el.checked} onClick={() => onCheckedItem(idx)} />
                </div>
              </td>
              <td>
                <div>{el.siteName}</div>
              </td>
              <td>
                <div className={styles.containerMessage}>
                  {el.warning}
                </div>
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReviewMessagesDialog;
