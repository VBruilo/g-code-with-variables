// src/utilities/gcodeUtils.ts
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

/**
 * Extrahiert das Template bis zum MODELS_PLACEHOLDER.
 * Wirft Fehler, wenn der Platzhalter fehlt.
 */
export function extractTemplate(content: string): string {
    const placeholderRegex = /;;\s*MODELS_PLACEHOLDER/;
    if (!placeholderRegex.test(content)) {
        throw new Error(`The placeholder not found in G-code template.`);
    }
    return content;
}

/**
 * Konsolidiert Default- und User-Parameter
 * und wandelt sie in ein ParsedParams-Objekt um.
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

