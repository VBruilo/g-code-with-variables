const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3002;

// simple in-memory state for the mock server
let currentJob = null;
let printerState = 'IDLE';
let nextJobId = 1;

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
    currentJob = {
      id: nextJobId++,
      state: 'PRINTING',
      progress: 0,
      time_printing: 0,
      time_remaining: null
    };
    printerState = 'PRINTING';
    console.log('[MockPrusaLink] Starting print job id', currentJob.id, 'for file:', filename);
  }

  // Antwort zurücksenden
  return res.status(201).json({
    done: true,
    detail: 'File uploaded successfully (mock PrusaLink)',
    file: filename
  });
});

// GET /api/v1/job
app.get('/api/v1/job', (req, res) => {
  if (!currentJob) {
    return res.status(204).end();
  }
  const { id, state, progress, time_printing, time_remaining } = currentJob;
  return res.json({ id, state, progress, time_printing, time_remaining });
});

// GET /api/v1/status
app.get('/api/v1/status', (req, res) => {
  return res.json({ printer: { state: printerState } });
});

// PUT /api/v1/job/:jobId/pause
app.put('/api/v1/job/:jobId/pause', (req, res) => {
  if (currentJob && String(currentJob.id) === req.params.jobId) {
    currentJob.state = 'PAUSED';
    printerState = 'PAUSED';
    console.log('[MockPrusaLink] Job', currentJob.id, 'paused');
  }
  return res.status(204).end();
});

// PUT /api/v1/job/:jobId/resume
app.put('/api/v1/job/:jobId/resume', (req, res) => {
  if (currentJob && String(currentJob.id) === req.params.jobId) {
    currentJob.state = 'PRINTING';
    printerState = 'PRINTING';
    console.log('[MockPrusaLink] Job', currentJob.id, 'resumed');
  }
  return res.status(204).end();
});

// DELETE /api/v1/job/:jobId
app.delete('/api/v1/job/:jobId', (req, res) => {
  if (currentJob && String(currentJob.id) === req.params.jobId) {
    console.log('[MockPrusaLink] Job', currentJob.id, 'deleted');
    currentJob = null;
    printerState = 'FINISHED';
  }
  return res.status(204).end();
});

app.listen(port, () => {
  console.log(`[MockPrusaLink] Mock PrusaLink server listening on port ${port}`);
});
