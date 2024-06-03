import { DayType, SchStateType } from '../../common/constants/schedule';
import { IMainState as NewShiftMainState } from '../../components/ScheduleComponents/Popups/NewMultipleWizardMenu/multipleStates/newShifts';
import SchUtils, { ISelected } from './SchUtils';
import SchActivitySet from './SchActivitySet';
import moment from 'moment';
import { ITimezone } from '../../common/interfaces/config/ITimezone';
import DateUtils, { siteTimezone } from '../dateUtils';
import SchDay from './SchDay';
import { IBusinessUnits } from '../../common/interfaces/config';
import { IResponseFindAgentsFromSnapshotData } from '../../api/ts/interfaces/findAgentsFromSnapshot';
import React from 'react';

class SchMultipleItems {
  static prepareDataForNewMultipleShift(
    formData: NewShiftMainState,
    dateRange: string[],
    siteTz: ITimezone,
    selectedTz: ITimezone,
    type: string,
    siteId: number,
  ) {
    const ids = SchUtils.requiredFields(SchUtils.getElementsByID(formData.checkedActivitiesSets, formData.activities), [
      'id',
      'setId',
    ]);
    const getDays = () => {
      const daysCollector = [];
      for (let i = 0; i < dateRange.length; i++) {
        const startDateTime = DateUtils.convertToIsoWithoutTz(
          DateUtils.setDayTime(dateRange[i], String(formData.startTime), false),
        );

        const singleDay = {
          isModified: true,
          isBuild: true,
          date: DateUtils.getMidnight(startDateTime),
          timezoneId: selectedTz.timezoneId,
          activities: ids,
          activitySets: SchActivitySet.getActivitySetsByID(
            formData.checkedActivitiesSets,
            formData.activities,
            formData.activitiesSet,
          ),
          dayState: {
            id: formData.shifts[formData.selectedShift].id,
            type: SchStateType.SHIFT,
            startDateTime,
            endDateTime: DateUtils.convertToIsoWithoutTz(
              DateUtils.setDayTime(dateRange[i], String(formData.endTime), formData.nextEndDay),
            ),
          },
          startDateTime: DateUtils.convertToIsoWithoutTz(
            DateUtils.setDayTime(dateRange[i], String(formData.startTime), false),
          ),
          endDateTime: DateUtils.convertToIsoWithoutTz(
            DateUtils.setDayTime(dateRange[i], String(formData.endTime), formData.nextEndDay),
          ),
          type: DayType.SHIFT,
          id: formData.shifts[formData.selectedShift].id,
          states: [
            {
              endDateTime: DateUtils.convertToIsoWithoutTz(
                DateUtils.setDayTime(dateRange[i], String(formData.endTime), formData.nextEndDay),
              ),
              id: SchUtils.requiredFields(
                SchUtils.getElementsByID(formData.checkedActivitiesSets, formData.activities),
                ['setId'],
              )[0].setId,
              name: 'Work',
              type: SchStateType.ACTIVITY_SET,
              startDateTime: DateUtils.convertToIsoWithoutTz(
                DateUtils.setDayTime(dateRange[i], String(formData.startTime), false),
              ),
            },
          ],
        };

        // [customer-1050] Unable to Insert multiple shifts with start time on previous day
        const isValid = SchDay.checkShiftEndTimeLessThan12NextDay(
          DateUtils.setUTCDateWithTime(singleDay.startDateTime),
          DateUtils.setUTCDateWithTime(singleDay.endDateTime),
          siteTimezone,
          siteTimezone,
        );
        if (!isValid)
          throw new Error(
            'The time range 00:00 - +12:00 violates the following constraint(s): Maximum time constraint. The end time must not be later than 12:00',
          );
        //

        daysCollector.push(singleDay);
      }
      return daysCollector;
    };
    const tempObject = {
      agentId: 0,
      buId: 0,
      siteId: siteId,
      teamId: 0,
      days: getDays(),
      contracts: [],
    };
    return tempObject;
  }

  static prepareDataForNewMultipleDayOff(dateRange: string[]) {
    const statesCollector = [];
    for (let i = 0; i < dateRange.length; i++) {
      const singleDay = {
        id: 0,
        isFullDay: true,
        isPaid: false,
        name: 'Day off',
        paidMinutes: 0,
        shortName: 'DOF',
        startDateTime: dateRange[i] + 'T00:00',
        endDateTime: dateRange[i] + 'T00:00',
        type: SchStateType.DAY_OFF,
      };
      statesCollector.push(singleDay);
    }
    return statesCollector;
  }

