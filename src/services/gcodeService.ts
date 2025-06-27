import { promises as fs } from 'fs';
import path from 'path';
import { GCodeTransformer } from '../transformer/gcodeTransformer';
import { ConfigParamDef } from '../types/configServer';

/**
 * Generates the final G-code by combining templates with configuration
 * parameters and convenience helpers.
 */
export class GcodeService {
  private transformer: GCodeTransformer;

  /**
   * @param transformer - Instance used to transform template G-code files.
   */
  constructor(transformer = new GCodeTransformer()) {
    this.transformer = transformer;
  }

  /**
   * Selects the correct template file for the given filament type.
   */
  private getTemplateFile(filamentType: string): string {
    if (filamentType === 'PLA') {
      return 'PLA_start_G-code.gcode';
    }
    if (filamentType === 'PETG') {
      return 'PETG_start_G-code.gcode';
    }
    throw new Error(`[GcodeService] Unsupported FILAMENT_TYPE: ${filamentType}.`);
  }

  /**
   * Creates the final G-code by loading the template, applying configuration
   * values and writing the output file.
   *
   * @param rawParams - Configuration parameters retrieved from the config server.
   * @returns Rendered G-code ready for printing.
   */
  async createFinalGcode(rawParams: Record<string, ConfigParamDef>): Promise<string> {
    const filamentType =
      rawParams?.["coin-color"]?.parameters?.["coin-material"]?.content?.[0]?.value ||
      'PETG';
    const templateFile = this.getTemplateFile(String(filamentType));

    const gcodeFilePath = path.join(process.cwd(), 'gcode', 'templates', templateFile);
    const gcodeContent = await fs.readFile(gcodeFilePath, 'utf-8');

    const finalGCode = await this.transformer.transformGCode(gcodeContent, rawParams);

    const outputFilePath = path.join(process.cwd(), 'gcode', 'print_ready', 'final.gcode');
    await fs.writeFile(outputFilePath, finalGCode, 'utf-8');

    return finalGCode;
  }

  /**
   * Loads the calibration G-code file from disk.
   */
  async loadCalibrationGcode(): Promise<string> {
    const calibrationPath = path.join(process.cwd(), 'gcode', 'printer_control', 'start-up.gcode');
    return fs.readFile(calibrationPath, 'utf-8');
  }

  /**
   * Loads the shutdown G-code file from disk.
   */
  async loadShutdownGcode(): Promise<string> {
    const shutdownPath = path.join(process.cwd(), 'gcode', 'printer_control', 'shutting-down.gcode');
    return fs.readFile(shutdownPath, 'utf-8');
  }

  /**
   * Loads the final generated G-code from disk if present.
   *
   * @returns The final G-code contents or `null` when the file does not exist.
   */
  async loadFinalGcode(): Promise<string | null> {
    const finalPath = path.join(process.cwd(), 'gcode', 'print_ready', 'final.gcode');
    try {
      return await fs.readFile(finalPath, 'utf-8');
    } catch (err: any) {
      if (err && err.code === 'ENOENT') {
        return null;
      }
      throw err;
    }
  }
}
