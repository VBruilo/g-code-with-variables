import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import { registerHandlebarsHelpers } from '../helpers/handlebarsHelpers';
import defaultParams from '../utilities/defaultParameters.json';
import { superModels } from '../utilities/superModels';

interface GCodeParameters {
  [key: string]: string | number | boolean | any;
}

export class GCodeTransformer {

  constructor() {
    registerHandlebarsHelpers();
  }

  public async transformGCode(
    gcodeContent: string,
    params: Partial<GCodeParameters>
  ): Promise<string> {
    const mergedParams: GCodeParameters = {
      ...defaultParams,
      ...params
    };
    const withModels = this.assembleGCode(gcodeContent, mergedParams);
    return this.replacePlaceholders(withModels, mergedParams);
  }

  private assembleGCode(
    templateContent: string,
    params: GCodeParameters
  ): string {
    const placeholderRegex = /;;\s*MODELS_PLACEHOLDER/;
    if (!placeholderRegex.test(templateContent)) {
      throw new Error('Models placeholder not found in G-code template.');
    }

    const material = String(params.FILAMENT_TYPE ?? params.material ?? 'PLA');
    const sizes: number[] = Array.isArray(params.MODEL_SIZES_CM)
      ? (params.MODEL_SIZES_CM as any[]).map(s => Number(s))
      : [];
    const count = sizes.length;
    const spacingX = Number(params.SPACING_X ?? params.spacingX ?? 90);
    const spacingY = Number(params.SPACING_Y ?? params.spacingY ?? 90);
    const maxColumns = Number(params.MAX_COLUMNS ?? params.maxColumns ?? 4);
    const columns = Math.max(1, Math.min(count, maxColumns));

    const available = superModels[material] || [];
    const selected = sizes.map(size => {
      const idx = size - 1;
      if (idx < 0 || idx >= available.length) {
        throw new Error(`Model block for ${size}cm not found in superModels[${material}]`);
      }
      return available[idx];
    });

    let assembled = '';
    selected.forEach((block, i) => {
      const col = i % columns;
      const row = Math.floor(i / columns);
      const offsetX = col * spacingX;
      const offsetY = row * spacingY;

      assembled += `G1 X${offsetX} Y${offsetY}\n`;
      assembled += `G92 X0 Y0\n`;
      assembled += `${block.trim()}\n`;
      assembled += `G1 X-${offsetX} Y-${offsetY}\n`;
      assembled += `G92 X0 Y0\n`;
      
    });

    return templateContent.replace(placeholderRegex, assembled.trim());
  }

  private replacePlaceholders(
    gcode: string,
    params: GCodeParameters
  ): string {
    const template = handlebars.compile(gcode);
    return template(params);
  }
}
