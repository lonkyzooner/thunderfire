import { Message } from '../contexts/ConversationContext';
import { liveKitVoiceService } from '../services/livekit/LiveKitVoiceService';
import { liveKitVoiceServiceFallback } from '../services/livekit/LiveKitVoiceServiceFallback';
import { queryPinecone } from './pineconeClient';
import statutesData from '../data/statutes.json';
import {
  LLMClient,
  QuasarClient, 
  OpenAIClient,
  AnthropicClient,
  GroqClient
} from './llmClients';
import { toolManager } from './ToolManager';
import { ContextManager } from './ContextManager';
import { logSystem, logCompliance, logAnalytics } from '../lib/auditLogger';
import { WorkflowManager, WorkflowEvent, SuggestedAction, WorkflowState } from './WorkflowManager';
import { getEnv } from './system/envService';
import { intentRecognitionService, LawEnforcementIntent, SceneContext } from './IntentRecognitionService';
import { mapboxService } from './MapboxService';
import { getCurrentLocation } from '../utils/locationTracker';

type InputType = 'voice' | 'text' | 'ui';

interface OrchestratorInput {
  orgId: string;
  userId: string;
  type: InputType;
  content: string;
  metadata?: Record<string, any>;
}

interface OrchestratorResponse {
  orgId: string;
  userId: string;
  type: 'text' | 'voice' | 'action' | 'navigation';
  content: string;
  metadata?: Record<string, any>;
}

type ResponseListener = (response: OrchestratorResponse) => void;

interface Statute {
  code: string;
  title: string;
  text: string;
}

interface MirandaLog {
  timestamp: number;
  language: string;
  text: string;
}

// Enhanced types for law enforcement operations
interface Action {
  type: 'statute_search' | 'miranda' | 'tool_use' | 'llm_response' | 'navigation' | 'dispatch_notification' | 'compliance_check';
  language?: string;
  toolId?: string;
  params?: Record<string, any>;
  destination?: string;
  priority?: 'routine' | 'urgent' | 'emergency';
}

class OrchestratorService {
  private listeners: Record<string, ResponseListener[]> = {};
  private quasarClient: LLMClient;
  private openAIClient: LLMClient;
  private anthropicClient: LLMClient;
  private groqClient: LLMClient;
  private statutes: Statute[] = [];
  private isInitialized = false;

  // Scene context tracking per user
  private userSceneContexts: Record<string, SceneContext> = {};

  constructor() {
    logSystem('OrchestratorServiceInitialized', { message: 'Enhanced Orchestrator initialized' });
    console.log('[Orchestrator] Enhanced Orchestrator initialized with autonomous capabilities');

    const env = getEnv();
    this.quasarClient = new QuasarClient(env.OPENROUTER_API_KEY);
    this.openAIClient = new OpenAIClient(env.OPENAI_API_KEY);
    this.anthropicClient = new AnthropicClient(env.ANTHROPIC_API_KEY);
    this.groqClient = new GroqClient(env.GROQ_API_KEY);

    this.statutes = statutesData as Statute[];
    this.initializeServices();
  }

  private async initializeServices(): Promise<void> {
    try {
      // Initialize intent recognition service
      await intentRecognitionService.initialize();
      
      // Initialize Mapbox service
      await mapboxService.initialize();
      
      this.isInitialized = true;
      console.log('[Orchestrator] All services initialized successfully');
    } catch (error) {
      console.error('[Orchestrator] Service initialization error:', error);
      this.isInitialized = false;
    }
  }

  onResponse(userId: string, listener: ResponseListener) {
    if (!this.listeners[userId]) {
      this.listeners[userId] = [];
    }
    this.listeners[userId].push(listener);
  }

  offResponse(userId: string, listener: ResponseListener) {
    if (!this.listeners[userId]) return;
    this.listeners[userId] = this.listeners[userId].filter(l => l !== listener);
  }

  emitResponse(response: OrchestratorResponse) {
    const listeners = this.listeners[response.userId] || [];
    listeners.forEach(listener => listener(response));
  }

  receiveInput(input: OrchestratorInput): void {
    console.log('[Orchestrator] Received input:', input);
    ContextManager.addMessage(input.orgId, input.userId, input.type === 'ui' ? 'system' : 'user', input.content);
    logAnalytics('UserInputReceived', { inputType: input.type, content: input.content, metadata: input.metadata }, input.userId, undefined, undefined, input.orgId);

    // Integrate WorkflowManager: log the event for workflow tracking
    const workflowEvent: WorkflowEvent = {
      type: input.type,
      payload: { content: input.content, metadata: input.metadata },
      timestamp: Date.now(),
    };
    WorkflowManager.handleEvent(input.orgId, input.userId, workflowEvent);

    this.processInput(input);
  }

