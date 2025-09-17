import { config } from 'dotenv';
import { ServerConfig } from '@/types/index.js';

// Load environment variables
config();

const requiredEnvVars = ['DEEPGRAM_API_KEY'];

// Validate required environment variables
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const serverConfig: ServerConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  deepgramApiKey: process.env.DEEPGRAM_API_KEY!,
  audioSampleRate: parseInt(process.env.AUDIO_SAMPLE_RATE || '16000', 10),
  audioEncoding: process.env.AUDIO_ENCODING || 'linear16',
  deepgramModel: process.env.DEEPGRAM_MODEL || 'nova-2',
  deepgramLanguage: process.env.DEEPGRAM_LANGUAGE || 'pt-BR',
  smartFormat: process.env.DEEPGRAM_SMART_FORMAT === 'true',
  interimResults: process.env.DEEPGRAM_INTERIM_RESULTS === 'true',
  endpointing: parseInt(process.env.DEEPGRAM_ENDPOINTING || '300', 10),
  utterances: process.env.DEEPGRAM_UTTERANCES === 'true',
};

export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';