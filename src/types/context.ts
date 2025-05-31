// Enhanced Context Management Types for LARK
export interface IncidentContext {
  id: string;
  type: 'traffic_stop' | 'domestic_disturbance' | 'patrol' | 'backup_request' | 'emergency' | 'investigation' | 'other';
  status: 'active' | 'pending' | 'resolved' | 'transferred' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // Location and time
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    zone?: string;
  };
  startTime: Date;
  endTime?: Date;
  estimatedDuration?: number; // in minutes
  
  // Personnel
  primaryOfficer: string; // officer ID
  assisting: string[]; // other officer IDs
  supervisor?: string;
  
  // Context data
  conversationHistory: ConversationMessage[];
  voiceTranscripts: VoiceTranscript[];
  evidence: Evidence[];
  relatedIncidents: string[]; // incident IDs
  
  // Metadata
  createdAt: Date;
  lastUpdated: Date;
  tags: string[];
  notes: string;
}

export interface ConversationMessage {
  id: string;
  timestamp: Date;
  sender: 'officer' | 'lark' | 'dispatch' | 'system';
  content: string;
  messageType: 'text' | 'voice' | 'command' | 'alert' | 'status_update';
  incidentId?: string;
  metadata?: {
    confidence?: number; // for voice recognition
    processingTime?: number;
    actionTaken?: string;
  };
}

export interface VoiceTranscript {
  id: string;
  timestamp: Date;
  originalAudio?: Blob;
  transcript: string;
  confidence: number;
  speaker: 'officer' | 'civilian' | 'other';
  language: string;
  incidentId?: string;
  isEvidence: boolean;
}

export interface Evidence {
  id: string;
  type: 'voice_recording' | 'photo' | 'video' | 'document' | 'location_data' | 'sensor_data';
  timestamp: Date;
  data: any; // file blob, coordinates, sensor readings, etc.
  description: string;
  chain_of_custody: ChainOfCustody[];
  incidentId: string;
  officerId: string;
}

export interface ChainOfCustody {
  officerId: string;
  action: 'created' | 'accessed' | 'modified' | 'transferred' | 'deleted';
  timestamp: Date;
  reason: string;
  location: string;
}

export interface OfficerContext {
  id: string;
  badgeNumber: string;
  name: string;
  
  // Current status
  status: 'on_duty' | 'off_duty' | 'busy' | 'available' | 'emergency' | 'break';
  currentLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;
  };
  
  // Current shift
  shiftStart: Date;
  shiftEnd: Date;
  beat?: string;
  vehicle?: string;
  
  // Active incidents
  activeIncidents: string[]; // incident IDs
  primaryIncident?: string; // current focus
  
  // Personal notes and preferences
  personalNotes: string;
  voicePreferences: {
    preferredLanguage: string;
    voiceSpeed: number;
    wakeWordEnabled: boolean;
    autoTranscribe: boolean;
  };
  
  // Activity tracking
  lastActivity: Date;
  locationHistory: LocationPoint[];
  
  // Metadata
  lastLogin: Date;
  deviceInfo: {
    deviceId: string;
    deviceType: string;
    appVersion: string;
  };
}

export interface LocationPoint {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  activity?: 'patrol' | 'stop' | 'station' | 'court' | 'break';
}

export interface DepartmentalContext {
  // BOLO alerts
  alerts: Alert[];
  
  // Policy updates
  policies: Policy[];
  
  // Shift information
  shifts: ShiftInfo[];
  
  // Emergency protocols
  emergencyProtocols: EmergencyProtocol[];
  
  // Department-wide announcements
  announcements: Announcement[];
  
  // Active incidents (department overview)
  departmentIncidents: IncidentSummary[];
}

export interface Alert {
  id: string;
  type: 'bolo' | 'amber_alert' | 'weather' | 'traffic' | 'security' | 'policy';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  issuedBy: string;
  issuedAt: Date;
  expiresAt?: Date;
  affectedZones?: string[];
  acknowledged: boolean;
  acknowledgedBy?: string[];
}

export interface Policy {
  id: string;
  title: string;
  version: string;
  effectiveDate: Date;
  category: 'use_of_force' | 'arrest_procedures' | 'evidence_handling' | 'safety' | 'administrative';
  summary: string;
  fullText: string;
  lastUpdated: Date;
  mandatoryReview: boolean;
}

export interface ShiftInfo {
  id: string;
  shiftName: string;
  startTime: string; // HH:MM format
  endTime: string;
  officers: string[]; // officer IDs
  supervisor: string;
  specialInstructions?: string;
  date: Date;
}

export interface EmergencyProtocol {
  id: string;
  name: string;
  triggerConditions: string[];
  steps: string[];
  contacts: Contact[];
  resources: string[];
  lastReviewed: Date;
}

export interface Contact {
  name: string;
  role: string;
  phone: string;
  email?: string;
  availability: '24/7' | 'business_hours' | 'emergency_only';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: Date;
  priority: 'low' | 'medium' | 'high';
  categories: string[];
  targetAudience: 'all' | 'patrol' | 'detectives' | 'supervisors' | 'admin';
  readBy: string[]; // officer IDs who have read it
}

export interface IncidentSummary {
  id: string;
  type: string;
  status: string;
  priority: string;
  location: string;
  primaryOfficer: string;
  startTime: Date;
  participantCount: number;
}

// Context Store Interface
export interface ContextStore {
  // Current context
  currentIncident?: IncidentContext;
  officer: OfficerContext;
  departmental: DepartmentalContext;
  
  // Actions
  createIncident: (incident: Omit<IncidentContext, 'id' | 'createdAt' | 'lastUpdated'>) => Promise<string>;
  updateIncident: (id: string, updates: Partial<IncidentContext>) => Promise<void>;
  setActiveIncident: (incidentId: string) => Promise<void>;
  closeIncident: (incidentId: string, summary: string) => Promise<void>;
  
  addMessage: (message: Omit<ConversationMessage, 'id' | 'timestamp'>) => Promise<void>;
  addVoiceTranscript: (transcript: Omit<VoiceTranscript, 'id' | 'timestamp'>) => Promise<void>;
  addEvidence: (evidence: Omit<Evidence, 'id' | 'timestamp'>) => Promise<void>;
  
  updateOfficerStatus: (status: OfficerContext['status']) => Promise<void>;
  updateLocation: (location: { latitude: number; longitude: number; accuracy: number }) => Promise<void>;
  
  // Search and retrieval
  getIncidentHistory: (timeRange?: { start: Date; end: Date }) => Promise<IncidentContext[]>;
  searchMessages: (query: string, incidentId?: string) => Promise<ConversationMessage[]>;
  getRelatedIncidents: (incidentId: string) => Promise<IncidentContext[]>;
  
  // Sync and offline
  syncToServer: () => Promise<void>;
  getOfflineCapabilities: () => Promise<string[]>;
  
  // Notifications
  subscribeToAlerts: (callback: (alert: Alert) => void) => () => void;
  acknowledgeAlert: (alertId: string) => Promise<void>;
}

// WebSocket event types for real-time updates
export interface RealtimeEvent {
  type: 'incident_update' | 'new_alert' | 'officer_status' | 'backup_request' | 'emergency' | 'system_announcement';
  data: any;
  timestamp: Date;
  sender?: string;
  targetOfficers?: string[];
}
