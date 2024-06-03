import React, { ForwardedRef, LegacyRef } from 'react';
import styles from './button.module.scss';
import { ReactComponent as Setup } from './assets/Nut.svg';
import { ReactComponent as Settings } from './assets/SquaresFour.svg';
import { ReactComponent as Save } from './assets/FloppyDisk.svg';
import { ReactComponent as Update } from './assets/update.svg';
import { ReactComponent as Multiple } from './assets/Multiple.svg';
import { ReactComponent as Rebuild } from './assets/Rebuild.svg';
import { ReactComponent as Cleanup } from './assets/cleanup.svg';
import { ReactComponent as MeetingScheduler } from './assets/Meeting_Scheduler.svg';
import { ReactComponent as Build } from './assets/buildSchedule.svg';
import { ReactComponent as Filter } from './assets/filter.svg';
import { ReactComponent as NotShared } from './assets/notShared.svg';
import { ReactComponent as Shared } from './assets/shared.svg';
import { ReactComponent as Extract } from './assets/extract.svg';
import { ReactComponent as Delete } from './assets/delete.svg';
import { ReactComponent as Open } from './assets/open.svg';
import { ReactComponent as Close } from './assets/close.svg';
import { ReactComponent as Publish } from './assets/publish.svg';
import { ReactComponent as Create } from './assets/create.svg';
import { ReactComponent as CreateBaseOn } from './assets/createBaseOn.svg';

export type ScheduleBtnType =
  | 'setup'
  | 'settings'
  | 'save'
  | 'view'
  | 'update'
  | 'multiple'
  | 'rebuild'
  | 'cleanup'
  | 'meetingScheduler'
  | 'buildSchedule'
  | 'filter'
  | 'notShared'
  | 'shared'
  | 'delete'
  | 'open'
  | 'close'
  | 'publish'
  | 'extract'
  | 'createBaseOn'
  | 'create';

export interface IIconButtonProps extends React.HTMLProps<HTMLElement> {
  type: ScheduleBtnType;
  click: (...args: any[]) => void;
  style?: any;
  active?: boolean;
  disable?: boolean;
  ref?: LegacyRef<HTMLButtonElement>;
}

const IconButton = React.forwardRef((props: IIconButtonProps, ref: ForwardedRef<HTMLButtonElement>) => {
  const { click, type, style = {}, disable, active, ...rest } = props;
  const buttonId =
    type === 'setup'
      ? 'column-options'
      : type === 'settings'
      ? 'agents-view-settings'
      : type === 'save'
      ? 'save'
      : type === 'rebuild'
      ? 'rebuild-button'
      : type === 'buildSchedule'
      ? 'build-schedule-button'
      : type === 'multiple'
      ? 'multiple-operations-button'
      : type === 'cleanup'
      ? 'multiple-cleanup-button'
      : type === 'meetingScheduler'
      ? 'meeting-scheduler-button'
      : type === 'filter'
      ? 'filter-button'
      : type === 'notShared'
      ? 'notShared-button'
      : type === 'shared'
      ? 'shared-button'
      : type === 'delete'
      ? 'delete-button'
      : type === 'extract'
      ? 'extract-button'
      : type === 'open'
      ? 'open-button'
      : type === 'close'
      ? 'close-button'
      : type === 'createBaseOn'
      ? 'createBaseOn-button'
      : type === 'create'
      ? 'create-button'
      : type === 'publish'
      ? 'publish-button'
      : '';

  return (
    <button
      ref={ref}
      id={buttonId}
      className={`${styles.button} ${active ? styles.active : ''} ${disable ? styles.disable : ''}`}
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        if (!props.disable) click();
      }}
      style={style}
      disabled={disable}
      {...rest}
    >
      {type === 'setup' && <Setup />}
      {type === 'settings' && <Settings />}
      {type === 'save' && <Save />}
      {type === 'update' && <Update />}
      {type === 'multiple' && <Multiple />}
      {type === 'rebuild' && <Rebuild />}
      {type === 'buildSchedule' && <Build />}
      {type === 'cleanup' && <Cleanup />}
      {type === 'meetingScheduler' && <MeetingScheduler />}
      {type === 'filter' && <Filter />}
      {type === 'notShared' && <NotShared />}
      {type === 'shared' && <Shared />}
      {type === 'extract' && <Extract />}
      {type === 'publish' && <Publish />}
      {type === 'open' && <Open />}
      {type === 'delete' && <Delete />}
      {type === 'create' && <Create />}
      {type === 'createBaseOn' && <CreateBaseOn />}
      {type === 'close' && <Close />}
    </button>
  );
});
IconButton.displayName = 'IconButton';
export default IconButton;
