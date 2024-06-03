import classnames from 'classnames/bind';

import s from './generalButton.module.scss';

const cx = classnames.bind(s);
export type TGeneralButtonProps = {
  text?: string;
  icon?: React.FunctionComponent;
  className?: string;
  style?: React.CSSProperties;
  type?: 'primary' | 'danger' | 'regular';
  disabled?: boolean;
  id?: string;
  onClick?: () => void;
  loading?: boolean;
  cancelClickOnLoading?: boolean;
  // padding
  p?: string;
  hoverable?: boolean;
  shadow?: boolean;
  borderColor?: string;
};
export const GeneralButton = ({
  id,
  loading,
  shadow = false,
  hoverable = true,
  disabled,
  text,
  icon,
  className = '',
  style = {},
  cancelClickOnLoading = true,
  p,
  onClick = () => {},
  type = 'regular',
  borderColor,
}: TGeneralButtonProps) => {
  const combinedStyle = {
    ...style,
  };
  if (p) {
    combinedStyle.padding = p;
  }
  if (borderColor) {
    combinedStyle.borderColor = borderColor;
  }
  const combinedClassName = cx({
    hoverable,
    shadow,
    button: true,
    withIcon: icon,
    disabled,
    loading,
    [type || '']: type,
  }).concat(` ${className}`);

  const onClickHandler = () => {
    if (!disabled && (!loading || (loading && !cancelClickOnLoading))) {
      onClick();
    }
  };

  if (icon) {
    const IconComponent = icon;
    return (
      <button id={id} style={combinedStyle} onClick={onClickHandler} className={combinedClassName}>
        {text && <span>{text}</span>}
        <IconComponent />
      </button>
    );
  }
  return (
    <button id={id} onClick={onClickHandler} style={combinedStyle} className={combinedClassName}>
      {text}
    </button>
  );
};
