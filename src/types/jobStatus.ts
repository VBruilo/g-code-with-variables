// src/types/jobStatus.ts
export interface JobStatus {
  /** job.id */
  id: number;
  state: 'PRINTING'| 'PAUSED'| 'FINISHED'| 'STOPPED'| 'ERROR';
  /** percent complete */
  progress: number;
  /** Sekunden */
  timePrinting: number;
  /** Sekunden */
  timeRemaining: number;
  inaccurateEstimates?: boolean;
}
