import React, { FC, useState } from 'react';
import styles from './dropdown.module.scss';
import { ReactComponent as Arrow } from './assets/arrow.svg';
import { ReactComponent as ArrowReverse } from './assets/arrowReverse.svg';
import classnames from 'classnames';
import { useFloating } from '@floating-ui/react';

interface DropdownProps {
  onSelect: (value: DropdownOption) => void;
  initialState: DropdownOption;
  hideFixLater: boolean;
  hideSave: boolean;
}

export enum DropdownOption {
  SAVE = 'Save',
  FIX_LATER = 'Fix later',
  DONT_SAVE = "Don't Save",
}

const Dropdown: FC<DropdownProps> = ({ onSelect, initialState, hideFixLater, hideSave }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<DropdownOption>(
    initialState ? initialState : DropdownOption.SAVE,
  );
  const { x, y, refs } = useFloating();

  const handleSelect = (option: DropdownOption) => {
    setSelectedOption(option);
    setIsOpen(false);
    onSelect(option);
  };

  return (
    <div className={styles.dropdown}>
      <div className={styles.dropdown__selected} onClick={() => setIsOpen(!isOpen)} ref={refs.setReference}>
        <div className={styles.dropdown__selectedText}>{selectedOption || 'Select an option...'}</div>
        <div
          className={classnames({
            [styles.dropdown__selectedArrow]: true,
            [styles['dropdown__selectedArrow--active']]: isOpen,
          })}
        >
          {isOpen ? <ArrowReverse /> : <Arrow />}
        </div>
      </div>
      {isOpen && (
        <div
          className={styles.dropdown__options}
          ref={refs.setFloating}
          style={{
            position: 'fixed',
            top: y ?? 0,
            left: x ?? 0,
            width: 'max-content',
          }}
        >
          {!hideSave && (
            <div className={styles.dropdown__option} onClick={() => handleSelect(DropdownOption.SAVE)}>
              Save
            </div>
          )}
          {!hideFixLater && (
            <div className={styles.dropdown__option} onClick={() => handleSelect(DropdownOption.FIX_LATER)}>
              Fix later
            </div>
          )}
          <div className={styles.dropdown__option} onClick={() => handleSelect(DropdownOption.DONT_SAVE)}>
            {"Don't save"}
          </div>
        </div>
      )}
    </div>
  );
};
export default Dropdown;
