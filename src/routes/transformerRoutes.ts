// src/routes/transformerRoutes.ts
/*import { Router, Request, Response } from 'express';
import { promises as fs } from 'fs';
import { GCodeTransformer } from '../transformer/gcodeTransformer';
import path from 'path';

const router = Router();

router.post('/transform', async (req: Request, res: Response) => {
  try {
    const { gcode } = req.body;
    if (!gcode) {
      return res.status(400).json({ error: 'G-Code content missing in request' });
    }
    const transformer = new GCodeTransformer();
    const finalGCode = await transformer.transformGCode(gcode);
    
    const outputFilePath = process.env.OUTPUT_GCODE_FILE_PATH || path.join(process.cwd(), 'parameterized_g-code', 'final.gcode');
    
    // Schreibe den finalen G-Code in die neue Datei
    await fs.writeFile(outputFilePath, finalGCode, 'utf-8');
    
    return res.json({ message: 'Final G-Code file created successfully', outputFilePath });
  } catch (error: any) {
    console.error('[Transformer] Error: ', error.message);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
*/
