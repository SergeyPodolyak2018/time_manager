import React, { CSSProperties, FC } from 'react';
import styles from './inlineSpinner.module.scss';
import classnames from 'classnames';

interface IInlineSpinnerProps {
  style?: CSSProperties;
  color?: 'white' | 'grey' | 'blue';
}
const InlineSpinner: FC<IInlineSpinnerProps> = ({ style, color }) => {
  return (
    <span
      style={style}
      className={classnames(styles.loader, {
        [styles.loader__grey]: color === 'grey',
        [styles.loader__blue]: color === 'blue'
      })}
    ></span>
  );
};

export default InlineSpinner;
