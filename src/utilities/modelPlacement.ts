// src/utilities/modelPlacement.ts

import fs from 'fs';
import path from 'path';
import modelsMetadata from './models.json';
import {loadSnippet} from './snippetPlacement';

export interface ModelMeta {
  size: number;
  path: string;
  boundingBox: { width: number; depth: number };
}

export interface LoadedModel {
  meta: ModelMeta;
  content: string;
}

export interface Placement {
  model: LoadedModel;
  offsetX: number;
  offsetY: number;
}

export interface ParsedParams {
  material: string;
  sizes: number[];
  spacingX: number;
  spacingY: number;
  maxColumns: number;
}

type ModelsConfig = Record<string, ModelMeta[]>;

/**
 * Lädt die G-Code-Blöcke für das gegebene Material und die gewünschten Größen.
 */
export async function loadModels(parsed: ParsedParams): Promise<LoadedModel[]> {
    const entries = (modelsMetadata as ModelsConfig)[parsed.material] || [];
    const loaded: LoadedModel[] = [];
    for (const size of parsed.sizes) {
      const meta = entries.find(e => e.size === size);
      if (!meta) {
        throw new Error(`No block for ${parsed.material} ${size}mm in models.json`);
      }
      const fullPath = path.isAbsolute(meta.path) ? meta.path : path.resolve(process.cwd(), meta.path);
      let content: string;
      try {
        content = await fs.promises.readFile(fullPath, 'utf8');
      } catch (err) {
        throw new Error(`Failed to load ${fullPath}: ${err}`);
      }
      loaded.push({meta, content: content.trim()});
    }
    return loaded;
  }

/**
 * Berechnet für jedes geladene Modell die X/Y-Offsets basierend auf Spacing und Max-Columns.
 */
export function calculateLayout(models: LoadedModel[], parsed: ParsedParams): Placement[] {
    const placements: Placement[] = [];
    const columns = Math.max(1, Math.min(models.length, parsed.maxColumns));
    const placedAreas: { x: number; y: number; w: number; h: number }[] = [];
    for (let i = 0; i < models.length; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      const offsetX = col * parsed.spacingX;
      const offsetY = row * parsed.spacingY;
      const { width: w, depth: h } = models[i].meta.boundingBox;
      for (const other of placedAreas) {
        const overlapX = offsetX < other.x + other.w && offsetX + w > other.x;
        const overlapY = offsetY < other.y + other.h && offsetY + h > other.y;
        if (overlapX && overlapY) {
          throw new Error(`Collision detected at positions (${offsetX},${offsetY})`);
        }
      }
      placedAreas.push({ x: offsetX, y: offsetY, w, h });
      placements.push({ model: models[i], offsetX, offsetY });
    }
    return placements;
  }

/**
 * Generiert den finalen G-Code-Block für alle Modellausrichtungen.
 */
export function insertModelBlocks(template: string, placements: Placement[]): string {
    const placeholderRegex = /;;\s*MODELS_PLACEHOLDER/;
    let assembled = '';
    for (const { model, offsetX, offsetY } of placements) {
    // G92 und G1 Logik ist gerade nicht relevant, da es nur ein Modell geben wird

     // assembled += `G1 X${offsetX} Y${offsetY}\n`;
     // assembled += `G92 X0 Y0\n`;
      assembled += model.content + '\n';
     // assembled += `G1 X-${offsetX} Y-${offsetY}\n`;
     // assembled += `G92 X0 Y0\n`;
    }
    return template.replace(placeholderRegex, assembled.trim());
}