import axios from 'axios';
import { ConfigServerResponse, ConfigParamDef } from '../types/configServer';
import { CONFIG_SERVER_URL } from '../config';

export class ConfigService {
  private baseUrl: string;

  constructor(baseUrl = CONFIG_SERVER_URL) {
    this.baseUrl = baseUrl;
  }

  async fetchParameters(machineConfigID: string, configSetID: string): Promise<Record<string, ConfigParamDef>> {
    const url = `${this.baseUrl}/api/spaces/proceed-default-no-iam-user/configurations/${configSetID}/latest/machine/${machineConfigID}`;
    const resp = await axios.get<ConfigServerResponse>(url);
    return resp.data.parameters;
  }
}
