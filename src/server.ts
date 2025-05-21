// src/server.ts
import express, { Request, Response } from 'express';
import controllerRoutes from './routes/controllerRoutes';


const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routen
app.use('/api', controllerRoutes);

// Health-Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.listen(port, () => {
  console.timeEnd('startup');
  console.log(`Server is running on http://localhost:${port}`);
});

 