import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
  size?: 'sm' | 'default' | 'icon';
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  className = '',
  size = 'sm'
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const onTranscriptRef = useRef(onTranscript);
  const lastTranscriptRef = useRef<string>('');
  const { toast } = useToast();

  // Always keep latest callback reference without re-triggering effect
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    // Do not force continuous restart loops on mobile as it causes OS mic beeping and permission toggling
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0]?.transcript;
        if (transcriptPart) {
          currentTranscript += transcriptPart;
        }
      }

      const trimmed = currentTranscript.trim();
      if (trimmed && trimmed !== lastTranscriptRef.current) {
        lastTranscriptRef.current = trimmed;
        onTranscriptRef.current(trimmed);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        toast({
          title: 'Voice Input Info',
          description: `Voice dictation stopped (${event.error})`,
          variant: 'default',
        });
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore stop error on unmount
        }
      }
    };
  }, [toast]);

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault();

    if (!isSupported) {
      toast({
        title: 'Browser Not Supported',
        description:
          'Speech recognition is not supported by your current browser. Please try Chrome, Edge, or Safari.',
        variant: 'destructive',
      });
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (err) {
        console.error(err);
      }
      setIsListening(false);
    } else {
      lastTranscriptRef.current = '';
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        toast({
          title: 'Voice Input Active 🎙️',
          description: 'Speak your story idea. Dictation will complete when you finish speaking.',
        });
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
        setIsListening(false);
      }
    }
  };

  if (!isSupported) {
    return (
      <Button
        type="button"
        variant="ghost"
        size={size}
        className={`text-xs text-muted-foreground opacity-50 ${className}`}
        title="Speech recognition not supported in this browser"
        onClick={toggleListening}
      >
        <MicOff className="h-3.5 w-3.5 mr-1" />
        Speech Input
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={isListening ? 'destructive' : 'outline'}
      size={size}
      onClick={toggleListening}
      className={`text-xs gap-1.5 transition-all ${
        isListening
          ? 'bg-red-600 text-white animate-pulse hover:bg-red-700'
          : 'border-border text-muted-foreground hover:text-foreground'
      } ${className}`}
      title={isListening ? 'Click to stop recording' : 'Click to dictate your story idea'}
    >
      {isListening ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          Listening... (Stop)
        </>
      ) : (
        <>
          <Mic className="h-3.5 w-3.5 text-naija-green" />
          Voice Input
        </>
      )}
    </Button>
  );
};
