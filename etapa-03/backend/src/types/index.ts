export interface TranscriptionResult {
  text: string;
  confidence: number;
  words?: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  isInterim: boolean;
  timestamp: number;
}

export interface AudioChunk {
  data: Buffer;
  timestamp: number;
  clientId: string;
}

export interface ClientSession {
  id: string;
  socket: any; // Socket.IO socket
  deepgramConnection?: any;
  isRecording: boolean;
  startTime?: number;
}

export interface ServerConfig {
  port: number;
  corsOrigin: string;
  deepgramApiKey: string;
  audioSampleRate: number;
  audioEncoding: string;
  deepgramModel: string;
  deepgramLanguage: string;
  smartFormat: boolean;
  interimResults: boolean;
  endpointing: number;
  utterances: boolean;
  awsRegion: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  bedrockModelId: string;
  elevenlabsApiKey: string;
  elevenlabsVoiceId: string;
  elevenlabsModel: string;
}

export interface SocketEvents {
  // Client to Server
  'start-recording': () => void;
  'stop-recording': () => void;
  'audio-chunk': (chunk: ArrayBuffer) => void;
  'disconnect': () => void;

  // Server to Client
  'recording-started': () => void;
  'recording-stopped': () => void;
  'transcription-result': (result: TranscriptionResult) => void;
  'transcription-error': (error: string) => void;
  'connection-status': (status: 'connected' | 'disconnected' | 'error') => void;
  'ai-response': (response: AIResponse) => void;
  'ai-error': (error: string) => void;
  'tts-audio': (audio: TTSResponse) => void;
  'tts-error': (error: string) => void;
}

export interface AIResponse {
  text: string;
  timestamp: number;
  confidence?: number;
}

export interface TTSResponse {
  audioData: string; // Base64 encoded audio
  text: string;
  timestamp: number;
  voiceId: string;
  format: string;
}

export interface DeepgramConfig {
  model: string;
  language: string;
  smart_format: boolean;
  interim_results: boolean;
  endpointing: number;
  sample_rate: number;
  encoding: string;
  utterances: boolean;
}