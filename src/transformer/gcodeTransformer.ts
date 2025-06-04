// src/transformer/gcodeTransformer.ts
import handlebars from 'handlebars';
import { registerHandlebarsHelpers } from '../helpers/handlebarsHelpers';
import defaultParams from '../utilities/defaultParameters.json';
import { ConfigParamDef } from '../types/configServer';
import { flattenConfigParameters } from '../utilities/flattenConfigParameters';
import { insertModelBlocks, calculateLayout, loadModels } from '../utilities/modelPlacement';
import { parseParams, GCodeParameters, extractTemplate, loadSnippet } from '../utilities/gcodeUtils';

/**
 * Applies configuration parameters to a template G-code file.
 *
 * The transformer registers all custom Handlebars helpers upon creation
 * so that placeholders inside the G-code can be resolved later on.
 */
export class GCodeTransformer {
  constructor() {
    registerHandlebarsHelpers();
  }

  /**
   * Transforms the provided G-code template with the given parameters.
   *
   * The method flattens the parameter structure, merges it with the default
   * values and performs the two major transformation steps:
   * 1. inserting model blocks and
   * 2. replacing Handlebars placeholders.
   *
   * @param gcodeContent - Raw G-code including the model placeholder.
   * @param rawParams - Configuration parameters retrieved from the config server.
   * @returns The fully transformed G-code.
   */
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


  /**
   * Inserts model blocks into the G-code template.
   *
   * The method parses the merged parameter set, loads the required models
   * from disk and calculates their layout within the build area. After loading
   * an optional logo snippet, all parts are assembled in place of the model
   * placeholder within the provided template.
   *
   * @param gcodeContent - Original G-code containing the model placeholder.
   * @param mergedParams - Parameter object after merging defaults and config values.
   * @returns G-code with model blocks inserted.
   */
  private async modelPlacement(gcodeContent: string, mergedParams: Record<string, any>): Promise<string> {
    const template = extractTemplate(gcodeContent);
    const parsed = parseParams(mergedParams);
    const loaded = await loadModels(parsed);
    const placements = calculateLayout(loaded, parsed);
    const logoSnippet = await loadSnippet('logo', String(mergedParams.LOGO))
    const modelBlocks = insertModelBlocks(template, placements, logoSnippet);
    return modelBlocks;
  }

  /**
   * Replaces Handlebars placeholders in the given G-code string.
   *
   * @param gcode - The G-code with Handlebars expressions.
   * @param params - Parameter values used when rendering the template.
   * @returns The rendered G-code.
   */
  private replacePlaceholders(gcode: string, params: GCodeParameters): string {
    const template = handlebars.compile(gcode);
    return template(params);
  }
}
