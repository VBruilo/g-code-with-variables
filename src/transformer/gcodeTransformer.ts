// src/transformer/gcodeTransformer.ts
import handlebars from 'handlebars';
import { registerHandlebarsHelpers } from '../helpers/handlebarsHelpers';

interface GCodeParameters {
  [key: string]: string | number;
}

export class GCodeTransformer {

  constructor() {
    registerHandlebarsHelpers();
  }

  public async transformGCode(gcodeContent: string, params: any): Promise<string> {
    const transformedGCode = this.replacePlaceholders(gcodeContent, params);
    return transformedGCode;
  }

  private replacePlaceholders(gcode: string, params: any): string {
    const template = handlebars.compile(gcode);
    return template(params);
  }
}
