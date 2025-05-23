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
export function parseParams(params: GCodeParameters): ParsedParams {
    return {
      material: String(params.FIRST_FILAMENT_TYPE ?? 'PETG'),
      sizes: Array.isArray(params.MODEL_SIZE) ? (params.MODEL_SIZE as any[]).map(s => Number(s)) : [],
      spacingX: Number(params.SPACING_X ?? 90),
      spacingY: Number(params.SPACING_Y ?? 90),
      maxColumns: Number(params.MAX_COLUMNS ?? 4)
    };
}

