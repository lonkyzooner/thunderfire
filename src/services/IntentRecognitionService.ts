/**
 * Intent Recognition Service for LARK
 * 
 * Uses Groq for fast inference to classify law enforcement intents
 * and extract entities from officer voice/text commands
 */

import { GroqClient } from './llmClients';
import { getEnv } from './system/envService';

export interface LawEnforcementIntent {
  intent: string;
  confidence: number;
  entities: Record<string, any>;
  suggestedActions: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  context?: string;
}

export interface SceneContext {
  type: 'traffic_stop' | 'domestic_disturbance' | 'foot_pursuit' | 'welfare_check' | 'arrest' | 'investigation' | 'patrol' | 'unknown';
  location?: string;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  timeOfDay: 'day' | 'night';
  backup?: 'requested' | 'en_route' | 'on_scene' | 'not_needed';
  suspects?: number;
  weapons?: boolean;
}

class IntentRecognitionService {
  private groqClient: GroqClient;
  private isInitialized = false;

  // Law enforcement specific intents with examples
  private lawEnforcementIntents = {
    // Navigation & Location
    'navigate_to': {
      examples: ['navigate to 123 main street', 'take me to the hospital', 'route to backup location'],
      entities: ['address', 'destination_type'],
      actions: ['start_navigation', 'update_dispatch', 'estimate_eta'],
      priority: 'medium' as const
    },
    'find_location': {
      examples: ['where is the nearest hospital', 'find safe staging area', 'locate backup units'],
      entities: ['location_type', 'radius'],
      actions: ['search_nearby', 'display_map', 'provide_directions'],
      priority: 'medium' as const
    },

    // Incident Management
    'arriving_scene': {
      examples: ['arriving at scene', 'on location', 'at the call'],
      entities: ['location', 'time'],
      actions: ['notify_dispatch', 'activate_camera', 'assess_scene'],
      priority: 'high' as const
    },
    'request_backup': {
      examples: ['request backup', 'need assistance', 'send units', 'emergency backup'],
      entities: ['urgency', 'reason', 'location'],
      actions: ['send_backup_request', 'update_threat_level', 'notify_supervisor'],
      priority: 'critical' as const
    },
    'scene_secure': {
      examples: ['scene is secure', 'all clear', 'situation under control'],
      entities: ['status', 'time'],
      actions: ['notify_dispatch', 'update_status', 'deactivate_alerts'],
      priority: 'high' as const
    },

    // Suspect Interaction
    'suspect_contact': {
      examples: ['making contact with suspect', 'approaching subject', 'detained individual'],
      entities: ['suspect_count', 'behavior', 'cooperation'],
      actions: ['activate_camera', 'update_dispatch', 'prepare_miranda'],
      priority: 'high' as const
    },
    'miranda_rights': {
      examples: ['read miranda rights', 'deliver miranda', 'miranda in spanish'],
      entities: ['language', 'suspect_count'],
      actions: ['deliver_miranda', 'log_compliance', 'activate_recording'],
      priority: 'critical' as const
    },
    'arrest_made': {
      examples: ['suspect in custody', 'making arrest', 'placing under arrest'],
      entities: ['suspect_count', 'charges', 'location'],
      actions: ['deliver_miranda', 'start_arrest_report', 'notify_booking'],
      priority: 'critical' as const
    },

    // Evidence & Documentation
    'collect_evidence': {
      examples: ['photographing evidence', 'collecting items', 'documenting scene'],
      entities: ['evidence_type', 'location', 'quantity'],
      actions: ['activate_camera', 'start_evidence_log', 'GPS_tag'],
      priority: 'medium' as const
    },
    'start_report': {
      examples: ['start incident report', 'begin documentation', 'create report'],
      entities: ['report_type', 'incident_number'],
      actions: ['open_report_form', 'populate_details', 'voice_dictation'],
      priority: 'medium' as const
    },

    // Safety & Threats
    'threat_detected': {
      examples: ['shots fired', 'weapon visible', 'aggressive behavior', 'officer safety'],
      entities: ['threat_type', 'weapon_type', 'suspect_behavior'],
      actions: ['request_emergency_backup', 'escalate_threat_level', 'alert_supervisor'],
      priority: 'critical' as const
    },
    'officer_safety': {
      examples: ['officer down', 'need medical', 'injured officer', 'emergency assistance'],
      entities: ['injury_type', 'severity', 'location'],
      actions: ['emergency_alert', 'request_ems', 'send_all_units'],
      priority: 'critical' as const
    },

    // Vehicle Operations
    'traffic_stop': {
      examples: ['conducting traffic stop', 'vehicle pulled over', 'license plate run'],
      entities: ['license_plate', 'vehicle_description', 'violation'],
      actions: ['run_plate', 'notify_dispatch', 'activate_camera'],
      priority: 'medium' as const
    },
    'pursuit': {
      examples: ['in pursuit', 'vehicle fleeing', 'foot chase'],
      entities: ['direction', 'vehicle_description', 'speed'],
      actions: ['notify_all_units', 'request_air_support', 'coordinate_units'],
      priority: 'critical' as const
    },

    // Information Requests
    'statute_lookup': {
      examples: ['what is the statute for', 'look up law', 'legal code for'],
      entities: ['crime_type', 'jurisdiction'],
      actions: ['search_statutes', 'display_legal_text', 'provide_guidance'],
      priority: 'low' as const
    },
    'dispatch_check': {
      examples: ['check with dispatch', 'any updates', 'status check'],
      entities: ['update_type'],
      actions: ['contact_dispatch', 'check_messages', 'update_status'],
      priority: 'low' as const
    }
  };

