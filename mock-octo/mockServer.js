const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3002;

// Express-Middleware, um den rohen Body als Buffer zu parsen (für application/octet-stream)
app.use(express.raw({ type: 'application/octet-stream', limit: '50mb' }));

// Mock Endpoint für PrusaLink API
// PUT /api/v1/files/local/:filename
app.put('/api/v1/files/local/:filename', (req, res) => {
  const filename = req.params.filename;
  console.log('[MockPrusaLink] Received file upload for:', filename);

  // Header auslesen
  const contentLength = req.header('Content-Length');
  const printAfterUpload = req.header('Print-After-Upload');
  const overwrite = req.header('Overwrite');

  console.log('[MockPrusaLink] Content-Length:', contentLength);
  console.log('[MockPrusaLink] Print-After-Upload:', printAfterUpload);
  console.log('[MockPrusaLink] Overwrite:', overwrite);

  // Zielverzeichnis definieren
  const uploadDir = path.join(__dirname, 'mock_uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const filePath = path.join(uploadDir, filename);

  // Falls die Datei existiert und Overwrite nicht erlaubt ist, Fehler zurückgeben
  if (fs.existsSync(filePath) && overwrite !== '?1') {
    return res.status(409).json({ 
      error: 'File already exists and overwrite not allowed'
    });
  }

  // Datei speichern (der Body liegt als Buffer vor)
  fs.writeFileSync(filePath, req.body);
  console.log('[MockPrusaLink] File saved:', filePath);

  // Optional: Simuliere den Druckstart, falls Print-After-Upload gesetzt ist
  if (printAfterUpload === '?1') {
    console.log('[MockPrusaLink] Starting print job for file:', filename);
    // Hier könnte weitere Logik zum Starten des Druckauftrags stehen
  }

  // Antwort zurücksenden
  return res.status(201).json({ 
    done: true, 
    detail: 'File uploaded successfully (mock PrusaLink)', 
    file: filename 
  });
});

app.listen(port, () => {
  console.log(`[MockPrusaLink] Mock PrusaLink server listening on port ${port}`);
});
