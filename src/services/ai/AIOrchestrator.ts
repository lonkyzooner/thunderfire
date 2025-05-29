import { BehaviorSubject, Observable } from 'rxjs';

// Dynamic imports for lazy loading - reduces initial bundle size
type LLMClient = any;

// Define task types for intelligent routing
export type TaskType = 
  | 'miranda'
  | 'legal_analysis'
  | 'threat_assessment'
  | 'tactical_planning'
  | 'fast_response'
  | 'real_time_data'
  | 'general_query'
  | 'emergency'
  | 'translation'
  | 'voice_recognition'
  | 'text_to_speech';

// Define model performance characteristics
interface ModelCapability {
  name: string;
  client: LLMClient | null;
  clientLoader?: () => Promise<LLMClient>;
  strengths: TaskType[];
  averageLatency: number; // milliseconds
  costPerToken: number;
  reliability: number; // 0-1 score
  offline: boolean;
  purpose: 'chat' | 'voice' | 'hybrid';
}

// Define routing decision
interface RoutingDecision {
  selectedModel: string;
  reasoning: string;
  fallbackModels: string[];
  estimatedLatency: number;
  priority: 'high' | 'medium' | 'low';
}

// Performance tracking
interface ModelPerformance {
  modelName: string;
  successRate: number;
  averageResponseTime: number;
  lastUpdated: Date;
  totalRequests: number;
}

/**
 * AIOrchestrator - Optimized for OpenRouter + OpenAI Voice Strategy
 * 
 * Simplified routing:
 * - OpenRouter: Primary for all chat/text AI tasks
 * - OpenAI: Exclusively for voice features (Whisper + TTS)
 * - Groq: Optional fast fallback for emergency responses
 */
export class AIOrchestrator {
  private models: Map<string, ModelCapability> = new Map();
  private modelPerformance: Map<string, ModelPerformance> = new Map();
  private isInitialized = new BehaviorSubject<boolean>(false);
  private currentLoad = new BehaviorSubject<number>(0);
  
  // Simplified task strategy - OpenRouter primary, OpenAI for voice
  private taskStrategy: Map<TaskType, string[]> = new Map([
    // Chat/Text tasks - OpenRouter primary
    ['miranda', ['openrouter-primary', 'groq-fallback']], 
    ['legal_analysis', ['openrouter-primary', 'groq-fallback']], 
    ['threat_assessment', ['openrouter-primary', 'groq-fallback']], 
    ['tactical_planning', ['openrouter-primary', 'groq-fallback']], 
    ['fast_response', ['groq-fallback', 'openrouter-primary']], // Groq first for speed
    ['real_time_data', ['openrouter-primary', 'groq-fallback']], 
    ['general_query', ['openrouter-primary', 'groq-fallback']], 
    ['emergency', ['groq-fallback', 'openrouter-primary']], // Speed critical
    ['translation', ['openrouter-primary', 'groq-fallback']], 
    
    // Voice tasks - OpenAI exclusive
    ['voice_recognition', ['openai-whisper']], 
    ['text_to_speech', ['openai-tts']]
  ]);

  constructor() {
    this.initializeModels();
    this.startPerformanceMonitoring();
  }

