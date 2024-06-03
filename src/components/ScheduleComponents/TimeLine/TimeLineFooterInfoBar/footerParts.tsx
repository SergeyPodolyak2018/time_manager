import { SCH_STATE_TYPE } from '../../../../common/constants';
import { SchStateType } from '../../../../common/constants/schedule';
import DateUtils from '../../../../helper/dateUtils';
import SchSelectedActivity from '../../../../helper/schedule/SchSelectedActivity';
import SchUtils from '../../../../helper/schedule/SchUtils';
import { ISelectedActivity, TimeFormatType } from '../../../../redux/ts/intrefaces/timeLine';
import itemStyles from './Items/infobaritems.module.scss';

export const Details = ({ date }: { date: string }) => (
  <span className={`${itemStyles.item} ${itemStyles.titleFontStyle}`}>
    {'Details:'}
    <p className={`${itemStyles.item} ${itemStyles.mainFontStyle}`}>{date.split('T')[0]}</p>
  </span>
);

export const ItemDetails = ({ data, shortName }: { data: ISelectedActivity[]; shortName: string }) => (
  <span className={`${itemStyles.item} ${itemStyles.titleFontStyle}`}>
    {'State:'}
    <p className={`${itemStyles.item} ${itemStyles.mainFontStyle}`}>
      {DateUtils.getBreakString(data[0]?.type, data[0]?.name)}
    </p>
    {shortName && <p className={`${itemStyles.item} ${itemStyles.mainFontStyle}`}>Short name: {shortName}</p>}
  </span>
);

type TTimeAndDurationInfoProps = {
  endStateTime: Date;
  startStateTime: Date;
  timeFormat: TimeFormatType;
};

export const TimeAndDurationInfo = ({ endStateTime, startStateTime, timeFormat }: TTimeAndDurationInfoProps) => (
  <>
    <p className={`${itemStyles.innerItem} ${itemStyles.mainFontStyle}`} data-test={'footer-info-time'}>
      Start: {DateUtils.getTime(startStateTime, timeFormat)}, End: {DateUtils.getTime(endStateTime, timeFormat)}
    </p>

    <p className={`${itemStyles.durationItem} ${itemStyles.mainFontStyle}`} data-test={'footer-info-duration'}>
      Duration: {DateUtils.getDifference(DateUtils.getUTCFormat(endStateTime), DateUtils.getUTCFormat(startStateTime))}
    </p>
  </>
);

type TBreakItemDetailsProps = {
  data: ISelectedActivity[];
  endStateTime: Date;
  shortName: string;
  startStateTime: Date;
  timeFormat: TimeFormatType;
};

export const BreakItemDetails = ({
  data,
  endStateTime,
  shortName,
  startStateTime,
  timeFormat,
}: TBreakItemDetailsProps) => {
  const isSingleData = data?.length <= 1;

  return (
    <span data-test={'footer-info-state'} className={`${itemStyles.item} ${itemStyles.titleFontStyle}`}>
      {'State:'}
      <p className={`${itemStyles.item} ${itemStyles.mainFontStyle}`}>
        {DateUtils.getBreakString(data[0]?.type, data[0]?.name, data[0].meetingInfo?.name)}
      </p>
      {data[0].type !== 'time_off' && shortName && (
        <p className={`${itemStyles.item} ${itemStyles.mainFontStyle}`}>Short name: {shortName}</p>
      )}
      {isSingleData && (
        <>
          <p className={`${itemStyles.innerItem} ${itemStyles.mainFontStyle}`} data-test={'footer-info-time'}>
            Start: {DateUtils.getTime(startStateTime, timeFormat)}, End: {DateUtils.getTime(endStateTime, timeFormat)}
          </p>

          <p className={`${itemStyles.durationItem} ${itemStyles.mainFontStyle}`} data-test={'footer-info-duration'}>
            Duration:{' '}
            {DateUtils.getDifference(DateUtils.getUTCFormat(endStateTime), DateUtils.getUTCFormat(startStateTime))}
          </p>
        </>
      )}
    </span>
  );
};

