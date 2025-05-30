// src/routes/controllerRoutes.ts
import { json, Router } from 'express';
import { printerController } from '../controller/printerController';
import axios from 'axios';

const router = Router();

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


router.get('prints/parameterized/coin/getJobId', async (req, res) => {
  try {

    const jobId = printerController.getCurrentJobId();
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

router.delete('/prints/parameterized/coin/:coinJobId/cancel', async (req, res) => {
  const { coinJobId } = req.params;

  if (!coinJobId) {
    return res
      .status(400)
      .json({ error: 'Missing required path parameter: coinJobId' });
  }

  try {
    await printerController.cancelPrint(coinJobId);
    return res
      .status(204)
      .json({ message: 'Print cancelled successfully!' });
          
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

export default router;
