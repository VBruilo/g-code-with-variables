import { promises as fs } from 'fs';
import path from 'path';
import { GCodeTransformer } from '../transformer/gcodeTransformer';
import { ConfigParamDef } from '../types/configServer';

export class GcodeService {
  private transformer: GCodeTransformer;

  constructor(transformer = new GCodeTransformer()) {
    this.transformer = transformer;
  }

  private getTemplateFile(filamentType: string): string {
    if (filamentType === 'PLA') {
      return 'PLA_start_G-code.gcode';
    }
    if (filamentType === 'PETG') {
      return 'PETG_start_G-code.gcode';
    }
    throw new Error(`[GcodeService] Unsupported FILAMENT_TYPE: ${filamentType}.`);
  }

  async createFinalGcode(rawParams: Record<string, ConfigParamDef>): Promise<string> {
    const filamentType = rawParams["coin-color"].parameters["coin-material"].content[0].value || 'PETG';
    const templateFile = this.getTemplateFile(String(filamentType));

    const gcodeFilePath = path.join(process.cwd(), 'parameterized_g-code', templateFile);
    const gcodeContent = await fs.readFile(gcodeFilePath, 'utf-8');

    const finalGCode = await this.transformer.transformGCode(gcodeContent, rawParams);

    const outputFilePath = path.join(process.cwd(), 'parameterized_g-code', 'final.gcode');
    await fs.writeFile(outputFilePath, finalGCode, 'utf-8');

    return finalGCode;
  }

  async loadCalibrationGcode(): Promise<string> {
    const calibrationPath = path.join(process.cwd(), 'gcode', 'printer_control', 'start-up.gcode');
    return fs.readFile(calibrationPath, 'utf-8');
  }

  async loadShutdownGcode(): Promise<string> {
    const shutdownPath = path.join(process.cwd(), 'gcode', 'printer_control', 'shutting-down.gcode');
    return fs.readFile(shutdownPath, 'utf-8');
  }
}