  static prepareDataForNewMultipleFullDayTimeOffException(
    dateRange: string[],
    siteTz: ITimezone,
    selectedTz: ITimezone,
    siteId: number,
    isPaid: boolean,
    id: number,
    name: string,
    shortName: string,
    paidHours: string,
    memo: string,
    isException?: boolean,
  ) {
    const getDays = () => {
      const daysCollector = [];
      for (let i = 0; i < dateRange.length - 1; i++) {
        const singleDay = {
          isModified: true,
          isBuild: true,
          date: dateRange[i],
          dayState: {
            refId: 0,
            refType: 0,
            id,
            type: !isException ? SchStateType.TIME_OFF : SchStateType.EXCEPTION,
            name,
            shortName,
            isPaid,
            isFullDay: true,
            paidMinutes: isPaid ? DateUtils.convertTimeToMinutes(String(paidHours)) : 0,
            memo,
            startDateTime: dateRange[i] + 'T00:00',
            endDateTime: DateUtils.getNextDay(dateRange[i]) + 'T00:00',
          },
          startDateTime: dateRange[i] + 'T00:00',
          endDateTime: DateUtils.getNextDay(dateRange[i]) + 'T00:00',
          type: !isException ? DayType.TIME_OFF : DayType.EXCEPTION,
          id: 0,
        };
        daysCollector.push(singleDay);
      }
      return daysCollector;
    };
    const tempObject = {
      agentId: 0,
      buId: 0,
      siteId: siteId,
      teamId: 0,
      days: getDays(),
      contracts: [],
    };
    return tempObject;
  }

  static prepareDataForNewMultipleTimeOff(formData: any, dateRange: string[], fullDayItem: boolean) {
    const statesCollector = [];
    for (let i = 0; i < dateRange.length; i++) {
      if (!fullDayItem) {
        const singleState = {
          refId: 0,
          refType: 0,
          id: formData.item.id,
          type: SchStateType.TIME_OFF,
          name: formData.item.name,
          shortName: formData.item.shortName,
          startDateTime: DateUtils.convertToIsoWithoutTz(
            DateUtils.setDayTime(
              dateRange[i],
              DateUtils.convertTo24h(String(formData.startTime)),
              formData.isNextStartDay,
            ),
          ),
          endDateTime: DateUtils.convertToIsoWithoutTz(
            DateUtils.setDayTime(dateRange[i], DateUtils.convertTo24h(String(formData.endTime)), formData.isNextEndDay),
          ),
          isPaid: formData.item.isPaid,
          isFullDay: formData.isFullDay,
          paidMinutes: formData.isSpecifyPaid ? DateUtils.convertTimeToMinutes(String(formData.paidHours)) : 0,
          memo: formData.memo,
        };
        statesCollector.push(singleState);
      } else {
        const singleDay = {
          id: formData.item.id,
          type: SchStateType.TIME_OFF,
          name: formData.item.name,
          shortName: formData.item.shortName,
          startDateTime: dateRange[i] + 'T00:00',
          endDateTime: dateRange[i] + 'T00:00',
          isPaid: formData.item.isPaid,
          isFullDay: formData.isFullDay,
          paidMinutes: formData.isSpecifyPaid ? DateUtils.convertTimeToMinutes(String(formData.paidHours)) : 0,
          memo: formData.memo,
        };
        statesCollector.push(singleDay);
      }
    }
    return statesCollector;
  }

