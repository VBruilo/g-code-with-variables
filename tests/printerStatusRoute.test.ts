import express from 'express';
import request from 'supertest';

jest.mock('../src/controller/printerController');

import router from '../src/routes/controllerRoutes';
import { printerController } from '../src/controller/printerController';

const app = express();
app.use(express.json());
app.use('/api', router);

describe('GET /api/printer/status', () => {
  it('returns mapped printer status', async () => {
    (printerController.getPrinterStatus as jest.Mock).mockResolvedValue('ready-for-print');

    const res = await request(app).get('/api/printer/status');

    expect(printerController.getPrinterStatus).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ready-for-print' });
  });

  it('handles failures with 500', async () => {
    (printerController.getPrinterStatus as jest.Mock).mockRejectedValue(new Error('fail'));

    const res = await request(app).get('/api/printer/status');

    expect(res.status).toBe(500);
  });
});
