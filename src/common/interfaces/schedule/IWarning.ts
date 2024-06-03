export interface IWarning {
  agentId: number;
  date: string;
  messages: string[];
  errors: string[];
  siteId: number;
}

export interface IResponseValidateAgentDay {
  validations: IWarning[];
}
