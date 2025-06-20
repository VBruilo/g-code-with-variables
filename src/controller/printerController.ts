// src/controller/printerController.ts
import { ConfigService } from '../services/configService';
import { GcodeService } from '../services/gcodeService';
import { PrusaLinkService } from '../services/prusaLinkService';
import { JobStatus } from '../types/jobStatus';

/**
 * Coordinates print related operations by delegating to the service layer.
 */
class PrinterController {
  private currentJobId?: string;

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
    const params = await this.configService.fetchParameters(machineConfigID, configSetID);
    const gcode = await this.gcodeService.createFinalGcode(params);
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
    } else if (status === 'shutting-down') {
      await this.startShutdown();
    } else {
      throw new Error(`Invalid status: ${status}`);
    }
  }

  /**
   * Retrieves the current status of the printer from PrusaLink.
   */
  public getPrinterStatus(): Promise<string> {
    return this.prusaLink.getPrinterStatus();
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
    if (status.state === 'FINISHED' || status.state === 'STOPPED') {
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
