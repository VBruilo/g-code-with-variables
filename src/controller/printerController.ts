// src/controller/printerController.ts
import { promises as fs } from 'fs';
import axios from 'axios';
import path from 'path';


class PrinterController {
  constructor() {}

  public async startPrint(): Promise<void> {
    const finalGCode = await this.fetchTransformedGCode();
    // G-Code an den Drucker schicken
    await this.sendToPrinter(finalGCode);
  }
  
  //
  /*private async fetchTransformedGCode(): Promise<string> {
    const transformEndpoint = 'http://localhost:3000/api/transform';
    const response = await axios.get<TransformResponse>(transformEndpoint);
    if (!response.data || !response.data.finalGCode) {
      throw new Error('No finalGCode returned from /transform');
    }
    return response.data.finalGCode;
  }*/
  
  // New Fetch Method
  private async fetchTransformedGCode(): Promise<string> {
    console.log(process.cwd())
    const gcodeFilePath = process.env.GCODE_FILE_PATH || path.join(process.cwd(), 'parameterized_g-code', 'two_colors_model.gcode');
    const gcodeContent = await fs.readFile(gcodeFilePath, 'utf-8');

    const transformEndpoint = 'http://localhost:3000/api/transform';
    // Sende den G-Code als POST-Body an den Transformer-Endpoint
    const response = await axios.post<{ outputFilePath: string }>(transformEndpoint, { gcode: gcodeContent });
    
    if (!response.data || !response.data.outputFilePath) {
      throw new Error('No outputFilePath returned from /transform');
    }
    // Lese den Inhalt der neu erstellten Datei
    const finalGCode = await fs.readFile(response.data.outputFilePath, 'utf-8');
    return finalGCode;
  }

  private async sendToPrinter(gcode: string): Promise<void> {
    console.log('[PrinterController] Sending final G-Code to printer...');
    console.log(`... G-Code length: ${gcode.length}`);

    console.log('--- BEGIN FINAL G-CODE ---');
    console.log(gcode);
    console.log('--- END FINAL G-CODE ---');

    //Irgendwann OctoPrint oder so?
  }
}

interface TransformResponse {
    finalGCode: string;
  }

export const printerController = new PrinterController();
