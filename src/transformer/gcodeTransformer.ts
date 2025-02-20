// src/transformer/gcodeTransformer.ts
import {promises as fs } from 'fs';
import axios from 'axios';
import handlebars from 'handlebars';


interface GCodeParameters {
  [key: string]: string | number;
}

export class GCodeTransformer {
  private configServerUrl: string;
  private gcodeFilePath: string;

  constructor() {
    this.configServerUrl = process.env.CONFIG_SERVER_URL || 'http://localhost:3001';
    this.gcodeFilePath = process.env.GCODE_FILE_PATH || '/Users/vladislavbruilo/Documents/Studium/Thesis/Code/g-code_with_variables/parameterized_g-code/test.gcode';
  }

  // Liest die lokale Datei ein, holt Parameter und ersetzt Platzhalter.
  public async transformGCode(): Promise<string> {
    // 1. Parameter vom Config Server abholen
    const params = await this.fetchParameters();

    // 2. Datei einlesen
    const gcodeContent = await fs.readFile(this.gcodeFilePath, 'utf-8');

    // 3. Platzhalter ersetzen, in der Zukunft mit Template Engines
    const transformedGCode = this.replacePlaceholders(gcodeContent, params);

    // 4. Fertigen G-Code zurückgeben, in der Zukunft als Datei zurückgeben
    return transformedGCode;
  }

  private async fetchParameters(): Promise<GCodeParameters> {
    console.time("fetchParameters");
    // Abfrage von Parametern vom Config Server mit einem GET Request
    const response = await axios.get(`${this.configServerUrl}/api/parameters`);
    console.timeEnd("fetchParameters");
    return response.data as GCodeParameters;
  }

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

  private replacePlaceholders(gcode: string, params: GCodeParameters): string {
    // Kompiliere den G-Code-Inhalt als Handlebars Template
    const template = handlebars.compile(gcode);
    // Wende die Parameter an und erhalte den finalen G-Code
    return template(params);
  }
}
