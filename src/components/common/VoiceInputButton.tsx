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
  const shouldListenRef = useRef(false);
  const processedIndicesRef = useRef<Set<number>>(new Set());
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
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let newTranscript = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result && result.isFinal && !processedIndicesRef.current.has(i)) {
          processedIndicesRef.current.add(i);
          const text = result[0]?.transcript?.trim();
          if (text) {
            newTranscript += (newTranscript ? ' ' : '') + text;
          }
        }
      }

      if (newTranscript) {
        onTranscriptRef.current(newTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        // Automatically keep listening if no speech was detected in a brief silence
        return;
      }
      shouldListenRef.current = false;
      setIsListening(false);
      if (event.error !== 'aborted') {
        toast({
          title: 'Voice Input Warning',
          description: `Voice input ended: ${event.error}`,
          variant: 'destructive',
        });
      }
    };

    recognition.onend = () => {
      // Auto-restart if user has not explicitly clicked stop
      if (shouldListenRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          shouldListenRef.current = false;
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldListenRef.current = false;
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
      shouldListenRef.current = false;
      try {
        recognitionRef.current?.stop();
      } catch (err) {
        console.error(err);
      }
      setIsListening(false);
    } else {
      shouldListenRef.current = true;
      processedIndicesRef.current = new Set();
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        toast({
          title: 'Voice Input Active 🎙️',
          description: 'Speak your story idea. Click the mic button when done.',
        });
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
        shouldListenRef.current = false;
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
