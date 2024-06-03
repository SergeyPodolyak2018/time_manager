import styles from './infobar.module.scss';
import itemStyles from './Items/infobaritems.module.scss';
import { StaticItems } from './Items';
import { useAppDispatch } from '../../../../redux/hooks';
import { useSelector, connect } from 'react-redux';

import {
  getModifiedData,
  getIsModifiedData,
  getSelectedActivitySelector,
  getTimeFormat,
  isLoadingSelector,
  getSelectedAgentSelector,
  getBuffer,
  getAgentById,
} from '../../../../redux/selectors/timeLineSelector';
import { clearBuffer, validateAndSaveAgentDay } from '../../../../redux/actions/timeLineAction';
import InlineSpinner from '../../../ReusableComponents/InlineSpinner';
import classnames from 'classnames';
import { FC } from 'react';
import {
  BreakItemDetails,
  Details,
  MarkedTimeOrNonEmptyActivityType,
  RenderActivitiesStrings,
  ShiftInfo,
} from './footerParts';
import { getActivityDate, getDate } from './footerUtils';
import { SCH_STATE_TYPE, SCH_STATE_VALUES } from '../../../../common/constants';
import { SchStateType } from '../../../../common/constants/schedule';
import { getChartLoader } from '../../../../redux/selectors/chartSelector';
import { IAgentTimeline } from '../../../../redux/ts/intrefaces/timeLine/IAgentTimeline';
import DateUtilsTimeZone from '../../../../helper/DateUtilsTimeZone';

export const breakItems: SCH_STATE_VALUES[] = [
  SCH_STATE_TYPE[SchStateType.BREAK],
  SCH_STATE_TYPE[SchStateType.MEAL],
  SCH_STATE_TYPE[SchStateType.EXCEPTION],
  SCH_STATE_TYPE[SchStateType.TIME_OFF],
];

const TimeLineFooter: FC = (props: any) => {
  const dispatchHook = useAppDispatch();
  const modifiedData = useSelector(getModifiedData);
  const isModified = useSelector(getIsModifiedData);
  const data = useSelector(getSelectedActivitySelector);
  const timeFormat = useSelector(getTimeFormat);
  const isLoading = useSelector(isLoadingSelector);
  const isChartLoading = useSelector(getChartLoader);
  const agent = useSelector(getSelectedAgentSelector);
  const buffer = useSelector(getBuffer);

  const startStateTime = new Date(data[0]?.start);
  const endStateTime = new Date(data[0]?.end);

  const startShiftTime = new Date(data[0]?.shiftStart);
  const endShiftTime = new Date(data[0]?.shiftEnd);
  const shortName = data[0]?.shortName;

  // const startTime = data[0]?.shiftStart;
  const itemStartTime = data[0]?.start;
  const savedAgent: IAgentTimeline[] = props.selectedAgent;
  let dstText = '';
  if(data[0]?.start && data[0]?.end && props?.selectedAgent?._TZ_INTERNAL_USAGE?.tzSite){
   const dst = DateUtilsTimeZone.getTimeDST(data[0]?.start,data[0]?.end,props?.selectedAgent?._TZ_INTERNAL_USAGE?.tzSite, props?.selectedAgent?._TZ_INTERNAL_USAGE?.tzSelected);
   let dstDirection = '';
   let dstVal = '';
   if(dst !== 0){
      if(dst>0){
        dstDirection=`(DST end)`;
        dstVal = `+${dst}`

      }else{
        dstDirection='(DST start)';
        dstVal = `${dst}`
      }
    }

   if(props?.selectedAgent?._TZ_INTERNAL_USAGE?.tzSite.timezoneId === props?.selectedAgent?._TZ_INTERNAL_USAGE?.tzSelected.timezoneId || props?.selectedAgent?._TZ_INTERNAL_USAGE?.tzSelected.timezoneId === 0){
     dstText = `${dstVal} ${dstDirection}`;
   }else{
     dstText = `${dstDirection}`;
   }

  }


  const itemDate = getDate(data, agent[0] ? agent : savedAgent, itemStartTime);

  const activityDate = getActivityDate(data, agent);

  const isSingleData = data?.length <= 1;
  const isShiftNameDayOff = data[0]?.shiftName === 'Day Off';

  const isMarkedTimeOrNonEmptyActivityType =
    data[0]?.type === 'marked_time' || (data[0]?.type === 'activity' && data[0]?.activities.length !== 0);

  const isSameDate = itemDate?.split('T')[0] === activityDate?.split('T')[0];

  return (
    <div
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
      }}
      className={styles.container}
    >
      <div className={styles.childrenHolder}>
        <StaticItems />
        <div className={itemStyles.secondChildContainer}>
          {data?.length !== 0 && (
            <div className={styles.itemsHolder}>
              {isSingleData && <Details date={itemDate} />}
              {isMarkedTimeOrNonEmptyActivityType ? (
                <MarkedTimeOrNonEmptyActivityType
                  activityDate={isSameDate ? '' : activityDate}
                  data={data}
                  endStateTime={endStateTime}
                  isSingleData={isSingleData}
                  shortName={shortName}
                  startStateTime={startStateTime}
                  timeFormat={timeFormat}
                />
              ) : breakItems.includes(data[0]?.type) ? (
                <BreakItemDetails
                  data={data}
                  endStateTime={endStateTime}
                  shortName={shortName}
                  startStateTime={startStateTime}
                  timeFormat={timeFormat}
                />
              ) : data[0]?.activities?.length === 0 ? (
                <span />
              ) : (
                <RenderActivitiesStrings data={data} />
              )}
              <ShiftInfo
                data={data}
                endShiftTime={endShiftTime}
                isShiftNameDayOff={isShiftNameDayOff}
                shortName={shortName}
                startShiftTime={startShiftTime}
                timeFormat={timeFormat}
                startStateTime={startStateTime}
                endStateTime={endStateTime}
                dstText={dstText}
              />
            </div>
          )}
        </div>
      </div>
      <div className={styles.buttonWrapper}>
        {isModified && (
          <button
            onClick={() => {
              if (isLoading) return;
              if (buffer?.elements) {
                dispatchHook(clearBuffer());
              }
              dispatchHook(validateAndSaveAgentDay({ agents: modifiedData, reviewWarningsType: 'full' }));
              // dispatchHook(saveAgentDay({ agents: modifiedData, reviewWarningsType: 'full' }));
            }}
            id="publish"
            className={classnames([styles.button], {
              [styles.button__disable]: isLoading || isChartLoading,
            })}
          >
            {isLoading || isChartLoading ? <InlineSpinner /> : 'Publish'}
          </button>
        )}
      </div>
    </div>
  );
};

const mapStateToProps = (state: any) => {
  return {
    selectedAgent: getAgentById(state),
  };
};
export default connect(mapStateToProps)(TimeLineFooter);
