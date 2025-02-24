// src/transformer/gcodeTransformer.ts
import axios from 'axios';
import handlebars from 'handlebars';
import { registerHandlebarsHelpers } from '../helpers/handlebarsHelpers';

interface GCodeParameters {
  [key: string]: string | number;
}

export class GCodeTransformer {
  private configServerUrl: string;

  constructor() {
    this.configServerUrl = process.env.CONFIG_SERVER_URL || 'http://localhost:3001';
    registerHandlebarsHelpers();
  }

  // Liest die lokale Datei ein, holt Parameter und ersetzt Platzhalter.
  /*public async transformGCode(): Promise<string> {
    const params = await this.fetchParameters();
    const gcodeContent = await fs.readFile(this.gcodeFilePath, 'utf-8');
    const transformedGCode = this.replacePlaceholders(gcodeContent, params);
    return transformedGCode;
  }*/

  public async transformGCode(gcodeContent: string): Promise<string> {
    // Parameter vom Config Server holen
    const params = await this.fetchParameters();
    // Platzhalter ersetzen
    const transformedGCode = this.replacePlaceholders(gcodeContent, params);
    return transformedGCode;
  }

  private async fetchParameters(): Promise<GCodeParameters> {
    // Abfrage von Parametern vom Config Server mit einem GET Request
    const response = await axios.get(`${this.configServerUrl}/api/parameters`);
    return response.data as GCodeParameters;
  }

  // Deprecated Method with Regex
  /*private replacePlaceholders(gcode: string, params: GCodeParameters): string {
    return gcode.replace(/\{(\w+)\}/g, (match, p1) => {
      const key = p1 as keyof GCodeParameters;
      // Wenn Parameter existiert, ersetzen, sonst Platzhalter beibehalten
      if (params[key] !== undefined) {
        return String(params[key]);
      } else {
        return match; // Falls nicht gefunden
      }
    });
  }*/

  // New Method with Handlebars
  private replacePlaceholders(gcode: string, params: GCodeParameters): string {
    const template = handlebars.compile(gcode);
    return template(params);
  }
}
