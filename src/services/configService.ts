import axios from 'axios';
import { ConfigServerResponse, ConfigParamDef } from '../types/configServer';
import { CONFIG_SERVER_URL } from '../config';

/**
 * Service responsible for retrieving configuration parameters from the
 * external config server.
 */
export class ConfigService {
  private baseUrl: string;

  /**
   * @param baseUrl - Base URL of the config server.
   */
  constructor(baseUrl = CONFIG_SERVER_URL) {

    this.baseUrl = baseUrl;
  }

  /**
   * Fetches parameter definitions for a specific machine and configuration set.
   *
   * @param machineConfigID - Identifier of the machine configuration.
   * @param configSetID - Identifier of the configuration set.
   * @returns Mapping of parameter names to their definitions.
   */
  async fetchParameters(machineConfigID: string, configSetID: string): Promise<Record<string, ConfigParamDef>> {
    const url = `${this.baseUrl}/api/spaces/proceed-default-no-iam-user/configurations/${configSetID}/latest/machine/${machineConfigID}`;
    const resp = await axios.get<ConfigServerResponse>(url);
    return resp.data.parameters;
  }
}
