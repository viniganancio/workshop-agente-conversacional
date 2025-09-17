import { Request, Response } from 'express';
import { SocketService } from '@/services/SocketService.js';
import { serverConfig } from '@/utils/config.js';
import { logger } from '@/utils/logger.js';

let socketService: SocketService | null = null;

export const setSocketService = (service: SocketService) => {
  socketService = service;
};

export const healthCheck = async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();

    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
      connections: {
        total: socketService?.getConnectedClients() || 0,
        recording: socketService?.getActiveRecordings() || 0,
      },
      config: {
        port: serverConfig.port,
        corsOrigin: serverConfig.corsOrigin,
        deepgramModel: serverConfig.deepgramModel,
        deepgramLanguage: serverConfig.deepgramLanguage,
        audioSampleRate: serverConfig.audioSampleRate,
      },
    };

    // Test Deepgram connection
    let deepgramStatus = 'unknown';
    try {
      if (socketService) {
        const isConnected = await socketService.testDeepgramConnection();
        deepgramStatus = isConnected ? 'connected' : 'disconnected';
      }
    } catch (error) {
      deepgramStatus = 'error';
      logger.error('Deepgram health check failed', { error });
    }

    const responseTime = Date.now() - startTime;

    const response = {
      ...health,
      services: {
        deepgram: deepgramStatus,
        websocket: socketService ? 'running' : 'not_initialized',
      },
      responseTime: `${responseTime}ms`,
    };

    logger.debug('Health check completed', response);
    res.json(response);
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const readinessCheck = async (req: Request, res: Response) => {
  try {
    // Check if all required services are ready
    const checks = {
      deepgram: false,
      websocket: false,
    };

    // Check Deepgram connection
    try {
      if (socketService) {
        checks.deepgram = await socketService.testDeepgramConnection();
        checks.websocket = true;
      }
    } catch (error) {
      logger.error('Readiness check failed for Deepgram', { error });
    }

    const isReady = Object.values(checks).every(check => check === true);

    const response = {
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks,
    };

    const statusCode = isReady ? 200 : 503;
    logger.debug('Readiness check completed', { ...response, statusCode });

    res.status(statusCode).json(response);
  } catch (error) {
    logger.error('Readiness check failed', { error });
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};