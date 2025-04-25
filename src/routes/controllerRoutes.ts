// src/routes/controllerRoutes.ts
import { Router } from 'express';
import { printerController } from '../controller/printerController';

const router = Router();

router.post('/print', async (req, res) => {
  try {
    
    const { numberOfModels, configSetID } = req.body;
    //await printerController.startPrint(numberOfModels, configSetID);
    //Welches Programm (Coin, Würfel, etc.) soll ausgeführt werden?

    await printerController.startPrint();

    // Wenn alles geklappt hat:
    return res.json({ message: 'Printing started successfully!' });
  } catch (err: any) {
    console.error('[ControllerRoutes] Error while starting print:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