  // Expose workflow state and suggestions for UI
  getWorkflowState(orgId: string, userId: string): WorkflowState | null {
    return WorkflowManager.getCurrentWorkflowState(orgId, userId);
  }

  getWorkflowSuggestions(orgId: string, userId: string): SuggestedAction[] {
    return WorkflowManager.suggestNextActions(orgId, userId);
  }

  /**
   * Get current scene context for a user
   */
  getSceneContext(userId: string): SceneContext {
    const userKey = userId;
    if (!this.userSceneContexts[userKey]) {
      this.userSceneContexts[userKey] = {
        type: 'patrol',
        threatLevel: 'low',
        timeOfDay: new Date().getHours() > 18 || new Date().getHours() < 6 ? 'night' : 'day'
      };
    }
    return this.userSceneContexts[userKey];
  }

  /**
   * Update scene context for a user
   */
  updateSceneContext(userId: string, context: Partial<SceneContext>): void {
    const userKey = userId;
    this.userSceneContexts[userKey] = {
      ...this.getSceneContext(userId),
      ...context
    };
    
    // Log context change
    logSystem('SceneContextUpdated', { userId, context: this.userSceneContexts[userKey] });
  }

  private async processInput(input: OrchestratorInput): Promise<void> {
    logSystem('ProcessInputStart', { input }, undefined, input.orgId);
    try {
      // Check if input is feedback on a previous response
      if (input.content.match(/rate\s+\d/i)) {
        this.handleFeedback(input);
        return;
      }

      // Enhanced intent recognition using our new service
      const intent = await this.recognizeIntent(input);
      console.log('[Orchestrator] Recognized intent:', intent);

      // Update scene context based on intent
      this.updateSceneContextFromIntent(input.userId, intent);

      // Decide on action based on enhanced intent
      const action = await this.decideNextAction(input, intent);

      // Execute action with enhanced capabilities
      await this.executeAction(input, intent, action);

    } catch (err: any) {
      logSystem('ProcessInputError', { error: err?.message || err, input }, undefined, input.orgId);
      console.error('[Orchestrator] Process input error:', err);
      
      // Send error response
      const errorResponse: OrchestratorResponse = {
        orgId: input.orgId,
        userId: input.userId,
        type: 'text',
        content: "I encountered an error processing your request. Please try again.",
      };
      this.emitResponse(errorResponse);
    }
  }

  /**
   * Enhanced intent recognition using the new IntentRecognitionService
   */
  private async recognizeIntent(input: OrchestratorInput): Promise<LawEnforcementIntent> {
    try {
      if (!this.isInitialized) {
        console.warn('[Orchestrator] Services not initialized, using fallback classification');
        return this.fallbackIntentClassification(input);
      }

      // Get current scene context
      const sceneContext = this.getSceneContext(input.userId);
      
      // Get conversation history for context
      const context = ContextManager.getContext(input.orgId, input.userId);
      const conversationHistory = context.conversationHistory.slice(-5);

      // Use enhanced intent recognition
      const intent = await intentRecognitionService.recognizeIntent(
        input.content,
        sceneContext,
        conversationHistory
      );

      return intent;
    } catch (error) {
      console.error('[Orchestrator] Intent recognition error:', error);
      return this.fallbackIntentClassification(input);
    }
  }

  /**
   * Fallback intent classification for when services aren't available
   */
  private fallbackIntentClassification(input: OrchestratorInput): LawEnforcementIntent {
    const text = input.content.toLowerCase();

    // High priority safety keywords
    if (text.includes('backup') || text.includes('assistance') || text.includes('help')) {
      return {
        intent: 'request_backup',
        confidence: 0.8,
        entities: { urgency: text.includes('emergency') ? 'emergency' : 'routine' },
        suggestedActions: ['send_backup_request', 'notify_supervisor'],
        priority: 'critical'
      };
    }

    if (text.includes('miranda') || text.includes('rights')) {
      return {
        intent: 'miranda_rights',
        confidence: 0.9,
        entities: { language: text.includes('spanish') ? 'spanish' : 'english' },
        suggestedActions: ['deliver_miranda', 'log_compliance'],
        priority: 'critical'
      };
    }

    if (text.includes('navigate') || text.includes('route') || text.includes('directions')) {
      return {
        intent: 'navigate_to',
        confidence: 0.8,
        entities: { destination: input.content },
        suggestedActions: ['start_navigation', 'calculate_route'],
        priority: 'medium'
      };
    }

    if (text.includes('arriving') || text.includes('on scene') || text.includes('at location')) {
      return {
        intent: 'arriving_scene',
        confidence: 0.8,
        entities: { time: Date.now() },
        suggestedActions: ['notify_dispatch', 'activate_camera', 'assess_scene'],
        priority: 'high'
      };
    }

    // Default general query
    return {
      intent: 'general_query',
      confidence: 0.5,
      entities: {},
      suggestedActions: ['general_assistance'],
      priority: 'low'
    };
  }

