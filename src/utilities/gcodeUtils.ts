// src/utilities/gcodeUtils.ts
import fs from 'fs';
import path from 'path';

export interface SnippetParams {

  [key: string]: any;
}

export interface GCodeParameters {
  [key: string]: string | number | boolean | any;
}

export interface ParsedParams {
  material: string;
  sizes: number[];
  spacingX: number;
  spacingY: number;
  maxColumns: number;
}

export function extractTemplate(content: string): string {
    const placeholderRegex = /;;\s*MODELS_PLACEHOLDER/;
    if (!placeholderRegex.test(content)) {
        throw new Error(`The placeholder not found in G-code template.`);
    }
    return content;
}


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

