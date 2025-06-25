import express from 'express';
import request from 'supertest';


let getCurrentJobIdMock: jest.Mock;
jest.mock('../src/controller/printerController', () => {
  const { PrinterController } = jest.requireActual('../src/controller/printerController');
  getCurrentJobIdMock = jest.fn().mockResolvedValue('job1');
  class StubPrusaLinkService {
    uploadAndPrint = jest.fn().mockResolvedValue(undefined);
    getCurrentJobId = getCurrentJobIdMock;

    getPrinterStatus = jest.fn().mockResolvedValue('from-prusa');
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
    expect(res.body).toEqual({ status: 'inactive' });
  });

  it('returns overridden status', async () => {
    const putRes = await request(app)
      .put('/api/printer/status')
      .send({ status: 'start-up' });
    expect(putRes.status).toBe(202);

    const getRes = await request(app).get('/api/printer/status');
    expect(getRes.status).toBe(200);
    expect(getRes.body).toEqual({ status: 'start-up' });
  });

  it('clears override when job id changes', async () => {
    getCurrentJobIdMock.mockResolvedValueOnce('job1'); // startCalibration
    getCurrentJobIdMock.mockResolvedValueOnce('job1'); // first GET
    getCurrentJobIdMock.mockResolvedValueOnce('job2'); // second GET

    await request(app).put('/api/printer/status').send({ status: 'start-up' });

    const first = await request(app).get('/api/printer/status');
    expect(first.body).toEqual({ status: 'start-up' });

    const second = await request(app).get('/api/printer/status');
    expect(second.body).toEqual({ status: 'from-prusa' });
  });

  it('returns inactive after shutdown completes', async () => {
    getCurrentJobIdMock.mockResolvedValueOnce('job1'); // startShutdown
    getCurrentJobIdMock.mockResolvedValueOnce('job1'); // first GET (override)
    getCurrentJobIdMock.mockResolvedValueOnce('job2'); // second GET (job finished)

    await request(app).put('/api/printer/status').send({ status: 'shutting-down' });

    const first = await request(app).get('/api/printer/status');
    expect(first.body).toEqual({ status: 'shutting-down' });

    const second = await request(app).get('/api/printer/status');
    expect(second.body).toEqual({ status: 'inactive' });
  });
});
