import express from 'express';
import request from 'supertest';

jest.mock('../src/controller/printerController');

import router from '../src/routes/controllerRoutes';
import { printerController } from '../src/controller/printerController';

const app = express();
app.use(express.json());
app.use('/api', router);

afterEach(() => {
  jest.clearAllMocks();
});

describe('PUT /api/printer/status', () => {
  it('accepts start-up status', async () => {
    (printerController.updatePrinterStatus as jest.Mock).mockResolvedValue(undefined);

    const res = await request(app)
      .put('/api/printer/status')
      .send({ status: 'start-up' });

    expect(printerController.updatePrinterStatus).toHaveBeenCalledWith('start-up');
    expect(res.status).toBe(202);
  });

  it('accepts shutting-down status', async () => {
    (printerController.updatePrinterStatus as jest.Mock).mockResolvedValue(undefined);

    const res = await request(app)
      .put('/api/printer/status')
      .send({ status: 'shutting-down' });

    expect(printerController.updatePrinterStatus).toHaveBeenCalledWith('shutting-down');
    expect(res.status).toBe(202);
  });

  it('rejects invalid status with 400', async () => {
    const res = await request(app)
      .put('/api/printer/status')
      .send({ status: 'invalid' });

    expect(printerController.updatePrinterStatus).not.toHaveBeenCalled();
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: "Status must be either 'start-up' or 'shutting-down'",
    });
  });
});
