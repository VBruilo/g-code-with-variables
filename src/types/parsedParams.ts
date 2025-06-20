// src/types/parsedParams.ts

/**
 * Normalized parameters used for model placement calculations.
 */
export interface ParsedParams {
  /** Selected filament material */
  material: string;
  /** List of model sizes in millimeters */
  sizes: number[];
  /** Horizontal spacing between models */
  spacingX: number;
  /** Vertical spacing between models */
  spacingY: number;
  /** Maximum number of columns when arranging models */
  maxColumns: number;
}
