import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface TranscriptionResult {
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

interface UseWebSocketProps {
  url?: string;
  onTranscription?: (result: TranscriptionResult) => void;
  onError?: (error: string) => void;
  autoConnect?: boolean;
  maxRetries?: number;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  isRecording: boolean;
  connect: () => void;
  disconnect: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  sendAudioChunk: (chunk: ArrayBuffer) => void;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error' | 'failed';
  retryCount: number;
  canRetry: boolean;
}

export const useWebSocket = ({
  url = 'http://localhost:3001',
  onTranscription,
  onError,
  autoConnect = true,
  maxRetries = 5
}: UseWebSocketProps = {}): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'error' | 'failed'>('disconnected');
  const [retryCount, setRetryCount] = useState(0);
  const [canRetry, setCanRetry] = useState(true);

  const socketRef = useRef<Socket | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const canRetryRef = useRef(true);
  const isConnectingRef = useRef(false); // Track if we're already trying to connect
  const isRecordingRef = useRef(false); // Track recording state with ref

  const scheduleRetry = useCallback(() => {
    // Increment retry count first
    retryCountRef.current += 1;
    setRetryCount(retryCountRef.current);

    if (retryCountRef.current > maxRetries) {
      setConnectionStatus('failed');
      setCanRetry(false);
      canRetryRef.current = false;
      onError?.('Falha na conexão após várias tentativas. Por favor, recarregue a página.');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 30000); // Exponential backoff, max 30s
    console.log(`Tentativa de reconexão ${retryCountRef.current}/${maxRetries} em ${delay}ms`);

    retryTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [maxRetries, onError]);

  const connect = useCallback(() => {
    // Prevent multiple connection attempts
    if (socketRef.current?.connected) {
      console.log('🔗 Already connected, skipping');
      return;
    }

    if (isConnectingRef.current) {
      console.log('🔗 Connection already in progress, skipping');
      return;
    }

    if (!canRetryRef.current) {
      console.log('❌ Cannot retry, max attempts reached');
      return;
    }

    console.log('🚀 Attempting to connect...', { retryCount: retryCountRef.current });
    isConnectingRef.current = true;
    setConnectionStatus('connecting');

    socketRef.current = io(url, {
      transports: ['websocket'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 5000,
      autoConnect: false,
      reconnection: false, // Disable Socket.IO's built-in reconnection
      forceNew: true
    });

    // Manually connect after setting up all event handlers
    socketRef.current.connect();

    socketRef.current.on('connect', () => {
      console.log('✅ Connected to WebSocket server', { socketId: socketRef.current?.id });
      isConnectingRef.current = false; // Reset connecting flag
      setIsConnected(true);
      setConnectionStatus('connected');
      retryCountRef.current = 0; // Reset retry count on successful connection
      setRetryCount(0);
      canRetryRef.current = true;
      setCanRetry(true);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('❌ Disconnected from WebSocket server:', { reason, socketId: socketRef.current?.id });
      isConnectingRef.current = false; // Reset connecting flag
      setIsConnected(false);
      setIsRecording(false);
      setConnectionStatus('disconnected');

      // Don't retry if it was a manual disconnect or client intentionally disconnected
      if (reason !== 'io client disconnect' && reason !== 'client namespace disconnect') {
        console.log('🔄 Scheduling retry due to:', reason);
        scheduleRetry();
      } else {
        console.log('⏹️ Manual disconnect, not retrying');
      }
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('🔥 WebSocket connection error:', { error: error.message, type: error.type });
      isConnectingRef.current = false; // Reset connecting flag
      setIsConnected(false);
      setConnectionStatus('error');

      // Schedule retry for connection errors
      scheduleRetry();
    });

    socketRef.current.on('connection-status', (status: 'connected' | 'disconnected' | 'error') => {
      setConnectionStatus(status);
    });

    socketRef.current.on('recording-started', () => {
      isRecordingRef.current = true;
      setIsRecording(true);
    });

    socketRef.current.on('recording-stopped', () => {
      isRecordingRef.current = false;
      setIsRecording(false);
    });

    socketRef.current.on('transcription-result', (result: TranscriptionResult) => {
      console.log('Received transcription:', result);
      onTranscription?.(result);
    });

    socketRef.current.on('transcription-error', (error: string) => {
      console.error('Transcription error:', error);
      onError?.(error);
    });

  }, [url, onTranscription, onError]);

  const disconnect = useCallback(() => {
    console.log('🛑 Disconnecting...');

    // Clear any pending retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // Reset connection state
    isConnectingRef.current = false;

    if (socketRef.current) {
      socketRef.current.removeAllListeners(); // Clean up event listeners
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setIsRecording(false);
      setConnectionStatus('disconnected');
    }
  }, []);

  const startRecording = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('Starting recording...');
      socketRef.current.emit('start-recording');
    } else {
      onError?.('Not connected to server');
    }
  }, [onError]);

  const stopRecording = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('Stopping recording...');
      socketRef.current.emit('stop-recording');
    }
  }, []);

  const sendAudioChunk = useCallback((chunk: ArrayBuffer) => {
    if (socketRef.current?.connected && isRecordingRef.current) {
      socketRef.current.send(chunk);
    }
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect]); // Remove connect and disconnect from dependencies to prevent infinite loops

  return {
    isConnected,
    isRecording,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    sendAudioChunk,
    connectionStatus,
    retryCount,
    canRetry,
  };
};