import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;

app.get('/api/parameters', (req, res) => {
  const filePath = path.join(__dirname, 'parameters.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Fehler beim Lesen der Datei:', err);
      return res.status(500).json({ error: 'Fehler beim Laden der Parameter.' });
    }
    try {
      const parameters = JSON.parse(data);
      res.json(parameters);
    } catch (parseError) {
      console.error('Fehler beim Parsen der JSON-Daten:', parseError);
      res.status(500).json({ error: 'Fehler beim Parsen der Parameter.' });
    }
  });
});

app.listen(port, () => {
  console.log(`Mock Config Server hört auf Port ${port}`);
});

/*
HEADS:{
      HEAD_1: {
        PRINTING_HEAD: "1",
        COLOR: "RED",
        FILAMENT_TYPE: "PETG",
        TEMPERATURES: [175, 250, 80], //1: extruder, 2: extruder, 3: bed
      },
      HEAD_2: {
        PRINTING_HEAD: "2",
        COLOR: "BLUE",
        FILAMENT_TYPE: "PLA",
        TEMPERATURES: [170, 215, 60], //1: extruder, 2: extruder, 3: bed
      },
      HEAD_3: {
        PRINTING_HEAD: "3",
        COLOR: "BLACK",
        FILAMENT_TYPE: "PETG",
        TEMPERATURES: [175, 250, 80], //1: extruder, 2: extruder, 3: bed
      },
      HEAD_4: {
        PRINTING_HEAD: "4",
        COLOR: "WHITE",
        FILAMENT_TYPE: "PLA",
        TEMPERATURES: [170, 215, 60], //1: extruder, 2: extruder, 3: bed
      },
      HEAD_5: {
        PRINTING_HEAD: "5",
        COLOR: "ORANGE",
        FILAMENT_TYPE: "PETG",
        TEMPERATURES: [175, 250, 80], //1: extruder, 2: extruder, 3: bed
      }
}
*/