  /**
   * Update scene context based on recognized intent
   */
  private updateSceneContextFromIntent(userId: string, intent: LawEnforcementIntent): void {
    const currentContext = this.getSceneContext(userId);
    let updatedContext: Partial<SceneContext> = {};

    switch (intent.intent) {
      case 'threat_detected':
        updatedContext = { threatLevel: 'critical', weapons: true };
        break;
      case 'traffic_stop':
        updatedContext = { type: 'traffic_stop' };
        break;
      case 'arriving_scene':
        if (intent.entities?.scene_type) {
          updatedContext = { type: intent.entities.scene_type };
        }
        break;
      case 'arrest_made':
        updatedContext = { type: 'arrest', suspects: intent.entities?.suspect_count || 1 };
        break;
      case 'scene_secure':
        updatedContext = { threatLevel: 'low' };
        break;
    }

    if (Object.keys(updatedContext).length > 0) {
      this.updateSceneContext(userId, updatedContext);
    }
  }

  /**
   * Enhanced action decision making
   */
  private async decideNextAction(input: OrchestratorInput, intent: LawEnforcementIntent): Promise<Action> {
    switch (intent.intent) {
      case 'navigate_to':
        return {
          type: 'navigation',
          destination: intent.entities?.destination || input.content,
          priority: intent.priority === 'critical' ? 'emergency' : 'routine'
        };

      case 'request_backup':
        return {
          type: 'dispatch_notification',
          params: { type: 'backup_request', urgency: intent.entities?.urgency || 'routine' }
        };

      case 'miranda_rights':
        return {
          type: 'miranda',
          language: intent.entities?.language || 'english'
        };

      case 'arriving_scene':
      case 'scene_secure':
      case 'arrest_made':
        return {
          type: 'compliance_check',
          params: { action: intent.intent, timestamp: Date.now() }
        };

      case 'statute_lookup':
        return {
          type: 'statute_search'
        };

      case 'tool_use':
        return {
          type: 'tool_use',
          toolId: intent.entities?.toolId,
          params: intent.entities?.params || {}
        };

      default:
        return {
          type: 'llm_response'
        };
    }
  }

  /**
   * Enhanced action execution with law enforcement capabilities
   */
  private async executeAction(input: OrchestratorInput, intent: LawEnforcementIntent, action: Action): Promise<void> {
    switch (action.type) {
      case 'navigation':
        await this.handleNavigation(input, action);
        break;

      case 'dispatch_notification':
        await this.handleDispatchNotification(input, action);
        break;

      case 'compliance_check':
        await this.handleComplianceCheck(input, intent, action);
        break;

      case 'statute_search':
        this.handleStatuteSearch(input.orgId, input.userId, input.content);
        break;

      case 'miranda':
        await this.handleMiranda(input.orgId, input.userId, action.language || 'english');
        break;

      case 'tool_use':
        await this.invokeTool(input, action);
        break;

      case 'llm_response':
      default:
        await this.handleLLMResponse(input, intent);
        break;
    }
  }