  /**
   * Initialize optimized AI models
   */
  private initializeModels(): void {
    // Get API keys from environment
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const groqKey = import.meta.env.VITE_GROQ_API_KEY;
    const openrouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;

    // Initialize OpenRouter as PRIMARY chat AI
    if (openrouterKey) {
      this.models.set('openrouter-primary', {
        name: 'OpenRouter (GPT-4, Claude, etc.)',
        client: null,
        clientLoader: async () => {
          const { QuasarClient } = await import('../llmClients');
          return new QuasarClient(openrouterKey);
        },
        strengths: ['legal_analysis', 'threat_assessment', 'tactical_planning', 'general_query', 'miranda', 'translation'],
        averageLatency: 1500,
        costPerToken: 0.005, // Variable based on model chosen
        reliability: 0.92,
        offline: false,
        purpose: 'chat'
      });
    }

    // Initialize OpenAI EXCLUSIVELY for voice features
    if (openaiKey) {
      this.models.set('openai-whisper', {
        name: 'OpenAI Whisper (Speech Recognition)',
        client: null,
        clientLoader: async () => {
          const { voiceRecognitionService } = await import('../voice/VoiceRecognitionService');
          return voiceRecognitionService;
        },
        strengths: ['voice_recognition'],
        averageLatency: 2000,
        costPerToken: 0.006, // Per minute for Whisper
        reliability: 0.95,
        offline: false,
        purpose: 'voice'
      });

      this.models.set('openai-tts', {
        name: 'OpenAI TTS (Text-to-Speech)',
        client: null,
        clientLoader: async () => {
          const { openAIVoiceService } = await import('../voice/OpenAIVoiceService');
          return openAIVoiceService;
        },
        strengths: ['text_to_speech'],
        averageLatency: 1000,
        costPerToken: 0.015, // Per 1K characters
        reliability: 0.96,
        offline: false,
        purpose: 'voice'
      });
    }

    // Initialize Groq as FAST FALLBACK for emergencies
    if (groqKey) {
      this.models.set('groq-fallback', {
        name: 'Groq Mixtral (Fast Emergency Fallback)',
        client: null,
        clientLoader: async () => {
          const { GroqClient } = await import('../llmClients');
          return new GroqClient(groqKey, 'mixtral-8x7b-32768');
        },
        strengths: ['fast_response', 'emergency'],
        averageLatency: 400,
        costPerToken: 0.0005,
        reliability: 0.88,
        offline: false,
        purpose: 'chat'
      });
    }

    const chatModels = Array.from(this.models.values()).filter(m => m.purpose === 'chat').length;
    const voiceModels = Array.from(this.models.values()).filter(m => m.purpose === 'voice').length;
    
    console.log(`[AIOrchestrator] Initialized ${chatModels} chat models, ${voiceModels} voice models with lazy loading`);
    this.isInitialized.next(true);
  }

  /**
   * Lazy load a model client if not already loaded
   */
  private async getModelClient(modelName: string): Promise<LLMClient> {
    const model = this.models.get(modelName);
    if (!model) {
      throw new Error(`Model ${modelName} not found`);
    }

    // If client is already loaded, return it
    if (model.client) {
      return model.client;
    }

    // Lazy load the client
    if (model.clientLoader) {
      console.log(`[AIOrchestrator] Lazy loading ${modelName} client...`);
      try {
        model.client = await model.clientLoader();
        return model.client;
      } catch (error) {
        console.error(`[AIOrchestrator] Failed to load ${modelName}:`, error);
        throw error;
      }
    }

    throw new Error(`No client loader available for model ${modelName}`);
  }

