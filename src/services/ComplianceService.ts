/**
 * Compliance Service for LARK
 * 
 * Handles compliance checking and logging for law enforcement operations
 */

import { supabase } from './supabaseClient';
import { getCurrentLocation } from '../utils/locationTracker';

export interface ComplianceEvent {
  event_type: string;
  compliance_status: 'compliant' | 'violation' | 'warning';
  event_data?: any;
  officer_id?: string;
  incident_id?: string;
  location_lat?: number;
  location_lng?: number;
}

export interface ComplianceCheck {
  id: string;
  name: string;
  description: string;
  category: 'miranda' | 'camera' | 'threat' | 'general';
  required: boolean;
}

export class ComplianceService {
  private officerId: string | null = null;
  private activeIncidentId: string | null = null;
  private complianceState: Map<string, any> = new Map();
  
  // Compliance checks configuration
  private complianceChecks: ComplianceCheck[] = [
    {
      id: 'miranda_delivered',
      name: 'Miranda Rights Delivered',
      description: 'Miranda rights must be delivered before custodial interrogation',
      category: 'miranda',
      required: true
    },
    {
      id: 'camera_activated',
      name: 'Body Camera Active',
      description: 'Body camera should be activated during interactions',
      category: 'camera',
      required: true
    },
    {
      id: 'threat_acknowledged',
      name: 'Threat Alert Acknowledged',
      description: 'High/critical threat alerts must be acknowledged',
      category: 'threat',
      required: true
    }
  ];

  /**
   * Set the current officer ID
   */
  setOfficerId(officerId: string): void {
    this.officerId = officerId;
  }

  /**
   * Set the active incident ID
   */
  setActiveIncident(incidentId: string | null): void {
    this.activeIncidentId = incidentId;
  }

  /**
   * Log a compliance event to both MongoDB and Supabase
   */
  async logComplianceEvent(event: ComplianceEvent): Promise<boolean> {
    if (!this.officerId) {
      console.warn('[ComplianceService] Officer ID not set');
      return false;
    }

    try {
      // Get current location if not provided
      let locationData = null;
      if (!event.location_lat || !event.location_lng) {
        try {
          locationData = await getCurrentLocation();
        } catch (error) {
          console.warn('[ComplianceService] Could not get location:', error);
        }
      }

      // Prepare the complete event
      const completeEvent = {
        officer_id: this.officerId,
        event_type: event.event_type,
        event_data: event.event_data || {},
        compliance_status: event.compliance_status,
        incident_id: event.incident_id || this.activeIncidentId,
        location_lat: event.location_lat || locationData?.latitude,
        location_lng: event.location_lng || locationData?.longitude
      };

      // Log to Supabase
      const { data, error } = await supabase
        .from('usage_events')
        .insert([completeEvent])
        .select();

      if (error) {
        console.error('[ComplianceService] Error logging to Supabase:', error.message);
        return false;
      }

      console.log('[ComplianceService] Event logged successfully:', data);

      // Update internal compliance state
      this.updateComplianceState(event.event_type, event.compliance_status, event.event_data);

      return true;
    } catch (error) {
      console.error('[ComplianceService] Error logging compliance event:', error);
      return false;
    }
  }

  /**
   * Check for Miranda rights delivery compliance
   */
  async checkMirandaCompliance(delivered: boolean, language: string = 'en'): Promise<void> {
    const complianceStatus = delivered ? 'compliant' : 'violation';
    
    await this.logComplianceEvent({
      event_type: 'miranda_delivered',
      compliance_status: complianceStatus,
      event_data: {
        delivered,
        language,
        timestamp: Date.now()
      }
    });

    // Log additional violation if Miranda was required but not delivered
    if (!delivered) {
      await this.logComplianceEvent({
        event_type: 'miranda_violation',
        compliance_status: 'violation',
        event_data: {
          reason: 'Miranda rights not delivered when required',
          timestamp: Date.now()
        }
      });
    }
  }