  /**
   * Handle navigation requests with Mapbox integration
   */
  private async handleNavigation(input: OrchestratorInput, action: Action): Promise<void> {
    try {
      if (!mapboxService.isAvailable()) {
        const response: OrchestratorResponse = {
          orgId: input.orgId,
          userId: input.userId,
          type: 'text',
          content: 'Navigation service is not available. Please check your location settings.',
        };
        this.emitResponse(response);
        return;
      }

      const destination = action.destination || '';
      const priority = action.priority || 'routine';

      // Get emergency route with traffic considerations
      const routeResult = await mapboxService.getEmergencyRoute(destination, priority);

      if (routeResult.route) {
        const route = routeResult.route;
        const eta = route.eta.toLocaleTimeString();
        const distance = (route.distance / 1000).toFixed(1); // Convert to km
        const duration = Math.round(route.duration / 60); // Convert to minutes

        const responseText = `🗺️ Route calculated to ${destination}. Distance: ${distance} km, ETA: ${eta} (${duration} min). ${route.traffic ? `Traffic: ${route.traffic}` : ''}`;

        const response: OrchestratorResponse = {
          orgId: input.orgId,
          userId: input.userId,
          type: 'navigation',
          content: responseText,
          metadata: {
            route: route,
            destination: destination,
            priority: priority
          }
        };

        this.emitResponse(response);
        await this.speakWithLiveKit(input.userId, responseText);

        // Log navigation start
        logSystem('NavigationStarted', { destination, route: { distance, duration, traffic: route.traffic } }, { userId: input.userId }, input.orgId);
      } else {
        const errorResponse: OrchestratorResponse = {
          orgId: input.orgId,
          userId: input.userId,
          type: 'text',
          content: `Unable to calculate route to ${destination}. Please check the address and try again.`,
        };
        this.emitResponse(errorResponse);
      }

    } catch (error) {
      console.error('[Orchestrator] Navigation error:', error);
      const errorResponse: OrchestratorResponse = {
        orgId: input.orgId,
        userId: input.userId,
        type: 'text',
        content: 'Navigation service encountered an error. Please try again.',
      };
      this.emitResponse(errorResponse);
    }
  }

  /**
   * Handle dispatch notifications
   */
  private async handleDispatchNotification(input: OrchestratorInput, action: Action): Promise<void> {
    try {
      const notificationType = action.params?.type || 'general';
      const urgency = action.params?.urgency || 'routine';

      // Get current location for dispatch
      const location = await getCurrentLocation();
      const locationText = location ? `${location.latitude}, ${location.longitude}` : 'Location unavailable';

      let responseText = '';
      
      switch (notificationType) {
        case 'backup_request':
          responseText = `🚨 Backup request sent. Location: ${locationText}. Urgency: ${urgency.toUpperCase()}. Units being dispatched.`;
          break;
        case 'arrival_notification':
          responseText = `📍 Arrival notification sent to dispatch. Location: ${locationText}.`;
          break;
        case 'status_update':
          responseText = `📢 Status update sent to dispatch. Current location: ${locationText}.`;
          break;
        default:
          responseText = `📡 Notification sent to dispatch. Location: ${locationText}.`;
      }

      const response: OrchestratorResponse = {
        orgId: input.orgId,
        userId: input.userId,
        type: 'action',
        content: responseText,
        metadata: {
          type: 'dispatch_notification',
          urgency: urgency,
          location: location,
          timestamp: Date.now()
        }
      };

      this.emitResponse(response);
      await this.speakWithLiveKit(input.userId, responseText);

      // Log dispatch notification
      logSystem('DispatchNotification', { type: notificationType, urgency, location }, { userId: input.userId }, input.orgId);

    } catch (error) {
      console.error('[Orchestrator] Dispatch notification error:', error);
      const errorResponse: OrchestratorResponse = {
        orgId: input.orgId,
        userId: input.userId,
        type: 'text',
        content: 'Failed to send dispatch notification. Please try again.',
      };
      this.emitResponse(errorResponse);
    }
  }

  /**
   * Handle compliance checks and logging
   */
  private async handleComplianceCheck(input: OrchestratorInput, intent: LawEnforcementIntent, action: Action): Promise<void> {
    const actionType = action.params?.action || intent.intent;
    
    let responseText = '';
    let complianceData: any = {};

    switch (actionType) {
      case 'arriving_scene':
        responseText = '📍 Arrival logged. Camera activated. Scene assessment initiated. Dispatch notified.';
        complianceData = { action: 'scene_arrival', timestamp: Date.now(), camera_activated: true };
        break;

      case 'scene_secure':
        responseText = '✅ Scene secured. Status updated. Threat level reduced. All units notified.';
        complianceData = { action: 'scene_secured', timestamp: Date.now(), threat_level: 'low' };
        break;

      case 'arrest_made':
        responseText = '🔒 Arrest logged. Miranda rights required. Documentation started. Supervisor notified.';
        complianceData = { action: 'arrest_made', timestamp: Date.now(), miranda_required: true };
        break;

      default:
        responseText = `✓ ${actionType.replace('_', ' ')} logged for compliance.`;
        complianceData = { action: actionType, timestamp: Date.now() };
    }

    // Log compliance action
    logCompliance('ComplianceAction', complianceData, input.userId, undefined, undefined, input.orgId);

    const response: OrchestratorResponse = {
      orgId: input.orgId,
      userId: input.userId,
      type: 'action',
      content: responseText,
      metadata: {
        type: 'compliance_check',
        action: actionType,
        data: complianceData
      }
    };

    this.emitResponse(response);
    await this.speakWithLiveKit(input.userId, responseText);
  }