  /**
   * Main orchestration method - simplified routing strategy
   */
  public async orchestrate(
    request: string,
    taskType: TaskType,
    priority: 'high' | 'medium' | 'low' = 'medium',
    context?: Record<string, any>
  ): Promise<{
    response: string;
    metadata: {
      modelUsed: string;
      responseTime: number;
      routing: RoutingDecision;
    };
  }> {
    const startTime = Date.now();

    try {
      // Make routing decision
      const routing = this.makeRoutingDecision(taskType, priority, context);
      console.log(`[AIOrchestrator] Routing decision:`, routing);

      // Get the selected model client (lazy loaded)
      const selectedClient = await this.getModelClient(routing.selectedModel);

      // Prepare request with task-specific context
      const enhancedRequest = this.enhanceRequestForTask(request, taskType, context);

      // Execute request with fallback logic
      let response: string;
      let modelUsed = routing.selectedModel;

      try {
        response = await this.executeWithTimeout(
          selectedClient,
          enhancedRequest,
          routing.estimatedLatency * 2 // Allow 2x estimated time
        );
      } catch (error) {
        console.warn(`[AIOrchestrator] Primary model failed: ${error}. Trying fallback...`);
        
        // Try fallback models (simplified - only one fallback for our setup)
        if (routing.fallbackModels.length > 0) {
          const fallbackModelName = routing.fallbackModels[0];
          try {
            const fallbackClient = await this.getModelClient(fallbackModelName);
            response = await this.executeWithTimeout(
              fallbackClient,
              enhancedRequest,
              this.models.get(fallbackModelName)!.averageLatency * 2
            );
            modelUsed = fallbackModelName;
          } catch (fallbackError) {
            console.warn(`[AIOrchestrator] Fallback model ${fallbackModelName} failed: ${fallbackError}`);
            throw new Error('Both primary and fallback models failed');
          }
        } else {
          throw error;
        }
      }

      const responseTime = Date.now() - startTime;

      // Update performance metrics
      this.updateModelPerformance(modelUsed, true, responseTime);

      return {
        response,
        metadata: {
          modelUsed,
          responseTime,
          routing
        }
      };

    } catch (error) {
      console.error('[AIOrchestrator] Orchestration failed:', error);
      
      // Update failure metrics if we had a selected model
      const routing = this.makeRoutingDecision(taskType, priority, context);
      this.updateModelPerformance(routing.selectedModel, false, Date.now() - startTime);

      throw error;
    }
  }

  /**
   * Simplified routing decision - OpenRouter first for chat, OpenAI for voice
   */
  private makeRoutingDecision(
    taskType: TaskType,
    priority: 'high' | 'medium' | 'low',
    context?: Record<string, any>
  ): RoutingDecision {
    // Get preferred models for this task type
    const preferredModels = this.taskStrategy.get(taskType) || ['openrouter-primary'];
    
    // Filter available models
    const availableModels = preferredModels.filter(modelName => 
      this.models.has(modelName) && this.isModelHealthy(modelName)
    );

    if (availableModels.length === 0) {
      throw new Error(`No healthy models available for task type: ${taskType}`);
    }

    // Simple selection - first available model is primary
    const selectedModel = availableModels[0];
    const fallbackModels = availableModels.slice(1);

    const estimatedLatency = this.models.get(selectedModel)!.averageLatency;

    // Adjust for priority
    let reasoning = `Selected ${selectedModel} for ${taskType}`;
    if (priority === 'high' || taskType === 'emergency') {
      reasoning += ' (high priority - optimized for speed)';
    } else if (taskType === 'voice_recognition' || taskType === 'text_to_speech') {
      reasoning += ' (voice task - OpenAI exclusive)';
    }

    return {
      selectedModel,
      reasoning,
      fallbackModels,
      estimatedLatency,
      priority
    };
  }

