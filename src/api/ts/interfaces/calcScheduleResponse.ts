import {IAgentTimeline} from '../../../redux/ts/intrefaces/timeLine/IAgentTimeline';

export interface ICalcScheduleResponse {
    coverage: ICalcScheduleCoverage[],
    foundSolution: boolean,
    isOvertime: boolean,
    modelName: string,
    overtime_hours: number,
    shifts: ICalcScheduleShift[],
    agents: IAgentTimeline[],
}

export interface ICalcScheduleCoverage {
    value: number
}

export interface ICalcScheduleShift {
    breakEnd: number,
    breakStart: number,
    endShift: number,
    isBreak: boolean,
    isDayOff: boolean,
    isMeal: boolean,
    isOvertime: boolean,
    overtime: number,
    mealEnd: number,
    mealStart: number,
    startShift: number,
}
