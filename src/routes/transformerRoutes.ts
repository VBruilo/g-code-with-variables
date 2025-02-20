// src/routes/transformerRoutes.ts
import { Router, Request, Response } from 'express';
import { GCodeTransformer } from '../transformer/gcodeTransformer';

const router = Router();

router.get('/transform', async (req: Request, res: Response) => {
  try {
    const transformer = new GCodeTransformer();
    const finalGCode = await transformer.transformGCode();
    return res.json({ finalGCode });
  } catch (error: any) {
    console.error('[Transformer] Error: ', error.message);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
