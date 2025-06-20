import express from 'express';
import request from 'supertest';

jest.mock('../src/controller/printerController');

import router from '../src/routes/controllerRoutes';
import { printerController } from '../src/controller/printerController';

const app = express();
app.use(express.json());
app.use('/api', router);

describe('GET /api/prints/parameterized/coin/getJobId', () => {
  it('returns job id when job is active', async () => {
    (printerController.getCurrentJobId as jest.Mock).mockResolvedValue('42');

    const res = await request(app).get('/api/prints/parameterized/coin/getJobId');

    expect(printerController.getCurrentJobId).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ jobId: '42' });
  });

  it('returns 404 when no job is running', async () => {
    (printerController.getCurrentJobId as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get('/api/prints/parameterized/coin/getJobId');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'No active print job found' });
  });
});
