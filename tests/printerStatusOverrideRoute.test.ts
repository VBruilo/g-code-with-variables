import express from 'express';
import request from 'supertest';


let getCurrentJobIdMock: jest.Mock;
jest.mock('../src/controller/printerController', () => {
  const { PrinterController } = jest.requireActual('../src/controller/printerController');
  getCurrentJobIdMock = jest.fn().mockResolvedValue('job1');
  class StubPrusaLinkService {
    uploadAndPrint = jest.fn().mockResolvedValue(undefined);
    getCurrentJobId = getCurrentJobIdMock;

    getPrinterStatus = jest
      .fn()
      .mockResolvedValue({ status: 'from-prusa', temp_bed: 0 });
    getPrintStatus = jest.fn();
    pauseJob = jest.fn();
    resumeJob = jest.fn();
    cancelJob = jest.fn();
  }
  class StubGcodeService {
    loadCalibrationGcode = jest.fn().mockResolvedValue('CAL');
    loadShutdownGcode = jest.fn().mockResolvedValue('SHUT');
  }
  const controller = new PrinterController({}, new StubGcodeService() as any, new StubPrusaLinkService() as any);
  return { printerController: controller, PrinterController };
});

import { printerController } from '../src/controller/printerController';
import router from '../src/routes/controllerRoutes';

const app = express();
app.use(express.json());
app.use('/api', router);

afterEach(() => {
  jest.clearAllMocks();

  getCurrentJobIdMock.mockResolvedValue('job1');
});

describe('PUT then GET /api/printer/status integration', () => {
  it('returns inactive before startup', async () => {
    const res = await request(app).get('/api/printer/status');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'inactive', temp_bed: 0 });
  });

  it('returns overridden status', async () => {
    const putRes = await request(app)
      .put('/api/printer/status')
      .send({ status: 'start-up' });
    expect(putRes.status).toBe(202);

    const getRes = await request(app).get('/api/printer/status');
    expect(getRes.status).toBe(200);
    expect(getRes.body).toEqual({ status: 'start-up', temp_bed: 0 });
  });

  it('clears override when job id changes', async () => {
    getCurrentJobIdMock.mockResolvedValueOnce('job1'); // startCalibration
    getCurrentJobIdMock.mockResolvedValueOnce('job1'); // first GET
    getCurrentJobIdMock.mockResolvedValueOnce('job2'); // second GET

    await request(app).put('/api/printer/status').send({ status: 'start-up' });

    const first = await request(app).get('/api/printer/status');
    expect(first.body).toEqual({ status: 'start-up', temp_bed: 0 });

    const second = await request(app).get('/api/printer/status');
    expect(second.body).toEqual({ status: 'from-prusa', temp_bed: 0 });
  });

  it('keeps shutting-down status until bed cools', async () => {
    const prusaLink = (printerController as any).prusaLink;

    getCurrentJobIdMock.mockResolvedValueOnce('job1'); // startShutdown
    getCurrentJobIdMock.mockResolvedValueOnce('job1'); // first GET (override)
    (prusaLink.getPrinterStatus as jest.Mock).mockResolvedValueOnce({
      status: 'from-prusa',
      temp_bed: 30,
    });
    getCurrentJobIdMock.mockResolvedValueOnce('job2'); // second GET (job finished)
    (prusaLink.getPrinterStatus as jest.Mock).mockResolvedValueOnce({
      status: 'from-prusa',
      temp_bed: 25,
    });
    getCurrentJobIdMock.mockResolvedValueOnce('job2'); // third GET (cool below threshold)
    (prusaLink.getPrinterStatus as jest.Mock).mockResolvedValueOnce({
      status: 'from-prusa',
      temp_bed: 20,
    });

    await request(app).put('/api/printer/status').send({ status: 'shutting-down' });

    const first = await request(app).get('/api/printer/status');
    expect(first.body).toEqual({ status: 'shutting-down', temp_bed: 30 });

    const second = await request(app).get('/api/printer/status');
    expect(second.body).toEqual({ status: 'shutting-down', temp_bed: 25 });

    const third = await request(app).get('/api/printer/status');
    expect(third.body).toEqual({ status: 'inactive', temp_bed: 20 });
  });
});
