/**
 * React Hook for Wake Word Detection
 * 
 * Provides easy integration of wake word functionality in React components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import wakeWordService, { WakeWordResult, WakeWordOptions } from '../services/wakeWordService';

export interface UseWakeWordReturn {
  isListening: boolean;
  isActive: boolean;
  lastDetection: WakeWordResult | null;
  audioLevel: number;
  startListening: (options?: Partial<WakeWordOptions>) => Promise<void>;
  stopListening: () => void;
  updateOptions: (options: Partial<WakeWordOptions>) => void;
  error: string | null;
}

export function useWakeWord(autoStart = false): UseWakeWordReturn {
  const [isListening, setIsListening] = useState(false);
  const [lastDetection, setLastDetection] = useState<WakeWordResult | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const audioLevelIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Handle wake word detection
  const handleWakeWordDetection = useCallback((result: WakeWordResult) => {
    setLastDetection(result);
    setError(null);
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('lark-wake-word-activated', {
      detail: result
    }));
  }, []);

  // Start listening for wake words
  const startListening = useCallback(async (options?: Partial<WakeWordOptions>) => {
    try {
      setError(null);
      await wakeWordService.startListening(options);
      setIsListening(true);
      
      // Start audio level monitoring
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
      }
      
      audioLevelIntervalRef.current = setInterval(() => {
        const level = wakeWordService.getAudioLevel();
        setAudioLevel(level);
      }, 100);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start wake word detection';
      setError(errorMessage);
      console.error('Wake word start error:', err);
    }
  }, []);

  // Stop listening
  const stopListening = useCallback(() => {
    wakeWordService.stopListening();
    setIsListening(false);
    setAudioLevel(0);
    
    // Clear audio level monitoring
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
      audioLevelIntervalRef.current = null;
    }
  }, []);

  // Update options
  const updateOptions = useCallback((options: Partial<WakeWordOptions>) => {
    wakeWordService.updateOptions(options);
  }, []);

  // Setup event listeners and cleanup
  useEffect(() => {
    // Subscribe to wake word detections
    unsubscribeRef.current = wakeWordService.onWakeWordDetected(handleWakeWordDetection);

    // Listen for service state changes
    const handleListeningStarted = () => setIsListening(true);
    const handleListeningStopped = () => {
      setIsListening(false);
      setAudioLevel(0);
    };

    window.addEventListener('lark-wake-word-listening-started', handleListeningStarted);
    window.addEventListener('lark-wake-word-listening-stopped', handleListeningStopped);

    // Auto-start if requested
    if (autoStart) {
      startListening();
    }

    // Cleanup
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
      }
      
      window.removeEventListener('lark-wake-word-listening-started', handleListeningStarted);
      window.removeEventListener('lark-wake-word-listening-stopped', handleListeningStopped);
      
      // Stop listening when component unmounts
      if (isListening) {
        wakeWordService.stopListening();
      }
    };
  }, [autoStart, startListening, handleWakeWordDetection, isListening]);

  return {
    isListening,
    isActive: wakeWordService.isActive(),
    lastDetection,
    audioLevel,
    startListening,
    stopListening,
    updateOptions,
    error
  };
}

// Hook for handling wake word commands
export function useWakeWordCommands() {
  const [pendingCommand, setPendingCommand] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const processCommand = useCallback(async (command: string) => {
    setIsProcessing(true);
    setPendingCommand(command);
    
    try {
      // Here you would integrate with your command processing logic
      // For now, we'll just simulate processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Process different command types
      if (command.includes('backup') || command.includes('help')) {
        // Handle emergency commands
        window.dispatchEvent(new CustomEvent('lark-emergency-command', {
          detail: { command, type: 'emergency' }
        }));
      } else if (command.includes('status') || command.includes('update')) {
        // Handle status commands
        window.dispatchEvent(new CustomEvent('lark-status-command', {
          detail: { command, type: 'status' }
        }));
      } else {
        // Handle general commands
        window.dispatchEvent(new CustomEvent('lark-general-command', {
          detail: { command, type: 'general' }
        }));
      }
      
    } catch (error) {
      console.error('Error processing wake word command:', error);
    } finally {
      setIsProcessing(false);
      setPendingCommand(null);
    }
  }, []);

  // Listen for wake word activations
  useEffect(() => {
    const handleWakeWordActivated = (event: any) => {
      const result: WakeWordResult = event.detail;
      
      // Extract command from transcript (remove wake word)
      let command = result.transcript
        .replace(/\b(hey|hi|hello)\s*(lark|clark|larc)\b/i, '')
        .trim();
      
      if (command) {
        processCommand(command);
      }
    };

    window.addEventListener('lark-wake-word-activated', handleWakeWordActivated);
    
    return () => {
      window.removeEventListener('lark-wake-word-activated', handleWakeWordActivated);
    };
  }, [processCommand]);

  return {
    pendingCommand,
    isProcessing,
    processCommand
  };
}
