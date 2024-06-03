import _ from 'lodash';
import { isEmpty } from 'ramda';
import React, { Dispatch, SetStateAction } from 'react';

import DateUtils from '../../../../../helper/dateUtils';
import SchAgent from '../../../../../helper/schedule/SchAgent';
import SchSelectedActivity from '../../../../../helper/schedule/SchSelectedActivity';
import SchUtils from '../../../../../helper/schedule/SchUtils';
import Utils from '../../../../../helper/utils';
import { ISelectedActivity, IWarningPopUpParam } from '../../../../../redux/ts/intrefaces/timeLine';
import { IAgentTimeline } from '../../../../../redux/ts/intrefaces/timeLine/IAgentTimeline';
import { ITimelineActivityType } from './Activities';

export interface IDragNDrop {
  clickX: number;
  agentId: number | string | null;
  type: ITimelineActivityType | null;
  leftStart: number;
  shiftItemId: string | null;
  data: ISelectedActivity | null;
  leftStartPosition: number;
}

export const DragNDropAttributes: Record<string, string> = {
  DATA_DRAG_N_DROP: 'data-dragndrop',
  DATA_SHIFT_ITEM: 'data-shiftItem',
  DATA_TYPE: 'datatype',
  DATA_SHIFT_ITEM_ID: 'data-shiftitem',
};

interface IItem {
  left: any;
  item: any;
  id: number;
  initialized: boolean;
  startValue: number;
  endValue: number;
  startLeft: number;
  percentDifference: number;
  lessThanHundred: boolean;
}

let draggedElementData: IDragNDrop;

let items: IItem[] = [];
let blankCanvas: any;
let isFullShiftActivityLocal: any;

const FIVE_MIN_MS = 300000;
const FIFTEEN_MIN_MS = 900000;

export const handleDragOver = _.throttle((e: React.DragEvent, data: IDragNDrop) => {
  e.preventDefault();
  // e.dataTransfer.dropEffect = 'none';
  e.dataTransfer.effectAllowed = 'move';
  const { clickX } = data;
  if (!draggedElementData) return;

  const draggedElement = document.querySelector(
    `[${DragNDropAttributes.DATA_SHIFT_ITEM_ID}="${draggedElementData.shiftItemId}"]`,
  ) as HTMLDivElement;

  // this can be undefined

  if (!draggedElement) return;

  const divItems = document.querySelectorAll('[data-selected=true][data-visible=true]');
  isFullShiftActivityLocal = divItems[0]?.getAttribute('data-isfullshiftitem') === 'true';
  const allSelectors: any[] = [];
  if (
    isFullShiftActivityLocal === true ||
    divItems[0]?.getAttribute(DragNDropAttributes.DATA_DRAG_N_DROP)?.includes('shift')
  ) {
    divItems.forEach(item => {
      if (item.parentElement?.id !== 'timeline') {
        allSelectors.push(item.parentElement);
      } else {
        allSelectors.push(item);
      }
    });
  } else {
    divItems.forEach(item => {
      allSelectors.push(item);
    });
  }
  const draggedElementId = draggedElement.getAttribute(DragNDropAttributes.DATA_DRAG_N_DROP);

  const parentElement = draggedElement.parentElement as HTMLDivElement;
  const parentType = parentElement.getAttribute(DragNDropAttributes.DATA_TYPE) as ITimelineActivityType;
  const parentRect = parentElement.getBoundingClientRect();
  const draggedElementRect = draggedElement.getBoundingClientRect();
  const mouseX = e.clientX - parentRect.x;
  const percent = Number((((mouseX - draggedElementData.clickX) / parentRect.width) * 100).toFixed(2));

  if (items.length === 0) {
    return;
  }

  if (
    (draggedElementData.type === ITimelineActivityType.SHIFT ||
      draggedElementData.type === ITimelineActivityType.SHIFT_ITEM_AS_SHIFT) &&
    parentElement.id !== 'timeline'
  )
    return;
  if (draggedElementData.type === ITimelineActivityType.SHIFT_ITEM && parentType !== ITimelineActivityType.SHIFT)
    return;
  try {
    allSelectors.forEach(element => {
      const currentElement = element as HTMLDivElement;
      const currentElementRect = currentElement.getBoundingClientRect();
      const currentParent = currentElement.parentElement as HTMLDivElement;
      const currentParentRect = currentParent.getBoundingClientRect();

      const elementId = currentElement.getAttribute(DragNDropAttributes.DATA_DRAG_N_DROP);
      const shiftItemId = currentElement.getAttribute(DragNDropAttributes.DATA_SHIFT_ITEM_ID);
      const idString = currentElement.getAttribute('data-drag-id');
      const idNum = idString ? parseInt(idString) : -1;
      const currentItem = items.find(x => x.id === idNum);

      if (!currentItem) return;

      const left = parseFloat(currentItem?.left);
      const difference = Number((draggedElementData.leftStart - left).toFixed(2));

      if (draggedElementData.type === ITimelineActivityType.SHIFT) {
        //[customer-1868]: Improve drag and drop - Shift items should stay on place during drag of shift
        // drag shift
        if (elementId !== draggedElementId) {
          let left = percent - difference;
          const { min: shiftMinPercent, max: shiftMaxPercent } = currentElement.dataset;
          left = shiftMinPercent && left >= +shiftMinPercent ? +shiftMinPercent : left;
          left = shiftMaxPercent && left <= +shiftMaxPercent ? +shiftMaxPercent : left;

          currentElement.style.left = `${left}%`;
        } else {
          const { min: shiftMinPercent, max: shiftMaxPercent } = draggedElement.dataset;
          let left = shiftMinPercent && percent >= +shiftMinPercent ? +shiftMinPercent : percent;
          left = shiftMaxPercent && left <= +shiftMaxPercent ? +shiftMaxPercent : left;

          draggedElement.style.left = `${left}%`;
        }
      } else {
        const leftShiftItem = mouseX - clickX;
        if (elementId !== draggedElementId) {
          if (currentItem) {
            setMultipleItemPosition(
              draggedElement,
              currentElement,
              currentElementRect,
              difference,
              currentParentRect,
              parentRect,
              currentItem,
            );
          }
        } else {
          if (shiftItemId !== draggedElement.getAttribute(DragNDropAttributes.DATA_SHIFT_ITEM_ID)) {
            if (currentItem) {
              setMultipleItemPosition(
                draggedElement,
                currentElement,
                currentElementRect,
                difference,
                currentParentRect,
                parentRect,
                currentItem,
              );
            }
          } else {
            setDraggableItemPosition(leftShiftItem, parentRect, draggedElementRect, draggedElement);
          }
        }
      }
    });
  } catch (e) {
    return;
  }
}, 10);