  constructor() {
    const env = getEnv();
    this.groqClient = new GroqClient(env.GROQ_API_KEY);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Test Groq connection
      await this.groqClient.generateReply('test', [{ role: 'user', content: 'test' }], []);
      this.isInitialized = true;
      console.log('[IntentRecognition] Service initialized successfully');
    } catch (error) {
      console.warn('[IntentRecognition] Groq client not available, using fallback classification');
      this.isInitialized = false;
    }
  }

  /**
   * Recognize intent from officer's voice/text input
   */
  async recognizeIntent(
    input: string, 
    context?: SceneContext,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<LawEnforcementIntent> {
    try {
      if (this.isInitialized) {
        return await this.recognizeWithGroq(input, context, conversationHistory);
      } else {
        return this.recognizeWithRules(input, context);
      }
    } catch (error) {
      console.error('[IntentRecognition] Error recognizing intent:', error);
      return this.recognizeWithRules(input, context);
    }
  }

  /**
   * Advanced intent recognition using Groq LLM
   */
  private async recognizeWithGroq(
    input: string,
    context?: SceneContext,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<LawEnforcementIntent> {
    const systemPrompt = `You are an intent recognition system for law enforcement officers. 
    
    Analyze the officer's input and return a JSON response with:
    {
      "intent": "one of the predefined intents",
      "confidence": 0.0-1.0,
      "entities": {"key": "value"},
      "suggestedActions": ["action1", "action2"],
      "priority": "low|medium|high|critical",
      "context": "brief explanation"
    }

    Available intents: ${Object.keys(this.lawEnforcementIntents).join(', ')}
    
    Current scene context: ${context ? JSON.stringify(context) : 'unknown'}
    
    Consider the urgency and safety implications of the officer's request.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []).slice(-3), // Last 3 messages for context
      { role: 'user', content: `Officer input: "${input}"` }
    ];

    try {
      const response = await this.groqClient.generateReply('intent_recognition', messages, []);
      const parsed = JSON.parse(response);
      
      return {
        intent: parsed.intent || 'unknown',
        confidence: parsed.confidence || 0.5,
        entities: parsed.entities || {},
        suggestedActions: parsed.suggestedActions || [],
        priority: parsed.priority || 'medium',
        context: parsed.context
      };
    } catch (error) {
      console.warn('[IntentRecognition] Groq parsing failed, falling back to rules');
      return this.recognizeWithRules(input, context);
    }
  }

  /**
   * Fallback rule-based intent recognition
   */
  private recognizeWithRules(input: string, context?: SceneContext): LawEnforcementIntent {
    const lowerInput = input.toLowerCase();
    
    // High priority safety keywords
    if (this.containsKeywords(lowerInput, ['shots fired', 'weapon', 'gun', 'knife', 'officer down'])) {
      return {
        intent: 'threat_detected',
        confidence: 0.9,
        entities: { threat_type: this.extractThreatType(lowerInput) },
        suggestedActions: ['request_emergency_backup', 'escalate_threat_level'],
        priority: 'critical'
      };
    }

    // Backup requests
    if (this.containsKeywords(lowerInput, ['backup', 'assistance', 'help', 'units'])) {
      return {
        intent: 'request_backup',
        confidence: 0.8,
        entities: { urgency: this.extractUrgency(lowerInput) },
        suggestedActions: ['send_backup_request', 'notify_supervisor'],
        priority: 'critical'
      };
    }

    // Miranda rights
    if (this.containsKeywords(lowerInput, ['miranda', 'rights', 'read rights'])) {
      return {
        intent: 'miranda_rights',
        confidence: 0.9,
        entities: { language: this.extractLanguage(lowerInput) },
        suggestedActions: ['deliver_miranda', 'log_compliance', 'activate_recording'],
        priority: 'critical'
      };
    }

    // Navigation
    if (this.containsKeywords(lowerInput, ['navigate', 'route', 'directions', 'take me to'])) {
      return {
        intent: 'navigate_to',
        confidence: 0.8,
        entities: { destination: this.extractDestination(lowerInput) },
        suggestedActions: ['start_navigation', 'update_dispatch'],
        priority: 'medium'
      };
    }

    // Scene arrival
    if (this.containsKeywords(lowerInput, ['arriving', 'on scene', 'at location', 'on site'])) {
      return {
        intent: 'arriving_scene',
        confidence: 0.8,
        entities: { time: Date.now() },
        suggestedActions: ['notify_dispatch', 'activate_camera', 'assess_scene'],
        priority: 'high'
      };
    }

    // Statute lookup
    if (this.containsKeywords(lowerInput, ['statute', 'law', 'legal', 'code', 'what is'])) {
      return {
        intent: 'statute_lookup',
        confidence: 0.7,
        entities: { query: input },
        suggestedActions: ['search_statutes', 'display_legal_text'],
        priority: 'low'
      };
    }

    // Default fallback
    return {
      intent: 'general_query',
      confidence: 0.3,
      entities: {},
      suggestedActions: ['general_assistance'],
      priority: 'low',
      context: 'Unable to classify specific law enforcement intent'
    };
  }

  private containsKeywords(input: string, keywords: string[]): boolean {
    return keywords.some(keyword => input.includes(keyword));
  }

  private extractThreatType(input: string): string {
    if (input.includes('gun') || input.includes('firearm')) return 'firearm';
    if (input.includes('knife') || input.includes('blade')) return 'edged_weapon';
    if (input.includes('weapon')) return 'weapon';
    if (input.includes('aggressive')) return 'aggressive_behavior';
    return 'unknown';
  }

  private extractUrgency(input: string): string {
    if (input.includes('emergency') || input.includes('urgent')) return 'emergency';
    if (input.includes('priority') || input.includes('code')) return 'priority';
    return 'routine';
  }

  private extractLanguage(input: string): string {
    if (input.includes('spanish') || input.includes('español')) return 'spanish';
    if (input.includes('french') || input.includes('français')) return 'french';
    if (input.includes('chinese') || input.includes('mandarin')) return 'chinese';
    return 'english';
  }

  private extractDestination(input: string): string {
    // Simple destination extraction - could be enhanced with NER
    const addressPattern = /\d+\s+\w+\s+(street|st|avenue|ave|road|rd|drive|dr|lane|ln|blvd|boulevard)/i;
    const match = input.match(addressPattern);
    if (match) return match[0];
    
    if (input.includes('hospital')) return 'hospital';
    if (input.includes('station')) return 'station';
    if (input.includes('courthouse')) return 'courthouse';
    
    return input; // Return full input if no specific pattern found
  }

  /**
   * Get suggested actions based on current scene context
   */
  getSuggestedActions(sceneContext: SceneContext): string[] {
    const suggestions: string[] = [];

    // Scene-specific suggestions
    switch (sceneContext.type) {
      case 'traffic_stop':
        suggestions.push('run_license_plate', 'check_insurance', 'activate_camera');
        break;
      case 'domestic_disturbance':
        suggestions.push('assess_threat_level', 'separate_parties', 'check_restraining_orders');
        break;
      case 'foot_pursuit':
        suggestions.push('request_backup', 'coordinate_perimeter', 'notify_air_support');
        break;
      case 'arrest':
        suggestions.push('deliver_miranda', 'start_arrest_report', 'search_incident_to_arrest');
        break;
    }

    // Threat level suggestions
    if (sceneContext.threatLevel === 'high' || sceneContext.threatLevel === 'critical') {
      suggestions.push('request_backup', 'notify_supervisor', 'activate_emergency_alert');
    }

    // Time-based suggestions
    if (sceneContext.timeOfDay === 'night') {
      suggestions.push('use_spotlight', 'extra_caution', 'coordinate_units');
    }

    return suggestions;
  }

  /**
   * Update scene context based on recognized intent
   */
  updateSceneContext(intent: LawEnforcementIntent, currentContext?: SceneContext): SceneContext {
    const context = currentContext || {
      type: 'unknown',
      threatLevel: 'low',
      timeOfDay: new Date().getHours() > 18 || new Date().getHours() < 6 ? 'night' : 'day'
    };

    // Update context based on intent
    switch (intent.intent) {
      case 'threat_detected':
        context.threatLevel = 'critical';
        context.weapons = true;
        break;
      case 'traffic_stop':
        context.type = 'traffic_stop';
        break;
      case 'arriving_scene':
        // Infer scene type from entities if available
        if (intent.entities?.scene_type) {
          context.type = intent.entities.scene_type;
        }
        break;
      case 'arrest_made':
        context.type = 'arrest';
        context.suspects = intent.entities?.suspect_count || 1;
        break;
    }

    return context;
  }
}

export const intentRecognitionService = new IntentRecognitionService();
