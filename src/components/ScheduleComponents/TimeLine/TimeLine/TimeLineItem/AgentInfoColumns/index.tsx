import React, { CSSProperties, FC, useMemo, useState } from 'react';
import { IPossibleColumns } from '../../../../../../redux/ts/intrefaces/timeLine';
import styles from '../lineBar.module.scss';
import { initOpenEditCommentMenu, selectAgentAction } from '../../../../../../redux/actions/timeLineAction';
import { IAgentTimeline } from '../../../../../../redux/ts/intrefaces/timeLine/IAgentTimeline';
import { useAppDispatch } from '../../../../../../redux/hooks';
import { useSelector } from 'react-redux';
import {
  getColumns,
  getSelectedAgents,
  getTextCoefficient,
  getTimeFormat,
  getTimelineOptions,
} from '../../../../../../redux/selectors/timeLineSelector';
import { getActiveDateSelector } from '../../../../../../redux/selectors/controlPanelSelector';
import SchUtils from '../../../../../../helper/schedule/SchUtils';
import SchAgent from '../../../../../../helper/schedule/SchAgent';
import classnames from 'classnames';
import {
  autoPlacement,
  autoUpdate,
  detectOverflow,
  MiddlewareState,
  offset,
  useFloating,
  useHover,
  useInteractions,
} from '@floating-ui/react';
import { DayType } from '../../../../../../common/constants/schedule';

interface IAgentInfoColumns {
  agent: IAgentTimeline;
  style?: CSSProperties;
}

const AgentInfoColumns: FC<IAgentInfoColumns> = ({ agent, style }) => {
  const dispatch = useAppDispatch();

  const timeFormat = useSelector(getTimeFormat);
  const scale = useSelector(getTextCoefficient);
  const currentDate = useSelector(getActiveDateSelector);
  const columns = useSelector(getColumns);
  const options = useSelector(getTimelineOptions);
  const selectedAgents = useSelector(getSelectedAgents);

  const isSelected = useMemo(
    () => selectedAgents && selectedAgents.some(({ agentId }) => agentId === agent.agentId),
    [selectedAgents],
  );
  const getColumnsContent = (element: IPossibleColumns, timeFormat: string) => {
    let scaleConst = 1;
    if (scale > 250) {
      scaleConst = 1.5;
    }
    if (scale < 100) {
      scaleConst = scale / 80;
    }

    const text = SchUtils.columnContentHandler(
      element.id,
      agent[element.id as keyof IAgentTimeline],
      timeFormat,
      agent,
      currentDate,
    );

    const [isFullNameVisible, setIsFullNameVisible] = useState(false);

    // const isElementHidden = async (state: Partial<UseFloatingProps<ReferenceType>> ) => {
    //
    // };
    const checkOverflow = {
      name: 'detectOverflow',
      async fn(state: MiddlewareState) {
        const overflow = await detectOverflow(state, {
          elementContext: 'reference',
        });
        if (overflow.right !== 0) {
          state.elements.floating.style.display = 'none';
          return { ...state, strategy: 'fixed' };
        }
        return state;
      },
    };

    const { x, y, strategy, refs, context } = useFloating({
      placement: 'top',
      open: isFullNameVisible,
      onOpenChange: setIsFullNameVisible,
      whileElementsMounted: autoUpdate,
      middleware: [
        offset(0),
        checkOverflow,
        autoPlacement({
          padding: 5, // 0 by default
        }),
      ],
    });

    const hover = useHover(context, {
      restMs: 800,
    });

    const { getReferenceProps, getFloatingProps } = useInteractions([hover]);
    // const cursorStyle = useMemo(() => conditionForPointerCursor(element.id, 'comments'), [agent.activities]);

    if (element.visible) {
      return (
        <div key={`${agent.agentId}${element.id}`}>
          {isFullNameVisible && (
            <div
              ref={refs.setFloating}
              style={{
                position: strategy,
                top: y ?? 0,
                left: x ?? 0,
                width: 'max-content',
              }}
              {...getFloatingProps()}
              className={styles.floatName__popup}
              onMouseOver={e => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              {text}
            </div>
          )}
          <div
            key={element.id}
            style={{
              width: `${element.width}px`,
              cursor: `${conditionForPointerCursor(element.id, 'comments')}`,
              height: `calc(30px * ${scaleConst})`,
            }}
            className={classnames(styles.columnElement, {})}
            onClick={() => {
              if (element.id === 'comments') {
                dispatch(selectAgentAction(agent.agentId));
                if (!agent) return;
                const agentHasDay = agent.days.some(
                  day => day.type !== DayType.NONE && SchAgent.activityIsInCurrentDay(currentDate, day, agent),
                );
                if (!agentHasDay) return;
                dispatch(
                  initOpenEditCommentMenu({
                    agent: agent,
                  }),
                );
              }
            }}
            data-test={`timeline-row-${element.name.replaceAll(' ', '-').toLowerCase()}`}
          >
            <span
              ref={refs.setReference}
              {...getReferenceProps()}
              style={{
                // TODO: performance low
                // cursor: cursorStyle,

                fontSize: `calc(14px * ${scaleConst})`,
              }}
              className={element.id === 'comments' && text.length === 0 ? styles.emptyCommentContent : styles.content}
            >
              {text}
            </span>
          </div>
        </div>
      );
    }
    return '';
  };

  /* eslint-disable @typescript-eslint/no-unused-vars */
  const conditionForPointerCursor = (value: any, conditionValue: string) => {
    const agentHasDay = agent.days.some(
      day => day.type !== DayType.NONE && SchAgent.activityIsInCurrentDay(currentDate, day, agent),
    );

    return agentHasDay && value === conditionValue ? 'pointer' : '';
  };
  const columnWidth = useMemo(() => {
    return columns.reduce((acc, item) => {
      if (item.visible) acc += item.width;
      return acc;
    }, 0);
  }, [columns]);

  return (
    <div
      className={classnames(styles.infoContainer, {
        [styles.infoContainer__pinned]: options.pinColumn,
      })}
      style={{
        ...(style || {}),
        color: isSelected ? '#1E95FE' : '#5D6472',
        minWidth: options.pinColumn ? `100%` : `${columnWidth - 1}px`,
        width: options.pinColumn ? `100%` : `${columnWidth - 1}px`,
      }}
      id={'agentInfo'}
    >
      {columns.map(el => getColumnsContent(el, timeFormat))}
    </div>
  );
};

export default AgentInfoColumns;
