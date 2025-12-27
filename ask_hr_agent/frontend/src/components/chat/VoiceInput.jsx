import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function VoiceInput({ onTranscript, disabled }) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }
        
        setTranscript(finalTranscript || interimTranscript);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Please enable it in your browser settings.');
        } else if (event.error !== 'aborted') {
          toast.error('Voice recognition error. Please try again.');
        }
        setIsListening(false);
        setIsProcessing(false);
      };
      
      recognitionRef.current.onend = () => {
        if (isListening) {
          // If we're still supposed to be listening, restart
          try {
            recognitionRef.current.start();
          } catch {
            setIsListening(false);
          }
        }
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [isListening]);

  const toggleListening = async () => {
    if (!recognitionRef.current) {
      toast.error('Voice input is not supported in this browser');
      return;
    }
    
    if (isListening) {
      // Stop listening
      setIsProcessing(true);
      recognitionRef.current.stop();
      setIsListening(false);
      
      // Send the transcript if we have one
      if (transcript.trim()) {
        await onTranscript(transcript.trim());
        setTranscript('');
      }
      setIsProcessing(false);
    } else {
      // Start listening
      setTranscript('');
      try {
        await recognitionRef.current.start();
        setIsListening(true);
        toast.success('Listening... Speak now');
      } catch (e) {
        console.error('Failed to start recognition:', e);
        toast.error('Failed to start voice input');
      }
    }
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant={isListening ? "destructive" : "outline"}
        size="icon"
        onClick={toggleListening}
        disabled={disabled || isProcessing}
        className={cn(
          "h-11 w-11 rounded-xl shrink-0 transition-all",
          isListening && "bg-red-500 hover:bg-red-600 animate-pulse"
        )}
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isListening ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </Button>
      
      {/* Live Transcript Bubble */}
      <AnimatePresence>
        {isListening && transcript && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-14 right-0 w-64 p-3 bg-white rounded-xl shadow-lg border border-slate-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-medium text-slate-500">Listening...</span>
            </div>
            <p className="text-sm text-slate-700">{transcript}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
