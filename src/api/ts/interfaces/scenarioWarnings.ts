export interface ISchScenarioWarning {
    siteId: number;
    warningNumber: number;
    warning: string;
    checked: boolean;
}

export interface IGetScenarioWarningsPayload {
    siteId: number | number[];
    scheduleId: number;
}

export interface ISaveScenarioWarningsPayload {
    scheduleId: number;
    warnings: ISchScenarioWarning[];
}
