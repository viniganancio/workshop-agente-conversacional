import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Download, Trash2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TranscriptionSegment {
  id: string;
  text: string;
  timestamp: number;
  confidence?: number;
  isInterim?: boolean;
}

interface TranscriptionDisplayProps {
  segments: TranscriptionSegment[];
  isConnected: boolean;
  onClear?: () => void;
}

export default function TranscriptionDisplay({
  segments,
  isConnected,
  onClear
}: TranscriptionDisplayProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new content is added
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [segments]);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const copyAllText = async () => {
    const allText = segments
      .filter(segment => !segment.isInterim)
      .map(segment => segment.text)
      .join(' ');

    try {
      await navigator.clipboard.writeText(allText);
      setCopiedId('all');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy all text:', error);
    }
  };

  const downloadTranscription = () => {
    const allText = segments
      .filter(segment => !segment.isInterim)
      .map(segment => {
        const date = new Date(segment.timestamp);
        return `[${date.toLocaleTimeString()}] ${segment.text}`;
      })
      .join('\n');

    const blob = new Blob([allText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcricao-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'bg-gray-500';
    if (confidence > 0.8) return 'bg-green-500';
    if (confidence > 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getConfidenceText = (confidence?: number) => {
    if (!confidence) return 'N/A';
    return `${Math.round(confidence * 100)}%`;
  };

  const finalSegments = segments.filter(segment => !segment.isInterim);
  const interimSegments = segments.filter(segment => segment.isInterim);

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-xl">
            <MessageSquare className="w-5 h-5 text-primary" />
            Transcrição em Tempo Real
          </CardTitle>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
              )}
            />
            <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
              {isConnected ? "Conectado" : "Desconectado"}
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        {finalSegments.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={copyAllText}
              className="text-xs"
            >
              <Copy className="w-3 h-3 mr-1" />
              {copiedId === 'all' ? 'Copiado!' : 'Copiar Tudo'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={downloadTranscription}
              className="text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </Button>

            {onClear && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClear}
                className="text-xs text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Limpar
              </Button>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        <ScrollArea
          className="flex-1 w-full rounded-md border p-4"
          ref={scrollAreaRef}
        >
          <div className="space-y-4">
            {finalSegments.length === 0 && interimSegments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg mb-2">Aguardando transcrição...</p>
                <p className="text-sm">
                  Inicie a gravação para ver a transcrição aparecer aqui em tempo real
                </p>
              </div>
            ) : (
              <>
                {/* Final segments */}
                {finalSegments.map((segment) => (
                  <div
                    key={segment.id}
                    className="group relative p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm leading-relaxed">{segment.text}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">
                            {formatTime(segment.timestamp)}
                          </span>
                          {segment.confidence && (
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-xs px-1 py-0",
                                getConfidenceColor(segment.confidence)
                              )}
                            >
                              {getConfidenceText(segment.confidence)}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => copyToClipboard(segment.text, segment.id)}
                      >
                        <Copy className="w-3 h-3" />
                        {copiedId === segment.id && (
                          <span className="ml-1 text-xs">Copiado!</span>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Interim segments (real-time, not final) */}
                {interimSegments.map((segment) => (
                  <div
                    key={segment.id}
                    className="p-3 rounded-lg bg-primary/5 border border-primary/20 animate-pulse"
                  >
                    <p className="text-sm leading-relaxed text-primary/80 italic">
                      {segment.text}
                    </p>
                    <span className="text-xs text-primary/60">
                      Transcrevendo...
                    </span>
                  </div>
                ))}
              </>
            )}

            <div ref={endRef} />
          </div>
        </ScrollArea>

        {/* Statistics */}
        {finalSegments.length > 0 && (
          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{finalSegments.length} segmentos</span>
              <span>
                {finalSegments.reduce((acc, seg) => acc + seg.text.split(' ').length, 0)} palavras
              </span>
              <span>
                {finalSegments.reduce((acc, seg) => acc + seg.text.length, 0)} caracteres
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}