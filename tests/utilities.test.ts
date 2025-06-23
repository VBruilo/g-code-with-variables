import { flattenConfigParameters } from '../src/utilities/flattenConfigParameters';
import { parseParams, extractTemplate } from '../src/utilities/gcodeUtils';
import { ConfigParamDef } from '../src/types/configServer';

describe('flattenConfigParameters', () => {
  it('maps nested parameters correctly', () => {
    const params: Record<string, ConfigParamDef> = {
      'coin-color': {
        content: [],
        parameters: {
          'coin-printing-head-no': { content: [{ value: 1 }], parameters: {} },
          'coin-material': { content: [{ value: 'PLA' }], parameters: {} },
        },
      },
      width: { content: [{ value: 20 }, { value: 25 }], parameters: {} },
      height: { content: [{ value: 1 }], parameters: {} },
      'top-surface': {
        content: [],
        parameters: {
          logo: { content: [{ value: 'LOGO' }], parameters: {} },
          'logo-color': {
            content: [],
            parameters: {
              'coin-printing-head-no': { content: [{ value: 2 }], parameters: {} },
            },
          },
          'logo-material': { content: [{ value: 'ABS' }], parameters: {} },
        },
      },
      coordinates: {
        content: [],
        parameters: {
          x: { content: [{ value: 5 }], parameters: {} },
          y: { content: [{ value: 7 }], parameters: {} },
        },
      },
    };

    const result = flattenConfigParameters(params);
    expect(result).toEqual({
      FIRST_PRINTING_HEAD: 0,
      FIRST_FILAMENT_TYPE: 'PLA',
      MODEL_SIZE: [20, 25.75],
      LAYERS: 10,
      LOGO: 'LOGO',
      SECOND_PRINTING_HEAD: 1,
      SECOND_FILAMENT_TYPE: 'ABS',
      POS_X: 5,
      POS_Y: 7,
    });
  });

  it('rounds width values to nearest allowed size', () => {
    const params: Record<string, ConfigParamDef> = {
      width: { content: [{ value: 21 }, { value: 22 }], parameters: {} },
    } as any;

    const result = flattenConfigParameters(params);
    expect(result.MODEL_SIZE).toEqual([20, 23.25]);
  });

  it('rounds values above 25.75 up to 30', () => {
    const params: Record<string, ConfigParamDef> = {
      width: { content: [{ value: 29 }], parameters: {} },
    } as any;

    const result = flattenConfigParameters(params);
    expect(result.MODEL_SIZE).toEqual([30]);
  });

  it('caps height at 7mm when converting to layers', () => {
    const params: Record<string, ConfigParamDef> = {
      height: { content: [{ value: 10 }], parameters: {} },
    } as any;

    const result = flattenConfigParameters(params);
    expect(result.LAYERS).toBe(10);
  });
});

describe('parseParams', () => {
  it('applies default values when missing', () => {
    const result = parseParams({ MODEL_SIZE: [20] });
    expect(result).toEqual({
      material: 'PETG',
      sizes: [20],
      spacingX: 90,
      spacingY: 90,
      maxColumns: 4,
    });
  });
});

describe('extractTemplate', () => {
  it('returns content if placeholder is present', () => {
    const gcode = 'start\n;; MODELS_PLACEHOLDER\nend';
    expect(extractTemplate(gcode)).toBe(gcode);
  });

  it('throws if placeholder is missing', () => {
    expect(() => extractTemplate('no placeholder')).toThrow(
      'The placeholder not found in G-code template.'
    );
  });
});
