'use client';

import { useState, useEffect } from 'react';

export default function VoiceInput({ onCommand, disabled }) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = 'en-US';

        recognitionInstance.onresult = (event) => {
          const result = event.results[0][0].transcript;
          setIsListening(false);
          
          // Text-to-speech feedback
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(`Executing: ${result}`);
            window.speechSynthesis.speak(utterance);
          }
          
          onCommand(result);
        };

        recognitionInstance.onend = () => setIsListening(false);
        recognitionInstance.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        setRecognition(recognitionInstance);
        setSupported(true);
      }
    }
  }, [onCommand]);

  const handleVoiceInput = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  if (!supported) {
    return (
      <div className="text-gray-500 text-sm">
        Voice input not supported in this browser
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Voice Command</label>
      <button
        onClick={handleVoiceInput}
        disabled={disabled}
        className={`w-full p-3 rounded font-medium transition-colors ${
          isListening
            ? 'bg-red-600 hover:bg-red-700 animate-pulse'
            : 'bg-green-600 hover:bg-green-700'
        } text-white disabled:bg-gray-600 disabled:cursor-not-allowed`}
      >
        {isListening ? '🛑 Stop Listening' : '🎤 Start Voice Input'}
      </button>
    </div>
  );
}