  static prepareDataForNewMultipleException(formData: any, dateRange: string[]) {
    const statesCollector = [];
    for (let i = 0; i < dateRange.length; i++) {
      if (!formData.isFullDay) {
        const singleState = {
          id: formData.item.id,
          type: SchStateType.EXCEPTION,
          name: formData.item.name,
          shortName: formData.item.shortName,
          startDateTime: DateUtils.convertToIsoWithoutTz(
            DateUtils.setDayTime(
              dateRange[i],
              DateUtils.convertTo24h(String(formData.startTime)),
              formData.isNextStartDay,
            ),
          ),
          endDateTime: DateUtils.convertToIsoWithoutTz(
            DateUtils.setDayTime(dateRange[i], DateUtils.convertTo24h(String(formData.endTime)), formData.isNextEndDay),
          ),
          isPaid: formData.item.isPaid,
          isFullDay: false,
          paidMinutes: formData.isSpecifyPaid ? DateUtils.convertTimeToMinutes(String(formData.paidHours)) : 0,
          memo: formData.memo,
        };
        statesCollector.push(singleState);
      } else {
        const singleDay = {
          id: formData.item.id,
          type: SchStateType.EXCEPTION,
          name: formData.item.name,
          shortName: formData.item.shortName,
          startDateTime: dateRange[i] + 'T00:00',
          endDateTime: dateRange[i] + 'T00:00',
          isPaid: formData.item.isPaid,
          isFullDay: true,
          paidMinutes: formData.isSpecifyPaid ? DateUtils.convertTimeToMinutes(String(formData.paidHours)) : 0,
          memo: formData.memo,
        };
        statesCollector.push(singleDay);
      }
    }
    return statesCollector;
  }

  static prepareDataForDeleteMultipleException(
    formData: any,
    dateRange: string[],
    itemsStartTime?: string,
    itemsEndTime?: string,
    isNextEndDay?: boolean,
  ) {
    const statesCollector = [];
    for (let i = 0; i < dateRange.length; i++) {
      const startTime = DateUtils.convertToIsoWithoutTz(
        DateUtils.setDayTime(dateRange[i], itemsStartTime ? itemsStartTime : '00:00', false),
      );
      const endTime = DateUtils.convertToIsoWithoutTz(
        DateUtils.setDayTime(dateRange[i], itemsEndTime ? itemsEndTime : '00:00', !!isNextEndDay),
      );
      const state = {
        id: formData.item.id,
        type: SchStateType.EXCEPTION,
        startDateTime: startTime,
        endDateTime: endTime,
      };
      statesCollector.push(state);
    }
    return statesCollector;
  }

  static prepareDataForNewMultipleBreacMeal(formData: any, dateRange: string[]) {
    const statesCollector = [];
    for (let i = 0; i < dateRange.length; i++) {
      const singleState = {
        id: formData.item.id,
        isPaid: formData.item.isPaid,
        name: formData.item.name,
        shortName: formData.item.shortName,
        type: formData.type,
        startDateTime: DateUtils.convertToIsoWithoutTz(
          DateUtils.setDayTime(
            dateRange[i],
            DateUtils.convertTo24h(String(formData.startTime)),
            formData.isNextStartDay,
          ),
        ),
        endDateTime: DateUtils.convertToIsoWithoutTz(
          DateUtils.setDayTime(dateRange[i], DateUtils.convertTo24h(String(formData.endTime)), formData.isNextEndDay),
        ),
        paidMinutes: 0,
        memo: formData.item.memo,
        isFullDay: false,
      };
      statesCollector.push(singleState);
    }
    return statesCollector;
  }

  static prepareStatesForDeleteMultiple(
    type: SchStateType,
    ids: number[],
    dateRange: string[],
    itemsStartTime?: string,
    itemsEndTime?: string,
    isNextEndDay?: boolean,
  ) {
    const statesCollector: any = [];
    for (let i = 0; i < dateRange.length; i++) {
      const startTime = DateUtils.convertToIsoWithoutTz(
        DateUtils.setDayTime(dateRange[i], itemsStartTime ? itemsStartTime : '00:00', false),
      );
      const endTime = DateUtils.convertToIsoWithoutTz(
        DateUtils.setDayTime(dateRange[i], itemsEndTime ? itemsEndTime : '00:00', !!isNextEndDay),
      );
      ids.forEach((id: any) => {
        const singleState = {
          id: id,
          type: type,
          startDateTime: startTime,
          endDateTime: endTime,
          isFullDay: false,
        };
        statesCollector.push(singleState);
      });
    }
    return statesCollector;
  }

  static prepareDataForNewMultipleWorkSet(formData: any, dateRange: string[]) {
    const statesCollector = [];
    for (let i = 0; i < dateRange.length; i++) {
      const singleState = {
        startDateTime: DateUtils.convertToIsoWithoutTz(
          DateUtils.setDayTime(dateRange[i], DateUtils.convertTo24h(String(formData.startTime)), formData.nextDayStart),
        ),
        endDateTime: DateUtils.convertToIsoWithoutTz(
          DateUtils.setDayTime(dateRange[i], DateUtils.convertTo24h(String(formData.endTime)), formData.nextDayEnd),
        ),
        activities: formData.activities,
        markedTimeId: formData.markedTimeId,
        agentId: 0,
        date: formData.nextDayStart ? DateUtils.getNextDay(dateRange[i]) : dateRange[i],
        siteId: 0,
        timezoneId: formData.timezoneId,
      };
      statesCollector.push(singleState);
    }
    return statesCollector;
  }

