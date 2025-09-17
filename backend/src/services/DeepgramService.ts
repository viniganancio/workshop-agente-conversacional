import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import { DeepgramConfig, TranscriptionResult } from '@/types/index.js';
import { serverConfig } from '@/utils/config.js';
import { logger } from '@/utils/logger.js';

export class DeepgramService {
  private deepgram;
  private config: DeepgramConfig;

  constructor() {
    logger.info('🔑 Deepgram API Key status', {
      hasKey: !!serverConfig.deepgramApiKey,
      keyLength: serverConfig.deepgramApiKey?.length || 0,
      keyPrefix: serverConfig.deepgramApiKey?.substring(0, 8) + '...'
    });

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

    logger.info('🚀 DeepgramService initialized', {
      model: serverConfig.deepgramModel,
      language: serverConfig.deepgramLanguage,
      encoding: serverConfig.audioEncoding,
      sampleRate: serverConfig.audioSampleRate
    });
  }

  createLiveConnection(
    socket: any,
    onTranscription: (result: TranscriptionResult) => void,
    onError: (error: string) => void
  ) {
    try {
      // Use the same configuration as the working example
      const config = {
        model: 'nova-2',
        language: 'pt-BR',
        smart_format: true,
        interim_results: true,
        encoding: 'linear16',
        sample_rate: 16000
      };

      const connection = this.deepgram.listen.live(config);

      // Follow the working example exactly
      connection.on(LiveTranscriptionEvents.Open, () => {
        logger.info('✅ Deepgram connection opened successfully');

        connection.on(LiveTranscriptionEvents.Transcript, (data) => {
          logger.info('📝 Received transcript data', {
            text: data.channel?.alternatives?.[0]?.transcript,
            isFinal: data.is_final
          });

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

              logger.info('✨ Sending transcription result to client', { text: result.text });
              onTranscription(result);
            }
          }
        });

        connection.on(LiveTranscriptionEvents.Error, (error) => {
          logger.error('❌ Deepgram error inside Open', { error });
          onError(`Deepgram error: ${error.message || 'Unknown error'}`);
        });

        // Receive audio data from client and send it to the live transcription connection
        // This is the key part from your working example!
        socket.on("message", (audioData: any) => {
          logger.info('🎵 Received audio data from socket message', {
            dataSize: audioData.length || audioData.byteLength || 'unknown',
            connectionState: connection.getReadyState ? connection.getReadyState() : 'unknown'
          });

          try {
            if (connection.getReadyState && connection.getReadyState() === 1) {
              connection.send(audioData);
              logger.debug('📤 Audio sent to Deepgram successfully');
            } else {
              logger.warn('⚠️ Deepgram connection not ready for audio data');
            }
          } catch (error) {
            logger.error('💥 Error sending audio to Deepgram', { error });
          }
        });
      });

      connection.on(LiveTranscriptionEvents.Close, (code: any, reason: any) => {
        logger.warn('🔴 Deepgram connection closed', { code, reason });
      });

      connection.on(LiveTranscriptionEvents.Metadata, (data) => {
        logger.info('📊 Deepgram metadata', { data });
      });

      connection.on(LiveTranscriptionEvents.Error, (error) => {
        logger.error('💀 Deepgram error outside Open', { error });
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