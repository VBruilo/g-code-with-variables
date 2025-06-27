// src/controller/printerController.ts
import { ConfigService } from '../services/configService';
import { GcodeService } from '../services/gcodeService';
import { PrusaLinkService } from '../services/prusaLinkService';
import { JobStatus } from '../types/jobStatus';
import { PrinterStatus } from '../types/printerStatus';

/**
 * Coordinates print related operations by delegating to the service layer.
 */
class PrinterController {
  private currentJobId?: string;
  private overrideStatus?: 'start-up' | 'shutting-down';
  private overrideJobId?: string;
  private isActive = false;

  /**
   * Creates a new controller instance.
   *
   * @param configService - Service used for fetching machine parameters.
   * @param gcodeService - Service that generates the final G-code.
   * @param prusaLink - Service communicating with PrusaLink.
   */
  constructor(
    private configService = new ConfigService(),
    private gcodeService = new GcodeService(),
    private prusaLink = new PrusaLinkService()
  ) {}

  /**
   * Starts a parameterized print and stores the returned job ID.
   *
   * @param machineConfigID - Identifier of the machine configuration to use.
   * @param configSetID - Identifier of the configuration set to apply.
   * @returns The job ID assigned by PrusaLink.
   */
  public async startPrint(machineConfigID: string, configSetID: string): Promise<string> {
    let gcode: string | null;
    try {
      const params = await this.configService.fetchParameters(machineConfigID, configSetID);
      gcode = await this.gcodeService.createFinalGcode(params);
    } catch {
      gcode = await this.gcodeService.loadFinalGcode();
      if (!gcode) {
        gcode = await this.gcodeService.createFinalGcode({} as any);
      }
    }

    await this.prusaLink.uploadAndPrint(gcode);
    this.currentJobId = await this.prusaLink.getCurrentJobId() || undefined;
    if (!this.currentJobId) {
      throw new Error('Unable to determine job ID after starting print');
    }
    return this.currentJobId;
  }

  /**
   * Executes the calibration G-code sequence and updates the current job ID.
   */
  public async startCalibration(): Promise<void> {
    const gcode = await this.gcodeService.loadCalibrationGcode();
    await this.prusaLink.uploadAndPrint(gcode);
    this.currentJobId = await this.prusaLink.getCurrentJobId() || undefined;
  }

  /**
   * Executes the shutdown G-code sequence and updates the current job ID.
   */
  public async startShutdown(): Promise<void> {
    const gcode = await this.gcodeService.loadShutdownGcode();
    await this.prusaLink.uploadAndPrint(gcode);
    this.currentJobId = await this.prusaLink.getCurrentJobId() || undefined;
  }

  /**
   * Triggers calibration or shutdown based on the provided printer status.
   *
   * @param status - Either `'start-up'` or `'shutting-down'`.
   */
  public async updatePrinterStatus(status: 'start-up' | 'shutting-down'): Promise<void> {
    if (status === 'start-up') {
      await this.startCalibration();
      this.overrideStatus = 'start-up';
      this.overrideJobId = this.currentJobId;
      this.isActive = true;
    } else if (status === 'shutting-down') {
      await this.startShutdown();
      this.overrideStatus = 'shutting-down';
      this.overrideJobId = this.currentJobId;
      this.isActive = false;
    } else {
      throw new Error(`Invalid status: ${status}`);
    }
  }

  /**
   * Retrieves the current status of the printer from PrusaLink.
  */
  public async getPrinterStatus(): Promise<PrinterStatus> {
    const current = await this.prusaLink.getPrinterStatus();
    const temp_bed = current.temp_bed || 0;

    if (this.overrideStatus) {
      const jobId = await this.prusaLink.getCurrentJobId();

      if (jobId && this.overrideJobId && jobId === this.overrideJobId) {
        return { 
          status: this.overrideStatus, 
          temp_bed: temp_bed 
        };
      }

      if (this.overrideStatus === 'shutting-down' && temp_bed >= 35) {
        return { 
          status: 'shutting-down', 
          temp_bed: temp_bed 
        };
      }

      if (jobId !== this.overrideJobId) {
        this.overrideStatus = undefined;
        this.overrideJobId = undefined;
      }
    }

    if (!this.isActive) {
      return { 
        status: 'inactive', 
        temp_bed: temp_bed
      };
    }

    return current;
  }

  /**
   * Returns the ID of the active print job if one exists.
   */
  public getCurrentJobId(): Promise<string | null> {
    return this.prusaLink.getCurrentJobId();
  }

  /**
   * Retrieves status information for the specified or currently stored job ID.
   *
   * @param coinJobId - Optional explicit job ID to query.
   */
  public async getPrintStatus(coinJobId?: string): Promise<JobStatus> {
    const jobId = coinJobId ?? this.currentJobId;
    if (!jobId) {
      throw new Error('No job ID specified and no current job stored');
    }

    const status = await this.prusaLink.getPrintStatus(jobId);
    if (status.state === 'finished' || status.state === 'stopped') {
      this.currentJobId = undefined;
    }
    return status;
  }

  /**
   * Pauses the specified or current print job.
   *
   * @param coinJobId - Optional explicit job ID to pause.
   */
  public async pausePrint(coinJobId?: string): Promise<void> {
    const jobId = coinJobId ?? this.currentJobId;
    if (!jobId) {
      throw new Error('No job ID specified and no current job stored');
    }
    await this.prusaLink.pauseJob(jobId);
  }

  /**
   * Resumes a previously paused print job.
   *
   * @param coinJobId - Optional explicit job ID to resume.
   */
  public async resumePrint(coinJobId?: string): Promise<void> {
    const jobId = coinJobId ?? this.currentJobId;
    if (!jobId) {
      throw new Error('No job ID specified and no current job stored');
    }
    await this.prusaLink.resumeJob(jobId);
  }

  /**
   * Cancels the specified or current print job and clears the stored ID.
   *
   * @param coinJobId - Optional explicit job ID to cancel.
   */
  public async cancelPrint(coinJobId?: string): Promise<void> {
    const jobId = coinJobId ?? this.currentJobId;
    if (!jobId) {
      throw new Error('No job ID specified and no current job stored');
    }
    await this.prusaLink.cancelJob(jobId);
    this.currentJobId = undefined;
  }
}

export const printerController = new PrinterController();
export { PrinterController };
