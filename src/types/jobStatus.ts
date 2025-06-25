// src/types/jobStatus.ts
export interface JobStatus {
  /** job.id */
  id: number;
  state: 'printing'| 'paused'| 'finished'| 'stopped'| 'error';
  /** percent complete */
  progress: number;
  /** Sekunden */
  timePrinting: number;
  /** Sekunden */
  timeRemaining: number;
  inaccurateEstimates?: boolean;
}