  /**
   * Execute request with timeout protection
   */
  private async executeWithTimeout(
    client: LLMClient,
    request: string,
    timeoutMs: number
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Model response timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      try {
        // Handle different client types
        let response: string;
        
        if (typeof client.generateReply === 'function') {
          // Standard chat client
          response = await client.generateReply('orchestrator', 
            [{ role: 'user', content: request }], 
            []
          );
        } else if (typeof client.speak === 'function') {
          // TTS client (OpenAI Voice Service)
          await client.speak(request);
          response = 'Audio synthesis completed';
        } else if (typeof client.startListening === 'function') {
          // Voice recognition client
          // This is more complex as it's event-based
          response = 'Voice recognition started';
        } else {
          throw new Error('Unknown client type');
        }
        
        clearTimeout(timeout);
        resolve(response);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Enhance request with task-specific context and prompting
   */
  private enhanceRequestForTask(
    request: string,
    taskType: TaskType,
    context?: Record<string, any>
  ): string {
    // For voice tasks, return request as-is (audio data or text for TTS)
    if (taskType === 'voice_recognition' || taskType === 'text_to_speech') {
      return request;
    }

    const taskPrompts = {
      miranda: 'You are a law enforcement AI assistant. Provide Miranda rights information. Be precise and legally accurate.',
      legal_analysis: 'You are a law enforcement AI assistant. Analyze this from a legal perspective with Louisiana law focus.',
      threat_assessment: 'You are a law enforcement AI assistant. Assess potential threats and provide safety recommendations.',
      tactical_planning: 'You are a law enforcement AI assistant. Provide tactical analysis and strategic recommendations.',
      fast_response: 'You are a law enforcement AI assistant. Provide a quick, direct response.',
      real_time_data: 'You are a law enforcement AI assistant. Provide current, up-to-date information.',
      general_query: 'You are a law enforcement AI assistant. Provide a comprehensive and helpful response.',
      emergency: 'You are a law enforcement AI assistant. URGENT: Provide immediate, critical response.',
      translation: 'You are a law enforcement AI assistant. Provide accurate translation and language assistance.'
    };

    const taskPrompt = taskPrompts[taskType as keyof typeof taskPrompts];
    const contextInfo = context ? `\nContext: ${JSON.stringify(context)}` : '';
    
    return `${taskPrompt}\n\nRequest: ${request}${contextInfo}`;
  }

  /**
   * Performance monitoring and health checks
   */
  private isModelHealthy(modelName: string): boolean {
    const performance = this.modelPerformance.get(modelName);
    if (!performance) return true; // No data means assume healthy
    
    // Consider model unhealthy if success rate < 70% in recent requests
    return performance.successRate >= 0.7;
  }

  private updateModelPerformance(
    modelName: string,
    success: boolean,
    responseTime: number
  ): void {
    const current = this.modelPerformance.get(modelName) || {
      modelName,
      successRate: 1.0,
      averageResponseTime: 1000,
      lastUpdated: new Date(),
      totalRequests: 0
    };

    // Update with exponential moving average
    const alpha = 0.1; // Learning rate
    current.successRate = success 
      ? current.successRate + alpha * (1 - current.successRate)
      : current.successRate + alpha * (0 - current.successRate);
    
    current.averageResponseTime = current.averageResponseTime + 
      alpha * (responseTime - current.averageResponseTime);
    
    current.lastUpdated = new Date();
    current.totalRequests += 1;

    this.modelPerformance.set(modelName, current);
  }

  private startPerformanceMonitoring(): void {
    // Update model health metrics every 30 seconds
    setInterval(() => {
      this.updateModelHealth();
    }, 30000);
  }

  private updateModelHealth(): void {
    // Update average latencies based on recent performance
    this.modelPerformance.forEach((performance, modelName) => {
      const model = this.models.get(modelName);
      if (model) {
        model.averageLatency = performance.averageResponseTime;
        model.reliability = performance.successRate;
      }
    });
  }

  /**
   * Public getters for monitoring
   */
  public getInitializationState(): Observable<boolean> {
    return this.isInitialized.asObservable();
  }

  public getCurrentLoad(): Observable<number> {
    return this.currentLoad.asObservable();
  }

  public getModelPerformance(): Map<string, ModelPerformance> {
    return new Map(this.modelPerformance);
  }

  public getAvailableModels(): string[] {
    return Array.from(this.models.keys());
  }

  public getTaskStrategy(): Map<TaskType, string[]> {
    return new Map(this.taskStrategy);
  }

  /**
   * Convenience methods for common operations
   */
  public async chatCompletion(
    message: string,
    context?: Record<string, any>
  ): Promise<string> {
    const result = await this.orchestrate(message, 'general_query', 'medium', context);
    return result.response;
  }

  public async emergencyResponse(
    message: string,
    context?: Record<string, any>
  ): Promise<string> {
    const result = await this.orchestrate(message, 'emergency', 'high', context);
    return result.response;
  }

  public async voiceTranscription(
    audioData: any
  ): Promise<string> {
    const result = await this.orchestrate(audioData, 'voice_recognition', 'high');
    return result.response;
  }

  public async textToSpeech(
    text: string
  ): Promise<string> {
    const result = await this.orchestrate(text, 'text_to_speech', 'medium');
    return result.response;
  }
}

// Create singleton instance
export const aiOrchestrator = new AIOrchestrator();
