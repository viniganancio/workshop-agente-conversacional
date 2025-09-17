import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { ClientSession, SocketEvents, TranscriptionResult, AIResponse } from '@/types/index.js';
import { DeepgramService } from './DeepgramService.js';
import { BedrockService } from './BedrockService.js';
import { serverConfig } from '@/utils/config.js';
import { logger } from '@/utils/logger.js';

export class SocketService {
  private io: SocketIOServer;
  private deepgramService: DeepgramService;
  private bedrockService: BedrockService;
  private sessions = new Map<string, ClientSession>();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: serverConfig.corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.deepgramService = new DeepgramService();
    this.bedrockService = new BedrockService();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      logger.info('Client connected', { socketId: socket.id });

      // Initialize client session
      const session: ClientSession = {
        id: socket.id,
        socket,
        isRecording: false,
      };
      this.sessions.set(socket.id, session);

      // Send connection status
      socket.emit('connection-status', 'connected');

      // Handle start recording
      socket.on('start-recording', () => {
        this.handleStartRecording(session);
      });

      // Handle stop recording
      socket.on('stop-recording', () => {
        this.handleStopRecording(session);
      });

      // Note: audio message handling is now done in DeepgramService following the working example

      // Handle disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(session);
      });

      // Handle connection errors
      socket.on('error', (error) => {
        logger.error('Socket error', { socketId: socket.id, error });
      });
    });
  }

  private handleStartRecording(session: ClientSession): void {
    if (session.isRecording) {
      logger.warn('Recording already in progress', { sessionId: session.id });
      return;
    }

    logger.info('Starting recording', { sessionId: session.id });

    try {
      // Create Deepgram connection and pass the socket
      session.deepgramConnection = this.deepgramService.createLiveConnection(
        session.socket,
        async (result: TranscriptionResult) => {
          session.socket.emit('transcription-result', result);

          // Generate AI response for final transcriptions only
          if (!result.isInterim && result.text.trim()) {
            try {
              logger.info(`🤖 Generating AI response for: "${result.text}"`);
              const aiResponse = await this.bedrockService.generateResponse(result.text, session.id);
              session.socket.emit('ai-response', aiResponse);
            } catch (error) {
              logger.error('AI response generation failed', { sessionId: session.id, error });
              session.socket.emit('ai-error', `Failed to generate AI response: ${error}`);
            }
          }
        },
        (error: string) => {
          logger.error('Transcription error', { sessionId: session.id, error });
          session.socket.emit('transcription-error', error);
        }
      );

      if (session.deepgramConnection) {
        session.isRecording = true;
        session.startTime = Date.now();
        session.socket.emit('recording-started');
        logger.info('Recording started successfully', { sessionId: session.id });
      } else {
        throw new Error('Failed to create Deepgram connection');
      }
    } catch (error) {
      logger.error('Failed to start recording', { sessionId: session.id, error });
      session.socket.emit('transcription-error', 'Failed to start recording');
    }
  }

  private handleStopRecording(session: ClientSession): void {
    if (!session.isRecording) {
      logger.warn('No recording in progress', { sessionId: session.id });
      return;
    }

    logger.info('Stopping recording', { sessionId: session.id });

    try {
      // Close Deepgram connection
      if (session.deepgramConnection) {
        session.deepgramConnection.finish();
        session.deepgramConnection = undefined;
      }

      session.isRecording = false;
      const duration = session.startTime ? Date.now() - session.startTime : 0;
      session.startTime = undefined;

      session.socket.emit('recording-stopped');
      logger.info('Recording stopped successfully', {
        sessionId: session.id,
        duration: `${duration}ms`
      });
    } catch (error) {
      logger.error('Failed to stop recording', { sessionId: session.id, error });
      session.socket.emit('transcription-error', 'Failed to stop recording');
    }
  }

  private handleAudioChunk(session: ClientSession, chunk: ArrayBuffer): void {
    if (!session.isRecording || !session.deepgramConnection) {
      logger.warn('Received audio chunk but not recording', { sessionId: session.id });
      return;
    }

    try {
      // Convert ArrayBuffer to Buffer
      const buffer = Buffer.from(chunk);

      // For now, send the raw buffer - browser MediaRecorder should be configured
      // to output compatible format, or we'd need audio processing library
      session.deepgramConnection.send(buffer);

      logger.debug('Audio chunk sent to Deepgram', {
        sessionId: session.id,
        chunkSize: buffer.length
      });
    } catch (error) {
      logger.error('Failed to process audio chunk', { sessionId: session.id, error });
      session.socket.emit('transcription-error', 'Failed to process audio chunk');
    }
  }

  private handleDisconnect(session: ClientSession): void {
    logger.info('Client disconnected', { sessionId: session.id });

    // Clean up recording if in progress
    if (session.isRecording) {
      this.handleStopRecording(session);
    }

    // Remove session
    this.sessions.delete(session.id);

    logger.debug('Session cleaned up', { sessionId: session.id });
  }

  public getConnectedClients(): number {
    return this.sessions.size;
  }

  public getActiveRecordings(): number {
    return Array.from(this.sessions.values()).filter(session => session.isRecording).length;
  }

  public async testDeepgramConnection(): Promise<boolean> {
    return await this.deepgramService.testConnection();
  }

  public async testBedrockConnection(): Promise<boolean> {
    return await this.bedrockService.testConnection();
  }
}