  /**
   * Enhanced LLM response handling
   */
  private async handleLLMResponse(input: OrchestratorInput, intent: LawEnforcementIntent): Promise<void> {
    try {
      const retrievedSnippets = await this.retrieveKnowledge(input.content);
      const history = ContextManager.getContext(input.orgId, input.userId).conversationHistory || [];
      const mappedHistory = history.map(m => ({ role: m.role, content: m.content }));

      // Select appropriate LLM based on intent
      const selectedClient = this.selectLLM(intent, input.userId, input.orgId);
      const clientName = (selectedClient as any).constructor.name || 'UnknownClient';

      const startTime = Date.now();
      console.log(`[Orchestrator] Starting request to ${clientName} for intent: ${intent.intent}`);

      // Enhanced prompt with law enforcement context
      const enhancedHistory = [
        ...mappedHistory,
        {
          role: 'system',
          content: `Current scene: ${this.getSceneContext(input.userId).type}, threat level: ${this.getSceneContext(input.userId).threatLevel}. Respond as LARK, a law enforcement AI assistant.`
        }
      ];

      const reply = await selectedClient.generateReply(input.userId, enhancedHistory, retrievedSnippets);

      const responseTime = Date.now() - startTime;
      console.log(`[Orchestrator] Response from ${clientName} took ${responseTime}ms`);
      logAnalytics('LLMResponseTime', { client: clientName, intent: intent.intent, responseTime }, input.userId, undefined, undefined, input.orgId);

      const response: OrchestratorResponse = {
        orgId: input.orgId,
        userId: input.userId,
        type: 'text',
        content: reply,
        metadata: {
          intent: intent.intent,
          confidence: intent.confidence,
          client: clientName
        }
      };

      this.emitResponse(response);
      await this.speakWithLiveKit(input.userId, reply);

    } catch (error) {
      console.error('[Orchestrator] LLM response error:', error);
      const errorResponse: OrchestratorResponse = {
        orgId: input.orgId,
        userId: input.userId,
        type: 'text',
        content: "I apologize, but I'm having trouble processing your request right now. Please try again.",
      };
      this.emitResponse(errorResponse);
    }
  }

  /**
   * Enhanced LLM selection based on law enforcement intent
   */
  private selectLLM(intent: LawEnforcementIntent, userId: string = '', orgId: string = ''): LLMClient {
    // Use Groq for fast emergency responses
    if (intent.priority === 'critical' && this.groqClient && (this.groqClient as any).apiKey) {
      console.log('[Orchestrator] Using GroqClient for critical priority intent');
      return this.groqClient;
    }

    // Use Anthropic for legal/compliance analysis
    if ((intent.intent.includes('statute') || intent.intent.includes('compliance') || intent.intent.includes('miranda')) 
        && this.anthropicClient && (this.anthropicClient as any).apiKey) {
      console.log('[Orchestrator] Using AnthropicClient for legal analysis');
      return this.anthropicClient;
    }

    // Use OpenAI for general law enforcement assistance
    if (this.openAIClient && (this.openAIClient as any).apiKey) {
      console.log('[Orchestrator] Using OpenAIClient for law enforcement assistance');
      return this.openAIClient;
    }

    // Fallback to Quasar
    console.log('[Orchestrator] Using QuasarClient as fallback');
    return this.quasarClient;
  }

  // Method to handle user feedback on LLM responses
  private handleFeedback(input: OrchestratorInput): void {
    const ratingMatch = input.content.match(/rate\s+(\d)/i);
    if (ratingMatch && ratingMatch[1]) {
      const rating = parseInt(ratingMatch[1], 10);
      if (rating >= 1 && rating <= 5) {
        console.log(`[Orchestrator] Feedback received: Rating ${rating}`);
        logAnalytics('LLMFeedback', { rating }, input.userId, undefined, undefined, input.orgId);

        const feedbackResponse: OrchestratorResponse = {
          orgId: input.orgId,
          userId: input.userId,
          type: 'text',
          content: `Thank you for your feedback! You rated this response ${rating}/5.`
        };
        this.emitResponse(feedbackResponse);
      } else {
        const invalidRatingResponse: OrchestratorResponse = {
          orgId: input.orgId,
          userId: input.userId,
          type: 'text',
          content: "Invalid rating. Please provide a number between 1 and 5."
        };
        this.emitResponse(invalidRatingResponse);
      }
    }
  }

