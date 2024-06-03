import { createPortal } from 'react-dom';

import { Cross } from '../../../static/svg';
import { GeneralButton, TGeneralButtonProps } from '../GeneralButton/GeneralButton';
import s from './generalPopup.module.scss';

type TPopupProps = {
  open: boolean;
  modalId?: string;
  onClose?: () => void;
  title?: string;
  children?: React.ReactNode;
  footerButtons?: TGeneralButtonProps[];
  width?: number;
  height?: number;
  customContentColor?: string;
  justifyFooter?: string;
  footerGap?: number;
};
export const GeneralPopup = ({
  width,
  height,
  modalId,
  children,
  title,
  open,
  onClose,
  footerButtons,
  customContentColor = 'white',
  justifyFooter = 'flex-end',
  footerGap = 20,
}: TPopupProps) => {
  if (!open) return null;
  const renderFooter = () => {
    if (!footerButtons || footerButtons.length === 0) return null;
    return (
      <div
        className={s.popupButtons}
        style={{
          justifyContent: justifyFooter,
          gap: `${footerGap}px`,
        }}
      >
        {footerButtons.map((buttonProps, index) => (
          <GeneralButton key={buttonProps.id || index} {...buttonProps} />
        ))}
      </div>
    );
  };
  return createPortal(
    <div className={s.popup}>
      <div
        className={s.popupContent}
        style={{
          width: width ? `${width}px` : 'auto',
          height: height ? `${height}px` : 'auto',
        }}
      >
        <div className={s.popupHeader}>
          <div className={s.popupTitle}>{title}</div>
          {onClose && (
            <GeneralButton
              p="0"
              hoverable={false}
              icon={Cross}
              onClick={onClose}
              style={{
                border: 'none',
              }}
            />
          )}
        </div>
        <div
          className={s.popupBody}
          style={{
            backgroundColor: customContentColor,
          }}
        >
          {children}
        </div>
        {renderFooter()}
      </div>
    </div>,
    document.body,
    modalId || 'general-modal',
  );
};
