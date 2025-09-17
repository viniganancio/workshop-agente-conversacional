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
    };

    // DeepgramService initialized silently
  }

  createLiveConnection(
    onTranscription: (result: TranscriptionResult) => void,
    onError: (error: string) => void
  ) {
    try {
      const connection = this.deepgram.listen.live(this.config);

      connection.on(LiveTranscriptionEvents.Open, () => {
        logger.debug('Deepgram connection opened');
      });

      connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        logger.debug('Received transcript data', { data });

        if (data.channel?.alternatives?.[0]) {
          const alternative = data.channel.alternatives[0];

          if (alternative.transcript && alternative.transcript.trim()) {
            const result: TranscriptionResult = {
              text: alternative.transcript,
              confidence: alternative.confidence || 0,
              words: alternative.words?.map(word => ({
                word: word.word,
                start: word.start,
                end: word.end,
                confidence: word.confidence,
              })),
              isInterim: data.is_final === false,
              timestamp: Date.now(),
            };

            logger.debug('Processed transcription result', { result });
            onTranscription(result);
          }
        }
      });

      connection.on(LiveTranscriptionEvents.Error, (error) => {
        logger.error('Deepgram error', { error });
        onError(`Deepgram error: ${error.message || 'Unknown error'}`);
      });

      connection.on(LiveTranscriptionEvents.Close, () => {
        logger.debug('Deepgram connection closed');
      });

      connection.on(LiveTranscriptionEvents.Metadata, (data) => {
        logger.debug('Deepgram metadata', { data });
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
      const response = await this.deepgram.manage.getProjectBalances(
        await this.deepgram.manage.getProjects().then(projects =>
          projects.projects?.[0]?.project_id || ''
        )
      );

      // Deepgram connection test successful
      return true;
    } catch (error) {
      logger.error('Deepgram connection test failed', { error });
      return false;
    }
  }
}