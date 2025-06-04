// src/transformer/gcodeTransformer.ts
import handlebars from 'handlebars';
import { registerHandlebarsHelpers } from '../helpers/handlebarsHelpers';
import defaultParams from '../utilities/defaultParameters.json';
import { ConfigParamDef } from '../types/configServer';
import { flattenConfigParameters } from '../utilities/flattenConfigParameters';
import { insertModelBlocks, calculateLayout, loadModels } from '../utilities/modelPlacement';
import { parseParams, GCodeParameters, extractTemplate, loadSnippet } from '../utilities/gcodeUtils';

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

    // 1) Modell einfügen
    let content = await this.modelPlacement(gcodeContent, merged);

    // 2) Handlebars-Platzhalter ersetzen
    return this.replacePlaceholders(content, merged);
  }


  private async modelPlacement(gcodeContent: string, mergedParams: Record<string, any>): Promise<string> {
    const template = extractTemplate(gcodeContent);
    const parsed = parseParams(mergedParams);
    const loaded = await loadModels(parsed);
    const placements = calculateLayout(loaded, parsed);
    const logoSnippet = await loadSnippet('logo', String(mergedParams.LOGO))
    const modelBlocks = insertModelBlocks(template, placements, logoSnippet);
    return modelBlocks;
  }

  private replacePlaceholders(gcode: string, params: GCodeParameters): string {
    const template = handlebars.compile(gcode);
    return template(params);
  }
}