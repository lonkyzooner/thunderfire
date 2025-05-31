import { Message } from '../contexts/ConversationContext';
import { liveKitVoiceService } from '../services/livekit/LiveKitVoiceService';
import { queryPinecone } from './pineconeClient';
import statutesData from '../data/statutes.json';
import {
  LLMClient,
  QuasarClient
} from './llmClients';
import { toolManager } from './ToolManager';
import { ContextManager } from './ContextManager';
import { logSystem, logCompliance, logAnalytics } from '../lib/auditLogger';
import { WorkflowManager, WorkflowEvent, SuggestedAction, WorkflowState } from './WorkflowManager';

type InputType = 'voice' | 'text' | 'ui';

export interface OrchestratorInput {
  orgId: string;
  userId: string;
  type: InputType;
  content: string;
  metadata?: Record<string, any>;
}

export interface OrchestratorResponse {
  orgId: string;
  userId: string;
  type: 'text' | 'voice' | 'action';
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

class OrchestratorService {
  private listeners: Record<string, ResponseListener[]> = {};
  private quasarClient: LLMClient;

  private statutes: Statute[] = [];

  constructor() {
    logSystem('OrchestratorServiceInitialized', { message: 'Orchestrator initialized' });
    console.log('[Orchestrator] Initialized');
    this.quasarClient = new QuasarClient(import.meta.env.VITE_OPENROUTER_API_KEY || 'dummy');

    this.statutes = statutesData as Statute[];
    this.statutes = statutesData as Statute[];
    this.statutes = statutesData as Statute[];
    this.statutes = statutesData as Statute[];
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

    // ContextManager.addMessage called earlier handles history
    this.processInput(input);
  }

  // Expose workflow state and suggestions for UI
  getWorkflowState(orgId: string, userId: string): WorkflowState | null {
    return WorkflowManager.getCurrentWorkflowState(orgId, userId);
  }

  getWorkflowSuggestions(orgId: string, userId: string): SuggestedAction[] {
    return WorkflowManager.suggestNextActions(orgId, userId);
  }

  private async processInput(input: OrchestratorInput): Promise<void> {
    logSystem('ProcessInputStart', { input }, undefined, input.orgId);
    try {
      const intent = await this.classifyIntent(input);

      const action = await this.decideNextAction(input, intent);

      switch (action.type) {
        case 'statute_search':
          this.handleStatuteSearch(input.orgId, input.userId, input.content);
          break;
        case 'miranda':
          this.handleMiranda(input.orgId, input.userId, action.language || 'english');
          break;
        case 'tool_use':
          await this.invokeTool(input, intent, action);
          break;
        case 'llm_response':
        default:
          const reply = await this.routeToLLM(input, intent, action);
          const textResponse: OrchestratorResponse = {
            orgId: input.orgId,
            userId: input.userId,
            type: 'text',
            content: reply,
          };
          this.emitResponse(textResponse);
          this.speakWithLiveKit(input.userId, reply);
          break;
      }
    } catch (err: any) {
      logSystem('ProcessInputError', { error: err?.message || err, input }, undefined, input.orgId);
      throw err;
    }
  }

  private async classifyIntent(input: OrchestratorInput): Promise<string> {
    // Placeholder: Replace with ML/LLM-based intent classification
    const text = input.content.toLowerCase();
    if (text.includes('search') || text.includes('find') || text.includes('statute') || text.includes('law')) return 'search';
    if (text.includes('miranda')) return 'miranda';
    // Future: add more intents like 'translate', 'dispatch', 'report', 'tool_use'
    return 'general';
  }

  private async decideNextAction(input: OrchestratorInput, intent: string): Promise<any> {
    // Placeholder: Expand with context-aware decision logic
    if (intent === 'search') {
      return { type: 'statute_search' };
    }
    if (intent === 'miranda') {
      return { type: 'miranda', language: 'english' }; // Future: parse language
    }
    // Future: add tool use decision here
    return { type: 'llm_response' };
  }

