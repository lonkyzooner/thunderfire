import React, { useEffect, useState, useCallback } from "react";
import { supabase } from '../services/supabaseClient';

export interface TimelineEvent {
  id: string;
  timestamp: number;
  type: "user" | "assistant" | "flag" | "annotation" | "threat" | "compliance" | "location";
  content: string;
  severity?: string;
  metadata?: any;
}

interface ThreatEvent {
  id: string;
  officer_id: string;
  threat_type: string;
  confidence_score: number;
  location_lat?: number;
  location_lng?: number;
  context?: string;
  severity: string;
  acknowledged: boolean;
  created_at: string;
  metadata?: any;
}

interface UsageEvent {
  id: string;
  officer_id: string;
  event_type: string;
  event_data?: any;
  compliance_status?: string;
  incident_id?: string;
  location_lat?: number;
  location_lng?: number;
  created_at: string;
}

interface IncidentTimelineProps {
  events?: TimelineEvent[];
  className?: string;
  maxEvents?: number;
}

const IncidentTimeline: React.FC<IncidentTimelineProps> = ({ 
  events = [], 
  className = "",
  maxEvents = 20 
}) => {
  const [realtimeEvents, setRealtimeEvents] = useState<TimelineEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Combine provided events with realtime events
  const allEvents = [...events, ...realtimeEvents]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, maxEvents);

  // Show toast notification
  const showToast = useCallback((message: string, duration: number = 3000) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), duration);
  }, []);

  // Convert threat event to timeline event
  const threatToTimelineEvent = useCallback((threat: ThreatEvent): TimelineEvent => {
    const severityEmoji = threat.severity === 'critical' ? '🔴' : 
                         threat.severity === 'high' ? '🟠' : 
                         threat.severity === 'medium' ? '🟡' : '🟢';
    
    return {
      id: threat.id,
      timestamp: new Date(threat.created_at).getTime(),
      type: 'threat',
      severity: threat.severity,
      content: `${severityEmoji} THREAT: ${threat.threat_type.replace('_', ' ').toUpperCase()} detected (${Math.round(threat.confidence_score * 100)}% confidence)`,
      metadata: threat
    };
  }, []);

  // Convert usage event to timeline event
  const usageToTimelineEvent = useCallback((usage: UsageEvent): TimelineEvent => {
    const statusEmoji = usage.compliance_status === 'compliant' ? '✅' : 
                       usage.compliance_status === 'violation' ? '❌' : 
                       usage.compliance_status === 'warning' ? '⚠️' : '📋';
    
    let content = `${statusEmoji} ${usage.event_type.replace('_', ' ').toUpperCase()}`;
    
    if (usage.compliance_status) {
      content += ` - ${usage.compliance_status}`;
    }

    return {
      id: usage.id,
      timestamp: new Date(usage.created_at).getTime(),
      type: 'compliance',
      content,
      metadata: usage
    };
  }, []);

  // Handle threat events
  const handleThreatEvent = useCallback((payload: any) => {
    console.log('[IncidentTimeline] Threat event received:', payload);
    
    const newThreat = payload.new as ThreatEvent;
    const timelineEvent = threatToTimelineEvent(newThreat);
    
    setRealtimeEvents(prev => [timelineEvent, ...prev]);
    
    // Show toast for critical/high threats
    if (newThreat.severity === 'critical' || newThreat.severity === 'high') {
      showToast(`🚨 ${newThreat.threat_type.toUpperCase()} DETECTED!`, 5000);
    }
  }, [threatToTimelineEvent, showToast]);

  // Handle usage events
  const handleUsageEvent = useCallback((payload: any) => {
    console.log('[IncidentTimeline] Usage event received:', payload);
    
    const newUsage = payload.new as UsageEvent;
    const timelineEvent = usageToTimelineEvent(newUsage);
    
    setRealtimeEvents(prev => [timelineEvent, ...prev]);
    
    // Show toast for violations
    if (newUsage.compliance_status === 'violation') {
      showToast(`⚠️ Compliance violation: ${newUsage.event_type}`, 4000);
    }
  }, [usageToTimelineEvent, showToast]);

  // Set up realtime subscriptions
  useEffect(() => {
    console.log('[IncidentTimeline] Setting up realtime subscriptions...');

    // Subscribe to threat events
    const threatChannel = supabase
      .channel('incident-threat-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'threat_events'
        },
        handleThreatEvent
      )
      .subscribe((status) => {
        console.log('[IncidentTimeline] Threat channel status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Subscribe to usage events
    const usageChannel = supabase
      .channel('incident-usage-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'usage_events'
        },
        handleUsageEvent
      )
      .subscribe((status) => {
        console.log('[IncidentTimeline] Usage channel status:', status);
      });

    // Load initial realtime data
    const loadInitialData = async () => {
      try {
        // Load recent threat events
        const { data: threats, error: threatError } = await supabase
          .from('threat_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (threatError) {
          console.error('[IncidentTimeline] Error loading threats:', threatError);
        } else if (threats) {
          const threatEvents = threats.map(threatToTimelineEvent);
          setRealtimeEvents(prev => [...threatEvents, ...prev]);
        }

        // Load recent usage events
        const { data: usageEvents, error: usageError } = await supabase
          .from('usage_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (usageError) {
          console.error('[IncidentTimeline] Error loading usage events:', usageError);
        } else if (usageEvents) {
          const complianceEvents = usageEvents.map(usageToTimelineEvent);
          setRealtimeEvents(prev => [...complianceEvents, ...prev]);
        }
      } catch (error) {
        console.error('[IncidentTimeline] Error loading initial data:', error);
      }
    };

    loadInitialData();

    // Cleanup subscriptions on unmount
    return () => {
      console.log('[IncidentTimeline] Cleaning up subscriptions...');
      threatChannel.unsubscribe();
      usageChannel.unsubscribe();
    };
  }, [handleThreatEvent, handleUsageEvent, threatToTimelineEvent, usageToTimelineEvent]);

  // Get event color based on type and severity
  const getEventColor = (event: TimelineEvent) => {
    switch (event.type) {
      case 'threat':
        switch (event.severity) {
          case 'critical': return '#dc2626'; // red-600
          case 'high': return '#ea580c'; // orange-600
          case 'medium': return '#ca8a04'; // yellow-600
          case 'low': return '#16a34a'; // green-600
          default: return '#6b7280'; // gray-500
        }
      case 'compliance':
        return '#3b82f6'; // blue-500
      case 'user':
        return '#1976d2'; // blue
      case 'assistant':
        return '#43a047'; // green
      case 'location':
        return '#9333ea'; // purple-600
      default:
        return '#ffa000'; // amber
    }
  };

  // Get event icon
  const getEventIcon = (event: TimelineEvent) => {
    switch (event.type) {
      case 'threat': return '⚠️';
      case 'compliance': return '📋';
      case 'user': return '👤';
      case 'assistant': return '🤖';
      case 'location': return '📍';
      default: return '📝';
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse max-w-md">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-100 border-b">
        <h3 className="font-semibold text-lg">Incident Timeline</h3>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {isConnected ? 'Live' : 'Offline'}
          </span>
          <span className="text-xs text-gray-500 ml-2">
            {allEvents.length} events
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 p-4 overflow-y-auto">
        {allEvents.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">📋</div>
            <div>No events yet</div>
            <div className="text-sm">Events will appear here in real-time</div>
          </div>
        ) : (
          <ul className="space-y-4">
            {allEvents.map((event) => (
              <li key={event.id} className="flex items-start gap-3">
                {/* Event dot */}
                <div
                  className="w-3 h-3 rounded-full border-2 border-white shadow-md mt-1 flex-shrink-0"
                  style={{ backgroundColor: getEventColor(event) }}
                />
                
                {/* Event content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <span>{getEventIcon(event)}</span>
                    <span className="font-medium capitalize">{event.type}</span>
                    <span>•</span>
                    <time>
                      {new Date(event.timestamp).toLocaleTimeString([], { 
                        hour: "2-digit", 
                        minute: "2-digit",
                        second: "2-digit"
                      })}
                    </time>
                  </div>
                  
                  <div className="text-gray-900 text-sm leading-relaxed whitespace-pre-line">
                    {event.content}
                  </div>
                  
                  {/* Additional metadata for threat events */}
                  {event.type === 'threat' && event.metadata && (
                    <div className="mt-2 text-xs text-gray-500">
                      Officer: {event.metadata.officer_id?.slice(-4)} | 
                      {event.metadata.location_lat && event.metadata.location_lng && (
                        <span> Location: {event.metadata.location_lat.toFixed(4)}, {event.metadata.location_lng.toFixed(4)}</span>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default IncidentTimeline;