  static prepareTeamPlate(
    filterAgents: ISelected,
    autoInsertMealBreaks: boolean,
    showWarnings: boolean,
    insertOnlyErrorsOrWarning: boolean,
    autoCommit: boolean,
    days: any,
    snapshotId?: string,
  ) {
    return {
      agentId: filterAgents.agentId,
      siteId: filterAgents.siteId,
      buId: filterAgents.buId,
      teamId: filterAgents.teamId,
      contractId: [],
      buildAgentDay: autoInsertMealBreaks,
      ignoreWarnings: showWarnings,
      allOrNothing: insertOnlyErrorsOrWarning,
      autoCommit,
      agentDays: days,
      snapshotId,
    };
  }

  static prepareTeamPlateInsertState(
    filterAgents: ISelected,
    showWarnings: boolean,
    insertOnlyErrorsOrWarning: boolean,
    autoCommit: boolean,
    dates: any,
    timezoneId: number,
    snapshotId: string,
  ) {
    return {
      agentId: filterAgents.agentId,
      siteId: filterAgents.siteId,
      buId: filterAgents.buId,
      teamId: filterAgents.teamId,
      ignoreWarnings: showWarnings,
      allOrNothing: insertOnlyErrorsOrWarning,
      autoCommit,
      states: dates,
      timezoneId,
      snapshotId,
    };
  }

  static prepareTeamPlateInsertWorkState(
    filterAgents: ISelected,
    showWarnings: boolean,
    insertOnlyErrorsOrWarning: boolean,
    autoCommit: boolean,
    dates: any,
  ) {
    return {
      workStates: dates,
      agentId: filterAgents.agentId,
      siteId: filterAgents.siteId,
      buId: filterAgents.buId,
      teamId: filterAgents.teamId,
      ignoreWarnings: showWarnings,
      allOrNothing: insertOnlyErrorsOrWarning,
      autoCommit,
    };
  }

  static getDate(date: Date | null) {
    if (date) {
      const tempDate = moment(date).format('YYYY-MM-DD');
      return tempDate;
    }
    return new Date().toISOString().split('T')[0];
  }

  static prepareDataForOpenScheduleAgentSnapshot(
    filterAgents: ISelected,
    activities: number[],
    date: string,
    dateRange: string[],
  ) {
    // const isOneDay = dateRange[0] === dateRange[dateRange.length - 1];
    return {
      // agentId: filterAgents.agentId,
      siteId: filterAgents.siteId,
      // buId: filterAgents.buId,
      teamId: filterAgents.teamId,
      date: dateRange[dateRange.length - 1],
      // startDate: isOneDay ? DateUtils.getPreviousDay(date) : dateRange[0],
      // endDate: isOneDay ? DateUtils.getNextDay(date) : dateRange[dateRange.length - 1],
      startDate: dateRange[0],
      endDate: dateRange[dateRange.length - 1],
      activities,
    };
  }

  static prepareDataForOpenScheduleAgentSnapshotFromSnapshot(
    filterAgents: ISelected,
    date: string,
    snapshotId: string,
  ) {
    return {
      siteId: filterAgents.siteId,
      buId: filterAgents.buId,
      date: date,
      startDate: date,
      endDate: date,
      snapshotId,
      useActivityFilter: false,
      enableSecondarySkills: true,
    };
  }

  static payloadOpenScheduleAgentSnapshotNewItem(agentId: number, siteId: number, date: string) {
    return {
      agentId,
      siteId,
      date,
      startDate: date,
      endDate: date,
    };
  }