const setDraggableItemPosition = (
  leftShiftItem: any,
  parentRect: any,
  draggedElementRect: any,
  draggedElement: any,
) => {
  const { min, max } = draggedElement.dataset;
  const rightShiftItem = leftShiftItem + draggedElementRect.width;
  if (min && max) {
    const left = SchUtils.setLeftWithMinMax((leftShiftItem / parentRect.width) * 100, min, max);
    draggedElement.style.left = `${left}%`;
    return;
  }
  if (leftShiftItem < 0) {
    draggedElement.style.left = `0%`;
  } else if (rightShiftItem > parentRect.width) {
    draggedElement.style.left = `${((parentRect.width - draggedElementRect.width) / parentRect.width) * 100}%`;
  } else {
    draggedElement.style.left = `${(leftShiftItem / parentRect.width) * 100}%`;
  }
};

const setMultipleItemPosition = (
  draggedElement: any,
  currentElement: any,
  currentElementRect: any,
  difference: any,
  currentParentRect: any,
  targetParentRect: any,
  currentItem: IItem,
) => {
  const currentElementPercent = (currentElementRect.width / currentParentRect.width) * 100;
  const { min, max } = currentElement.dataset;
  if (currentParentRect.width < targetParentRect.width) {
    const dif = targetParentRect.width / currentParentRect.width;
    const draggableElementLeft = parseFloat(draggedElement.style.left);

    if (!currentItem.initialized) {
      currentItem.percentDifference = ((draggableElementLeft - difference) * dif - parseFloat(currentItem.left)) * -1;
      currentItem.initialized = true;
    }
    if ((draggableElementLeft - difference) * dif + currentItem.percentDifference > 100 - currentElementPercent) {
      currentElement.style.left = `${100 - currentElementPercent}%`;
    } else if ((draggableElementLeft - difference) * dif + currentItem.percentDifference < 0) {
      currentElement.style.left = `${min}%`;
    } else {
      currentElement.style.left = `${SchUtils.setLeftWithMinMax(
        (draggableElementLeft - difference) * dif + currentItem.percentDifference,
        min,
        max,
      )}%`;
    }
  } else if (currentParentRect.width > targetParentRect.width) {
    const dif = currentParentRect.width / targetParentRect.width;
    const draggableElementLeft = parseFloat(draggedElement.style.left);
    if (!currentItem.initialized) {
      currentItem.percentDifference = ((draggableElementLeft - difference) / dif - parseFloat(currentItem.left)) * -1;
      currentItem.initialized = true;
    }

    if ((draggableElementLeft - difference) / dif + currentItem.percentDifference > 100 - currentElementPercent) {
      currentElement.style.left = `${100 - currentElementPercent}%`;
    } else if ((draggableElementLeft - difference) / dif + currentItem.percentDifference < 0) {
      currentElement.style.left = `${min}%`;
    } else {
      currentElement.style.left = `${(draggableElementLeft - difference) / dif + currentItem.percentDifference}%`;
    }
  } else {
    const draggableElementLeft = parseFloat(draggedElement.style.left);
    if (draggableElementLeft - difference > 100 - currentElementPercent) {
      currentElement.style.left = `${100 - currentElementPercent}%`;
    } else if (draggableElementLeft - difference < 0) {
      currentElement.style.left = `${min}%`;
    } else {
      currentElement.style.left = `${SchUtils.setLeftWithMinMax(draggableElementLeft - difference, min, max)}%`;
    }
  }
};

