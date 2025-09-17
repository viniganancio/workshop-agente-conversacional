import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Square, Loader2, Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useToast } from '@/hooks/use-toast';

type RecordingState = 'idle' | 'recording' | 'processing' | 'error';

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

interface AudioRecorderProps {
  onTranscription?: (result: TranscriptionResult) => void;
  globalConnectionStatus?: boolean;
}

export default function AudioRecorder({ onTranscription, globalConnectionStatus }: AudioRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

  const { toast } = useToast();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();
  const intervalRef = useRef<NodeJS.Timeout>();

  // WebSocket connection
  const {
    isConnected,
    isRecording: serverIsRecording,
    startRecording: startServerRecording,
    stopRecording: stopServerRecording,
    sendAudioChunk,
    connectionStatus,
    retryCount,
    canRetry
  } = useWebSocket({
    onTranscription: (result: TranscriptionResult) => {
      onTranscription?.(result);
    },
    onError: (error: string) => {
      console.error('WebSocket error:', error);
      toast({
        title: "Erro de conexão",
        description: error,
        variant: "destructive",
      });
      setRecordingState('error');
    }
  });

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      setPermissionStatus(result.state);
      return result.state === 'granted';
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  };

  const setupAudioAnalyser = (stream: MediaStream) => {
    audioContextRef.current = new AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    source.connect(analyserRef.current);
    analyserRef.current.fftSize = 256;

    const updateAudioLevel = () => {
      if (!analyserRef.current) return;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);

      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      setAudioLevel(average / 255);

      if (recordingState === 'recording') {
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      }
    };

    updateAudioLevel();
  };

  const startRecording = async () => {
    try {
      setRecordingState('processing');

      // Check WebSocket connection first
      if (!isConnected) {
        toast({
          title: "Erro de conexão",
          description: "Não é possível gravar sem conexão com o servidor. Aguarde a conexão ou recarregue a página.",
          variant: "destructive",
        });
        setRecordingState('idle');
        return;
      }

      const hasPermission = await checkMicrophonePermission();
      if (!hasPermission) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 16000
          }
        });
        stream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        }
      });

      setupAudioAnalyser(stream);

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      const audioChunks: Blob[] = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
          // Send audio chunk to backend via WebSocket
          event.data.arrayBuffer().then(buffer => {
            sendAudioChunk(buffer);
          });
        }
      };

      mediaRecorderRef.current.onstart = () => {
        setRecordingState('recording');
        setRecordingTime(0);
        startServerRecording(); // Start recording on server
        intervalRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      };

      mediaRecorderRef.current.onstop = () => {
        setRecordingState('idle');
        setAudioLevel(0);
        stopServerRecording(); // Stop recording on server
        stream.getTracks().forEach(track => track.stop());
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };

      mediaRecorderRef.current.start(100); // Send chunks every 100ms
      setPermissionStatus('granted');

    } catch (error) {
      console.error('Failed to start recording:', error);
      toast({
        title: "Erro no microfone",
        description: "Não foi possível acessar o microfone. Verifique as permissões do navegador.",
        variant: "destructive",
      });
      setRecordingState('idle');
      setPermissionStatus('denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const reloadPage = () => {
    window.location.reload();
  };

  const getStatusColor = () => {
    switch (recordingState) {
      case 'recording': return 'bg-red-500';
      case 'processing': return 'bg-yellow-500';
      case 'error': return 'bg-red-600';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    switch (recordingState) {
      case 'recording': return 'Gravando';
      case 'processing': return 'Processando';
      case 'error': return 'Erro';
      default: return 'Pronto';
    }
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="text-center pb-4">
        <CardTitle className="flex items-center justify-center gap-2 text-xl">
          <Mic className="w-5 h-5 text-primary" />
          Gravador de Áudio
        </CardTitle>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", getStatusColor())} />
            <Badge variant={recordingState === 'recording' ? 'destructive' : 'secondary'} className="text-xs">
              {getStatusText()}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="w-3 h-3 text-green-500" />
            ) : (
              <WifiOff className="w-3 h-3 text-red-500" />
            )}
            <Badge variant={isConnected ? 'default' : 'destructive'} className="text-xs">
              {connectionStatus === 'connecting' ? 'Conectando...' :
               isConnected ? 'Conectado' : 'Desconectado'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-center space-y-6">
        {/* Audio Level Visualizer */}
        <div className="flex items-center justify-center">
          <div className="relative w-24 h-24">
            <div
              className={cn(
                "absolute inset-0 rounded-full border-3 transition-all duration-100",
                recordingState === 'recording'
                  ? "border-red-500 animate-pulse"
                  : "border-gray-300"
              )}
              style={{
                transform: `scale(${1 + audioLevel * 0.3})`,
                boxShadow: recordingState === 'recording'
                  ? `0 0 ${15 + audioLevel * 20}px rgba(239, 68, 68, 0.4)`
                  : 'none'
              }}
            />
            <div className="absolute inset-3 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
              {recordingState === 'processing' ? (
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              ) : recordingState === 'recording' ? (
                <MicOff className="w-6 h-6 text-red-500" />
              ) : (
                <Mic className="w-6 h-6 text-primary" />
              )}
            </div>
          </div>
        </div>

        {/* Recording Time */}
        {recordingState === 'recording' && (
          <div className="text-center">
            <div className="text-2xl font-mono font-bold text-red-500">
              {formatTime(recordingTime)}
            </div>
            <p className="text-sm text-muted-foreground">Tempo de gravação</p>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-4 justify-center">
          {recordingState === 'idle' || recordingState === 'error' ? (
            <Button
              onClick={startRecording}
              size="lg"
              className="min-w-32"
              disabled={recordingState === 'processing' || !canRetry}
            >
              <Mic className="w-4 h-4 mr-2" />
              Iniciar Gravação
            </Button>
          ) : (
            <Button
              onClick={stopRecording}
              variant="destructive"
              size="lg"
              className="min-w-32"
              disabled={recordingState === 'processing'}
            >
              <Square className="w-4 h-4 mr-2 fill-current" />
              Parar Gravação
            </Button>
          )}
        </div>

        {/* Connection Failed Status */}
        {connectionStatus === 'failed' && !canRetry && (
          <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 mr-2" />
              <p className="text-red-700 dark:text-red-300 font-semibold">
                Falha na conexão com o servidor
              </p>
            </div>
            <p className="text-red-600 dark:text-red-400 text-sm mb-4">
              Não foi possível conectar após {retryCount} tentativas.
              Verifique sua conexão de internet e tente novamente.
            </p>
            <Button
              onClick={reloadPage}
              size="sm"
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-950"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Recarregar Página
            </Button>
          </div>
        )}

        {/* Retry Status */}
        {connectionStatus === 'connecting' && retryCount > 0 && (
          <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
            <p className="text-yellow-700 dark:text-yellow-300 text-sm">
              Tentativa de reconexão {retryCount}/5...
            </p>
          </div>
        )}

        {/* Permission Status */}
        {permissionStatus === 'denied' && (
          <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
            <p className="text-red-700 dark:text-red-300">
              Acesso ao microfone negado. Por favor, permita o acesso ao microfone nas configurações do navegador.
            </p>
          </div>
        )}

      </CardContent>

      {/* Connection Status Footer */}
      <div className="px-6 pb-6 pt-2">
        <div className="flex justify-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${
            connectionStatus === 'failed' ? 'bg-red-50 border-red-200' :
            connectionStatus === 'connecting' ? 'bg-yellow-50 border-yellow-200' :
            isConnected ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'failed' ? 'bg-red-500' :
              connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`} />
            <span className={`text-sm ${
              connectionStatus === 'failed' ? 'text-red-700' :
              connectionStatus === 'connecting' ? 'text-yellow-700' :
              isConnected ? 'text-green-700' : 'text-gray-600'
            }`}>
              {connectionStatus === 'failed' ? 'Falhou ao conectar com o servidor' :
               connectionStatus === 'connecting' ? retryCount > 0 ? `Reconectando... (${retryCount}/5)` : 'Conectando...' :
               isConnected ? 'Conectado ao servidor WebSocket' : 'Desconectado do servidor'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}