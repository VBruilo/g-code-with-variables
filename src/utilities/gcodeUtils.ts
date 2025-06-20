// src/utilities/gcodeUtils.ts
import fs from 'fs';
import path from 'path';
import type { ParsedParams } from '../types/parsedParams';
export type { ParsedParams } from '../types/parsedParams';

export interface SnippetParams {

  [key: string]: any;
}

export interface GCodeParameters {
  [key: string]: string | number | boolean | any;
}


/**
 * Validate that the template contains the `;; MODELS_PLACEHOLDER` marker.
 *
 * @param content Raw G-code template string.
 * @returns The original content when the placeholder is present.
 * @throws If the placeholder cannot be found.
 */
export function extractTemplate(content: string): string {
    const placeholderRegex = /;;\s*MODELS_PLACEHOLDER/;
    if (!placeholderRegex.test(content)) {
        throw new Error(`The placeholder not found in G-code template.`);
    }
    return content;
}
/**
 * Convert raw parameter values into typed numbers and strings for placement calculations.
 *
 * Expected keys include `FIRST_FILAMENT_TYPE`, `MODEL_SIZE`, `SPACING_X`, `SPACING_Y` and `MAX_COLUMNS`.
 *
 * @param p Flat parameter map usually returned by flattenConfigParameters.
 * @returns Normalised values for downstream processing.
 */


export function parseParams(p: GCodeParameters): ParsedParams {
  const { FIRST_FILAMENT_TYPE = 'PETG', MODEL_SIZE, SPACING_X = 90, SPACING_Y = 90, MAX_COLUMNS = 4 } = p;
  return {
    material: String(FIRST_FILAMENT_TYPE),
    sizes: Array.isArray(MODEL_SIZE) ? MODEL_SIZE.map(Number) : [],
    spacingX: Number(SPACING_X),
    spacingY: Number(SPACING_Y),
    maxColumns: Number(MAX_COLUMNS),
  };
}
/**
 * Load a G-code snippet from the `gcode/<type>` directory.
 *
 * @param type Subfolder under `gcode` specifying the snippet group.
 * @param key Name of the snippet file without extension.
 * @returns Trimmed G-code content of the snippet.
 * @throws If reading the snippet fails.
 */

export async function loadSnippet(
  type: string,
  key: string | number
): Promise<string> {
  const fileName = `${key}.gcode`;
  const fullPath = path.resolve(process.cwd(), 'gcode', type, fileName);
  try {
    const content = await fs.promises.readFile(fullPath, 'utf8');
    return content.trim();
  } catch (err) {
    throw new Error(`Failed to load snippet ${type}/${fileName}: ${err}`);
  }
}

