import { useCallback } from 'react';
import { commandContext } from '../lib/command-context';
import { useLiveKitVoice } from './useLiveKitVoice';

// Audio feedback types
type FeedbackType = 'acknowledge' | 'processing' | 'error' | 'success' | 'waiting';

interface VoiceFeedbackOptions {
  speed?: number;
  volume?: number;
}

export function useVoiceFeedback() {
  const { speak } = useLiveKitVoice();
  
  const generateAudioFeedback = useCallback(async (
    type: FeedbackType,
    customMessage?: string,
    options: VoiceFeedbackOptions = {}
  ) => {
    const voicePrefs = commandContext.getVoicePreferences();
    const speed = options.speed || voicePrefs.speed;
    const volume = options.volume || voicePrefs.volume;

    let message = customMessage;
    if (!message) {
      switch (type) {
        case 'acknowledge':
          message = 'Command received';
          break;
        case 'processing':
          message = 'Processing your request';
          break;
        case 'error':
          message = 'Sorry, I encountered an error';
          break;
        case 'success':
          message = 'Command executed successfully';
          break;
        case 'waiting':
          message = 'I\'m listening';
          break;
      }
    }

    try {
      // Use unified LiveKit voice service to prevent duplicates
      await speak(message);
    } catch (error) {
      console.error('Error generating voice feedback:', error);
      throw error;
    }
  }, [speak]);

  return {
    generateAudioFeedback
  };
}
