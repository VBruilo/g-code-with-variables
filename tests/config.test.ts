describe('config module', () => {
  const env = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...env };
    delete process.env.CONFIG_SERVER_URL;
    delete process.env.PRUSALINK_URL;
    delete process.env.PRUSALINK_API_KEY;
  });
  afterAll(() => {
    process.env = env;
  });

  it('uses environment variables when provided', () => {
    process.env.CONFIG_SERVER_URL = 'http://c';
    process.env.PRUSALINK_URL = 'http://p';
    process.env.PRUSALINK_API_KEY = 'KEY';
    const cfg = require('../src/config');
    expect(cfg.CONFIG_SERVER_URL).toBe('http://c');
    expect(cfg.PRUSALINK_URL).toBe('http://p');
    expect(cfg.PRUSALINK_API_KEY).toBe('KEY');
  });

  it('falls back to defaults', () => {
    const cfg = require('../src/config');
    expect(cfg.CONFIG_SERVER_URL).toMatch('research.snet.tu-berlin.de');
  });
});
