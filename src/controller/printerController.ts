// src/controller/printerController.ts
import { promises as fs } from 'fs';
import axios from 'axios';
import path from 'path';
import { GCodeTransformer } from '../transformer/gcodeTransformer';
import { ConfigServerResponse } from '../types/configServer';
import { JobStatus } from '../types/jobStatus';

/**
 * Controller responsible for transforming parameterized G-code and
 * communicating with PrusaLink to start and manage print jobs.
 */
class PrinterController {
  private configServerUrl: string;
  private transformer: GCodeTransformer;
  private prusaLinkUrl: string;
  private prusaLinkKey: string;

  constructor() {
    // Config-Server
    this.configServerUrl = 'http://localhost:3001';

    // PrusaLink Configurations – anpassen via ENV oder direkt
    this.prusaLinkUrl = process.env.PRUSALINK_URL || 'http://localhost:3002';

    // Transformer
    this.transformer = new GCodeTransformer();
  }

  /**
   * Returns common headers for authenticated PrusaLink requests.
   */
  private getAuthHeaders(additional: Record<string, any> = {}): Record<string, any> {
    return { 'X-Api-Key': this.prusaLinkKey, ...additional };
  }

  /**
   * Creates the final G-code from the parameterized template and sends it to
   * the printer to start the job.
   *
   * @throws {@link Error} When either fetching the transformed G-code or the
   * upload to the printer fails.
   */
  public async startPrint(): Promise<void> {
    // 1) Finales G-Code erzeugen
    const finalGCode = await this.fetchTransformedGCode();

    // 2) G-Code an den Drucker (über PrusaLink API) senden und Druck starten
    await this.sendToPrinter(finalGCode);
  }

  /**
   * Reads the parameterized G-code template, applies parameters from the
   * config server and stores the resulting file.
   *
   * @returns The fully transformed G-code ready for printing.
   * @throws {@link Error} When reading the template, contacting the config
   * server or writing the output fails.
   */
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

  /**
   * Uploads the final G-code to the printer via the PrusaLink API and starts
   * the print.
   *
   * @param gcode - The fully processed G-code to be printed.
   * @throws {@link Error} When the HTTP request to PrusaLink fails.
   */
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
      })
    });

    console.log('[PrinterController] File uploaded and print started via PrusaLink API!');
  }

  /**
   * Retrieves the identifier of the currently running job from the PrusaLink
   * API.
   *
   * @returns The job ID as a string or `null` if no job is active.
   * @throws {@link Error} When the request fails.
   */
  public async getCurrentJobId(): Promise<string | null> {
    console.log('[PrinterController] Getting current job ID from PrusaLink API...');
    const resp = await axios.get(`${this.prusaLinkUrl}/api/v1/job`, {
      headers: this.getAuthHeaders()
    });
    try {
        

        if (resp.status === 204) {
            return null;
        }

        if (resp.status === 200) {
            const job = resp.data as { id: number };
            console.log(`[PrinterController] Current job ID: ${job.id}`);
            return job.id.toString();
        }

        return null;
    } catch (error) {
        throw new Error(`PrusaLink getCurrentJobId failed with status ${resp.status}`);
    }
  }

  /**
   * Retrieves the print status for the given job from PrusaLink.
   *
   * @param coinJobId - The identifier used by the coin application.
   * @returns The current job status. If the request fails an error status is
   * returned.
   * @throws No errors are thrown; failures result in an `'ERROR'` state.
   */
  public async getPrintStatus(coinJobId: string): Promise<JobStatus> {
    try {
        console.log(`[PrinterController] getPrintStatus() for job ID: ${coinJobId}`);

        const resp = await axios.get(`${this.prusaLinkUrl}/api/v1/job`, {
        headers: this.getAuthHeaders()
        });

       
        // 204: kein aktiver Job
        if (resp.status === 204) {
            return {
                id: parseInt(coinJobId, 10),
                state: 'FINISHED',
                progress: 100,
                timePrinting: 0,
                timeRemaining: 0,
            };
        }

        // 200: Job-Daten im Body
        const job = resp.data as {
        id: number;
        state: 'PRINTING'| 'PAUSED'| 'FINISHED'| 'STOPPED'| 'ERROR';
        progress: number;
        time_printing: number;
        time_remaining: number;
        inaccurate_estimates?: boolean;
        };

        return {
        id:               job.id,
        state:            job.state,
        progress:         job.progress,
        timePrinting:     job.time_printing,
        timeRemaining:    job.time_remaining,
        inaccurateEstimates: job.inaccurate_estimates,
        };
    } catch (err: any) {
        console.error('[PrinterController] getPrintStatus error:', err.message);
        // Bei API-Fehler einen Error-Status zurückgeben
        return {
        id:               parseInt(coinJobId, 10),
        state:            'ERROR',
        progress:         0,
        timePrinting:     0,
        timeRemaining:    0,
        };
    }
  }

  /**
   * Sends a pause command for the specified print job.
   *
   * @param coinJobId - Identifier of the job to pause.
   * @throws {@link Error} If the HTTP request fails.
   */
  public async pausePrint(coinJobId: string): Promise<void> {
    console.log(`[PrinterController] pausePrint() for job ID: ${coinJobId}`);
    await axios.put(
      `${this.prusaLinkUrl}/api/v1/job/${coinJobId}/pause`,
      null,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Resumes a previously paused print job.
   *
   * @param coinJobId - Identifier of the job to resume.
   * @throws {@link Error} If the HTTP request fails.
   */
  public async resumePrint(coinJobId: string): Promise<void> {
    console.log(`[PrinterController] resumePrint() for job ID: ${coinJobId}`);
    await axios.put(
      `${this.prusaLinkUrl}/api/v1/job/${coinJobId}/resume`,
      null,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Cancels an active print job on the printer.
   *
   * @param coinJobId - Identifier of the job to cancel.
   * @throws {@link Error} If the HTTP request fails.
   */
   public async cancelPrint(coinJobId: string): Promise<void> {
    console.log(`[PrinterController] cancelPrint() for job ID: ${coinJobId}`);
    await axios.delete(`${this.prusaLinkUrl}/api/v1/job/${coinJobId}`, {
      headers: this.getAuthHeaders()
    });
  }
}

export const printerController = new PrinterController(); 