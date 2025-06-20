import dotenv from 'dotenv';

dotenv.config();

export const CONFIG_SERVER_URL =
  process.env.CONFIG_SERVER_URL || 'http://research.snet.tu-berlin.de:3000';
export const PRUSALINK_URL =
  process.env.PRUSALINK_URL || 'http://192.168.12.20';
export const PRUSALINK_API_KEY =
  process.env.PRUSALINK_API_KEY || 'GGLfRCFkCEFXrEN';
