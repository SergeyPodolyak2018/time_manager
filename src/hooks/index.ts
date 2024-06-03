import { mergeDeepRight } from 'ramda';
import React from 'react';
import { Options, useHotkeys } from 'react-hotkeys-hook';
import { useSelector } from 'react-redux';
import { Key } from 'ts-key-enum';

import { getErrorPopUpOpen } from '../redux/selectors/timeLineSelector';

export const useOutsideClick = (callback: () => void) => {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const handleClick = (event: any) => {
      if (ref.current && !ref.current?.contains(event.target)) {
        callback();
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [ref]);

  return ref;
};

type TPopUpHotkeysHookArgs = {
  onSubmit?: [onSubmitFunc: (e: KeyboardEvent) => void, onSubmitOptions?: Options, ...dependancies: any];
  onCancel?: [onCancelFunc: (e: KeyboardEvent) => void, onCancelOption?: Options, ...dependancies: any];
};
// usePopUpHotkeys - hook to close popups on ESC and submit on ENTER
// general popup should not be reacting if any error popup is open
// error popups should not be used with this hook, otherwise they will not be reacting on hotkeys
export const usePopUpHotkeys = ({ onSubmit, onCancel }: TPopUpHotkeysHookArgs) => {
  const onSubmitFunc = onSubmit ? onSubmit[0] : () => {};
  const onCancelFunc = onCancel ? onCancel[0] : () => {};

  const onSubmitOptions = onSubmit && onSubmit[1];
  const onCancelOptions = onCancel && onCancel[1];

  const onSubmitOptionsProps = onSubmitOptions || {};
  const onCancelOptionsProps = onCancelOptions || {};

  const onSubmitDependecies = onSubmit ? onSubmit.slice(2) : [];
  const onCancelDependecies = onCancel ? onCancel.slice(2) : [];

  const isErrorPopUpOpen = useSelector(getErrorPopUpOpen);
  const hotkeyOptions = { preventDefault: true, enabled: !isErrorPopUpOpen };
  const onSubmitHotkeyOptions = mergeDeepRight(hotkeyOptions, onSubmitOptionsProps);
  const onCancelHotkeyOptions = mergeDeepRight(hotkeyOptions, onCancelOptionsProps);

  useHotkeys(Key.Enter, onSubmitFunc, onSubmitHotkeyOptions, [onSubmit, ...onSubmitDependecies]);

  useHotkeys(Key.Escape, onCancelFunc, onCancelHotkeyOptions, [onCancel, ...onCancelDependecies]);
};
// uidotdev/usehooks/blob/main/index.js
export function useClickAway(cb: (e?: any) => void) {
  const ref = React.useRef<HTMLDivElement>(null);
  const refCb = React.useRef(cb);

  React.useLayoutEffect(() => {
    refCb.current = cb;
  });

  React.useEffect(() => {
    const handler = (e: any) => {
      const element = ref.current;
      if (element && !element.contains(e.target)) {
        refCb.current(e);
      }
    };

    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);

    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  return ref;
}