  private async invokeTool(input: OrchestratorInput, action: Action): Promise<void> {
    if (!action.toolId) {
      console.error('[Orchestrator] invokeTool called without a toolId in the action.');
      const errorResponse: OrchestratorResponse = {
        orgId: input.orgId,
        userId: input.userId,
        type: 'text',
        content: 'Sorry, I could not determine which tool to use.',
      };
      this.emitResponse(errorResponse);
      return;
    }

    try {
      const toolId = action.toolId;
      const params = action.params || {};
      console.log(`[Orchestrator] Invoking tool: ${toolId} with params:`, params);
      logSystem('ToolInvocationStart', { toolId, params }, { userId: input.userId }, input.orgId);

      const timerLabel = `Tool Execution: ${toolId}`;
      console.time(timerLabel);
      let result;
      try {
        result = await toolManager.invokeTool(toolId, params);
        console.timeEnd(timerLabel);
        logSystem('ToolInvocationSuccess', { toolId, params, result }, { userId: input.userId }, input.orgId);
      } catch (toolError) {
        console.timeEnd(timerLabel);
        throw toolError;
      }

      const response: OrchestratorResponse = {
        orgId: input.orgId,
        userId: input.userId,
        type: 'text',
        content: result,
      };
      this.emitResponse(response);
    } catch (error: any) {
      logSystem('ToolInvocationError', { toolId: action.toolId, params: action.params, error: error?.message || error }, { userId: input.userId }, input.orgId);
      console.error('[Orchestrator] Tool invocation error:', error);
      const response: OrchestratorResponse = {
        orgId: input.orgId,
        userId: input.userId,
        type: 'text',
        content: 'Sorry, I encountered an error executing the tool.',
      };
      this.emitResponse(response);
    }
  }

  private handleStatuteSearch(orgId: string, userId: string, query: string) {
    const lowerQuery = query.toLowerCase();

    const match = this.statutes.find(s =>
      lowerQuery.includes(s.code.toLowerCase()) ||
      lowerQuery.includes(s.title.toLowerCase())
    );

    let responseText: string;

    if (match) {
      responseText = `📚 ${match.code} - ${match.title}: ${match.text}`;
    } else {
      responseText = 'Sorry, I could not find a relevant statute. Please try a more specific search term.';
    }

    const response: OrchestratorResponse = {
      orgId,
      userId,
      type: 'text',
      content: responseText,
    };

    this.emitResponse(response);
    this.speakWithLiveKit(userId, responseText, true);
  }

  private async handleMiranda(orgId: string, userId: string, language: string) {
    const mirandaEnglish = "You have the right to remain silent. Anything you say can and will be used against you in a court of law. You have the right to an attorney. If you cannot afford an attorney, one will be provided for you. Do you understand these rights?";

    // TODO: Implement proper translations
    const translated = language === 'english'
      ? mirandaEnglish
      : `[${language.toUpperCase()} TRANSLATION NOT AVAILABLE]: ${mirandaEnglish}`;

    // Log the Miranda delivery
    logCompliance('MirandaRightsDelivered', { language, text: translated }, userId, undefined, undefined, orgId);

    const response: OrchestratorResponse = {
      orgId,
      userId,
      type: 'text',
      content: `⚖️ ${translated}`,
      metadata: {
        workflow: 'miranda',
        language,
        timestamp: Date.now(),
      },
    };

    this.emitResponse(response);
    await this.speakWithLiveKit(userId, translated);
  }

  private async retrieveKnowledge(query: string): Promise<string[]> {
    // Temporary fix: disable Pinecone retrieval to avoid errors
    return [];
  }

  private async speakWithLiveKit(userId: string, text: string, forceLiveKit: boolean = false): Promise<void> {
    try {
      // For now, just log the speech request
      console.log(`[Orchestrator] Speech request for ${userId}: ${text}`);
    } catch (error) {
      console.error(`[Orchestrator] Speech error for ${userId}:`, error);
    }
  }
}

export const orchestratorService = new OrchestratorService();
