import React, { useState } from 'react';
import styles from './button.module.scss';
import classnames from 'classnames';

type BTN_TYPES = 'primary' | 'secondary' | 'secondary_active';

export interface IButtonProps extends React.HTMLProps<HTMLElement> {
  innerText: string;
  click: (...args: any[]) => void;
  style?: any;
  disable?: boolean;
  type?: BTN_TYPES;
  classNames?: string[];
  isSaveButton?: boolean;
}

const Button = (props: IButtonProps) => {
  const [isButtonDisabled, setButtonDisabled] = useState(false);

  const { click, innerText, style = {}, disable, type, classNames, isSaveButton } = props;
  const delay = () => {
    setTimeout(() => {
      setButtonDisabled(false);
    }, 5000);
  };
  return (
    <button
      className={classnames(
        {
          [styles.button]: true,
          [styles.buttonPrimary]: type === 'primary',
          [styles.buttonSecondary]: type === 'secondary',
          [styles.buttonSecondaryActive]: type === 'secondary_active',
        },
        classNames,
      )}
      onClick={e => {
        click(e);
        if (isSaveButton) {
          setButtonDisabled(true);
          delay();
        }
      }}
      disabled={isSaveButton ? disable || isButtonDisabled : disable}
      style={
        isSaveButton
          ? !disable && !isButtonDisabled
            ? style
            : { background: 'none', border: '1px solid #BCC4C8', color: '#BCC4C8', cursor: 'default' }
          : !disable
          ? style
          : { background: 'none', border: '1px solid #BCC4C8', color: '#BCC4C8', cursor: 'default' }
      }
    >
      {innerText}
    </button>
  );
};

const customComparator = (prevProps: IButtonProps, nextProps: IButtonProps) => {
  if (nextProps.innerText !== prevProps.innerText) return false;

  return nextProps.disable === prevProps.disable;
};

export default React.memo(Button, customComparator);
