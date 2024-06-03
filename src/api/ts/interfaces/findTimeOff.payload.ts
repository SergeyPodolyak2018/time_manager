export interface FindTimeOffPayload {
  agentId?: number | number[];
  siteId?: number | number[];
  buId?: number | number[];
  teamId?: number | number[];
  shiftId?: number | number[];
  id?: number | number[];
  type?: number | number[];
  useAgentFilter?: boolean;
}
