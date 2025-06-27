import axios from 'axios';
import { PrusaLinkService } from '../src/services/prusaLinkService';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PrusaLinkService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uploads gcode with auth headers', async () => {
    mockedAxios.put.mockResolvedValue({} as any);
    const service = new PrusaLinkService('http://p', 'KEY');
    await service.uploadAndPrint('G');
    expect(mockedAxios.put).toHaveBeenCalled();
    const [url, buf, opts] = mockedAxios.put.mock.calls[0];
    expect(url).toBe('http://p/api/v1/files/usb/Vlad_Tests/final.gcode');
    expect((buf as Buffer).toString()).toBe('G');
    expect(opts?.headers?.['X-Api-Key']).toBe('KEY');
    expect(opts?.headers?.['Print-After-Upload']).toBe('?1');
  });

  it('gets current job id', async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 204 } as any);
    const service = new PrusaLinkService('b', 'k');
    expect(await service.getCurrentJobId()).toBeNull();
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: { id: 7 } } as any);
    expect(await service.getCurrentJobId()).toBe('7');
  });

  it('maps printer status and handles errors', async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: { printer: { state: 'FINISHED', temp_bed: 40 } } } as any);
    const service = new PrusaLinkService('b', 'k');
    const ready = await service.getPrinterStatus();
    expect(ready).toEqual({ status: 'ready-for-print', temp_bed: 40 });

    mockedAxios.get.mockRejectedValueOnce(new Error('off'));
    const fail = await service.getPrinterStatus();
    expect(fail).toEqual({ status: 'printer-not-reachable', temp_bed: 0 });
  });

  it('returns job status information', async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 204 } as any);
    const service = new PrusaLinkService('b', 'k');
    const finished = await service.getPrintStatus('1');
    expect(finished).toEqual({ id: 1, state: 'finished', progress: 100, timePrinting: 0, timeRemaining: 0 });

    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: { id: 2, state: 'printing', progress: 10, time_printing: 5, time_remaining: 5 },
    } as any);
    const job = await service.getPrintStatus('2');
    expect(job).toEqual({ id: 2, state: 'printing', progress: 10, timePrinting: 5, timeRemaining: 5 });
  });

  it('sends pause, resume and cancel requests', async () => {
    mockedAxios.put.mockResolvedValue({} as any);
    mockedAxios.delete.mockResolvedValue({} as any);
    const service = new PrusaLinkService('b', 'k');
    await service.pauseJob('1');
    expect(mockedAxios.put).toHaveBeenCalledWith('b/api/v1/job/1/pause', null, { headers: { 'X-Api-Key': 'k' } });
    await service.resumeJob('1');
    expect(mockedAxios.put).toHaveBeenCalledWith('b/api/v1/job/1/resume', null, { headers: { 'X-Api-Key': 'k' } });
    await service.cancelJob('1');
    expect(mockedAxios.delete).toHaveBeenCalledWith('b/api/v1/job/1', { headers: { 'X-Api-Key': 'k' } });
  });
});
