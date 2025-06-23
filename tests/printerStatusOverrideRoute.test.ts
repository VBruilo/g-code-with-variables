import express from 'express';
import request from 'supertest';

jest.mock('../src/controller/printerController', () => {
  const { PrinterController } = jest.requireActual('../src/controller/printerController');
  class StubPrusaLinkService {
    uploadAndPrint = jest.fn().mockResolvedValue(undefined);
    getCurrentJobId = jest.fn().mockResolvedValue(null);
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
});

describe('PUT then GET /api/printer/status integration', () => {
  it('returns overridden status', async () => {
    const putRes = await request(app)
      .put('/api/printer/status')
      .send({ status: 'start-up' });
    expect(putRes.status).toBe(202);

    const getRes = await request(app).get('/api/printer/status');
    expect(getRes.status).toBe(200);
    expect(getRes.body).toEqual({ status: 'start-up' });
  });
});
