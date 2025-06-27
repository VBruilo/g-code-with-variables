const use = jest.fn();
const get = jest.fn();
const listen = jest.fn();

const router = { post: jest.fn(), get: jest.fn(), put: jest.fn(), delete: jest.fn() };

jest.mock('express', () => {
  const expressFn: any = jest.fn(() => ({ use, get, listen }));
  expressFn.Router = jest.fn(() => router);
  expressFn.json = jest.fn(() => () => {});
  expressFn.urlencoded = jest.fn(() => () => {});
  return expressFn;
});

describe('server entrypoint', () => {
  it('initializes express app and routes', async () => {
    process.env.PORT = '1234';
    await import('../src/server');
    expect(use).toHaveBeenCalledWith('/api', router);
    expect(get).toHaveBeenCalledWith('/health', expect.any(Function));
    expect(listen).toHaveBeenCalledWith('1234', expect.any(Function));
  });
});