export const RenderActivitiesStrings = ({ data }: { data: ISelectedActivity[] }) => {
  const isActivitySet = data[0]?.type === SCH_STATE_TYPE[SchStateType.ACTIVITY_SET];
  // const isFullShiftActivity = data[0].isFullShiftActivity;

  const activitiesString = isActivitySet
    ? SchSelectedActivity.getActivitySetStrings(data[0]?.activities)
    : SchSelectedActivity.getActivitiesStrings(data[0]?.activities);
  if (!activitiesString || !activitiesString.length) return <></>;

  return (
    <span className={`${itemStyles.item} ${itemStyles.titleFontStyle}`}>
      {'Activities:'}
      <p className={`${itemStyles.item} ${itemStyles.mainFontStyle}`}>{activitiesString}</p>
    </span>
  );
};

type TRenderShiftInfoProps = {
  data: ISelectedActivity[];
  endShiftTime: Date;
  isShiftNameDayOff: boolean;
  shortName: string;
  startShiftTime: Date;
  timeFormat: TimeFormatType;
  startStateTime: Date;
  endStateTime: Date;
  dstText: string;
};

export const ShiftInfo = ({
  data,
  endShiftTime,
  isShiftNameDayOff,
  shortName,
  startShiftTime,
  timeFormat,
  startStateTime,
  endStateTime,
  dstText,
}: TRenderShiftInfoProps) => {
  if (!data[0]) return null;

  const startDate = data[0].type === SCH_STATE_TYPE[SchStateType.ACTIVITY_SET] ? startStateTime : startShiftTime;

  const endDate = data[0].type === SCH_STATE_TYPE[SchStateType.ACTIVITY_SET] ? endStateTime : endShiftTime;

  const isSingleData = data.length <= 1;

  const shouldRenderShiftInfo = !SchUtils.isFullDayTimeOff(data) && !SchUtils.isFullDayException(data) && isSingleData;

  if (!shouldRenderShiftInfo) {
    return null;
  }
  return (
    <span data-test={'footer-info-shifst'} className={`${itemStyles.item} ${itemStyles.titleFontStyle}`}>
      {'Shift:'}
      <p className={`${itemStyles.item} ${itemStyles.mainFontStyle}`}>{data[0].shiftName}</p>
      {isShiftNameDayOff && shortName && (
        <p className={`${itemStyles.item} ${itemStyles.mainFontStyle}`}>Short name: {shortName}</p>
      )}
      {!isShiftNameDayOff && (
        <p className={`${itemStyles.innerItem} ${itemStyles.mainFontStyle}`} data-test={'footer-info-time'}>
          Start: {DateUtils.getTime(startDate, timeFormat)}, End: {DateUtils.getTime(endDate, timeFormat)}
        </p>
      )}
      {!isShiftNameDayOff && (
        <p className={`${itemStyles.durationItem} ${itemStyles.mainFontStyle}`} data-test={'footer-info-duration'}>
          Duration: {DateUtils.getDifference(DateUtils.getUTCFormat(endDate), DateUtils.getUTCFormat(startDate))}{' '}
          {dstText}
        </p>
      )}
    </span>
  );
};

type TMarkedTimeOrNonEmptyActivityTypeProps = {
  activityDate: string;
  data: ISelectedActivity[];
  endStateTime: Date;
  isSingleData: boolean;
  shortName: string;
  startStateTime: Date;
  timeFormat: TimeFormatType;
};
export const MarkedTimeOrNonEmptyActivityType = ({
  activityDate,
  data,
  endStateTime,
  isSingleData,
  shortName,
  startStateTime,
  timeFormat,
}: TMarkedTimeOrNonEmptyActivityTypeProps) => {
  return (
    <span className={`${itemStyles.item} ${itemStyles.titleFontStyle}`}>
      {data[0]?.activities && data[0]?.activities.length && (
        <>
          <span>{'Activities:'}</span>
          <p className={`${itemStyles.item} ${itemStyles.mainFontStyle}`}>
            {SchSelectedActivity.getActivitiesStrings(data[0]?.activities)}
          </p>
        </>
      )}

      {data[0]?.type === 'activity' && activityDate !== '' && (
        <p className={`${itemStyles.item} ${itemStyles.mainFontStyle}`}>{activityDate?.split('T')[0]}</p>
      )}
      {data[0]?.type !== 'activity' && <ItemDetails data={data} shortName={shortName} />}
      {isSingleData && (
        <TimeAndDurationInfo endStateTime={endStateTime} startStateTime={startStateTime} timeFormat={timeFormat} />
      )}
    </span>
  );
};
