// src/controller/printerController.ts
import { ConfigService } from '../services/configService';
import { GcodeService } from '../services/gcodeService';
import { PrusaLinkService } from '../services/prusaLinkService';
import { JobStatus } from '../types/jobStatus';

class PrinterController {
  private currentJobId?: string;

  constructor(
    private configService = new ConfigService(),
    private gcodeService = new GcodeService(),
    private prusaLink = new PrusaLinkService()
  ) {}

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

  public async startCalibration(): Promise<void> {
    const gcode = await this.gcodeService.loadCalibrationGcode();
    await this.prusaLink.uploadAndPrint(gcode);
    this.currentJobId = await this.prusaLink.getCurrentJobId() || undefined;
  }

  public async startShutdown(): Promise<void> {
    const gcode = await this.gcodeService.loadShutdownGcode();
    await this.prusaLink.uploadAndPrint(gcode);
    this.currentJobId = await this.prusaLink.getCurrentJobId() || undefined;
  }

  public async updatePrinterStatus(status: 'start-up' | 'shutting-down'): Promise<void> {
    if (status === 'start-up') {
      await this.startCalibration();
    } else if (status === 'shutting-down') {
      await this.startShutdown();
    } else {
      throw new Error(`Invalid status: ${status}`);
    }
  }

  public getPrinterStatus(): Promise<string> {
    return this.prusaLink.getPrinterStatus();
  }

  public getCurrentJobId(): Promise<string | null> {
    return this.prusaLink.getCurrentJobId();
  }

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

  public async pausePrint(coinJobId?: string): Promise<void> {
    const jobId = coinJobId ?? this.currentJobId;
    if (!jobId) {
      throw new Error('No job ID specified and no current job stored');
    }
    await this.prusaLink.pauseJob(jobId);
  }

  public async resumePrint(coinJobId?: string): Promise<void> {
    const jobId = coinJobId ?? this.currentJobId;
    if (!jobId) {
      throw new Error('No job ID specified and no current job stored');
    }
    await this.prusaLink.resumeJob(jobId);
  }

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
