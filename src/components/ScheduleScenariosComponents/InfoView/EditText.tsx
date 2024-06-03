import classnames from 'classnames/bind';

import s from './EditText.module.scss';

const cx = classnames.bind(s);

export type TEditTextProps = {
  id?: string;
  onChange?: (...args: any[]) => void;
  initialValue?: string;
  removeSpecialCharacters?: boolean;
  placeHolder?: string;
  style?: any;
  notValid?: boolean;
  className?: string;
  disabled?: boolean;
  inactive?: boolean;
  width?: 'auto' | 'full';
  value?: string;
};

export const EditText = ({
  id,
  onChange,
  width,
  initialValue,
  inactive,
  placeHolder,
  className,
  disabled,
  value,
}: TEditTextProps) => {
  const editClassName = cx({
    edit: true,
    disabled,
    inactive,
    full: width === 'full',
    auto: width === 'auto',
  });

  return (
    <input
      id={id}
      className={`${editClassName}${className ? ' ' + className : ''}`}
      type="text"
      value={value || initialValue || ''}
      onChange={e => {
        if (disabled || inactive) return;
        onChange && onChange(e);

        // setValue(e.target.value);
      }}
      placeholder={disabled ? '' : placeHolder}
    />
  );
};
