import { loadSnippet } from '../src/utilities/gcodeUtils';

describe('loadSnippet', () => {
  it('loads an existing snippet', async () => {
    const content = await loadSnippet('logo', 'SNET');
    expect(content).toContain('SNET Logo G-code');
  });

  it('throws for a missing snippet', async () => {
    await expect(loadSnippet('logo', 'NON_EXISTENT')).rejects.toThrow();
  });
});
