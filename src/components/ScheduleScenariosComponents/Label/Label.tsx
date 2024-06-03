import s from './Label.module.scss';
import classnames from 'classnames/bind';
const cx = classnames.bind(s);

export type TLabelProps = {
  id?: string;
  value?: string;
  className?: string;
  disabled?: boolean;
  htmlFor?: string;
};
export const Label = ({ id, value, className, disabled, htmlFor }: TLabelProps) => {
  const labelClassName = cx({
    label: true,
    disabled,
  });
  return (
    <label htmlFor={htmlFor} id={id} className={`${labelClassName}${className ? ' ' + className : ''}`}>
      {value}
    </label>
  );
};
