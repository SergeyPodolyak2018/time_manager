import React, { FC } from 'react';
import styles from './FooterForm.module.scss';
import Button from '../../../../../ReusableComponents/button';
import { IFooterButton } from '../ModalFormElements.interfaces';

interface IFooterForm {
  buttons?: IFooterButton[];
}

const FooterForm: FC<IFooterForm> = props => {
  return (
    <div className={styles.footer}>
      <div className={styles.buttonWrapper_left} data-test={'modal-cancel-button'}>
        {(props.buttons ?? []).map((b: IFooterButton, idx: number) => (
          <Button
            key={idx}
            innerText={b.title ?? ''}
            click={b.onClick ? b.onClick : () => {}}
            disable={b.disabled}
            // type={}
            //   style={{
            //   background: '#FFFFFF',
            //   color: '#0183F5',
            //   border: '0.5px solid #0183F5',
            //   borderRadius: '5px',
            // }}
          />
        ))}
      </div>
      {/*{!copyToSelector.isMultiple ? (*/}
      {/*  mainState.viewState === 1 ? (*/}
      {/*    <div className={styles.buttonWrapper} data-test={'modal-next-button'}>*/}
      {/*      <Button*/}
      {/*        innerText={'Next >'}*/}
      {/*        click={() => {*/}
      {/*          if (mainStateRef.current.dateRange[1]) {*/}
      {/*            changeState(2);*/}
      {/*          }*/}
      {/*        }}*/}
      {/*        disable={!mainStateRef.current.dateRange[1]}*/}
      {/*        style={{*/}
      {/*          background: '#FFFFFF',*/}
      {/*          color: '#0183F5',*/}
      {/*          border: '0.5px solid #0183F5',*/}
      {/*          borderRadius: '5px',*/}
      {/*        }}*/}
      {/*      />*/}
      {/*    </div>*/}
      {/*  ) : (*/}
      {/*    <div className={styles.buttonWrapper} data-test={'modal-previous-button'}>*/}
      {/*      <Button*/}
      {/*        innerText={'< Previous'}*/}
      {/*        click={() => {*/}
      {/*          changeState(1);*/}
      {/*        }}*/}
      {/*        disable={false}*/}
      {/*        style={{*/}
      {/*          background: '#FFFFFF',*/}
      {/*          color: '#0183F5',*/}
      {/*          border: '0.5px solid #0183F5',*/}
      {/*          borderRadius: '5px',*/}
      {/*        }}*/}
      {/*      />*/}
      {/*    </div>*/}
      {/*  )*/}
      {/*) : null}*/}
      {/*<div className={styles.buttonWrapper} data-test={'modal-apply-button'}>*/}
      {/*  <Button*/}
      {/*    innerText={'Apply'}*/}
      {/*    click={onApply}*/}
      {/*    disable={isDisabledApply()}*/}
      {/*    style={{*/}
      {/*      background: '#FFFFFF',*/}
      {/*      color: '#0183F5',*/}
      {/*      border: '0.5px solid #0183F5',*/}
      {/*      borderRadius: '5px',*/}
      {/*    }}*/}
      {/*  />*/}
      {/*</div>*/}
    </div>
  );
};

export default FooterForm;
