// src/transformer/gcodeTransformer.ts
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import modelsMetadata from '../utilities/models.json';
import { registerHandlebarsHelpers } from '../helpers/handlebarsHelpers';
import defaultParams from '../utilities/defaultParameters.json';
import { ConfigServerDef } from '../types/configServer';
import { flattenConfigParameters } from '../utilities/flattenConfigParameters';

interface GCodeParameters {
  [key: string]: string | number | boolean | any;
}

interface ModelMeta {
  size: number;
  path: string;
  boundingBox: { width: number; depth: number };
}

interface LoadedModel {
  meta: ModelMeta;
  content: string;
}

interface ParsedParams {
  material: string;
  sizes: number[];
  spacingX: number;
  spacingY: number;
  maxColumns: number;
}

interface Placement {
  model: LoadedModel;
  offsetX: number;
  offsetY: number;
}

type ModelsConfig = Record<string, ModelMeta[]>;

export class GCodeTransformer {
  constructor() {
    registerHandlebarsHelpers();
  }

  public async transformGCode(
    gcodeContent: string,
    rawParams: Record<string, ConfigParamDef>
  ): Promise<string> {
    const flat = flattenConfigParameters(rawParams);
    const mergedParams: Record<string, any> = {
      ...defaultParams,
      ...flat
    };

    const template = this.extractTemplate(gcodeContent);
    const parsed = this.parseParams(mergedParams);
    const loaded = await this.loadModels(parsed);
    const placements = this.calculateLayout(loaded, parsed);
    const withModels = this.insertModelBlocks(template, placements);
    return this.replacePlaceholders(withModels, mergedParams);
  }

  private extractTemplate(content: string): string {
    const placeholderRegex = /;;\s*MODELS_PLACEHOLDER/;
    if (!placeholderRegex.test(content)) {
      throw new Error('Models placeholder not found in G-code template.');
    }
    return content;
  }

  private parseParams(params: GCodeParameters): ParsedParams {
    return {
      material: String(params.FILAMENT_TYPE ?? params.material ?? 'PLA'),
      sizes: Array.isArray(params.MODEL_SIZES_CM)
        ? (params.MODEL_SIZES_CM as any[]).map(s => Number(s)) : [],
      spacingX: Number(params.SPACING_X ?? params.spacingX ?? 90),
      spacingY: Number(params.SPACING_Y ?? params.spacingY ?? 90),
      maxColumns: Number(params.MAX_COLUMNS ?? params.maxColumns ?? 4)
    };
  }

  private async loadModels(parsed: ParsedParams): Promise<LoadedModel[]> {
    const entries = (modelsMetadata as ModelsConfig)[parsed.material] || [];
    const loaded: LoadedModel[] = [];
    for (const size of parsed.sizes) {
      const meta = entries.find(e => e.size === size);
      if (!meta) {
        throw new Error(No block for ${parsed.material} ${size}cm in models.json);
      }
      const fullPath = path.isAbsolute(meta.path) ? meta.path
                      : path.resolve(process.cwd(), meta.path);
      let content: string;
      try {
        content = await fs.promises.readFile(fullPath, 'utf8');
      } catch (err) {
        throw new Error(Failed to load ${fullPath}: ${err});
      }
      loaded.push({ meta, content: content.trim() });
    }
    return loaded;
  }

  private calculateLayout(models: LoadedModel[], parsed: ParsedParams): Placement[] {
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
          throw new Error(Collision detected at positions (${offsetX},${offsetY}));
        }
      }
      placedAreas.push({ x: offsetX, y: offsetY, w, h });
      placements.push({ model: models[i], offsetX, offsetY });
    }
    return placements;
  }

  private insertModelBlocks(template: string, placements: Placement[]): string {
    const placeholderRegex = /;;\s*MODELS_PLACEHOLDER/;
    let assembled = '';
    for (const { model, offsetX, offsetY } of placements) {
      assembled += G1 X${offsetX} Y${offsetY}\n;
      assembled += G92 X0 Y0\n;
      assembled += model.content + '\n';
      assembled += G1 X-${offsetX} Y-${offsetY}\n;
      assembled += G92 X0 Y0\n;
    }
    return template.replace(placeholderRegex, assembled.trim());
  }

  private replacePlaceholders(gcode: string, params: GCodeParameters): string {
    const template = handlebars.compile(gcode);
    return template(params);
  }
}