export const handleDragStart = (
  e: React.DragEvent,
  setDragNDrop: Dispatch<SetStateAction<IDragNDrop>>,
  data: ISelectedActivity,
  isFullShiftActivity: boolean | undefined,
) => {
  items = [];
  const divItems = document.querySelectorAll('[data-selected=true][data-visible=true]');
  e.dataTransfer.clearData();
  e.dataTransfer.effectAllowed = 'move';
  blankCanvas = document.createElement('canvas');
  blankCanvas.style.width = 10;
  blankCanvas.style.height = 10;
  e.dataTransfer?.setDragImage(blankCanvas, 0, 0);
  document?.body.appendChild(blankCanvas);
  isFullShiftActivityLocal =
    divItems.length !== 0
      ? (isFullShiftActivityLocal =
          divItems[0].getAttribute('data-isfullshiftitem') === 'true' ? true : isFullShiftActivity)
      : false;

  const allSelectedItems: any[] = [];
  if (isFullShiftActivity === true) {
    divItems.forEach(item => {
      if (item.parentElement?.id !== 'timeline') {
        allSelectedItems.push(item.parentElement);
      } else {
        allSelectedItems.push(item);
      }
    });
  } else {
    divItems.forEach(item => {
      allSelectedItems.push(item);
    });
  }

  let index = 1;
  let draggedElement = e.target as HTMLDivElement;

  if (
    isFullShiftActivity === true ||
    (isFullShiftActivity === undefined && draggedElement.parentElement?.id !== 'timeline')
  ) {
    draggedElement = draggedElement.parentElement as HTMLDivElement;
  }

  if (!draggedElement) {
    return;
  }

  const draggedElementId = draggedElement.getAttribute(DragNDropAttributes.DATA_DRAG_N_DROP);
  const draggetShiftItemId = draggedElement.getAttribute(DragNDropAttributes.DATA_SHIFT_ITEM_ID);
  const elementsIds = allSelectedItems.reduce((ids, currentValue) => {
    const currentElement = currentValue as HTMLDivElement;
    ids.push(currentElement.getAttribute(DragNDropAttributes.DATA_DRAG_N_DROP));
    return ids;
  }, []);

  if (!elementsIds.includes(draggedElementId) && elementsIds.length > 1) return;
  if (allSelectedItems.length <= 1) {
    draggedElement.setAttribute('data-drag-id', `${index}`);
    draggedElement.classList.add('dragging');

    const shiftRect = draggedElement.getBoundingClientRect();
    const timelineElement = document.getElementById('timeline') as HTMLDivElement;
    const timelineRect = timelineElement.getBoundingClientRect();
    const clickX = e.clientX - shiftRect.x;
    const positionX = draggedElement.getBoundingClientRect().x - timelineElement.getBoundingClientRect().left;
    let leftPercent = (positionX / timelineRect.width) * 100;
    const agentId = draggedElement.getAttribute(DragNDropAttributes.DATA_DRAG_N_DROP);
    const type = draggedElement.getAttribute(DragNDropAttributes.DATA_TYPE) as ITimelineActivityType;
    if (type === ITimelineActivityType.SHIFT_ITEM) {
      leftPercent = parseFloat(draggedElement.style.left);
    }
    const shiftItemId = draggedElement.getAttribute(DragNDropAttributes.DATA_SHIFT_ITEM_ID);
    items.push({
      left: draggedElement.style.left,
      item: e.target,
      id: index,
      initialized: false,
      startValue: 0,
      endValue: 0,
      startLeft: 0,
      percentDifference: leftPercent,
      lessThanHundred: true,
    });
    draggedElementData = {
      clickX,
      agentId,
      type,
      shiftItemId,
      data,
      leftStart: leftPercent,
      leftStartPosition: draggedElement.getBoundingClientRect().x,
    };
    setDragNDrop({
      clickX,
      agentId,
      type,
      shiftItemId,
      data,
      leftStart: leftPercent,
      leftStartPosition: draggedElement.getBoundingClientRect().x,
    });
    return;
  }

  allSelectedItems.forEach(element => {
    const currentElement = element as HTMLDivElement;
    currentElement.setAttribute('data-drag-id', `${index}`);
    currentElement.classList.add('dragging');
    let leftPercent = 0;
    // Get position of click relative to shif
    if (!currentElement) return;
    const shiftRect = draggedElement.getBoundingClientRect();
    const timelineElement = document.getElementById('timeline') as HTMLDivElement;
    const timelineRect = timelineElement.getBoundingClientRect();
    const clickX = e.clientX - shiftRect.x;
    const positionX = draggedElement.getBoundingClientRect().x - timelineElement.getBoundingClientRect().left;
    const agentId = draggedElement.getAttribute(DragNDropAttributes.DATA_DRAG_N_DROP);
    const type = draggedElement.getAttribute(DragNDropAttributes.DATA_TYPE) as ITimelineActivityType;
    const shiftItemId = draggedElement.getAttribute(DragNDropAttributes.DATA_SHIFT_ITEM_ID);
    items.push({
      left: currentElement.style.left,
      item: currentElement,
      id: index,
      initialized: false,
      startValue: 0,
      endValue: 0,
      startLeft: 0,
      percentDifference: 0,
      lessThanHundred: true,
    });
    if (draggedElementId === currentElement.getAttribute(DragNDropAttributes.DATA_DRAG_N_DROP)) {
      if (shiftItemId === draggetShiftItemId) {
        leftPercent = (positionX / timelineRect.width) * 100;
        if (type === ITimelineActivityType.SHIFT_ITEM) {
          leftPercent = parseFloat(draggedElement.style.left);
        }
        draggedElementData = {
          clickX,
          agentId,
          type,
          shiftItemId,
          data,
          leftStart: leftPercent,
          leftStartPosition: draggedElement.getBoundingClientRect().x,
        };
        setDragNDrop({
          clickX,
          agentId,
          type,
          shiftItemId,
          data,
          leftStart: leftPercent,
          leftStartPosition: draggedElement.getBoundingClientRect().x,
        });
      }
    }
    index++;
  });
};

