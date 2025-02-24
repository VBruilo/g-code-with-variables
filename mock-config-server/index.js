const express = require('express');
const app = express();
const port = 3001;

app.get('/api/parameters', (req, res) => {
  res.json({
    FIRST_PRINTING_HEAD: "0",
    SECOND_PRINTING_HEAD: "1",
  });
});

app.listen(port, () => {
  console.log(`Mock Config Server listening on port ${port}`);
});




