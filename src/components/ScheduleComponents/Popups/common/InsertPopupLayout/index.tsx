import React, {FC} from 'react';
import styles from './InsertPopupLayout.module.scss';
import Button from '../../../../ReusableComponents/button';
import { ReactComponent as Cross } from '../../../../../static/svg/cross.svg';
import classnames from 'classnames';
import { usePopUpHotkeys } from '../../../../../hooks';

export interface IInsertPopupLayoutProps {
  onClose: () => void;
  handleSave: (e: React.MouseEvent | KeyboardEvent) => void;
  disableSave: boolean;
  children: React.ReactNode;
  isApply: boolean;
  isPrevVisible?: boolean;
  handleClickPrev?: () => void;
  title: string;
  classNames?: string[];
  isDisabledButtons?: boolean;
}

const InsertPopupLayout: FC<IInsertPopupLayoutProps> = ({
  onClose,
  handleSave,
  disableSave,
  children,
  isApply,
  isPrevVisible,
  handleClickPrev,
  title,
  classNames,
  isDisabledButtons,
}) => {
  usePopUpHotkeys({ onSubmit: [handleSave], onCancel: [onClose] });

  return (
    <div className={styles.insertPopupLayout}>
      <div className={classnames([styles.insertPopupLayout__popup, ...(classNames || [])])}>
        <div className={styles.insertPopupLayout__header}>
          <h3 className={styles.insertPopupLayout__titleH3}>{title}</h3>
          <Cross style={{ cursor: 'pointer' }} onClick={onClose} />
        </div>
        <div className={styles.insertPopupLayout__content}>{children}</div>
        <div className={styles.insertPopupLayout__footer}>
          <div
            className={title.includes('Work') ? styles.insertPopupLayout_separatedBtns : styles.insertPopupLayout__btns}
          >
            <Button
              classNames={[styles.insertPopupLayout__btn]}
              style={{ background: '#FFFFFF', color: '#006FCF', border: '0.5px solid #0183F5', borderRadius: '5px' }}
              disable={isDisabledButtons}
              innerText={'Cancel'}
              click={onClose}
            />
            <div
              className={
                title.includes('Work') ? styles.insertPopupLayout_separatedBtns : styles.insertPopupLayout__btns
              }
            >
              {isPrevVisible && handleClickPrev && (
                <Button
                  classNames={[styles.insertPopupLayout__previousBtn]}
                  type={'primary'}
                  disable={isDisabledButtons}
                  innerText={'< Previous'}
                  click={handleClickPrev}
                />
              )}
              <Button
                classNames={[styles.insertPopupLayout__btn]}
                type={'primary'}
                disable={disableSave || isDisabledButtons}
                innerText={isApply ? 'Apply' : 'Next >'}
                click={handleSave}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsertPopupLayout;
