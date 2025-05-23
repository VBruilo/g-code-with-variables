// src/controller/printerController.ts
import { promises as fs } from 'fs';
import axios from 'axios';
import path from 'path';
import { GCodeTransformer } from '../transformer/gcodeTransformer';
import { ConfigServerResponse } from '../types/configServer';

class PrinterController {
  private configServerUrl: string;
  private transformer: GCodeTransformer;
  private prusaLinkUrl: string;

  constructor() {
    // Config-Server
    this.configServerUrl = 'http://localhost:3001';

    // PrusaLink Configurations – anpassen via ENV oder direkt
    this.prusaLinkUrl = process.env.PRUSALINK_URL || 'http://localhost:3002';

    // Transformer
    this.transformer = new GCodeTransformer();
  }

  public async startPrint(): Promise<void> {
    // 1) Finales G-Code erzeugen
    const finalGCode = await this.fetchTransformedGCode();

    // 2) G-Code an den Drucker (über PrusaLink API) senden und Druck starten
    await this.sendToPrinter(finalGCode);
  }

  // Liest die parameterisierte Datei ein und transformiert sie:
  private async fetchTransformedGCode(): Promise<string> {
    console.log('[PrinterController] fetchTransformedGCode() start...');

    // 1) Parameter vom Config-Server holen
    const configResponse = await axios.get<ConfigServerResponse>(`${this.configServerUrl}/api/parameters`);
    const rawParams = configResponse.data.parameters;

    // 2) Passende G-Code-Datei basierend auf FILAMENT_TYPE auswählen
    const filamentType = rawParams["coin-color"].parameters["coin-material"].content[0].value || 'PETG';
    
    let gcodeTemplateFile;
    if (filamentType === 'PLA') {
      gcodeTemplateFile = 'one_color_PLA.gcode';
    } else if (filamentType === 'PETG') {
      gcodeTemplateFile = 'one_color_PETG.gcode';
    } else {
      gcodeTemplateFile = 'test.gcode';
      // Wenn keiner der beiden Werte passt, Fehler werfen
      //throw new Error(
        //`[PrinterController] Unsupported FILAMENT_TYPE: ${params.FILAMENT_TYPE}`
      //);
    }

    // 3) Original-G-Code-Datei lesen
    const gcodeFilePath = path.join(
      process.cwd(), 
      'parameterized_g-code', 
      gcodeTemplateFile
    );
    const gcodeContent = await fs.readFile(gcodeFilePath, 'utf-8');

    // 4) G-Code mithilfe des Transformers anpassen
    const finalGCode = await this.transformer.transformGCode(gcodeContent, rawParams);

    // 5) Optional: Den finalen G-Code in eine Datei schreiben
    const outputFilePath = path.join(
      process.cwd(), 
      'parameterized_g-code', 
      'final.gcode'
    );

    await fs.writeFile(outputFilePath, finalGCode, 'utf-8');

    console.log('[PrinterController] fetchTransformedGCode() done.');
    return finalGCode;
  }


  private async sendToPrinter(gcode: string): Promise<void> {
    console.log('[PrinterController] Sending final G-Code to printer via PrusaLink API...');

    // G-Code in einen Buffer umwandeln, damit er als Binärdatei gesendet werden kann.
    const gcodeBuffer = Buffer.from(gcode, 'utf-8');
    const fileSize = gcodeBuffer.length;

    // Ziel-Endpoint: Hier laden wir die Datei unter dem Storage "local" hoch,
    // und benennen sie beispielsweise "final.gcode".
    const endpointUrl = `${this.prusaLinkUrl}/api/v1/files/local/final.gcode`;

    // Die PrusaLink API erwartet einen PUT-Request mit den folgenden Headers:
    // - Content-Length: Größe der Datei
    // - Content-Type: application/octet-stream
    // - Print-After-Upload: "?1" (um den Druck direkt zu starten)
    // - Overwrite: "?1" (falls eine gleichnamige Datei überschrieben werden soll)
    await axios.put(endpointUrl, gcodeBuffer, {
      headers: {
        'Content-Length': fileSize,
        'Content-Type': 'application/octet-stream',
        'Print-After-Upload': '?1',
        'Overwrite': '?1'
      }
    });

    console.log('[PrinterController] File uploaded and print started via PrusaLink API!');
  }
}

export const printerController = new PrinterController();