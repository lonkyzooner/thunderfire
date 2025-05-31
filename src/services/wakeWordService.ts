/**
 * Wake Word Detection Service for LARK
 * 
 * Handles continuous listening for "Hey LARK" wake word activation
 * with noise filtering and confidence scoring
 */

// TypeScript declarations for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    AudioContext: any;
    webkitAudioContext: any;
  }
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface WakeWordResult {
  detected: boolean;
  confidence: number;
  transcript: string;
  timestamp: number;
}

export interface WakeWordOptions {
  sensitivity: number; // 0.1 to 1.0
  noiseThreshold: number; // 0.1 to 1.0
  enableAudioFeedback: boolean;
  backgroundListening: boolean;
}

class WakeWordService {
  private static instance: WakeWordService;
  private isListening = false;
  private recognition: any = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private dataArray: Uint8Array | null = null;
  private lastDetectionTime = 0;
  private options: WakeWordOptions = {
    sensitivity: 0.7,
    noiseThreshold: 0.3,
    enableAudioFeedback: true,
    backgroundListening: true
  };

  // Wake word patterns with phonetic variations
  private wakeWordPatterns = [
    // Primary patterns
    /\b(hey|hi|hello)\s*lark\b/i,
    /\blark\b/i,
    
    // Phonetic variations
    /\b(hey|hi|hello)\s*(clark|larc|large|lark)\b/i,
    /\b(clark|larc|large)\b/i,
    
    // Loose patterns for noisy environments
    /\bl[aeiou]*r[aeiou]*[kc]\b/i,
    /\b[hl][aeiou]*r[aeiou]*\b/i,
    
    // Emergency patterns
    /\bemergency\s*lark\b/i,
    /\bbackup\s*lark\b/i,
    /\bhelp\s*lark\b/i
  ];

  private callbacks: ((result: WakeWordResult) => void)[] = [];

  static getInstance(): WakeWordService {
    if (!WakeWordService.instance) {
      WakeWordService.instance = new WakeWordService();
    }
    return WakeWordService.instance;
  }

  constructor() {
    this.initializeAudioContext();
  }

  private async initializeAudioContext(): Promise<void> {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }

  private async initializeSpeechRecognition(): Promise<void> {
    const SpeechRecognitionClass = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognitionClass) {
      throw new Error('Speech recognition not supported');
    }

    this.recognition = new SpeechRecognitionClass();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 3;
    this.recognition.lang = 'en-US';

    // Handle speech results
    if (this.recognition) {
      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        this.processResults(event);
      };

