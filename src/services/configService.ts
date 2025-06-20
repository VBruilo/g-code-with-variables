import axios from 'axios';
import { ConfigServerResponse, ConfigParamDef } from '../types/configServer';

/**
 * Service responsible for retrieving configuration parameters from the
 * external config server.
 */
export class ConfigService {
  private baseUrl: string;

  /**
   * @param baseUrl - Base URL of the mock config server.
   */
  constructor(baseUrl = 'http://localhost:3011') {
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
