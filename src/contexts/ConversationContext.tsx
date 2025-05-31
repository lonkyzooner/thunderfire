import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { 
  ContextStore, 
  IncidentContext, 
  ConversationMessage, 
  VoiceTranscript, 
  Evidence, 
  OfficerContext, 
  DepartmentalContext,
  Alert,
  RealtimeEvent
} from '../types/context';
import { contextService } from '../services/contextService';

// Enhanced Message type for backward compatibility
export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'lark' | 'officer' | 'dispatch' | 'system';
  timestamp: Date;
  type?: 'text' | 'voice' | 'command' | 'alert' | 'status_update';
  incidentId?: string;
  metadata?: {
    confidence?: number;
    processingTime?: number;
    actionTaken?: string;
  };
}

interface ConversationContextType extends ContextStore {
  // Enhanced state
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  
  // Backward compatibility methods
  addMessage: (message: Omit<ConversationMessage, 'id' | 'timestamp'>) => Promise<void>;
  clearMessages: () => void;
  
  // Enhanced methods
  startNewIncident: (type: IncidentContext['type'], location?: { latitude: number; longitude: number }) => Promise<string>;
  switchToIncident: (incidentId: string) => Promise<void>;
  endCurrentIncident: (summary?: string) => Promise<void>;
  
  // Voice integration
  addVoiceMessage: (transcript: string, confidence: number, originalAudio?: Blob) => Promise<void>;
  saveVoiceEvidence: (audioBlob: Blob, description: string) => Promise<void>;
  
  // Real-time features
  subscribeToIncidentUpdates: (callback: (incident: IncidentContext) => void) => () => void;
  broadcastStatusUpdate: (status: OfficerContext['status']) => Promise<void>;
  requestBackup: (reason: string, priority: 'low' | 'medium' | 'high' | 'critical') => Promise<void>;
  
  // Search and history
  searchConversation: (query: string) => Promise<Message[]>;
  getRecentIncidents: (count?: number) => Promise<IncidentContext[]>;
  
  // Alerts and notifications
  unreadAlerts: Alert[];
  acknowledgeAlert: (alertId: string) => Promise<void>;
  
  // Analytics
  getConversationAnalytics: () => {
    totalMessages: number;
    voiceMessages: number;
    averageResponseTime: number;
    currentIncidentDuration: number;
  };
}

const ConversationContext = createContext<ConversationContextType | null>(null);

interface ConversationProviderProps {
  children: ReactNode;
}

