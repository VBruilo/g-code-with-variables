const express = require('express');
const app = express();
const port = 3001;

app.get('/api/parameters', (req, res) => {
  res.json({
    Z_HEIGHT: "120",
    SPEED: "300",
    TEMPERATURE: "200"
  });
});

app.listen(port, () => {
  console.log(`Mock Config Server listening on port ${port}`);
});