  private async routeToLLM(input: OrchestratorInput, intent: string, action: any): Promise<string> {
    try {
      const retrievedSnippets = await this.retrieveKnowledge(input.content);
      const history = ContextManager.getContext(input.orgId, input.userId).conversationHistory || [];
      // Ensure we only map relevant fields if ContextManager's history type differs slightly
      const mappedHistory = history.map(m => ({ role: m.role, content: m.content }));

      const selected = this.selectLLM(intent);
      console.log(`[Orchestrator] Routing to LLM: ${selected.name}`);

      const reply = await selected.client.generateReply(input.userId, mappedHistory, retrievedSnippets);
      return reply;
    } catch (error) {
      console.error('[Orchestrator] LLM error:', error);
      // Return a more graceful error message
      return "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.";
    }
  }

  private selectLLM(intent: string): { name: string; client: QuasarClient } {
    // Use Quasar Alpha via OpenRouter for all LLM responses
    return { name: 'QuasarAlpha', client: this.quasarClient };
  }

  private async invokeTool(input: OrchestratorInput, intent: string, action: any): Promise<void> {
    try {
      // For now, parse toolId and params from input content as JSON or fallback
      let toolId = 'fetch_weather';
      let params: Record<string, any> = {};

      try {
        const parsed = JSON.parse(input.content);
        toolId = parsed.toolId || toolId;
        params = parsed.params || {};
      } catch {
        // Not JSON, fallback to default tool or parse heuristically
        if (input.content.toLowerCase().includes('weather')) {
          toolId = 'fetch_weather';
          params.city = input.content.replace(/.*weather in/i, '').trim() || 'New Orleans';
        } else if (input.content.toLowerCase().includes('zapier')) {
          toolId = 'trigger_zapier';
          params.url = 'https://hooks.zapier.com/hooks/catch/123456/abcde'; // Example URL
          params.payload = { message: input.content };
        }
      }

      const result = await toolManager.invokeTool(toolId, params);

      const response: OrchestratorResponse = {
        orgId: input.orgId,
        userId: input.userId,
        type: 'text',
        content: result,
      };
      this.emitResponse(response);
    } catch (error) {
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

  private parseIntent(text: string): string | null {
    const lower = text.toLowerCase();
    if (lower.includes('search') || lower.includes('find') || lower.includes('statute') || lower.includes('law')) return 'search';
    if (lower.includes('miranda')) return 'miranda';
    return null;
  }

  private handleStatuteSearch(orgId: string, userId: string, query: string) {
    const lowerQuery = query.toLowerCase();

    const match = this.statutes.find(s =>
      lowerQuery.includes(s.code.toLowerCase()) ||
      lowerQuery.includes(s.title.toLowerCase())
    );

    let responseText: string;

    if (match) {
      responseText = `${match.code} - ${match.title}: ${match.text}`;
    } else {
      responseText = 'Sorry, I could not find a relevant statute.';
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

    const translated = language === 'english'
      ? mirandaEnglish
      : `[${language.toUpperCase()} TRANSLATION NOT AVAILABLE]: ${mirandaEnglish}`;

    // Log the Miranda delivery
    // Log action via ContextManager (already done before this block)
    ContextManager.addAction(orgId, userId, 'MirandaRightsDelivered', { language, text: translated });
    logCompliance('MirandaRightsDelivered', { language, text: translated }, userId, undefined, undefined, orgId);

    const response: OrchestratorResponse = {
      orgId,
      userId,
      type: 'text',
      content: translated,
      metadata: {
        workflow: 'miranda',
        language,
        timestamp: Date.now(),
      },
    };

    this.emitResponse(response);
    this.speakWithLiveKit(userId, translated);
  }


  private async retrieveKnowledge(query: string): Promise<string[]> {
    // Temporary fix: disable Pinecone retrieval to avoid errors
    return [];
  }


  private async speakWithLiveKit(userId: string, text: string, forceLiveKit: boolean = false) {
    try {
      await liveKitVoiceService.speak(text, 'ash', undefined, forceLiveKit);

      const voiceResponse: OrchestratorResponse = {
        orgId: '', // orgId not available in this context, set to empty or refactor as needed
        userId,
        type: 'voice',
        content: text,
      };

      this.emitResponse(voiceResponse);
    } catch (error) {
      console.error('[Orchestrator] LiveKit TTS error:', error);
    }
  }

  // getHistory and getMirandaLogs removed, use ContextManager directly
}

export const orchestratorService = new OrchestratorService();
