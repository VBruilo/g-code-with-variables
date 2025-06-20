import axios from 'axios';
import { ConfigServerResponse, ConfigParamDef } from '../types/configServer';

export class ConfigService {
  private baseUrl: string;

  constructor(baseUrl = 'http://localhost:3011') {
    this.baseUrl = baseUrl;
  }

  async fetchParameters(machineConfigID: string, configSetID: string): Promise<Record<string, ConfigParamDef>> {
    const url = `${this.baseUrl}/api/spaces/proceed-default-no-iam-user/configurations/${configSetID}/latest/machine/${machineConfigID}`;
    const resp = await axios.get<ConfigServerResponse>(url);
    return resp.data.parameters;
  }
}
