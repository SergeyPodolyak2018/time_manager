export interface IPayloadOpenContractSnapshot {
    siteId?: number | number[];
    buId?: number | number[];
    contractId?: number | number[];
    shiftId?: number | number[];
}

export interface IResponseOpenContractSnapshot {
    snapshotId: string;
    totalCount: number;
    timestamp: number;
}

export interface IPayloadFindContractFromSnapshot {
    snapshotId: string;
    firstIndex?: number;
    lastIndex?: number;
}
