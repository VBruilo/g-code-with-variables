// src/transformer/gcodeTransformer.ts
import handlebars from 'handlebars';
import { registerHandlebarsHelpers } from '../helpers/handlebarsHelpers';
import defaultParams from '../utilities/defaultParameters.json';
import { ConfigParamDef } from '../types/configServer';
import { flattenConfigParameters } from '../utilities/flattenConfigParameters';
import { insertModelBlocks, calculateLayout, loadModels } from '../utilities/modelPlacement';
import { parseParams, GCodeParameters, extractTemplate } from '../utilities/gcodeUtils';
import { insertSnippet } from '../utilities/snippetPlacement';

export class GCodeTransformer {
  constructor() {
    registerHandlebarsHelpers();
  }

  public async transformGCode(
    gcodeContent: string,
    rawParams: Record<string, ConfigParamDef>
  ): Promise<string> {
    const flat = flattenConfigParameters(rawParams);
    const merged = { ...defaultParams, ...flat };

    // 1) QR-Code einfügen
    let content = await insertSnippet(
      gcodeContent,
      merged,
      'QR_CODE',
      'qr',
      /;;\s*QR_CODE_PLACEHOLDER/
    );

    // 2) Modell einfügen
    content = await this.modelPlacement(content, merged);

    // 3) Logo einfügen
    content = await insertSnippet(
      content,
      merged,
      'LOGO',
      'logo',
      /;;\s*LOGO_PLACEHOLDER/
    );

    // 4) Handlebars-Platzhalter ersetzen
    return this.replacePlaceholders(content, merged);
  }


  private async modelPlacement(gcodeContent: string, mergedParams: Record<string, any>): Promise<string> {
    const template = extractTemplate(gcodeContent);
    const parsed = parseParams(mergedParams);
    const loaded = await loadModels(parsed);
    const placements = calculateLayout(loaded, parsed);
    const modelBlocks = insertModelBlocks(template, placements);
    return modelBlocks;
  }

  private replacePlaceholders(gcode: string, params: GCodeParameters): string {
    const template = handlebars.compile(gcode);
    return template(params);
  }
}