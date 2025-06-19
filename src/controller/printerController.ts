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
  private currentJobId?: string;

  constructor() {
    // Config-Server
    this.configServerUrl = 'http://localhost:3001';

    // PrusaLink Configurations – anpassen via ENV oder direkt
    this.prusaLinkUrl = process.env.PRUSALINK_URL || 'http://localhost:3002';
    //this.prusaLinkUrl = process.env.PRUSALINK_URL || 'http://192.168.12.20';
    this.prusaLinkKey = process.env.PRUSALINK_API_KEY || 'GGLfRCFkCEFXrEN';

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
   * @param machineConfigID - Identifier of the machine configuration.
   * @param configSetID - Identifier of the configuration set.
   *
   * @throws {@link Error} When either fetching the transformed G-code or the
   * upload to the printer fails.
   */
  public async startPrint(machineConfigID: string, configSetID: string): Promise<string> {
    // 1) Finales G-Code erzeugen
    const finalGCode = await this.fetchTransformedGCode(machineConfigID, configSetID);

    // 2) G-Code an den Drucker (über PrusaLink API) senden und Druck starten
    await this.sendToPrinter(finalGCode);

    // 3) After initiating the print, store the current job ID
    this.currentJobId = await this.getCurrentJobId() || undefined;
    if (!this.currentJobId) {
      throw new Error('Unable to determine job ID after starting print');
    }
    return this.currentJobId;
  }

  /**
   * Reads the parameterized G-code template, applies parameters from the
   * config server and stores the resulting file.
   *
   * @param machineConfigID - Identifier of the machine configuration.
   * @param configSetID - Identifier of the configuration set.
   * @returns The fully transformed G-code ready for printing.
   * @throws {@link Error} When reading the template, contacting the config
   * server or writing the output fails.
   */
  private async fetchTransformedGCode(machineConfigID: string, configSetID: string): Promise<string> {
    console.log('[PrinterController] fetchTransformedGCode() start...');

    // 1) Parameter vom Config-Server holen
    const url =
      `${this.configServerUrl}/api/spaces/proceed-default-no-iam-user` +
      `/configurations/${configSetID}/latest/machine/${machineConfigID}`;

    const configResponse = await axios.get<ConfigServerResponse>(url);
    const rawParams = configResponse.data.parameters;

    // 2) Passende G-Code-Datei basierend auf FILAMENT_TYPE auswählen
    const filamentType = rawParams["coin-color"].parameters["coin-material"].content[0].value || 'PETG';
    
    let gcodeTemplateFile;
    if (filamentType === 'PLA') {
      gcodeTemplateFile = 'PLA_start_G-code.gcode';
    } else if (filamentType === 'PETG') {
      gcodeTemplateFile = 'PETG_start_G-code.gcode';
    } else {
      // Wenn keiner der beiden Werte passt, Fehler werfen
      throw new Error(
        `[PrinterController] Unsupported FILAMENT_TYPE: ${filamentType}. `
      );
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
   * Starts a calibration print using the predefined calibration G-code.
   *
   * The method reads the `calibration.gcode` file from the `gcode/printer_control`
   * folder and uploads it to the printer via {@link sendToPrinter}. After
   * uploading, {@link currentJobId} is updated with the ID of the started job.
   */
  public async startCalibration(): Promise<void> {
    const calibrationPath = path.join(
      process.cwd(),
      'gcode',
      'printer_control',
      'start-up.gcode'
    );

    const gcode = await fs.readFile(calibrationPath, 'utf-8');

    await this.sendToPrinter(gcode);

    this.currentJobId = (await this.getCurrentJobId()) || undefined;
  }

  /**
   * Sends a shutdown G-code to turn off the printer.
   *
   * The method reads the `turn_off.gcode` file from the `gcode/printer_control`
   * folder and uploads it to the printer via {@link sendToPrinter}. After
   * uploading, {@link currentJobId} is updated with the ID of the started job.
   */
  public async startShutdown(): Promise<void> {
    const shutdownPath = path.join(
      process.cwd(),
      'gcode',
      'printer_control',
      'shutting-down.gcode'
    );

    const gcode = await fs.readFile(shutdownPath, 'utf-8');

    await this.sendToPrinter(gcode);

    this.currentJobId = (await this.getCurrentJobId()) || undefined;
  }

  /**
   * Updates the printer status by starting the warm up or initiating the
   * shutdown procedure depending on the provided status string.
   */
  public async updatePrinterStatus(status: 'start-up' | 'shutting-down'): Promise<void> {
    if (status === 'start-up') {
      await this.startCalibration();
    } else if (status === 'shutting-down') {
      await this.startShutdown();
    } else {
      throw new Error(`Invalid status: ${status}`);
    }
  }

  /**
   * Retrieves the current printer status from PrusaLink.
   *
   * @returns The mapped printer status string or 'printer-not-reachable' when
   *          the request fails.
   */
  public async getPrinterStatus(): Promise<string> {
    try {
      const resp = await axios.get(`${this.prusaLinkUrl}/api/v1/status`, {
        headers: this.getAuthHeaders(),
      });

      const data: any = resp.data;
      const state: string | undefined = data?.printer?.state;
      const mapping: Record<string, string> = {
        IDLE: 'ready-for-print',
        PRINTING: 'printing',
        PAUSED: 'paused',
        FINISHED: 'finished',
        ERROR: 'error',
      };

      return mapping[state ?? ''] ?? state?.toLowerCase() ?? 'unknown';
    } catch (err: any) {
      console.error('[PrinterController] getPrinterStatus error:', err.message);
      return 'printer-not-reachable';
    }
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
      headers: this.getAuthHeaders({
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
   * @param coinJobId - (optional) The identifier used by the coin application.
   * @returns The current job status. If the request fails an error status is
   * returned.
   * @throws No errors are thrown; failures result in an `'ERROR'` state.
   */
  public async getPrintStatus(coinJobId?: string): Promise<JobStatus> {
    const jobId = coinJobId ?? this.currentJobId;
    if (!jobId) {
        throw new Error('No job ID specified and no current job stored');
    }

    try {
        console.log(`[PrinterController] getPrintStatus() for job ID: ${jobId}`);

        const resp = await axios.get(`${this.prusaLinkUrl}/api/v1/job`, {
        headers: this.getAuthHeaders()
        });

       
        // 204: kein aktiver Job
        if (resp.status === 204) {
            this.currentJobId = undefined;
            return {
                id: parseInt(jobId, 10),
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

        if (job.state === 'FINISHED' || job.state === 'STOPPED') {
            this.currentJobId = undefined;
        }

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
        id:               parseInt(jobId, 10),
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
   * @param coinJobId - (optional) Identifier of the job to pause.
   * @throws {@link Error} If the HTTP request fails.
   */
  public async pausePrint(coinJobId?: string): Promise<void> {
    const jobId = coinJobId ?? this.currentJobId;
    if (!jobId) {
      throw new Error('No job ID specified and no current job stored');
    }

    console.log(`[PrinterController] pausePrint() for job ID: ${jobId}`);
    await axios.put(
      `${this.prusaLinkUrl}/api/v1/job/${jobId}/pause`,
      null,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Resumes a previously paused print job.
   *
   * @param coinJobId - (optional) Identifier of the job to resume.
   * @throws {@link Error} If the HTTP request fails.
   */
  public async resumePrint(coinJobId?: string): Promise<void> {
    const jobId = coinJobId ?? this.currentJobId;
    if (!jobId) {
      throw new Error('No job ID specified and no current job stored');
    }

    console.log(`[PrinterController] resumePrint() for job ID: ${jobId}`);
    await axios.put(
      `${this.prusaLinkUrl}/api/v1/job/${jobId}/resume`,
      null,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Cancels an active print job on the printer.
   *
   * @param coinJobId - (optional) Identifier of the job to cancel.
   * @throws {@link Error} If the HTTP request fails.
   */
   public async cancelPrint(coinJobId?: string): Promise<void> {
    const jobId = coinJobId ?? this.currentJobId;
    if (!jobId) {
      throw new Error('No job ID specified and no current job stored');
    }

    console.log(`[PrinterController] cancelPrint() for job ID: ${jobId}`);
    await axios.delete(`${this.prusaLinkUrl}/api/v1/job/${jobId}`, {
      headers: this.getAuthHeaders()
    });

    // after canceling clear stored job ID
    this.currentJobId = undefined;
   }
}

export const printerController = new PrinterController(); 
