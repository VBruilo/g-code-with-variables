// src/types/printerStatus.ts
export interface PrinterStatus {
  /** Printer State */
  status: String;
  /** Bed Temperature */
  temp_bed: number;
  /** Nozzle Temperature */
  temp_nozzle: number;
}
