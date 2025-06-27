import * as fs from 'fs';
import { loadModels, calculateLayout, insertModelBlocks } from '../src/utilities/modelPlacement';
import type { ParsedParams } from '../src/types/parsedParams';

const readFileMock = jest.spyOn(fs.promises, 'readFile');

describe('modelPlacement utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads models from disk', async () => {
    readFileMock.mockResolvedValue('MODEL');
    const parsed: ParsedParams = { material: 'PETG', sizes: [20], spacingX: 0, spacingY: 0, maxColumns: 1 };
    const models = await loadModels(parsed);
    expect(readFileMock).toHaveBeenCalledWith(expect.stringContaining('20.00mm.gcode'), 'utf8');
    expect(models[0].meta.size).toBe(20);
    expect(models[0].content).toBe('MODEL');
  });

  it('throws when model entry is missing', async () => {
    const parsed: ParsedParams = { material: 'PETG', sizes: [99], spacingX: 0, spacingY: 0, maxColumns: 1 };
    await expect(loadModels(parsed)).rejects.toThrow('No block for PETG 99mm');
  });

  it('calculates layout and detects collisions', () => {
    const models = [
      { meta: { size: 1, path: '', boundingBox: { width: 10, depth: 10 } }, content: 'A' },
      { meta: { size: 1, path: '', boundingBox: { width: 10, depth: 10 } }, content: 'B' },
    ];
    const parsed: ParsedParams = { material: 'PETG', sizes: [], spacingX: 20, spacingY: 20, maxColumns: 2 };
    const layout = calculateLayout(models, parsed);
    expect(layout[1].offsetX).toBe(20);

    const badParsed: ParsedParams = { material: 'PETG', sizes: [], spacingX: 5, spacingY: 5, maxColumns: 1 };
    expect(() => calculateLayout(models, badParsed)).toThrow('Collision detected');
  });

  it('inserts model blocks into template', () => {
    const template = 'START\n;; MODELS_PLACEHOLDER\nEND';
    const placements = [
      { model: { meta: { size: 1, path: '', boundingBox: { width: 1, depth: 1 } }, content: 'A' }, offsetX: 0, offsetY: 0 },
      { model: { meta: { size: 1, path: '', boundingBox: { width: 1, depth: 1 } }, content: 'B' }, offsetX: 10, offsetY: 10 },
    ];
    const result = insertModelBlocks(template, placements, 'L');
    expect(result).toBe('START\nA\nL\nB\nL\nEND');
  });
});