      // Handle errors
      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        
        // Auto-restart on certain errors
        if (['network', 'audio-capture', 'no-speech'].includes(event.error)) {
          setTimeout(() => {
            if (this.isListening) {
              this.restartRecognition();
            }
          }, 1000);
        }
      };

      // Handle end event
      this.recognition.onend = () => {
        if (this.isListening && this.options.backgroundListening) {
          // Auto-restart for continuous listening
          setTimeout(() => {
            this.restartRecognition();
          }, 100);
        }
      };
    }
  }

  private processResults(event: SpeechRecognitionEvent): void {
    try {
      if (!event.results || event.results.length === 0) return;

      const results = Array.from(event.results);
      const lastResult = results[results.length - 1];
      
      if (!lastResult || lastResult.length === 0) return;

      const transcript = lastResult[0].transcript.toLowerCase().trim();
      const confidence = lastResult[0].confidence || 0.5;

      // Skip very short or low confidence results
      if (transcript.length < 2 || confidence < 0.3) return;

      // Check for wake word patterns
      const detection = this.detectWakeWord(transcript, confidence);
      
      if (detection.detected) {
        // Prevent duplicate detections within 2 seconds
        const now = Date.now();
        if (now - this.lastDetectionTime < 2000) return;
        
        this.lastDetectionTime = now;
        this.handleWakeWordDetection(detection);
      }
    } catch (error) {
      console.error('Error processing speech results:', error);
    }
  }

  private detectWakeWord(transcript: string, confidence: number): WakeWordResult {
    let maxScore = 0;
    let matchedPattern = '';

    // Test each pattern
    for (const pattern of this.wakeWordPatterns) {
      if (pattern.test(transcript)) {
        const match = transcript.match(pattern);
        if (match) {
          // Calculate score based on pattern specificity and confidence
          let score = confidence;
          
          // Boost score for exact matches
          if (transcript.includes('hey lark') || transcript.includes('hi lark')) {
            score += 0.3;
          } else if (transcript.includes('lark')) {
            score += 0.2;
          }
          
          // Boost score for emergency patterns
          if (pattern.source.includes('emergency') || pattern.source.includes('backup')) {
            score += 0.4;
          }
          
          if (score > maxScore) {
            maxScore = score;
            matchedPattern = match[0];
          }
        }
      }
    }

    // Apply sensitivity threshold
    const detected = maxScore >= this.options.sensitivity;

    return {
      detected,
      confidence: maxScore,
      transcript,
      timestamp: Date.now()
    };
  }

  private handleWakeWordDetection(result: WakeWordResult): void {
    console.log('Wake word detected:', result);

    // Play audio feedback
    if (this.options.enableAudioFeedback) {
      this.playActivationSound();
    }

    // Trigger haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }

    // Notify all callbacks
    this.callbacks.forEach(callback => {
      try {
        callback(result);
      } catch (error) {
        console.error('Error in wake word callback:', error);
      }
    });

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('lark-wake-word-detected', {
      detail: result
    }));
  }

  private async playActivationSound(): Promise<void> {
    try {
      // Try to play system sound first
      const audio = new Audio('/sounds/activation.mp3');
      audio.volume = 0.7;
      await audio.play();
    } catch (error) {
      // Fallback to programmatic tone
      this.playTone(800, 150);
    }
  }

  private playTone(frequency: number, duration: number): void {
    if (!this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.error('Error playing tone:', error);
    }
  }

  private async restartRecognition(): Promise<void> {
    if (!this.isListening) return;

    try {
      if (this.recognition) {
        this.recognition.stop();
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (this.recognition && this.isListening) {
        this.recognition.start();
      }
    } catch (error) {
      console.error('Error restarting recognition:', error);
    }
  }

  // Public methods
  async startListening(options?: Partial<WakeWordOptions>): Promise<void> {
    if (this.isListening) return;

    // Update options
    if (options) {
      this.options = { ...this.options, ...options };
    }

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Initialize audio analysis for noise detection
      if (this.audioContext && !this.analyser) {
        this.analyser = this.audioContext.createAnalyser();
        this.microphone = this.audioContext.createMediaStreamSource(stream);
        this.microphone.connect(this.analyser);
        
        this.analyser.fftSize = 256;
        const bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(bufferLength);
      }

      // Initialize speech recognition
      await this.initializeSpeechRecognition();
      
      if (this.recognition) {
        this.recognition.start();
        this.isListening = true;
        
        console.log('Wake word detection started');
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('lark-wake-word-listening-started'));
      }
    } catch (error) {
      console.error('Failed to start wake word detection:', error);
      throw error;
    }
  }

  stopListening(): void {
    if (!this.isListening) return;

    this.isListening = false;

    if (this.recognition) {
      this.recognition.stop();
    }

    console.log('Wake word detection stopped');
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('lark-wake-word-listening-stopped'));
  }

  isActive(): boolean {
    return this.isListening;
  }

  updateOptions(options: Partial<WakeWordOptions>): void {
    this.options = { ...this.options, ...options };
  }

  getOptions(): WakeWordOptions {
    return { ...this.options };
  }

  // Callback management
  onWakeWordDetected(callback: (result: WakeWordResult) => void): () => void {
    this.callbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  // Audio level monitoring for noise detection
  getAudioLevel(): number {
    if (!this.analyser || !this.dataArray) return 0;

    this.analyser.getByteFrequencyData(this.dataArray);
    
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    
    return sum / this.dataArray.length / 255; // Normalize to 0-1
  }

  // Check if environment is too noisy
  isEnvironmentSuitable(): boolean {
    const audioLevel = this.getAudioLevel();
    return audioLevel < this.options.noiseThreshold;
  }
}

// Export singleton instance
export const wakeWordService = WakeWordService.getInstance();
export default wakeWordService;
