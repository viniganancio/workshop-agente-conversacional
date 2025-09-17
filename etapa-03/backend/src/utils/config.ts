import { config } from 'dotenv';
import { ServerConfig } from '@/types/index.js';

// Load environment variables
config();

const requiredEnvVars = [
  'DEEPGRAM_API_KEY',
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'BEDROCK_MODEL_ID',
  'ELEVENLABS_API_KEY'
];

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
  awsRegion: process.env.AWS_REGION!,
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  bedrockModelId: process.env.BEDROCK_MODEL_ID!,
  elevenlabsApiKey: process.env.ELEVENLABS_API_KEY!,
  elevenlabsVoiceId: process.env.ELEVENLABS_VOICE_ID || 'Rachel',
  elevenlabsModel: process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2',
};

export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';