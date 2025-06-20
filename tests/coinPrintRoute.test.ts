import request from 'supertest';

jest.mock('../src/controller/printerController');

import { printerController } from '../src/controller/printerController';
import { createTestApp } from './testUtils';

const app = createTestApp();

describe('POST /api/prints/parameterized/coin', () => {
  it('returns 400 when parameters are missing', async () => {
    const res = await request(app)
      .post('/api/prints/parameterized/coin')
      .send({});

    expect(res.status).toBe(400);
    expect(printerController.startPrint).not.toHaveBeenCalled();
  });

  it('starts a print and returns job ID in Location header', async () => {
    (printerController.startPrint as jest.Mock).mockResolvedValue('1234');

    const res = await request(app)
      .post('/api/prints/parameterized/coin')
      .send({ machineConfigID: 'mc', configSetID: 'cs' });

    expect(printerController.startPrint).toHaveBeenCalledWith('mc', 'cs');
    expect(res.status).toBe(201);
    expect(res.headers.location).toBe('1234');
    expect(res.body).toEqual({ jobId: '1234' });
  });

  it('propagates errors with status 500', async () => {
    (printerController.startPrint as jest.Mock).mockRejectedValue(new Error('boom'));

    const res = await request(app)
      .post('/api/prints/parameterized/coin')
      .send({ machineConfigID: 'mc', configSetID: 'cs' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'boom' });
  });
});
