import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import { DeepgramConfig, TranscriptionResult } from '@/types/index.js';
import { serverConfig } from '@/utils/config.js';
import { logger } from '@/utils/logger.js';

export class DeepgramService {
  private deepgram;
  private config: DeepgramConfig;

  constructor() {
    this.deepgram = createClient(serverConfig.deepgramApiKey);
    this.config = {
      model: serverConfig.deepgramModel,
      language: serverConfig.deepgramLanguage,
      smart_format: serverConfig.smartFormat,
      interim_results: serverConfig.interimResults,
      endpointing: serverConfig.endpointing,
      sample_rate: serverConfig.audioSampleRate,
      encoding: serverConfig.audioEncoding,
      utterances: serverConfig.utterances,
    };
  }

  createLiveConnection(
    socket: any,
    onTranscription: (result: TranscriptionResult) => void,
    onError: (error: string) => void
  ) {
    try {
      // Use configuration from environment variables
      const config = {
        model: this.config.model,
        language: this.config.language,
        smart_format: this.config.smart_format,
        interim_results: this.config.interim_results,
        encoding: this.config.encoding,
        sample_rate: this.config.sample_rate,
        utterances: this.config.utterances
      };

      const connection = this.deepgram.listen.live(config);

      connection.on(LiveTranscriptionEvents.Open, () => {
        logger.info('Deepgram connection ready');

        connection.on(LiveTranscriptionEvents.Transcript, (data) => {
          if (data.channel?.alternatives?.[0]) {
            const alternative = data.channel.alternatives[0];

            if (alternative.transcript && alternative.transcript.trim()) {
              const result: TranscriptionResult = {
                text: alternative.transcript,
                confidence: alternative.confidence || 0,
                words: alternative.words?.map((word: any) => ({
                  word: word.word,
                  start: word.start,
                  end: word.end,
                  confidence: word.confidence,
                })),
                isInterim: data.is_final === false,
                timestamp: Date.now(),
              };

              logger.info(`💬 ${data.is_final ? '[FINAL]' : '[INTERIM]'} "${result.text}"`);
              onTranscription(result);
            }
          }
        });

        connection.on(LiveTranscriptionEvents.Error, (error) => {
          logger.error('Deepgram error', { error });
          onError(`Deepgram error: ${error.message || 'Unknown error'}`);
        });

        socket.on("message", (audioData: any) => {
          try {
            if (connection.getReadyState && connection.getReadyState() === 1) {
              connection.send(audioData);
              if (Math.random() < 0.02) {
                logger.info(`🔊 PCM audio flowing: ${audioData.length || audioData.byteLength || 'unknown'} bytes`);
              }
            } else {
              logger.warn('🚫 Deepgram not ready, dropping audio');
            }
          } catch (error) {
            logger.error('Error sending audio to Deepgram', { error });
          }
        });
      });

      connection.on(LiveTranscriptionEvents.Close, (code: any, reason: any) => {
        logger.info('Deepgram connection closed');
      });

      connection.on(LiveTranscriptionEvents.Metadata, (data) => {
        // Silent - metadata not needed for transcription focus
      });

      connection.on(LiveTranscriptionEvents.Error, (error) => {
        logger.error('Deepgram error', { error });
        onError(`Deepgram error: ${error.message || 'Unknown error'}`);
      });

      return connection;
    } catch (error) {
      logger.error('Failed to create Deepgram connection', { error });
      onError(`Failed to create Deepgram connection: ${error}`);
      return null;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Test the connection by creating a simple request
      const projectsResponse = await this.deepgram.manage.getProjects();
      const projects = (projectsResponse as any).projects;

      if (projects && projects[0]) {
        await this.deepgram.manage.getProjectBalances(projects[0].project_id);
      }

      // Deepgram connection test successful
      return true;
    } catch (error) {
      logger.error('Deepgram connection test failed', { error });
      return false;
    }
  }
}