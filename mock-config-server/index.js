const express = require('express');
const app = express();
const port = 3001;

app.get('/api/parameters', (req, res) => {
  res.json({
    PRINTING_HEAD: "0",
    FILAMENT_TYPE: "1", // 0: ASA, 1: PETG, 2: PLA, 3: ...
  });
});

app.listen(port, () => {
  console.log(`Mock Config Server listening on port ${port}`);
});


