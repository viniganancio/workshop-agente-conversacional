import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import AudioRecorder from "@/components/AudioRecorder";
import TranscriptionDisplay from "@/components/TranscriptionDisplay";
import { useWebSocket } from "@/hooks/useWebSocket";

interface TranscriptionSegment {
  id: string;
  text: string;
  timestamp: number;
  confidence?: number;
  isInterim?: boolean;
}

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

const App = () => {
  const [transcriptionSegments, setTranscriptionSegments] = useState<TranscriptionSegment[]>([]);

  // Global WebSocket connection status
  const { isConnected } = useWebSocket({
    autoConnect: false // We'll let the AudioRecorder handle its own connection
  });

  const handleNewTranscription = (result: TranscriptionResult) => {
    const newSegment: TranscriptionSegment = {
      id: `${result.timestamp}-${Math.random()}`,
      text: result.text,
      timestamp: result.timestamp,
      confidence: result.confidence,
      isInterim: result.isInterim
    };

    setTranscriptionSegments(prev => {
      // If it's an interim result, replace the last interim or add new
      if (result.isInterim) {
        const lastIndex = prev.findIndex(seg => seg.isInterim);
        if (lastIndex >= 0) {
          const updated = [...prev];
          updated[lastIndex] = newSegment;
          return updated;
        }
        return [...prev, newSegment];
      }

      // If it's final, remove any interim and add the final
      const withoutInterim = prev.filter(seg => !seg.isInterim);
      return [...withoutInterim, newSegment];
    });
  };

  const clearTranscriptions = () => {
    setTranscriptionSegments([]);
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
          {/* Header */}
          <header className="border-b bg-white/80 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-6">
              <div className="text-center">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
                  Workshop Agente Conversacional
                </h1>
                <p className="text-lg text-muted-foreground">
                  Transcrição de áudio em tempo real com Deepgram
                </p>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
              {/* Audio Recorder Section */}
              <section className="flex flex-col h-full">
                <AudioRecorder
                  onTranscription={handleNewTranscription}
                  globalConnectionStatus={isConnected}
                />
              </section>

              {/* Transcription Display Section */}
              <section className="flex flex-col h-full">
                <TranscriptionDisplay
                  segments={transcriptionSegments}
                  isConnected={isConnected}
                  onClear={clearTranscriptions}
                />
              </section>
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t bg-white/50 backdrop-blur-sm mt-16">
            <div className="container mx-auto px-4 py-6">
              <div className="text-center text-sm text-muted-foreground">
                <p>
                  Desenvolvido com ❤️ por{" "}
                  <a
                    href="mailto:contato@viniganancio.dev"
                    className="text-primary hover:underline"
                  >
                    Vini Ganancio
                  </a>
                </p>
                <p className="mt-1 text-xs">
                  Powered by React • Node.js • Deepgram • Socket.io
                </p>
              </div>
            </div>
          </footer>
        </div>

        <Toaster />
        <Sonner />
      </TooltipProvider>
    </ThemeProvider>
  );
};

export default App;