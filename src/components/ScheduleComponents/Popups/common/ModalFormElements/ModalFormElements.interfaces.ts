import { MouseEventHandler } from 'react';

export enum IButtonType {
  OUTLINE,
  SOLID,
}

export enum IButtonAlign {
  CENTER,
  LEFT,
  RIGHT,
}

export interface IModalForm {
  isLoading?: boolean;
  title?: string;
  width?: number;
  height?: number;
  onCloseHandle?: MouseEventHandler;
  buttons?: IFooterButton[];
}

export interface IBlankForm {
  isLoading?: boolean;
  width?: number;
  height?: number;
}

export interface IHeaderForm {
  title?: string;
  onCloseHandle?: MouseEventHandler;
}

export interface IFooterButton {
  align?: IButtonAlign;
  disabled?: boolean;
  type?: IButtonType;
  title?: string;
  onClick?: (...args: any[]) => void;
}