  static filterData = (checked: IBusinessUnits, fetched: IBusinessUnits, filterAgents?: boolean) => {
    const mainResult: IBusinessUnits = {};
    const cloneFetched = JSON.parse(JSON.stringify(fetched));
    const selected = SchUtils.getSelectedElements(checked, fetched);
    for (const i of selected.buId) {
      mainResult[i] = cloneFetched[i];
    }
    const bUnits = Object.keys(mainResult);

    for (const i of bUnits) {
      if (!checked[i].isAllChecked) {
        const sitesIncluded = Object.keys(mainResult[i].sites).filter(el => selected.siteId.includes(parseInt(el)));
        const tempSites: any = {};
        for (const s of sitesIncluded) {
          tempSites[s] = cloneFetched[i].sites[s];
        }
        mainResult[i].sites = tempSites;
      }
    }
    if (selected.teamId.length > 0) {
      for (const i of bUnits) {
        const sitesId = Object.keys(mainResult[i].sites);
        for (const s of sitesId) {
          const teamsIncluded = Object.keys(mainResult[i].sites[s].teams).filter(el =>
            selected.teamId.includes(parseInt(el)),
          );
          const tempteams: any = {};
          for (const t of teamsIncluded) {
            tempteams[t] = cloneFetched[i].sites[s].teams[t];
            if (filterAgents) {
              const agentsIncluded = Object.keys(mainResult[i].sites[s].teams[t].agents).filter(el =>
                selected.agentId.includes(parseInt(el)),
              );
              const tempAgents: any = {};
              for (const g of agentsIncluded) {
                tempAgents[g] = cloneFetched[i].sites[s].teams[t].agents[g];
              }
              tempteams[t].agents = tempAgents;
            }
          }
          mainResult[i].sites[s].teams = tempteams;
        }
      }
    }
    return mainResult;
  };
  static updateCheckedItems = (
    checked: IBusinessUnits,
    checkedAgents: IResponseFindAgentsFromSnapshotData[],
    fatchedData: IBusinessUnits,
  ): IBusinessUnits => {
    const updatedChecked: IBusinessUnits = {};
    for (const i of checkedAgents) {
      const tempAgentContainer = {
        employeeId: i.employeeId || '',
        agentId: i.agentId,
        teamId: i.teamId || 0,
        buId: i.buId || 0,
        siteId: i.siteId || 0,
        lastName: i.lastName || '',
        firstName: i.firstName || '',
        isChecked: false,
      };
      !updatedChecked[i.buId] &&
        (updatedChecked[i.buId] = {
          ...fatchedData[i.buId],
          sites: {},
          isChecked: checked[i.buId].isChecked,
          isAllChecked: checked[i.buId].isAllChecked,
        });
      !updatedChecked[i.buId].sites[i.siteId] &&
        (updatedChecked[i.buId].sites[i.siteId] = {
          ...fatchedData[i.buId].sites[i.siteId],
          teams: {},
          isChecked: checked[i.buId].sites[i.siteId].isChecked,
          isAllChecked: checked[i.buId].sites[i.siteId].isAllChecked,
        });
      if (!updatedChecked[i.buId].sites[i.siteId].teams[i.teamId]) {
        const tempTeam = {
          agents: {},
          teamId: i.teamId,
          buId: i.buId,
          siteId: i.siteId,
          name: fatchedData[i.buId].sites[i.siteId]?.teams[i.teamId]?.name || '',
          isChecked: !!checked[i.buId].sites[i.siteId]?.teams[i.teamId]?.isChecked,
          isAllChecked: !!checked[i.buId].sites[i.siteId]?.teams[i.teamId]?.isAllChecked,
        };
        updatedChecked[i.buId].sites[i.siteId].teams[i.teamId] = tempTeam;
      }
      if (!updatedChecked[i.buId].sites[i.siteId].teams[i.teamId].agents[i.agentId]) {
        if (
          !checked[i.buId]?.sites[i.siteId]?.teams[i.teamId]?.agents ||
          Object.keys(checked[i.buId]?.sites[i.siteId]?.teams[i.teamId]?.agents).length === 0
        ) {
          updatedChecked[i.buId].sites[i.siteId].teams[i.teamId].agents[i.agentId] = tempAgentContainer;
          if (checked[i.buId].sites[i.siteId]?.teams[i.teamId]?.isAllChecked) {
            updatedChecked[i.buId].sites[i.siteId].teams[i.teamId].agents[i.agentId].isChecked = true;
          }
        } else {
          updatedChecked[i.buId].sites[i.siteId].teams[i.teamId].agents[i.agentId] = {
            ...checked[i.buId].sites[i.siteId]?.teams[i.teamId]?.agents[i.agentId],
            ...fatchedData[i.buId].sites[i.siteId]?.teams[i.teamId]?.agents[i.agentId],
          };
        }
      }
    }
    return updatedChecked;
  };
  static checkedCorrector = (
    checked: IBusinessUnits,
    checkedAgents: IResponseFindAgentsFromSnapshotData[],
  ): IBusinessUnits => {
    const newChecked = JSON.parse(JSON.stringify(checked));
    let counter = 0;
    for (const i of checkedAgents) {
      if (newChecked[i.buId].sites[i.siteId]?.teams[i.teamId]?.agents[i.agentId].isChecked) {
        counter++;
      }
    }
    if (counter === 0) {
      for (const i of checkedAgents) {
        newChecked[i.buId].isChecked = true;
        newChecked[i.buId].isAllChecked = true;
        newChecked[i.buId].sites[i.siteId].isChecked = true;
        newChecked[i.buId].sites[i.siteId].isAllChecked = true;
        newChecked[i.buId].sites[i.siteId].teams[i.teamId].isChecked = true;
        newChecked[i.buId].sites[i.siteId].teams[i.teamId].isAllChecked = true;
        newChecked[i.buId].sites[i.siteId].teams[i.teamId].agents[i.agentId].isChecked = true;
      }
    }
    return newChecked;
  };

