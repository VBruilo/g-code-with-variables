// src/controller/printerController.ts
import { promises as fs } from 'fs';
import axios from 'axios';
import path from 'path';
import FormData from 'form-data';
import { GCodeTransformer } from '../transformer/gcodeTransformer';

class PrinterController {
  private configServerUrl: string;
  private transformer: GCodeTransformer;
  private octoUrl: string;
  private octoApiKey: string;

  constructor() {
    //Config-Server
    this.configServerUrl = 'http://localhost:3001';

    //OctoPrint Configurations
    this.octoUrl = process.env.OCTOPRINT_URL || 'http://localhost:3002';
    this.octoApiKey = process.env.OCTOPRINT_API_KEY || 'OCTO_API_KEY';

    //Transformer
    this.transformer = new GCodeTransformer();
  }

  public async startPrint(): Promise<void> {
    // 1) Finales G-Code erzeugen
    const finalGCode = await this.fetchTransformedGCode();

    // 2) G-Code an OctoPrint senden und Druck starten
    await this.sendToPrinter(finalGCode);
  }
  
  // Liest die parameterisierte Datei ein und transformiert sie:
  private async fetchTransformedGCode(): Promise<string> {
    console.log('[PrinterController] fetchTransformedGCode() start...');
    // Pfad zur ursprünglichen parametrierten G-Code-Datei
    const gcodeFilePath = path.join(
      process.cwd(), 
      'parameterized_g-code', 
      'one_color_parameterized.gcode');

    const gcodeContent = await fs.readFile(gcodeFilePath, 'utf-8');

    // Parameter vom Config-Server holen
    const configResponse = await axios.get(`${this.configServerUrl}/api/parameters`);
    const params = configResponse.data;

    // G-Code mithilfe des Transformers anpassen
    const finalGCode = await this.transformer.transformGCode(gcodeContent, params);

    // Den finalen G-Code in eine Datei schreiben, wenn du ihn local auch noch behalten willst
    const outputFilePath = path.join(
      process.cwd(), 
      'parameterized_g-code', 
      'final.gcode');

    await fs.writeFile(outputFilePath, finalGCode, 'utf-8');

    console.log('[PrinterController] fetchTransformedGCode() done.');
    return finalGCode;
  }


  private async sendToPrinter(gcode: string): Promise<void> {
    console.log('[PrinterController] Sending final G-Code to printer via OctoPrint...');

    // FormData erstellen
    const form = new FormData();

    // Wir wandeln den String in einen Buffer um, damit FormData es als Datei-Upload verarbeiten kann.
    const gcodeBuffer = Buffer.from(gcode, 'utf-8');

    // "file" -> G-Code-Inhalt aus dem Buffer
    // filename: 'final.gcode' -> Der Name, unter dem OctoPrint es speichern soll
    form.append('file', gcodeBuffer, { filename: 'final.gcode' });

    // "select" & "print" sorgen dafür, dass OctoPrint die Datei direkt nach Upload druckt
    form.append('select', 'true');
    form.append('print', 'true');

    await axios.post(`${this.octoUrl}/api/files/local`, form, {
      headers: {
        'X-Api-Key': this.octoApiKey,
        ...form.getHeaders()
      }
    });

    console.log('[PrinterController] File uploaded and print started via OctoPrint!');
    console.log('[PrinterController] Printing finished (or in progress).');
  }
}

export const printerController = new PrinterController();
