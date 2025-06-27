import handlebars from 'handlebars';

jest.mock('../src/utilities/modelPlacement', () => {
  const actual = jest.requireActual('../src/utilities/modelPlacement');
  return {
    ...actual,
    loadModels: jest.fn(),
  };
});

jest.mock('../src/utilities/gcodeUtils', () => {
  const actual = jest.requireActual('../src/utilities/gcodeUtils');
  return {
    ...actual,
    loadSnippet: jest.fn(),
  };
});

jest.mock('../src/helpers/handlebarsHelpers', () => ({
  registerHandlebarsHelpers: jest.fn(() => {
    handlebars.registerHelper('dummy', () => 'HELPER');
  }),
}));

import { GCodeTransformer } from '../src/transformer/gcodeTransformer';
import { loadModels } from '../src/utilities/modelPlacement';
import { loadSnippet } from '../src/utilities/gcodeUtils';


describe('GCodeTransformer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('produces final G-code with models and helpers', async () => {
    const transformer = new GCodeTransformer();

    (loadModels as jest.Mock).mockResolvedValue([
      {
        meta: { size: 20, path: 'model', boundingBox: { width: 10, depth: 10 } },
        content: 'MODEL',
      },
    ]);
    (loadSnippet as jest.Mock).mockResolvedValue('SNIP');

    const template = 'START\n;; MODELS_PLACEHOLDER\n{{dummy}}\nEND';

    const result = await transformer.transformGCode(template, {} as any);

    expect(loadModels).toHaveBeenCalledTimes(1);
    expect(loadSnippet).toHaveBeenCalledWith('logo', 'SNET');
    expect(result).toBe('START\nMODEL\nSNIP\nHELPER\nEND');
  });

  it('throws when template lacks placeholder', async () => {
    const transformer = new GCodeTransformer();
    await expect(transformer.transformGCode('NO_PLACEHOLDER', {} as any)).rejects.toThrow(
      'placeholder'
    );
  });
});
