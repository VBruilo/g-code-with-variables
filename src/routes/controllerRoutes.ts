// src/routes/controllerRoutes.ts
import { Router } from 'express';
import { printerController } from '../controller/printerController';

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
 * @returns 200 - `{ message: string }` when the job is started.
 * @returns 500 - `{ error: string }` on failure.
 */
router.post('/prints/parameterized/coin', async (req, res) => {
  try {
    
    const { machineConfigID, configSetID } = req.body;

    await printerController.startPrint();

    return res.json({ message: 'Printing started successfully!' });
  } catch (err: any) {
    console.error(
      '[ControllerRoutes] Error while starting print:', 
      err.message
    );
    return res
      .status(500)
      .json({ error: err.message });
    }
  }
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
router.get('/prints/parameterized/coin/getJobId', async (req, res) => {
  try {

    const jobId = await printerController.getCurrentJobId();
    if (!jobId) {
      return res
        .status(404)
        .json({ error: 'No active print job found' });
    }
    return res.json({ jobId });
  } catch (err: any) {
    console.error(
      '[ControllerRoutes] Error while getting current job ID:',
      err.message
    );
    return res
      .status(500)
      .json({ error: 'Internal server error while getting current job ID' });
    }
  }
);


/**
 * GET `/prints/parameterized/coin/:coinJobId/status`
 *
 * Returns the status of a running print job.
 *
 * @param req.params.coinJobId - ID of the coin job whose status is requested.
 *
 * @returns 200 - `JobStatus` object describing the current progress.
 * @returns 400 - `{ error: string }` when the `coinJobId` parameter is missing.
 * @returns 500 - `{ error: string }` on internal errors.
 */
router.get('/prints/parameterized/coin/:coinJobId/status', async (req, res) => {
    // 1) Pfad-Parameter auslesen
    const { coinJobId } = req.params;

     if (!coinJobId) {
      return res
        .status(400)
        .json({ error: 'Missing required path parameter: coinJobId' });
    }

    try {
      // 2) Controller-Methode aufrufen
      const status = await printerController.getPrintStatus(coinJobId);

      // 3) Status-Objekt direkt zurückgeben
      return res.json(status);
    } catch (err: any) {
      console.error(
        '[ControllerRoutes] Error while getting print status:',
        err.message
      );
      return res.status(500).json({ error: err.message });
    }
  }
);


/**
 * PUT `/prints/parameterized/coin/:coinJobId/pause`
 *
 * Pauses the running print job.
 *
 * @param req.params.coinJobId - ID of the job to pause.
 *
 * @returns 204 - When the job was paused successfully.
 * @returns 400 - `{ error: string }` when `coinJobId` is missing.
 * @returns 500 - `{ error: string }` on internal errors.
 */
router.put('/prints/parameterized/coin/:coinJobId/pause', async (req, res) => {
    const { coinJobId } = req.params;

    if (!coinJobId) {
      return res
        .status(400)
        .json({ error: 'Missing required path parameter: coinJobId' });
    }

    try {
      await printerController.pausePrint(coinJobId);
      // Spec: 204 No Content
      return res.sendStatus(204);
    } catch (err: any) {
      console.error(
        '[ControllerRoutes] Unexpected error while pausing print:',
        err
      );
      return res
        .status(500)
        .json({ error: 'Internal server error while pausing print' });
    }
  }
);

/**
 * PUT `/prints/parameterized/coin/:coinJobId/resume`
 *
 * Resumes a paused print job.
 *
 * @param req.params.coinJobId - ID of the job to resume.
 *
 * @returns 204 - When the job was resumed successfully.
 * @returns 400 - `{ error: string }` when `coinJobId` is missing.
 * @returns 500 - `{ error: string }` on internal errors.
 */
router.put('/prints/parameterized/coin/:coinJobId/resume', async (req, res) => {
    const { coinJobId } = req.params;
    
    if (!coinJobId) {
          return res
            .status(400)
            .json({ error: 'Missing required path parameter: coinJobId' });
        }  
    try {
          await printerController.resumePrint(coinJobId);
          return res
            .sendStatus(204);
        } catch (err: any) {

      console.error(
        '[ControllerRoutes] Error while resuming print:', 
        err.message
      );
      return res
        .status(500)
        .json({ error: err.message });
    }
  }
);

/**
 * DELETE `/prints/parameterized/coin/:coinJobId/cancel`
 *
 * Cancels a running print job.
 *
 * @param req.params.coinJobId - ID of the job to cancel.
 *
 * @returns 204 - When the job was cancelled successfully.
 * @returns 400 - `{ error: string }` when `coinJobId` is missing.
 * @returns 500 - `{ error: string }` on internal errors.
 */
router.delete('/prints/parameterized/coin/:coinJobId/cancel', async (req, res) => {
  const { coinJobId } = req.params;

  if (!coinJobId) {
    return res
      .status(400)
      .json({ error: 'Missing required path parameter: coinJobId' });
  }

  try {
    await printerController.cancelPrint(coinJobId);
    return res.sendStatus(204)
  } catch (err: any) {
    console.error(
      '[ControllerRoutes] Error while cancelling print:',
      err.message
    );
    return res
      .status(500)
      .json({ error: err.message });
    }
  }
);

/**
 * POST `/prints/calibration`
 *
 * Starts a calibration print using the predefined calibration file.
 *
 * @returns 200 - `{ message: string }` when the job is started.
 * @returns 500 - `{ error: string }` on failure.
 */
router.post('/prints/calibration', async (req, res) => {
  try {
    await printerController.startCalibration();
    return res.json({ message: 'Calibration started successfully!' });
  } catch (err: any) {
    console.error(
      '[ControllerRoutes] Error while starting calibration:',
      err.message
    );
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST `/prints/shutdown`
 *
 * Starts the shutdown procedure by printing the predefined G-code file.
 *
 * @returns 200 - `{ message: string }` when the job is started.
 * @returns 500 - `{ error: string }` on failure.
 */
router.post('/prints/shutdown', async (req, res) => {
  try {
    await printerController.startShutdown();
    return res.json({ message: 'Shutdown started successfully!' });
  } catch (err: any) {
    console.error(
      '[ControllerRoutes] Error while starting shutdown:',
      err.message
    );
    return res.status(500).json({ error: err.message });
  }
});

export default router;
