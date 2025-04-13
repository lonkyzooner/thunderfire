/**
 * Centralized Audit Logger for LARK
 * Supports compliance logs, user analytics, and system health metrics.
 * Extend this to send logs to a backend, cloud logging service, or analytics platform.
 */

type LogType = 'compliance' | 'analytics' | 'system';

interface AuditLogEntry {
  type: LogType;
  timestamp: string;
  orgId?: string;
  userId?: string;
  sessionId?: string;
  action: string;
  details?: Record<string, any>;
  context?: Record<string, any>;
}

function logAudit(entry: AuditLogEntry) {
  // TODO: Replace with backend/cloud logging integration
  // For now, log to console in structured JSON format
  console.log(JSON.stringify(entry));
}

// Compliance log example
export function logCompliance(action: string, details?: Record<string, any>, userId?: string, sessionId?: string, context?: Record<string, any>, orgId?: string) {
  logAudit({
    type: 'compliance',
    timestamp: new Date().toISOString(),
    orgId,
    userId,
    sessionId,
    action,
    details,
    context,
  });
}

// User analytics log example
export function logAnalytics(action: string, details?: Record<string, any>, userId?: string, sessionId?: string, context?: Record<string, any>, orgId?: string) {
  logAudit({
    type: 'analytics',
    timestamp: new Date().toISOString(),
    orgId,
    userId,
    sessionId,
    action,
    details,
    context,
  });
}

// System health log example
export function logSystem(action: string, details?: Record<string, any>, context?: Record<string, any>, orgId?: string) {
  logAudit({
    type: 'system',
    timestamp: new Date().toISOString(),
    orgId,
    action,
    details,
    context,
  });
}

/**
 * Usage:
 * logCompliance('MirandaRightsDelivered', { language: 'Spanish' }, userId, sessionId, context, orgId);
 * logAnalytics('FeatureUsed', { feature: 'VoiceCommand' }, userId, sessionId, context, orgId);
 * logSystem('Error', { error: err.message }, { location: 'OfficerMap' }, orgId);
 */