import { GcodeService } from '../src/services/gcodeService';
import { GCodeTransformer } from '../src/transformer/gcodeTransformer';
import * as fs from 'fs';
import path from 'path';

jest.mock('../src/transformer/gcodeTransformer');

const readFileMock = jest.spyOn(fs.promises, 'readFile');
const writeFileMock = jest.spyOn(fs.promises, 'writeFile');

describe('GcodeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates final gcode based on filament type', async () => {
    readFileMock.mockResolvedValue('TEMPLATE');
    writeFileMock.mockResolvedValue();

    const transformer = new GCodeTransformer() as unknown as jest.Mocked<GCodeTransformer>;
    (transformer.transformGCode as jest.Mock).mockResolvedValue('FINAL');

    const service = new GcodeService(transformer);
    const params: any = {
      'coin-color': {
        content: [],
        parameters: {
          'coin-material': { content: [{ value: 'PLA' }], parameters: {} },
          'coin-printing-head-no': { content: [], parameters: {} },
        },
      },
    };

    const result = await service.createFinalGcode(params);

    expect(readFileMock).toHaveBeenCalledWith(
      expect.stringContaining(path.join('gcode', 'templates', 'PLA_start_G-code.gcode')),
      'utf-8'
    );
    expect(transformer.transformGCode).toHaveBeenCalledWith('TEMPLATE', params);
    expect(writeFileMock).toHaveBeenCalledWith(
      expect.stringContaining(path.join('gcode', 'print_ready', 'final.gcode')),
      'FINAL',
      'utf-8'
    );
    expect(result).toBe('FINAL');
  });

  it('loads calibration and shutdown gcode', async () => {
    readFileMock.mockResolvedValueOnce('CAL');
    const service = new GcodeService(new GCodeTransformer() as any);
    const cal = await service.loadCalibrationGcode();
    expect(cal).toBe('CAL');
    expect(readFileMock).toHaveBeenCalledWith(
      expect.stringContaining(path.join('gcode', 'printer_control', 'start-up.gcode')),
      'utf-8'
    );

    readFileMock.mockResolvedValueOnce('SHUT');
    const shut = await service.loadShutdownGcode();
    expect(shut).toBe('SHUT');
    expect(readFileMock).toHaveBeenCalledWith(
      expect.stringContaining(path.join('gcode', 'printer_control', 'shutting-down.gcode')),
      'utf-8'
    );
  });
});
