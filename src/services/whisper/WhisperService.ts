import { BehaviorSubject } from 'rxjs';

// Disabled WhisperService stub
class WhisperService {
  private isInitialized = new BehaviorSubject<boolean>(false);
  private isProcessing = new BehaviorSubject<boolean>(false);

  constructor() {
    console.warn('[WhisperService] Disabled: Whisper model is not available.');
  }

  public async transcribeAudio(audioData: Float32Array): Promise<{ text: string; confidence: number }> {
    return { text: 'Speech recognition unavailable', confidence: 0 };
  }

  public getInitializationState() {
    return this.isInitialized.asObservable();
  }

  public getProcessingState() {
    return this.isProcessing.asObservable();
  }
}

export const whisperService = new WhisperService();
