import axios from 'axios';
import { JobStatus } from '../types/jobStatus';
import { PrinterStatus } from '../types/printerStatus';
import { PRUSALINK_URL, PRUSALINK_API_KEY } from '../config';

/**
 * Wrapper around the PrusaLink API used to manage print jobs on the printer.
 */
export class PrusaLinkService {
  private baseUrl: string;
  private apiKey: string;

  /**
   * @param baseUrl - Base URL of the PrusaLink instance.
   * @param apiKey - API key for authenticating requests.
   */
  constructor(
    baseUrl: string = PRUSALINK_URL,
    apiKey: string = PRUSALINK_API_KEY
  ) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Helper to build the authentication headers for PrusaLink requests.
   */
  private getAuthHeaders(additional: Record<string, any> = {}): Record<string, any> {
    return { 'X-Api-Key': this.apiKey, ...additional };
  }

  /**
   * Uploads the given G-code to the printer and starts the job immediately.
   *
   * @param gcode - The complete G-code to send to the printer.
   */
  async uploadAndPrint(gcode: string): Promise<void> {
    const gcodeBuffer = Buffer.from(gcode, 'utf-8');
    const endpointUrl = `${this.baseUrl}/api/v1/files/usb/Vlad_Tests/final.gcode`;
    await axios.put(endpointUrl, gcodeBuffer, {
      headers: this.getAuthHeaders({
        'Content-Length': gcodeBuffer.length,
        'Content-Type': 'application/octet-stream',
        'Print-After-Upload': '?1',
        'Overwrite': '?1'
      })
    });
  }

  /**
   * Queries the current job information and returns its ID or `null` if idle.
   */
  async getCurrentJobId(): Promise<string | null> {
    const resp = await axios.get(`${this.baseUrl}/api/v1/job`, { headers: this.getAuthHeaders() });
    if (resp.status === 204) {
      return null;
    }
    if (resp.status === 200) {
      const job = resp.data as { id: number };
      return job.id.toString();
    }
    return null;
  }

  /**
   * Retrieves the overall printer status and maps it to a friendly string.
   */
  async getPrinterStatus(): Promise<PrinterStatus> {
    try {
      const resp = await axios.get(`${this.baseUrl}/api/v1/status`, { headers: this.getAuthHeaders() });
      const data: any = resp.data;
      const state: string | undefined = data?.printer?.state;

      const isPrinterHotEnough = data?.printer?.temp_bed >= 50;
      const isPrinterHotEnoughExtruder = data?.printer?.temp_nozzle >= 150;

      if (state === 'FINISHED' && isPrinterHotEnough && isPrinterHotEnoughExtruder) {
        return {
          status: 'ready-for-print',
          temp_bed: data?.printer?.temp_bed,
        };
      }
      const mapping: Record<string, string> = {
        IDLE: 'ready-for-print',
        PRINTING: 'printing',
        PAUSED: 'paused',
        FINISHED: 'finished',
        ERROR: 'error',
      };

      return {
        status:mapping[state ?? ''] ?? state?.toLowerCase() ?? 'unknown',
        temp_bed: data?.printer?.temp_bed,
      }
    } catch {
      return {
        status: 'printer-not-reachable',
        temp_bed: 0,
      }
    }
  }

  /**
   * Fetches detailed status information about a specific job.
   *
   * @param jobId - Identifier of the job to query.
   */
  async getPrintStatus(jobId: string): Promise<JobStatus> {
    const resp = await axios.get(`${this.baseUrl}/api/v1/job`, { headers: this.getAuthHeaders() });
    if (resp.status === 204) {
      return {
        id: parseInt(jobId, 10),
        state: 'FINISHED',
        progress: 100,
        timePrinting: 0,
        timeRemaining: 0,
      };
    }

    const job = resp.data as {
      id: number;
      state: 'PRINTING'| 'PAUSED'| 'FINISHED'| 'STOPPED'| 'ERROR';
      progress: number;
      time_printing: number;
      time_remaining: number;
      inaccurate_estimates?: boolean;
    };

    return {
      id: job.id,
      state: job.state,
      progress: job.progress,
      timePrinting: job.time_printing,
      timeRemaining: job.time_remaining,
      inaccurateEstimates: job.inaccurate_estimates,
    };
  }

  /**
   * Sends a pause request for the given job.
   */
  async pauseJob(jobId: string): Promise<void> {
    await axios.put(`${this.baseUrl}/api/v1/job/${jobId}/pause`, null, { headers: this.getAuthHeaders() });
  }

  /**
   * Resumes a previously paused job.
   */
  async resumeJob(jobId: string): Promise<void> {
    await axios.put(`${this.baseUrl}/api/v1/job/${jobId}/resume`, null, { headers: this.getAuthHeaders() });
  }

  /**
   * Cancels the specified job on the printer.
   */
  async cancelJob(jobId: string): Promise<void> {
    await axios.delete(`${this.baseUrl}/api/v1/job/${jobId}`, { headers: this.getAuthHeaders() });
  }
}
