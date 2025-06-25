// src/routes/controllerRoutes.ts
import { Router } from 'express';
import { printerController } from '../controller/printerController';
import { asyncHandler } from '../middleware/asyncHandler';

/**
 * Express router providing endpoints for controlling the printer.
 *
 * These routes are mounted under the `/api` prefix in {@link ../server.ts | server.ts}.
 */
const router = Router();

/**
 * POST `/prints/parameterized/coin`
 *
 * Starts a print job for a parameterised coin.
 *
 * @param req.body.machineConfigID - Identifier of the machine configuration.
 * @param req.body.configSetID - Identifier of the configuration set.
 *
 * @returns 201 - `{ jobId: string }` when the job is started.
* @returns 500 - `{ error: string }` on failure.
*/
router.post(
  '/prints/parameterized/coin',
  asyncHandler(async (req, res) => {
    const { machineConfigID, configSetID } = req.body;
    if (!machineConfigID || !configSetID) {
      res
        .status(400)
        .json({ error: 'machineConfigID and configSetID are required' });
      return;
    }

    const jobId = await printerController.startPrint(machineConfigID, configSetID);

    res.status(201).location(jobId).json({ jobId });
  })
);


/**
 * GET `/prints/parameterized/coin/getJobId`
 *
 * Retrieves the ID of the currently running print job.
 *
 * @returns 200 - `{ jobId: string }` when a job is active.
 * @returns 404 - `{ error: string }` when no job is running.
 * @returns 500 - `{ error: string }` on internal errors.
 */
router.get(
  '/prints/parameterized/coin/getJobId',
  asyncHandler(async (req, res) => {
    const jobId = await printerController.getCurrentJobId();
    if (!jobId) {
      res.status(404).json({ error: 'No active print job found' });
      return;
    }
    res.json({ jobId });
  })
);


/**
 * GET `/prints/parameterized/coin/:coinJobId/status`
 *
 * Returns the status of a running print job.
 *
 * @returns 200 - `JobStatus` object describing the current progress.
 * @returns 500 - `{ error: string }` on internal errors.
 */
router.get(
  '/prints/parameterized/coin/:coinJobId/status',
  asyncHandler(async (req, res) => {
    const { coinJobId } = req.params;

    const status = await printerController.getPrintStatus(coinJobId);

    res.json(status);
  })
);


/**
 * PUT `/prints/parameterized/coin/:coinJobId/pause`
 *
 * Pauses the running print job.
 *
 * @returns 204 - When the job was paused successfully.
 * @returns 500 - `{ error: string }` on internal errors.
 */
router.put(
  '/prints/parameterized/coin/:coinJobId/pause',
  asyncHandler(async (req, res) => {
    const { coinJobId } = req.params;
    await printerController.pausePrint(coinJobId);
    res.sendStatus(204);
  })
);

/**
 * PUT `/prints/parameterized/coin/:coinJobId/resume`
 *
 * Resumes a paused print job.
 *
 * @returns 204 - When the job was resumed successfully.
 * @returns 500 - `{ error: string }` on internal errors.
 */
router.put(
  '/prints/parameterized/coin/:coinJobId/resume',
  asyncHandler(async (req, res) => {
    const { coinJobId } = req.params;
    await printerController.resumePrint(coinJobId);
    res.sendStatus(204);
  })
);

/**
 * DELETE `/prints/parameterized/coin/:coinJobId/cancel`
 *
 * Cancels a running print job.
 *
 * @returns 204 - When the job was cancelled successfully.
 * @returns 500 - `{ error: string }` on internal errors.
 */
router.delete(
  '/prints/parameterized/coin/:coinJobId/cancel',
  asyncHandler(async (req, res) => {
    const { coinJobId } = req.params;
    await printerController.cancelPrint(coinJobId);
    res.sendStatus(204);
  })
);

/**
 * PUT `/printer/status`
 *
 * Starts the warm up or initiates the shutdown procedure depending on the
 * provided printer status.
 *
 * @returns 202 - Accepted when the operation was triggered successfully.
 * @returns 400 - `{ error: string }` on validation errors.
 * @returns 500 - `{ error: string }` on failure.
 */
router.put(
  '/printer/status',
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (status !== 'start-up' && status !== 'shutting-down') {
      res.status(400).json({
        error: "Status must be either 'start-up' or 'shutting-down'",
      });
      return;
    }

    await printerController.updatePrinterStatus(status);

    res.sendStatus(202);
  })
);

/**
 * GET `/printer/status`
 *
 * Returns the current printer status fetched from PrusaLink.
 *
 * @returns 200 - `{ status: string }` with the mapped status.
 * @returns 500 - `{ error: string }` on failure.
 */
router.get(
  '/printer/status',
  asyncHandler(async (req, res) => {
    const status = await printerController.getPrinterStatus();
    res.json(status);
  })
);
export default router;