  static isMultisite = (localCheckedItems: IBusinessUnits) => {
    const keys = Object.keys(localCheckedItems);
    if (keys.length === 0) {
      return true;
    }
    if (keys.length > 1) {
      return true;
    }
    Object.keys(localCheckedItems[keys[0]].sites);
    if (
      Object.keys(localCheckedItems[keys[0]].sites).length > 1 &&
      Object.keys(localCheckedItems[keys[0]].sites).filter(el => localCheckedItems[keys[0]].sites[el].isChecked)
        .length > 1
    ) {
      return true;
    }
    return false;
  };

  static selectMultiple = (e: React.MouseEvent, index: number, selectedItems: number[]) => {
    let newSelectedItems = [...selectedItems];
    const foundedIndex = selectedItems.findIndex(i => i === index);

    if (e.shiftKey) {
      const start = selectedItems.length > 0 ? selectedItems[0] : index;
      const end = index;

      const arr = [];
      for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
        arr.push(i);
      }

      newSelectedItems = arr;
    } else if (e.ctrlKey || e.metaKey) {
      if (selectedItems.includes(index)) {
        newSelectedItems = selectedItems.filter(i => i !== index);
      } else {
        newSelectedItems = [...selectedItems, index];
      }
    } else {
      if (foundedIndex !== -1) {
        newSelectedItems.splice(foundedIndex, 1);
      } else {
        newSelectedItems = [index];
      }
    }

    return newSelectedItems;
  };

  static selectSingle(index: number, selectedItems: number[]) {
    let newSelectedItems = [...selectedItems];
    const foundedIndex = selectedItems.findIndex(i => i === index);
    if (foundedIndex !== -1) {
      newSelectedItems.splice(foundedIndex, 1);
    } else {
      newSelectedItems = [index];
    }
    return newSelectedItems;
  }
  static removeEmptySite = (
    checked: IBusinessUnits,
    initChecked: IBusinessUnits,
    sitesForRemove: number[],
  ): IBusinessUnits => {
    const newChecked: IBusinessUnits = JSON.parse(JSON.stringify(checked));
    if (sitesForRemove.length !== 0 && Object.keys(newChecked).length !== 0) {
      const newCheckedBUId: string = Object.keys(initChecked)[0];
      for (const i of sitesForRemove) {
        delete newChecked[newCheckedBUId].sites[i];
      }
    }

    return newChecked;
  };
  static getEmptySite = (
    fatchad: IBusinessUnits,
    initChecked: IBusinessUnits,
    checkedAgents: IResponseFindAgentsFromSnapshotData[],
  ): number[] => {
    const newFatched: IBusinessUnits = JSON.parse(JSON.stringify(fatchad));
    if (Object.keys(initChecked).length !== 0) {
      const newCheckedBUId: string = Object.keys(initChecked)[0];
      const newCheckedSitesId: number[] = Object.keys(newFatched[newCheckedBUId].sites).map(el => parseInt(el));
      for (const i of checkedAgents) {
        const tempIndex = newCheckedSitesId.indexOf(i.siteId);
        if (tempIndex > -1) {
          newCheckedSitesId.splice(tempIndex, 1);
        }
        if (newCheckedSitesId.length === 0) {
          return [];
        }
      }
      return newCheckedSitesId;
    } else {
      return [];
    }
  };
}

export default SchMultipleItems;
