import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Square, Loader2, Wifi, WifiOff, RefreshCw, AlertTriangle, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
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

interface AIResponse {
  text: string;
  timestamp: number;
  confidence?: number;
}

interface TTSResponse {
  audioData: string; // Base64 encoded audio
  text: string;
  timestamp: number;
  voiceId: string;
  format: string;
}

interface AudioRecorderProps {
  onTranscription?: (result: TranscriptionResult) => void;
  onAIResponse?: (response: AIResponse) => void;
  onConnectionChange?: (isConnected: boolean) => void;
}

export default function AudioRecorder({ onTranscription, onAIResponse, onConnectionChange }: AudioRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

  const { toast } = useToast();
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isRecordingRef = useRef<boolean>(false);
  const animationFrameRef = useRef<number>();
  const intervalRef = useRef<NodeJS.Timeout>();

  // Audio player for TTS
  const { isPlaying: isTTSPlaying, playAudio, currentlyPlayingText } = useAudioPlayer();

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
    onAIResponse: (response: AIResponse) => {
      onAIResponse?.(response);
    },
    onTTSAudio: async (audio: TTSResponse) => {
      try {
        console.log('🔊 Playing TTS audio:', audio.text.substring(0, 50) + '...');
        await playAudio(audio);
      } catch (error) {
        console.error('Failed to play TTS audio:', error);
        toast({
          title: "Erro de reprodução",
          description: "Não foi possível reproduzir o áudio da resposta.",
          variant: "destructive",
        });
      }
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

  // Notify parent component about connection status changes
  useEffect(() => {
    onConnectionChange?.(isConnected);
  }, [isConnected, onConnectionChange]);

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

  // Convert Float32Array to 16-bit PCM
  const convertToPCM16 = (float32Array: Float32Array): ArrayBuffer => {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    let offset = 0;
    for (let i = 0; i < float32Array.length; i++, offset += 2) {
      let sample = Math.max(-1, Math.min(1, float32Array[i]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, sample, true); // little-endian
    }
    return buffer;
  };

  const setupPCMAudioProcessing = (stream: MediaStream) => {
    streamRef.current = stream;

    // Create audio context with 16kHz sample rate to match Deepgram
    audioContextRef.current = new AudioContext({ sampleRate: 16000 });

    // Create analyser for visualization
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;

    // Create script processor for raw audio data
    processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

    // Create source from microphone stream
    const source = audioContextRef.current.createMediaStreamSource(stream);

    // Connect: source -> analyser (for visualization)
    source.connect(analyserRef.current);

    // Connect: source -> processor (for PCM data extraction)
    source.connect(processorRef.current);
    processorRef.current.connect(audioContextRef.current.destination);

    // Process audio data and send as PCM
    processorRef.current.onaudioprocess = (event) => {
      if (isRecordingRef.current) {
        const inputBuffer = event.inputBuffer;
        const inputData = inputBuffer.getChannelData(0); // Get mono channel

        // Debug: log audio processing
        console.log('🎵 Processing audio chunk:', inputData.length, 'samples');

        // Convert to 16-bit PCM and send
        const pcmData = convertToPCM16(inputData);
        console.log('🔊 Sending PCM data:', pcmData.byteLength, 'bytes');
        sendAudioChunk(pcmData);
      }
    };

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
            sampleRate: 16000, // Match working example
            channelCount: 1
          }
        });
        stream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000, // Match Deepgram requirements
          channelCount: 1
        }
      });

      setupPCMAudioProcessing(stream);

      // Start recording
      setRecordingState('recording');
      isRecordingRef.current = true; // Set ref for audio processing
      setRecordingTime(0);
      setPermissionStatus('granted');
      startServerRecording(); // Start recording on server

      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

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
    if (recordingState === 'recording') {
      setRecordingState('idle');
      isRecordingRef.current = false; // Stop audio processing
      setAudioLevel(0);
      stopServerRecording(); // Stop recording on server

      // Clean up audio processing
      if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
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
          {isTTSPlaying && (
            <div className="flex items-center gap-2">
              <Volume2 className="w-3 h-3 text-blue-500 animate-pulse" />
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                🔊 Reproduzindo
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-center space-y-6">
        {/* Audio Level Visualizer */}
        <div className="flex items-center justify-center">
          <div className="relative w-32 h-32">
            {/* Outer pulse rings for recording */}
            {recordingState === 'recording' && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-red-500/30 animate-ping" />
                <div className="absolute inset-2 rounded-full border-2 border-red-500/20 animate-ping animation-delay-75" />
                <div className="absolute inset-4 rounded-full border-2 border-red-500/10 animate-ping animation-delay-150" />
              </>
            )}

            {/* Main microphone container */}
            <div
              className={cn(
                "absolute inset-6 rounded-full transition-all duration-300 ease-out shadow-lg",
                "bg-gradient-to-br from-white via-slate-50 to-slate-100",
                "border-2 hover:shadow-xl transform-gpu",
                recordingState === 'recording'
                  ? "border-red-500 shadow-red-500/25 scale-110"
                  : recordingState === 'processing'
                  ? "border-yellow-500 shadow-yellow-500/25 scale-105"
                  : "border-slate-300 hover:border-primary hover:scale-105 active:scale-95"
              )}
              style={{
                transform: recordingState === 'recording'
                  ? `scale(${1.1 + audioLevel * 0.15})`
                  : undefined,
                boxShadow: recordingState === 'recording'
                  ? `0 0 ${20 + audioLevel * 30}px rgba(239, 68, 68, 0.3), 0 8px 32px rgba(0, 0, 0, 0.12)`
                  : recordingState === 'processing'
                  ? '0 0 20px rgba(234, 179, 8, 0.3), 0 8px 32px rgba(0, 0, 0, 0.12)'
                  : undefined
              }}
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
                {recordingState === 'processing' ? (
                  <Loader2 className="w-8 h-8 text-yellow-600 animate-spin" />
                ) : recordingState === 'recording' ? (
                  <MicOff className="w-8 h-8 text-red-500 transition-all duration-200" />
                ) : (
                  <Mic className="w-8 h-8 text-primary transition-all duration-200 hover:scale-110" />
                )}
              </div>
            </div>

            {/* Audio level indicator bars */}
            {recordingState === 'recording' && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 bg-red-500 rounded-full opacity-60"
                    style={{
                      height: `${8 + audioLevel * 16}px`,
                      left: '50%',
                      top: '50%',
                      transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-${20 + audioLevel * 8}px)`,
                      animationDelay: `${i * 50}ms`
                    }}
                  />
                ))}
              </div>
            )}
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

        {/* TTS Playback Status */}
        {isTTSPlaying && currentlyPlayingText && (
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-center mb-2">
              <Volume2 className="w-4 h-4 text-blue-600 mr-2 animate-pulse" />
              <p className="text-blue-700 font-semibold text-sm">
                Reproduzindo resposta da IA
              </p>
            </div>
            <p className="text-blue-600 text-xs max-w-md mx-auto line-clamp-2">
              "{currentlyPlayingText.length > 80 ? currentlyPlayingText.substring(0, 80) + '...' : currentlyPlayingText}"
            </p>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-4 justify-center">
          {recordingState === 'idle' || recordingState === 'error' ? (
            <Button
              onClick={startRecording}
              size="lg"
              className="min-w-32 transition-all duration-300 ease-out transform hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-primary/25"
              disabled={recordingState === 'processing' || !canRetry}
            >
              <Mic className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
              Iniciar Gravação
            </Button>
          ) : (
            <Button
              onClick={stopRecording}
              variant="destructive"
              size="lg"
              className="min-w-32 transition-all duration-300 ease-out transform hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-red-500/25 animate-pulse-soft"
              disabled={recordingState === 'processing'}
            >
              <Square className="w-4 h-4 mr-2 fill-current transition-transform duration-200" />
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