  /**
   * Check for camera activation compliance
   */
  async checkCameraCompliance(isActive: boolean, reason?: string): Promise<void> {
    const complianceStatus = isActive ? 'compliant' : 'warning';
    
    await this.logComplianceEvent({
      event_type: 'camera_activated',
      compliance_status: complianceStatus,
      event_data: {
        camera_active: isActive,
        reason: reason || (isActive ? 'Camera activated' : 'Camera not active'),
        timestamp: Date.now()
      }
    });

    // Log violation if camera should be active but isn't
    if (!isActive) {
      await this.logComplianceEvent({
        event_type: 'camera_violation',
        compliance_status: 'violation',
        event_data: {
          reason: 'Body camera not activated during interaction',
          timestamp: Date.now()
        }
      });
    }
  }

  /**
   * Check for threat acknowledgment compliance
   */
  async checkThreatAcknowledgment(
    threatId: string, 
    acknowledged: boolean, 
    severity: string
  ): Promise<void> {
    const requiresAcknowledgment = severity === 'critical' || severity === 'high';
    let complianceStatus: 'compliant' | 'violation' | 'warning' = 'compliant';

    if (requiresAcknowledgment && !acknowledged) {
      complianceStatus = 'violation';
    } else if (!requiresAcknowledgment && !acknowledged) {
      complianceStatus = 'warning';
    }

    await this.logComplianceEvent({
      event_type: 'threat_acknowledged',
      compliance_status: complianceStatus,
      event_data: {
        threat_id: threatId,
        acknowledged,
        severity,
        required_acknowledgment: requiresAcknowledgment,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Perform general compliance check
   */
  async performComplianceCheck(
    checkType: string, 
    passed: boolean, 
    details?: any
  ): Promise<void> {
    const complianceStatus = passed ? 'compliant' : 'violation';
    
    await this.logComplianceEvent({
      event_type: checkType,
      compliance_status: complianceStatus,
      event_data: {
        check_passed: passed,
        details: details || {},
        timestamp: Date.now()
      }
    });
  }

  /**
   * Update internal compliance state
   */
  private updateComplianceState(eventType: string, status: string, data: any): void {
    this.complianceState.set(eventType, {
      status,
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Get current compliance state
   */
  getComplianceState(): Map<string, any> {
    return new Map(this.complianceState);
  }

  /**
   * Check if all required compliance items are met
   */
  isCompliant(): boolean {
    const requiredChecks = this.complianceChecks.filter(check => check.required);
    
    for (const check of requiredChecks) {
      const state = this.complianceState.get(check.id);
      if (!state || state.status !== 'compliant') {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get compliance summary
   */
  getComplianceSummary(): {
    overall: 'compliant' | 'violations' | 'warnings';
    checks: Array<{
      id: string;
      name: string;
      status: 'compliant' | 'violation' | 'warning' | 'pending';
      required: boolean;
    }>;
  } {
    const checks = this.complianceChecks.map(check => {
      const state = this.complianceState.get(check.id);
      return {
        id: check.id,
        name: check.name,
        status: state?.status || 'pending' as 'compliant' | 'violation' | 'warning' | 'pending',
        required: check.required
      };
    });

    const hasViolations = checks.some(check => check.status === 'violation');
    const hasWarnings = checks.some(check => check.status === 'warning');
    
    let overall: 'compliant' | 'violations' | 'warnings';
    if (hasViolations) {
      overall = 'violations';
    } else if (hasWarnings) {
      overall = 'warnings';
    } else {
      overall = 'compliant';
    }

    return { overall, checks };
  }

  /**
   * Reset compliance state (e.g., for new incident)
   */
  resetComplianceState(): void {
    this.complianceState.clear();
    console.log('[ComplianceService] Compliance state reset');
  }

  /**
   * Get compliance checks configuration
   */
  getComplianceChecks(): ComplianceCheck[] {
    return [...this.complianceChecks];
  }
}

// Export singleton instance
export const complianceService = new ComplianceService();
