import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { TTSResponse } from '@/types/index.js';
import { serverConfig } from '@/utils/config.js';
import { logger } from '@/utils/logger.js';

export class ElevenLabsService {
  private client: ElevenLabsClient;

  constructor() {
    this.client = new ElevenLabsClient({
      apiKey: serverConfig.elevenlabsApiKey,
    });
  }

  async generateSpeech(text: string, sessionId?: string): Promise<TTSResponse> {
    try {
      logger.info(`🔊 Generating speech for text: "${text.substring(0, 100)}..."`, { sessionId });

      const response = await this.client.textToSpeech.convert(
        serverConfig.elevenlabsVoiceId,
        {
          text,
          modelId: serverConfig.elevenlabsModel,
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
          },
          outputFormat: 'mp3_44100_128',
        }
      );

      // Convert audio stream to buffer
      const chunks: Uint8Array[] = [];
      const reader = response.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      // Combine chunks into a single buffer
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const audioBuffer = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        audioBuffer.set(chunk, offset);
        offset += chunk.length;
      }

      // Convert to base64 for transmission
      const audioData = Buffer.from(audioBuffer).toString('base64');

      const ttsResponse: TTSResponse = {
        audioData,
        text,
        timestamp: Date.now(),
        voiceId: serverConfig.elevenlabsVoiceId,
        format: 'mp3',
      };

      logger.info(`✅ Speech generated successfully`, {
        sessionId,
        textLength: text.length,
        audioSize: audioBuffer.length,
        voiceId: serverConfig.elevenlabsVoiceId,
      });

      return ttsResponse;
    } catch (error) {
      logger.error('Failed to generate speech with ElevenLabs', {
        sessionId,
        error: error instanceof Error ? error.message : error,
        text: text.substring(0, 100),
      });
      throw new Error(`TTS generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      logger.info('Testing ElevenLabs connection...');

      // Try to get voices to test the connection
      const voices = await this.client.voices.getAll();

      logger.info('✅ ElevenLabs connection successful', {
        voicesCount: voices.voices?.length || 0,
      });

      return true;
    } catch (error) {
      logger.error('❌ ElevenLabs connection failed', {
        error: error instanceof Error ? error.message : error,
      });
      return false;
    }
  }

  async getAvailableVoices(): Promise<any[]> {
    try {
      const voices = await this.client.voices.getAll();
      logger.info(`Found ${voices.voices.length} available voices`);
      return voices.voices;
    } catch (error) {
      logger.error('Failed to fetch available voices', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }
}