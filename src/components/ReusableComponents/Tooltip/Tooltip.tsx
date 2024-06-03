import {
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  Placement,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useMergeRefs,
  useRole,
} from '@floating-ui/react';

import s from './floatingContentStyles.module.scss';

interface TooltipOptions {
  initialOpen?: boolean;
  placement?: Placement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function useTooltip({
  initialOpen = false,
  placement = 'top',
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: TooltipOptions = {}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(initialOpen);

  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = setControlledOpen ?? setUncontrolledOpen;

  const data = useFloating({
    placement,
    open,
    onOpenChange: setOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(5),
      flip({
        crossAxis: placement.includes('-'),
        fallbackAxisSideDirection: 'start',
        padding: 5,
      }),
      shift({ padding: 5 }),
    ],
  });

  const context = data.context;

  const hover = useHover(context, {
    move: false,
    restMs: 800,
    enabled: controlledOpen == null,
  });
  const focus = useFocus(context, {
    enabled: controlledOpen == null,
  });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });

  const interactions = useInteractions([hover, focus, dismiss, role]);

  return useMemo(
    () => ({
      open,
      setOpen,
      ...interactions,
      ...data,
    }),
    [open, setOpen, interactions, data],
  );
}

type ContextType = ReturnType<typeof useTooltip> | null;

const TooltipContext = createContext<ContextType>(null);

export const useTooltipContext = () => {
  const context = useContext(TooltipContext);

  if (context == null) {
    throw new Error('Tooltip components must be wrapped in <Tooltip />');
  }

  return context;
};

export function TooltipLegacy({ children, ...options }: { children: React.ReactNode } & TooltipOptions) {
  // This can accept any props as options, e.g. `placement`,
  // or other positioning options.
  const tooltip = useTooltip(options);
  // const boundingRef = React.useRef<HTMLDivElement>(null);
  return <TooltipContext.Provider value={tooltip}>{children}</TooltipContext.Provider>;
}

export const TooltipTrigger = forwardRef<HTMLElement, React.HTMLProps<HTMLElement> & { asChild?: boolean }>(
  function TooltipTrigger({ children, asChild = true, ...props }, propRef) {
    const context = useTooltipContext();
    const childrenRef = (children as any).ref;
    const ref = useMergeRefs([context.refs.setReference, propRef, childrenRef]);

    // `asChild` allows the user to pass any element as the anchor
    if (asChild && isValidElement(children)) {
      return cloneElement(
        children,
        context.getReferenceProps({
          ref,
          ...props,
          ...children.props,
          'data-state': context.open ? 'open' : 'closed',
        }),
      );
    }

    return (
      <button
        ref={ref}
        // The user can style the trigger based on the state
        data-state={context.open ? 'open' : 'closed'}
        {...context.getReferenceProps(props)}
      >
        {children}
      </button>
    );
  },
);

export const TooltipContent = forwardRef<
  HTMLDivElement,
  React.HTMLProps<HTMLDivElement> & { style?: React.CSSProperties }
>(function TooltipContent({ style, ...props }, propRef) {
  const context = useTooltipContext();
  const ref = useMergeRefs([context.refs.setFloating, propRef]);

  if (!context.open) return null;

  return (
    <FloatingPortal>
      <div
        ref={ref}
        className={s.tooltip}
        style={{
          //@ts-ignore
          ...context.floatingStyles,
          ...style,
        }}
        {...context.getFloatingProps(props)}
      />
    </FloatingPortal>
  );
});

export const Tooltip = ({ text = '', children }: { text: string | React.ReactNode; children: React.ReactNode }) => {
  return (
    <TooltipLegacy>
      <TooltipTrigger>{children}</TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </TooltipLegacy>
  );
};

export const TooltippedTd = ({ text = '', className = '' }: { text: string; className?: string }) => {
  return (
    <Tooltip text={text}>
      <td className={className}>{text}</td>
    </Tooltip>
  );
};
type TooltippedChildProps = {
  text: string | undefined | React.ReactNode;
  child: string;
  style?: React.CSSProperties | undefined;
  onClick?: () => void;
  className?: string;
  maxWidth?: number;
  maxWidthMultiplier?: number;
};
export const TooltippedChild = ({
  text = '',
  child,
  style,
  className = '',
  onClick = () => {},
  // minimum of container's width (px) for which the tooltip will be shown
  maxWidth = -1,
  // multiplier for setting maxWidth based on the text length
  maxWidthMultiplier = 1,
}: TooltippedChildProps) => {
  // create a component with a dynamic tag name
  const ChildComponent = child as any;
  const textToDisplay = text || '';

  const boundingRef = useRef<any>(null);
  const [showTooltip, setShowTooltip] = useState(true);

  const boundingRectWidth = boundingRef.current ? boundingRef.current.getBoundingClientRect().width : null;

  // add resize observer to element to check if it's width is less than showOnMaxWidth
  const resizeObserver = new ResizeObserver(entries => {
    const boundingRectWidth = entries[0].contentRect.width;
    if (boundingRectWidth < maxWidth && maxWidthMultiplier === 1) {
      setShowTooltip(true);
    } else if (
      typeof text === 'string' &&
      maxWidth === -1 &&
      text.length !== 0 &&
      boundingRectWidth < text.length * maxWidthMultiplier
    ) {
      setShowTooltip(true);
    } else setShowTooltip(false);
  });

  useLayoutEffect(() => {
    if (typeof text === 'string' && text.length === 0) return;
    if ((maxWidth === -1 && maxWidthMultiplier === 1) || !boundingRectWidth) return;

    resizeObserver.observe(boundingRef.current);
    return () => resizeObserver.disconnect();
  }, [boundingRef.current, boundingRectWidth, maxWidthMultiplier, maxWidth]);

  if (showTooltip)
    return (
      <Tooltip text={textToDisplay}>
        <ChildComponent ref={boundingRef} className={className} onClick={onClick} style={style}>
          {textToDisplay}
        </ChildComponent>
      </Tooltip>
    );
  return (
    <ChildComponent ref={boundingRef} className={className} onClick={onClick} style={style}>
      {textToDisplay}
    </ChildComponent>
  );
};
