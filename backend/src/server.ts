import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import compression from 'compression';

import { serverConfig, isDevelopment } from '@/utils/config.js';
import { logger } from '@/utils/logger.js';
import { SocketService } from '@/services/SocketService.js';
import { healthCheck, readinessCheck, setSocketService } from '@/controllers/healthController.js';
import {
  rateLimiter,
  securityHeaders,
  requestLogger,
  errorHandler,
  notFoundHandler
} from '@/middleware/security.js';

// Create Express app
const app = express();

// Create HTTP server
const httpServer = createServer(app);

// Security middleware
app.use(securityHeaders);
app.use(rateLimiter);

// CORS configuration
app.use(cors({
  origin: serverConfig.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Compression and parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Initialize Socket.IO service
const socketService = new SocketService(httpServer);
setSocketService(socketService);

// Health check routes
app.get('/health', healthCheck);
app.get('/ready', readinessCheck);

// API status route
app.get('/api/status', (req, res) => {
  res.json({
    service: 'Conversational Agent Backend',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      readiness: '/ready',
      websocket: '/socket.io/',
    },
    config: {
      environment: isDevelopment ? 'development' : 'production',
      corsOrigin: serverConfig.corsOrigin,
      deepgramLanguage: serverConfig.deepgramLanguage,
      audioSampleRate: serverConfig.audioSampleRate,
    }
  });
});

// Catch-all for undefined routes
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
  process.exit(1);
});

// Start server
const startServer = async () => {
  try {
    // Test Deepgram connection before starting
    const deepgramConnected = await socketService.testDeepgramConnection();
    if (!deepgramConnected) {
      logger.warn('Deepgram connection test failed - server will start but transcription may not work');
    }

    httpServer.listen(serverConfig.port, () => {
      logger.info(`🚀 Server running on port ${serverConfig.port} | WebSocket: ws://localhost:${serverConfig.port}/socket.io/`, {
        deepgramStatus: deepgramConnected ? 'ready' : 'failed'
      });
    });

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Start the server
startServer();