export const handleDragEnd = async (
  e: React.DragEvent,
  dragNDropData: IDragNDrop,
  selectedActivities: ISelectedActivity[],
  agents: IAgentTimeline[],
  saveData: (newAgents: IAgentTimeline[]) => void,
  onDragError: (msg: string) => void,
  isFullShiftActivity: boolean | undefined,
  onDragWarning: (payload: IWarningPopUpParam) => void,
) => {
  const performance = Utils.getFuncPerformance('handleDragEnd');
  e.stopPropagation();
  try {
    blankCanvas && document?.body.removeChild(blankCanvas);
    blankCanvas = null;
  } catch (e) {
    blankCanvas = null;
  }

  let diffInMilliseconds = 0;
  let isShift = false;
  const { type, leftStartPosition } = dragNDropData;
  let draggedElement = e.target as HTMLDivElement;

  const divItems = document.querySelectorAll('[data-selected=true][data-visible=true]');
  isFullShiftActivityLocal =
    divItems.length !== 0
      ? (isFullShiftActivityLocal =
          divItems[0].getAttribute('data-isfullshiftitem') === 'true' ? true : isFullShiftActivity)
      : false;

  if (
    isFullShiftActivityLocal === true ||
    (isFullShiftActivityLocal === undefined && draggedElement.parentElement?.id !== 'timeline')
  ) {
    draggedElement = draggedElement.parentElement as HTMLDivElement;
  }
  draggedElement.classList.remove('dragging');
  isShift = type === ITimelineActivityType.SHIFT;
  const timelineElement = document.getElementById('timeline') as HTMLDivElement;
  const timelineElementWidth = timelineElement.getBoundingClientRect().width;
  const positionX = draggedElement.getBoundingClientRect().x - timelineElement.getBoundingClientRect().left;
  // if (selectedActivities.length > 1) {
  //   if (draggedElementData?.data) {
  //     const isShift = timelineElement.getAttribute(DragNDropAttributes.DATA_TYPE) === 'shift' ? 'shift' : 'shiftItem';
  //     if (draggedElement.getAttribute(DragNDropAttributes.DATA_TYPE) !== isShift) {
  //       return;
  //     }
  //   }
  // }

  // find the position of the relative to the timeline element

  // calculate the left position of the dragged element as a percentage

  const relativeLeft = (positionX / timelineElementWidth) * 100;
  const posStartX = leftStartPosition - timelineElement.getBoundingClientRect().left;
  const relativeStartLeft = (posStartX / timelineElementWidth) * 100;
  // calculate the left position of the dragged element as a percentage
  const leftPercent = isShift ? +draggedElement.style.left.split('%')[0] : relativeLeft;

  if (+leftPercent === dragNDropData.leftStart) return;
  if (!draggedElementData?.data?.date) return;

  const allSelectors: any[] = [];

  if (isFullShiftActivity === true) {
    divItems.forEach(item => {
      if (item.parentElement?.id !== 'timeline') {
        allSelectors.push(item.parentElement);
      } else {
        allSelectors.push(item);
      }
    });
  } else {
    divItems.forEach(item => {
      allSelectors.push(item);
    });
  }
  const elementsIds = allSelectors.reduce((ids, currentValue) => {
    const currentElement = currentValue as HTMLDivElement;
    ids.push(currentElement.getAttribute(DragNDropAttributes.DATA_DRAG_N_DROP));
    return ids;
  }, []);

  const draggedElementId = draggedElement.getAttribute(DragNDropAttributes.DATA_DRAG_N_DROP);
  if (!elementsIds.includes(draggedElementId)) return;
  diffInMilliseconds = DateUtils.roundMsByStep(
    DateUtils.convertPercentToMs(+leftPercent - relativeStartLeft),
    FIVE_MIN_MS,
  );
  let warnings: string[] = [];
  try {
    const newAgents: IAgentTimeline[] = [];
    (diffInMilliseconds > 0 ? [...selectedActivities].reverse() : [...selectedActivities]).forEach(activity => {
      const agent = agents?.find(x => x.agentId === activity.agentId);

      if (agent) {
        if (isShift) {
          if (SchSelectedActivity.isActivitySetInside(activity)) {
            diffInMilliseconds = DateUtils.roundMsByStep(
              DateUtils.convertPercentToMs(+leftPercent - relativeStartLeft),
              FIFTEEN_MIN_MS,
            );
          }
          const selectedAgent = newAgents?.find(x => x.agentId === activity.agentId);
          if (!selectedAgent) {
            newAgents.push(SchAgent.moveAgentShift(agent, activity, diffInMilliseconds));
          } else {
            selectedAgent.days = SchAgent.moveAgentShift(selectedAgent, activity, diffInMilliseconds).days;
          }
        } else {
          if (selectedActivities[0].type === 'activity_set' || selectedActivities[0].type === 'workSet') {
            if (selectedActivities[0].type === 'activity_set') {
              diffInMilliseconds = DateUtils.roundMsByStep(
                DateUtils.convertPercentToMs(+leftPercent - relativeStartLeft),
                FIFTEEN_MIN_MS,
              );
            }

            const { start, end } = SchSelectedActivity.smartSetTime(
              activity,
              activity.start + diffInMilliseconds,
              activity.end + diffInMilliseconds,
            );
            const updatedActivity = SchSelectedActivity.updateActivityTime([activity], {
              start,
              end,
            });

            newAgents.push(
              SchAgent.updateAgentDay({
                agents: [agent],
                updatedActivities: updatedActivity,
                timeForMove: null,
                isChangeType: undefined,
                item: undefined,
                isEditedInReviewWarning: false,
                moveExceptions: false,
              }).agents[0],
            );
          } else {
            const moveAgentsResult = SchAgent.moveAgentsShift([agent], selectedActivities, diffInMilliseconds, false);
            warnings = moveAgentsResult.warnings;
            newAgents.push(moveAgentsResult.agents[0]);
          }
        }
      }
    });
    if (newAgents) {
      if (!isEmpty(warnings)) {
        onDragWarning({
          isOpen: true,
          data: warnings.map(m => `${m}`).join('\n'),
          rerender: true,
          agents: newAgents,
        });
      } else saveData(newAgents);
    }
    performance();
  } catch (e: any) {
    onDragError(e.message);
  }
};
