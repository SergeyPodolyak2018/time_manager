import React from 'react';
import styles from './button.module.scss';

import classnames from 'classnames/bind';

const cx = classnames.bind(styles); // <-- explicitly bind your styles

export interface IButtonProps extends React.HTMLProps<HTMLElement> {
  innerText: string;
  urlTarget: string;
  urlCurrent: string;
  click: (url: string) => void;
  dropdown?: boolean;
}

const NavButton = (props: IButtonProps) => {
  const { urlTarget, urlCurrent, innerText, click, dropdown } = props;
  const className = cx({
    button: true,
    active: urlCurrent === urlTarget,
    'button--dropdown': dropdown,
  });

  return (
    <button className={className} onClick={() => click(urlTarget)}>
      {innerText}
    </button>
  );
};

export default NavButton;
