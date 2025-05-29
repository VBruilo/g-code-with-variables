// src/types/jobStatus.ts
export interface JobStatus {
  id: number;                 // job.id
  state: 'PRINTING'| 'PAUSED'| 'FINISHED'| 'STOPPED'| 'ERROR';
  progress: number;           // percent complete
  timePrinting: number;       // Sekunden
  timeRemaining: number;      // Sekunden
  inaccurateEstimates?: boolean;
}
