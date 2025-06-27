import axios from 'axios';
import { ConfigService } from '../src/services/configService';
import type { ConfigServerResponse } from '../src/types/configServer';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ConfigService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches parameters from the config server', async () => {
    const response: ConfigServerResponse = { metadata: { name: 'm' }, parameters: { a: { content: [], parameters: {} } } };
    mockedAxios.get.mockResolvedValue({ data: response } as any);
    const service = new ConfigService('http://config');
    const result = await service.fetchParameters('machine', 'set');
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'http://config/api/spaces/proceed-default-no-iam-user/configurations/set/latest/machine/machine'
    );
    expect(result).toEqual(response.parameters);
  });
});
