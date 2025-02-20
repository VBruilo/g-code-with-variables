// src/controller/printerController.ts
import axios from 'axios'; 

class PrinterController {
  constructor() {}

  public async startPrint(): Promise<void> {
    const finalGCode = await this.fetchTransformedGCode();
    // G-Code an den Drucker schicken
    await this.sendToPrinter(finalGCode);
  }
  
  private async fetchTransformedGCode(): Promise<string> {
    const transformEndpoint = 'http://localhost:3000/api/transform';
    
    const response = await axios.get<TransformResponse>(transformEndpoint);
    
    if (!response.data || !response.data.finalGCode) {
      throw new Error('No finalGCode returned from /transform');
    }
    return response.data.finalGCode;
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
