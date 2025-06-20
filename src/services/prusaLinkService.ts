import axios from 'axios';
import { JobStatus } from '../types/jobStatus';
import { PRUSALINK_URL, PRUSALINK_API_KEY } from '../config';

export class PrusaLinkService {
  private baseUrl: string;
  private apiKey: string;

  constructor(
    baseUrl: string = PRUSALINK_URL,
    apiKey: string = PRUSALINK_API_KEY
  ) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private getAuthHeaders(additional: Record<string, any> = {}): Record<string, any> {
    return { 'X-Api-Key': this.apiKey, ...additional };
  }

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

  async getPrinterStatus(): Promise<string> {
    try {
      const resp = await axios.get(`${this.baseUrl}/api/v1/status`, { headers: this.getAuthHeaders() });
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
    } catch {
      return 'printer-not-reachable';
    }
  }

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

  async pauseJob(jobId: string): Promise<void> {
    await axios.put(`${this.baseUrl}/api/v1/job/${jobId}/pause`, null, { headers: this.getAuthHeaders() });
  }

  async resumeJob(jobId: string): Promise<void> {
    await axios.put(`${this.baseUrl}/api/v1/job/${jobId}/resume`, null, { headers: this.getAuthHeaders() });
  }

  async cancelJob(jobId: string): Promise<void> {
    await axios.delete(`${this.baseUrl}/api/v1/job/${jobId}`, { headers: this.getAuthHeaders() });
  }
}
