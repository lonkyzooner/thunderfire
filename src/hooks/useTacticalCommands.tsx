/**
 * Tactical Commands Hook
 * 
 * Handles tactical command processing and integration with wake word system
 */

import { useState, useEffect, useCallback } from 'react';
import { useWakeWordCommands } from './useWakeWord';

export interface TacticalAction {
  id: string;
  type: 'emergency' | 'intel' | 'report' | 'status';
  command: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: number;
  processed: boolean;
}

export function useTacticalCommands() {
  const [activeActions, setActiveActions] = useState<TacticalAction[]>([]);
  const [processingQueue, setProcessingQueue] = useState<TacticalAction[]>([]);
  const { processCommand } = useWakeWordCommands();

  // Process tactical commands from wake word or manual input
  const executeTacticalAction = useCallback(async (actionType: string, details?: any) => {
    const action: TacticalAction = {
      id: `action-${Date.now()}`,
      type: getTacticalType(actionType),
      command: actionType,
      priority: getTacticalPriority(actionType),
      timestamp: Date.now(),
      processed: false
    };

    // Add to processing queue
    setProcessingQueue(prev => [...prev, action]);

    try {
      switch (actionType) {
        case 'backup':
          await handleBackupRequest(details);
          break;
        case 'medical':
          await handleMedicalEmergency(details);
          break;
        case 'code3':
          await handleCode3Response(details);
          break;
        case 'alert':
          await handleAllUnitsAlert(details);
          break;
        case 'miranda':
          await handleMirandaRights(details);
          break;
        case 'report':
          await handleIncidentReport(details);
          break;
        case 'evidence':
          await handleEvidenceLog(details);
          break;
        default:
          console.log('Unknown tactical action:', actionType);
      }

      // Mark as processed and move to active actions
      action.processed = true;
      setActiveActions(prev => [...prev, action]);
      setProcessingQueue(prev => prev.filter(a => a.id !== action.id));

      // Play confirmation sound
      playTacticalConfirmation(action.type);

    } catch (error) {
      console.error('Tactical action failed:', error);
      setProcessingQueue(prev => prev.filter(a => a.id !== action.id));
    }
  }, []);

  // Handle backup request
  const handleBackupRequest = async (details?: any) => {
    console.log('🚨 BACKUP REQUESTED');
    
    // Integration with existing LARK functionality
    window.dispatchEvent(new CustomEvent('lark-backup-requested', {
      detail: {
        priority: 'high',
        location: details?.location || 'Current position',
        reason: details?.reason || 'Officer requested backup',
        timestamp: Date.now()
      }
    }));

    // Simulate dispatch communication
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      status: 'dispatched',
      units: ['Unit 15', 'Unit 23'],
      eta: '3-5 minutes'
    };
  };

  // Handle medical emergency
  const handleMedicalEmergency = async (details?: any) => {
    console.log('🚑 MEDICAL EMERGENCY');
    
    window.dispatchEvent(new CustomEvent('lark-medical-emergency', {
      detail: {
        priority: 'critical',
        type: details?.type || 'Medical assistance required',
        location: details?.location || 'Current position',
        timestamp: Date.now()
      }
    }));

    await new Promise(resolve => setTimeout(resolve, 1200));
    
    return {
      status: 'dispatched',
      ambulance: 'EMS-7',
      eta: '4-6 minutes'
    };
  };

  // Handle Code 3 response
  const handleCode3Response = async (details?: any) => {
    console.log('🚔 CODE 3 RESPONSE');
    
    window.dispatchEvent(new CustomEvent('lark-code3-response', {
      detail: {
        priority: 'high',
        incident: details?.incident || 'Emergency response requested',
        timestamp: Date.now()
      }
    }));

    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      status: 'acknowledged',
      response: 'Code 3 authorized'
    };
  };

  // Handle all units alert
  const handleAllUnitsAlert = async (details?: any) => {
    console.log('📢 ALL UNITS ALERT');
    
    window.dispatchEvent(new CustomEvent('lark-all-units-alert', {
      detail: {
        priority: 'critical',
        message: details?.message || 'All units alert - stand by for instructions',
        timestamp: Date.now()
      }
    }));

    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      status: 'broadcast',
      units: 'All available units notified'
    };
  };

  // Handle Miranda rights
  const handleMirandaRights = async (details?: any) => {
    console.log('⚖️ MIRANDA RIGHTS');
    
    window.dispatchEvent(new CustomEvent('lark-miranda-rights', {
      detail: {
        suspect: details?.suspect || 'Unknown',
        timestamp: Date.now()
      }
    }));

    return {
      status: 'logged',
      message: 'Miranda rights administration logged'
    };
  };

  // Handle incident report
  const handleIncidentReport = async (details?: any) => {
    console.log('📝 INCIDENT REPORT');
    
    window.dispatchEvent(new CustomEvent('lark-incident-report', {
      detail: {
        type: details?.type || 'General incident',
        timestamp: Date.now()
      }
    }));

    return {
      status: 'created',
      reportId: `RPT-${Date.now()}`
    };
  };

  // Handle evidence log
  const handleEvidenceLog = async (details?: any) => {
    console.log('🔬 EVIDENCE LOG');
    
    window.dispatchEvent(new CustomEvent('lark-evidence-log', {
      detail: {
        evidence: details?.evidence || 'Evidence item logged',
        timestamp: Date.now()
      }
    }));

    return {
      status: 'logged',
      evidenceId: `EVD-${Date.now()}`
    };
  };

  // Helper functions
  const getTacticalType = (actionType: string): TacticalAction['type'] => {
    const emergencyActions = ['backup', 'medical', 'code3', 'alert'];
    const intelActions = ['surveillance', 'database', 'map'];
    const reportActions = ['miranda', 'report', 'evidence'];
    
    if (emergencyActions.includes(actionType)) return 'emergency';
    if (intelActions.includes(actionType)) return 'intel';
    if (reportActions.includes(actionType)) return 'report';
    return 'status';
  };

  const getTacticalPriority = (actionType: string): TacticalAction['priority'] => {
    const highPriority = ['backup', 'medical', 'alert'];
    const mediumPriority = ['code3', 'report'];
    
    if (highPriority.includes(actionType)) return 'high';
    if (mediumPriority.includes(actionType)) return 'medium';
    return 'low';
  };

  const playTacticalConfirmation = (type: TacticalAction['type']) => {
    try {
      const audio = new Audio('/sounds/success.mp3');
      audio.volume = 0.5;
      audio.play();
    } catch (error) {
      console.error('Could not play confirmation sound:', error);
    }
  };

  // Listen for quick deploy events
  useEffect(() => {
    const handleQuickDeploy = (event: any) => {
      const { action } = event.detail;
      executeTacticalAction(action);
    };

    window.addEventListener('lark-quick-deploy', handleQuickDeploy);
    
    return () => {
      window.removeEventListener('lark-quick-deploy', handleQuickDeploy);
    };
  }, [executeTacticalAction]);

  // Clean up old actions
  useEffect(() => {
    const cleanup = setInterval(() => {
      const cutoff = Date.now() - (5 * 60 * 1000); // 5 minutes
      setActiveActions(prev => prev.filter(action => action.timestamp > cutoff));
    }, 60000); // Check every minute

    return () => clearInterval(cleanup);
  }, []);

  return {
    activeActions,
    processingQueue,
    executeTacticalAction,
    isProcessing: processingQueue.length > 0
  };
}
