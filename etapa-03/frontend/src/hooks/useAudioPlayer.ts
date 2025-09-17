import { useCallback, useRef, useState } from 'react';

interface TTSResponse {
  audioData: string; // Base64 encoded audio
  text: string;
  timestamp: number;
  voiceId: string;
  format: string;
}

interface UseAudioPlayerReturn {
  isPlaying: boolean;
  currentlyPlayingText: string | null;
  playAudio: (audio: TTSResponse) => Promise<void>;
  stopAudio: () => void;
  canPlay: boolean;
}

export const useAudioPlayer = (): UseAudioPlayerReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentlyPlayingText, setCurrentlyPlayingText] = useState<string | null>(null);
  const [canPlay, setCanPlay] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
    setCurrentlyPlayingText(null);
  }, []);

  const playAudio = useCallback(async (audio: TTSResponse): Promise<void> => {
    try {
      // Stop any currently playing audio
      stopAudio();

      setCanPlay(false);

      // Create blob from base64 audio data
      const audioBytes = atob(audio.audioData);
      const audioArray = new Uint8Array(audioBytes.length);

      for (let i = 0; i < audioBytes.length; i++) {
        audioArray[i] = audioBytes.charCodeAt(i);
      }

      const audioBlob = new Blob([audioArray], {
        type: audio.format === 'mp3' ? 'audio/mpeg' : 'audio/wav'
      });

      const audioUrl = URL.createObjectURL(audioBlob);
      const audioElement = new Audio(audioUrl);

      audioRef.current = audioElement;
      setCurrentlyPlayingText(audio.text);
      setIsPlaying(true);

      // Set up event listeners
      audioElement.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentlyPlayingText(null);
        setCanPlay(true);
        URL.revokeObjectURL(audioUrl);
      });

      audioElement.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        setIsPlaying(false);
        setCurrentlyPlayingText(null);
        setCanPlay(true);
        URL.revokeObjectURL(audioUrl);
      });

      // Start playback
      await audioElement.play();

      console.log('🔊 Playing TTS audio:', {
        text: audio.text.substring(0, 50) + '...',
        voiceId: audio.voiceId
      });

    } catch (error) {
      console.error('Failed to play audio:', error);
      setIsPlaying(false);
      setCurrentlyPlayingText(null);
      setCanPlay(true);
      throw error;
    }
  }, [stopAudio]);

  return {
    isPlaying,
    currentlyPlayingText,
    playAudio,
    stopAudio,
    canPlay,
  };
};