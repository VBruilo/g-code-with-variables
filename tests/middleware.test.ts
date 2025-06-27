import { asyncHandler } from '../src/middleware/asyncHandler';
import { errorHandler } from '../src/middleware/errorHandler';

describe('asyncHandler', () => {
  it('forwards resolved values', async () => {
    const req: any = {};
    const res: any = { send: jest.fn() };
    const next = jest.fn();
    const wrapped = asyncHandler(async () => { res.send('ok'); });
    await wrapped(req, res, next);
    expect(res.send).toHaveBeenCalledWith('ok');
    expect(next).not.toHaveBeenCalled();
  });

  it('forwards errors', async () => {
    const err = new Error('boom');
    const next = jest.fn();
    const wrapped = asyncHandler(async () => { throw err; });
    await wrapped({} as any, {} as any, next);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('errorHandler', () => {
  it('formats error responses', () => {
    const log = jest.spyOn(console, 'error').mockImplementation();
    const req: any = { method: 'GET', path: '/x' };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const err = new Error('oops');
    errorHandler(err, req, res, jest.fn());
    expect(log).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'oops' });
    log.mockRestore();
  });
});
