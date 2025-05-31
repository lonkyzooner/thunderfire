import { useState, useEffect, useRef, useCallback } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useLiveKitVoice } from '../hooks/useLiveKitVoice';
import { processVoiceCommand, getGeneralKnowledge, assessTacticalSituation } from '../lib/openai-service';
import { processOfflineCommand } from '../lib/offline-commands';
import { useSettings } from '../lib/settings-store';

interface CommandResponse {
  action: string;
  executed: boolean;
  result?: string;
  error?: string;
  parameters?: {
    language?: string;
    threat?: string;
    statute?: string;
  };
}
export const playAudioFeedback = (action: string) => {
  const audio = new Audio();
  switch (action.toLowerCase()) {
    case 'threat':
    case 'emergency':
      audio.src = '/sounds/alert.mp3';
      break;
    case 'miranda':
    case 'rights':
      audio.src = '/sounds/notification.mp3';
      break;
    case 'statute':
    case 'law':
      audio.src = '/sounds/info.mp3';
      break;
    default:
      audio.src = '/sounds/success.mp3';
  }
  audio.play().catch(console.error);
};


export function useVoiceAssistantCore(initialMessages: { role: 'user' | 'assistant', content: string }[] = []) {
  const [isActive, setIsActive] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>(initialMessages);
  const [isProcessing, setIsProcessing] = useState(false);
  const [latestAction, setLatestAction] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [typingIndex, setTypingIndex] = useState(0);
  const [showTypingEffect, setShowTypingEffect] = useState(false);
  const [currentTypingText, setCurrentTypingText] = useState('');

  const { settings } = useSettings();

  const getPersonalizedMessage = useCallback((baseMsg: string) => {
    const officerName = settings.officerName || localStorage.getItem('lark-officer-name');
    return officerName ? `${baseMsg}, Officer ${officerName}` : baseMsg;
  }, [settings.officerName]);

  const getUrgencyPrefix = useCallback((action: string) => {
    switch (action.toLowerCase()) {
      case 'threat':
      case 'emergency':
        return '🚨 ';
      case 'miranda':
      case 'rights':
        return '📢 ';
      case 'statute':
      case 'law':
        return '📚 ';
      default:
        return '';
    }
  }, []);


  const {
    transcript,
    listening,
    startListening,
    stopListening,
    hasRecognitionSupport,
    error: recognitionError,
    wakeWordDetected,
    setWakeWordDetected
  } = useSpeechRecognition();

  const { speak, isSpeaking, stopSpeaking } = useLiveKitVoice();

  const lastTranscriptRef = useRef('');
  const lastCommandRef = useRef<string>('');
  const lastCommandTimeRef = useRef<number>(0);

  const simulateTypingEffect = useCallback((text: string) => {
    setCurrentTypingText(text);
    setShowTypingEffect(true);
    setTypingIndex(0);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isActive, setIsActive,
    messages, setMessages,
    isProcessing, setIsProcessing,
    latestAction, setLatestAction,
    isOffline,
    typingIndex, setTypingIndex,
    showTypingEffect, setShowTypingEffect,
    currentTypingText, setCurrentTypingText,
    getPersonalizedMessage,
    getUrgencyPrefix,
    playAudioFeedback,
    transcript,
    listening,
    startListening,
    stopListening,
    hasRecognitionSupport,
    recognitionError,
    wakeWordDetected,
    setWakeWordDetected,
    speak,
    isSpeaking,
    stopSpeaking,
    lastTranscriptRef,
    lastCommandRef,
    lastCommandTimeRef,
    simulateTypingEffect
  };
}