export const ConversationProvider: React.FC<ConversationProviderProps> = ({ children }) => {
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadAlerts, setUnreadAlerts] = useState<Alert[]>([]);
  
  // Real-time subscribers
  const [incidentSubscribers, setIncidentSubscribers] = useState<((incident: IncidentContext) => void)[]>([]);

  // Initialize context service and load initial data
  useEffect(() => {
    loadInitialData();
    setupRealtimeSubscriptions();
    
    return () => {
      contextService.dispose();
    };
  }, []);

  // Load current incident messages
  useEffect(() => {
    if (contextService.currentIncident) {
      loadIncidentMessages(contextService.currentIncident.id);
    }
  }, [contextService.currentIncident?.id]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Load recent messages if there's an active incident
      if (contextService.currentIncident) {
        await loadIncidentMessages(contextService.currentIncident.id);
      }
      
      // Load unread alerts
      const alerts = contextService.departmental.alerts.filter(alert => !alert.acknowledged);
      setUnreadAlerts(alerts);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load initial data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadIncidentMessages = async (incidentId: string) => {
    const incident = contextService.currentIncident;
    if (!incident) return;
    
    // Convert ConversationMessages to Messages for backward compatibility
    const convertedMessages: Message[] = incident.conversationHistory.map(msg => ({
      id: msg.id,
      text: msg.content,
      sender: msg.sender === 'officer' ? 'user' : msg.sender === 'lark' ? 'lark' : msg.sender,
      timestamp: msg.timestamp,
      type: msg.messageType,
      incidentId: msg.incidentId,
      metadata: msg.metadata
    }));
    
    setMessages(convertedMessages);
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to alerts
    const unsubscribeAlerts = contextService.subscribeToAlerts((alert) => {
      setUnreadAlerts(prev => [alert, ...prev]);
    });
    
    // Subscribe to events
    const unsubscribeEvents = contextService.subscribeToEvents((event) => {
      if (event.type === 'incident_update') {
        // Notify incident subscribers
        incidentSubscribers.forEach(callback => callback(event.data));
        
        // Reload messages if it's the current incident
        if (contextService.currentIncident?.id === event.data.id) {
          loadIncidentMessages(event.data.id);
        }
      }
    });
    
    return () => {
      unsubscribeAlerts();
      unsubscribeEvents();
    };
  };

  // Enhanced message handling
  const addMessage = useCallback(async (messageData: Omit<ConversationMessage, 'id' | 'timestamp'>) => {
    try {
      setIsLoading(true);
      await contextService.addMessage(messageData);
      
      // Add to local state for immediate UI update
      const message: Message = {
        id: `temp-${Date.now()}`,
        text: messageData.content,
        sender: messageData.sender === 'officer' ? 'user' : messageData.sender === 'lark' ? 'lark' : messageData.sender,
        timestamp: new Date(),
        type: messageData.messageType,
        incidentId: messageData.incidentId,
        metadata: messageData.metadata
      };
      
      setMessages(prev => [...prev, message]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add message');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Incident management
  const startNewIncident = useCallback(async (
    type: IncidentContext['type'], 
    location?: { latitude: number; longitude: number }
  ): Promise<string> => {
    try {
      setIsLoading(true);
      
      const incidentLocation = location || {
        latitude: contextService.officer.currentLocation.latitude,
        longitude: contextService.officer.currentLocation.longitude
      };
      
      const incidentId = await contextService.createIncident({
        type,
        status: 'active',
        priority: 'medium',
        location: incidentLocation,
        startTime: new Date(),
        primaryOfficer: contextService.officer.id,
        assisting: [],
        conversationHistory: [],
        voiceTranscripts: [],
        evidence: [],
        relatedIncidents: [],
        tags: [],
        notes: ''
      });
      
      // Clear messages for new incident
      setMessages([]);
      
      // Add initial system message
      await addMessage({
        sender: 'system',
        content: `New ${type.replace('_', ' ')} incident started`,
        messageType: 'status_update'
      });
      
      setError(null);
      return incidentId;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start incident';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [addMessage]);

  const switchToIncident = useCallback(async (incidentId: string): Promise<void> => {
    try {
      setIsLoading(true);
      await contextService.setActiveIncident(incidentId);
      await loadIncidentMessages(incidentId);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch incident');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const endCurrentIncident = useCallback(async (summary?: string): Promise<void> => {
    if (!contextService.currentIncident) return;
    
    try {
      setIsLoading(true);
      await contextService.closeIncident(contextService.currentIncident.id, summary || 'Incident resolved');
      
      // Add final system message
      await addMessage({
        sender: 'system',
        content: 'Incident closed and logged',
        messageType: 'status_update'
      });
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end incident');
    } finally {
      setIsLoading(false);
    }
  }, [addMessage]);

  // Voice integration
  const addVoiceMessage = useCallback(async (
    transcript: string, 
    confidence: number, 
    originalAudio?: Blob
  ): Promise<void> => {
    try {
      // Add voice transcript to context
      await contextService.addVoiceTranscript({
        transcript,
        confidence,
        speaker: 'officer',
        language: 'en-US',
        originalAudio,
        isEvidence: confidence > 0.8 // High confidence transcripts can be evidence
      });
      
      // Add as regular message for conversation flow
      await addMessage({
        sender: 'officer',
        content: transcript,
        messageType: 'voice',
        metadata: { confidence }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add voice message');
    }
  }, [addMessage]);

  const saveVoiceEvidence = useCallback(async (audioBlob: Blob, description: string): Promise<void> => {
    try {
      await contextService.addEvidence({
        type: 'voice_recording',
        data: audioBlob,
        description,
        incidentId: contextService.currentIncident?.id || '',
        officerId: contextService.officer.id,
        chain_of_custody: [{
          officerId: contextService.officer.id,
          action: 'created',
          timestamp: new Date(),
          reason: 'Voice evidence collected during incident',
          location: `${contextService.officer.currentLocation.latitude}, ${contextService.officer.currentLocation.longitude}`
        }]
      });
      
      await addMessage({
        sender: 'system',
        content: `Voice evidence saved: ${description}`,
        messageType: 'status_update'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save voice evidence');
    }
  }, [addMessage]);

  // Real-time features
  const subscribeToIncidentUpdates = useCallback((callback: (incident: IncidentContext) => void) => {
    setIncidentSubscribers(prev => [...prev, callback]);
    
    return () => {
      setIncidentSubscribers(prev => prev.filter(cb => cb !== callback));
    };
  }, []);

  const broadcastStatusUpdate = useCallback(async (status: OfficerContext['status']): Promise<void> => {
    try {
      await contextService.updateOfficerStatus(status);
      
      await addMessage({
        sender: 'system',
        content: `Officer status updated to: ${status}`,
        messageType: 'status_update'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  }, [addMessage]);

  const requestBackup = useCallback(async (
    reason: string, 
    priority: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<void> => {
    try {
      // Add backup request message
      await addMessage({
        sender: 'system',
        content: `Backup requested: ${reason} (Priority: ${priority})`,
        messageType: 'alert'
      });
      
      // Note: Real-time broadcast would be handled by the context service internally
      // when WebSocket is available
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request backup');
    }
  }, [addMessage]);

  // Search and history
  const searchConversation = useCallback(async (query: string): Promise<Message[]> => {
    try {
      const results = await contextService.searchMessages(query, contextService.currentIncident?.id);
      
      // Convert to Message format
      return results.map(msg => ({
        id: msg.id,
        text: msg.content,
        sender: msg.sender === 'officer' ? 'user' : msg.sender === 'lark' ? 'lark' : msg.sender,
        timestamp: msg.timestamp,
        type: msg.messageType,
        incidentId: msg.incidentId,
        metadata: msg.metadata
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      return [];
    }
  }, []);

  const getRecentIncidents = useCallback(async (count: number = 10): Promise<IncidentContext[]> => {
    try {
      const incidents = await contextService.getIncidentHistory();
      return incidents.slice(0, count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get recent incidents');
      return [];
    }
  }, []);

  // Alert management
  const acknowledgeAlert = useCallback(async (alertId: string): Promise<void> => {
    try {
      await contextService.acknowledgeAlert(alertId);
      setUnreadAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to acknowledge alert');
    }
  }, []);

  // Analytics
  const getConversationAnalytics = useCallback(() => {
    const voiceMessages = messages.filter(msg => msg.type === 'voice').length;
    const currentIncidentDuration = contextService.currentIncident 
      ? Date.now() - contextService.currentIncident.startTime.getTime() 
      : 0;
    
    return {
      totalMessages: messages.length,
      voiceMessages,
      averageResponseTime: 0, // Would need to calculate from message timestamps
      currentIncidentDuration: Math.floor(currentIncidentDuration / 1000 / 60) // in minutes
    };
  }, [messages]);

  // Context value with all ContextStore methods
  const contextValue: ConversationContextType = {
    // State
    messages,
    isLoading,
    error,
    unreadAlerts,
    
    // Context store properties
    currentIncident: contextService.currentIncident,
    officer: contextService.officer,
    departmental: contextService.departmental,
    
    // Enhanced methods
    addMessage,
    clearMessages,
    startNewIncident,
    switchToIncident,
    endCurrentIncident,
    addVoiceMessage,
    saveVoiceEvidence,
    subscribeToIncidentUpdates,
    broadcastStatusUpdate,
    requestBackup,
    searchConversation,
    getRecentIncidents,
    acknowledgeAlert,
    getConversationAnalytics,
    
    // ContextStore interface methods
    createIncident: contextService.createIncident.bind(contextService),
    updateIncident: contextService.updateIncident.bind(contextService),
    setActiveIncident: contextService.setActiveIncident.bind(contextService),
    closeIncident: contextService.closeIncident.bind(contextService),
    addVoiceTranscript: contextService.addVoiceTranscript.bind(contextService),
    addEvidence: contextService.addEvidence.bind(contextService),
    updateOfficerStatus: contextService.updateOfficerStatus.bind(contextService),
    updateLocation: contextService.updateLocation.bind(contextService),
    getIncidentHistory: contextService.getIncidentHistory.bind(contextService),
    searchMessages: contextService.searchMessages.bind(contextService),
    getRelatedIncidents: contextService.getRelatedIncidents.bind(contextService),
    syncToServer: contextService.syncToServer.bind(contextService),
    getOfflineCapabilities: contextService.getOfflineCapabilities.bind(contextService),
    subscribeToAlerts: contextService.subscribeToAlerts.bind(contextService)
  };

  return (
    <ConversationContext.Provider value={contextValue}>
      {children}
    </ConversationContext.Provider>
  );
};

// Custom hook to use the conversation context
export const useConversation = (): ConversationContextType => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
};

// Export context and types
export { ConversationContext };
export type { ConversationContextType };
