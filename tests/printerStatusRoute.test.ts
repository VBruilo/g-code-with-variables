import request from 'supertest';

jest.mock('../src/controller/printerController');

import { printerController } from '../src/controller/printerController';
import { createTestApp } from './testUtils';

const app = createTestApp();

describe('GET /api/printer/status', () => {
  it('returns mapped printer status', async () => {
    (printerController.getPrinterStatus as jest.Mock).mockResolvedValue({
      status: 'ready-for-print',
      temp_bed: 55,
    });

    const res = await request(app).get('/api/printer/status');

    expect(printerController.getPrinterStatus).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ready-for-print', temp_bed: 55 });
  });

  it('handles failures with 500', async () => {
    (printerController.getPrinterStatus as jest.Mock).mockRejectedValue(new Error('fail'));

    const res = await request(app).get('/api/printer/status');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'fail' });
  });
});
