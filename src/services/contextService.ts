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
import { getCurrentUser } from './authService';

class ContextService implements ContextStore {
  private db: IDBDatabase | null = null;
  private websocket: WebSocket | null = null;
  private alertSubscribers: ((alert: Alert) => void)[] = [];
  private eventSubscribers: ((event: RealtimeEvent) => void)[] = [];
  
  // Current context state
  public currentIncident?: IncidentContext;
  public officer: OfficerContext;
  public departmental: DepartmentalContext;

  constructor() {
    this.officer = this.initializeOfficerContext();
    this.departmental = this.initializeDepartmentalContext();
    this.initializeIndexedDB();
    this.initializeWebSocket();
    this.startLocationTracking();
  }

  // Initialize IndexedDB for offline storage
  private async initializeIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('LARKContext', 2);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.loadFromIndexedDB();
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('incidents')) {
          const incidentStore = db.createObjectStore('incidents', { keyPath: 'id' });
          incidentStore.createIndex('status', 'status');
          incidentStore.createIndex('officer', 'primaryOfficer');
          incidentStore.createIndex('startTime', 'startTime');
        }
        
        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
          messageStore.createIndex('incidentId', 'incidentId');
          messageStore.createIndex('timestamp', 'timestamp');
          messageStore.createIndex('sender', 'sender');
        }
        
        if (!db.objectStoreNames.contains('voiceTranscripts')) {
          const voiceStore = db.createObjectStore('voiceTranscripts', { keyPath: 'id' });
          voiceStore.createIndex('incidentId', 'incidentId');
          voiceStore.createIndex('timestamp', 'timestamp');
          voiceStore.createIndex('isEvidence', 'isEvidence');
        }
        
        if (!db.objectStoreNames.contains('evidence')) {
          const evidenceStore = db.createObjectStore('evidence', { keyPath: 'id' });
          evidenceStore.createIndex('incidentId', 'incidentId');
          evidenceStore.createIndex('type', 'type');
          evidenceStore.createIndex('timestamp', 'timestamp');
        }
        
        if (!db.objectStoreNames.contains('officer')) {
          db.createObjectStore('officer', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  // Initialize WebSocket for real-time updates
  private initializeWebSocket(): void {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
    
    try {
      this.websocket = new WebSocket(wsUrl);
      
      this.websocket.onopen = () => {
        console.log('WebSocket connected for real-time updates');
        // Authenticate and join officer channel
        this.websocket?.send(JSON.stringify({
          type: 'authenticate',
          officerId: this.officer.id,
          badgeNumber: this.officer.badgeNumber
        }));
      };
      
      this.websocket.onmessage = (event) => {
        try {
          const realtimeEvent: RealtimeEvent = JSON.parse(event.data);
          this.handleRealtimeEvent(realtimeEvent);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.websocket.onclose = () => {
        console.log('WebSocket disconnected, attempting reconnect in 5s');
        setTimeout(() => this.initializeWebSocket(), 5000);
      };
      
      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  }

  // Handle real-time events
  private handleRealtimeEvent(event: RealtimeEvent): void {
    switch (event.type) {
      case 'new_alert':
        const alert = event.data as Alert;
        this.departmental.alerts.unshift(alert);
        this.alertSubscribers.forEach(callback => callback(alert));
        break;
      
      case 'incident_update':
        const updatedIncident = event.data as IncidentContext;
        if (this.currentIncident?.id === updatedIncident.id) {
          this.currentIncident = updatedIncident;
        }
        break;
      
      case 'backup_request':
        // Handle backup requests
        console.log('Backup request received:', event.data);
        break;
      
      case 'emergency':
        // Handle emergency alerts
        console.log('Emergency alert:', event.data);
        break;
    }
    
    // Notify event subscribers
    this.eventSubscribers.forEach(callback => callback(event));
  }

  // Initialize officer context
  private initializeOfficerContext(): OfficerContext {
    const user = getCurrentUser();
    const now = new Date();
    
    return {
      id: user?.id || 'demo-officer',
      badgeNumber: user?.badgeNumber || 'B-9876',
      name: user?.name || 'Demo Officer',
      status: 'on_duty',
      currentLocation: {
        latitude: 30.4515, // Baton Rouge default
        longitude: -91.1871,
        accuracy: 10,
        timestamp: now
      },
      shiftStart: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0),
      shiftEnd: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0),
      beat: 'Sector 4',
      vehicle: 'Unit 247',
      activeIncidents: [],
      personalNotes: '',
      voicePreferences: {
        preferredLanguage: 'en-US',
        voiceSpeed: 1.0,
        wakeWordEnabled: true,
        autoTranscribe: true
      },
      lastActivity: now,
      locationHistory: [],
      lastLogin: now,
      deviceInfo: {
        deviceId: 'unihiker-m10-001',
        deviceType: 'UniHiker M10',
        appVersion: '2.0.0'
      }
    };
  }

  // Initialize departmental context
  private initializeDepartmentalContext(): DepartmentalContext {
    return {
      alerts: [],
      policies: [],
      shifts: [],
      emergencyProtocols: [],
      announcements: [],
      departmentIncidents: []
    };
  }

  // Load data from IndexedDB
  private async loadFromIndexedDB(): Promise<void> {
    if (!this.db) return;
    
    try {
      // Load officer context
      const transaction = this.db.transaction(['officer'], 'readonly');
      const store = transaction.objectStore('officer');
      const request = store.get(this.officer.id);
      
      request.onsuccess = () => {
        if (request.result) {
          this.officer = { ...this.officer, ...request.result };
        }
      };
      
      // Load current incident if exists
      await this.loadCurrentIncident();
    } catch (error) {
      console.error('Error loading from IndexedDB:', error);
    }
  }

  // Load current active incident
  private async loadCurrentIncident(): Promise<void> {
    if (!this.db) return;
    
    try {
      const transaction = this.db.transaction(['incidents'], 'readonly');
      const store = transaction.objectStore('incidents');
      const index = store.index('officer');
      const request = index.getAll(this.officer.id);
      
      request.onsuccess = () => {
        const incidents = request.result.filter((inc: IncidentContext) => inc.status === 'active');
        if (incidents.length > 0) {
          this.currentIncident = incidents[0]; // Most recent active incident
        }
      };
    } catch (error) {
      console.error('Error loading current incident:', error);
    }
  }

  // Save data to IndexedDB
  private async saveToIndexedDB(storeName: string, data: any): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Generate unique ID
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Start location tracking
  private startLocationTracking(): void {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          this.updateLocation(location);
        },
        (error) => console.error('Location tracking error:', error),
        { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 }
      );
    }
  }

  // API URL helper
  private getApiUrl(): string {
    return import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  }

  // Implement ContextStore interface methods
  
  async createIncident(incidentData: Omit<IncidentContext, 'id' | 'createdAt' | 'lastUpdated'>): Promise<string> {
    const id = this.generateId();
    const now = new Date();
    
    const incident: IncidentContext = {
      ...incidentData,
      id,
      createdAt: now,
      lastUpdated: now,
      conversationHistory: [],
      voiceTranscripts: [],
      evidence: [],
      relatedIncidents: []
    };
    
    // Add to officer's active incidents
    this.officer.activeIncidents.push(id);
    this.currentIncident = incident;
    
    // Save locally
    await this.saveToIndexedDB('incidents', incident);
    await this.saveToIndexedDB('officer', this.officer);
    
    // Queue for server sync
    await this.queueForSync('create_incident', incident);
    
    return id;
  }

  async updateIncident(id: string, updates: Partial<IncidentContext>): Promise<void> {
    if (!this.currentIncident || this.currentIncident.id !== id) {
      throw new Error('Incident not found or not active');
    }
    
    this.currentIncident = {
      ...this.currentIncident,
      ...updates,
      lastUpdated: new Date()
    };
    
    await this.saveToIndexedDB('incidents', this.currentIncident);
    await this.queueForSync('update_incident', { id, updates });
  }

  async setActiveIncident(incidentId: string): Promise<void> {
    // Load incident from IndexedDB or server
    const incident = await this.getIncidentById(incidentId);
    if (incident) {
      this.currentIncident = incident;
      this.officer.primaryIncident = incidentId;
      await this.saveToIndexedDB('officer', this.officer);
    }
  }

  async closeIncident(incidentId: string, summary: string): Promise<void> {
    await this.updateIncident(incidentId, {
      status: 'resolved',
      endTime: new Date(),
      notes: summary
    });
    
    // Remove from active incidents
    this.officer.activeIncidents = this.officer.activeIncidents.filter(id => id !== incidentId);
    
    if (this.officer.primaryIncident === incidentId) {
      this.officer.primaryIncident = undefined;
      this.currentIncident = undefined;
    }
    
    await this.saveToIndexedDB('officer', this.officer);
  }

  async addMessage(messageData: Omit<ConversationMessage, 'id' | 'timestamp'>): Promise<void> {
    const message: ConversationMessage = {
      ...messageData,
      id: this.generateId(),
      timestamp: new Date(),
      incidentId: this.currentIncident?.id
    };
    
    // Add to current incident
    if (this.currentIncident) {
      this.currentIncident.conversationHistory.push(message);
      await this.saveToIndexedDB('incidents', this.currentIncident);
    }
    
    // Save message separately for search indexing
    await this.saveToIndexedDB('messages', message);
    await this.queueForSync('add_message', message);
  }

  async addVoiceTranscript(transcriptData: Omit<VoiceTranscript, 'id' | 'timestamp'>): Promise<void> {
    const transcript: VoiceTranscript = {
      ...transcriptData,
      id: this.generateId(),
      timestamp: new Date(),
      incidentId: this.currentIncident?.id
    };
    
    if (this.currentIncident) {
      this.currentIncident.voiceTranscripts.push(transcript);
      await this.saveToIndexedDB('incidents', this.currentIncident);
    }
    
    await this.saveToIndexedDB('voiceTranscripts', transcript);
    await this.queueForSync('add_voice_transcript', transcript);
  }

  async addEvidence(evidenceData: Omit<Evidence, 'id' | 'timestamp'>): Promise<void> {
    const evidence: Evidence = {
      ...evidenceData,
      id: this.generateId(),
      timestamp: new Date(),
      chain_of_custody: [{
        officerId: this.officer.id,
        action: 'created',
        timestamp: new Date(),
        reason: 'Evidence collected during incident',
        location: `${this.officer.currentLocation.latitude}, ${this.officer.currentLocation.longitude}`
      }]
    };
    
    if (this.currentIncident) {
      this.currentIncident.evidence.push(evidence);
      await this.saveToIndexedDB('incidents', this.currentIncident);
    }
    
    await this.saveToIndexedDB('evidence', evidence);
    await this.queueForSync('add_evidence', evidence);
  }

  async updateOfficerStatus(status: OfficerContext['status']): Promise<void> {
    this.officer.status = status;
    this.officer.lastActivity = new Date();
    
    await this.saveToIndexedDB('officer', this.officer);
    await this.queueForSync('update_officer_status', { status, timestamp: new Date() });
    
    // Broadcast status update via WebSocket
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'status_update',
        officerId: this.officer.id,
        status,
        timestamp: new Date()
      }));
    }
  }

  async updateLocation(location: { latitude: number; longitude: number; accuracy: number }): Promise<void> {
    const locationPoint = {
      ...location,
      timestamp: new Date()
    };
    
    this.officer.currentLocation = { ...locationPoint };
    this.officer.locationHistory.push(locationPoint);
    
    // Keep only last 100 location points
    if (this.officer.locationHistory.length > 100) {
      this.officer.locationHistory = this.officer.locationHistory.slice(-100);
    }
    
    await this.saveToIndexedDB('officer', this.officer);
    await this.queueForSync('update_location', locationPoint);
  }

  // Helper methods
  
  private async getIncidentById(incidentId: string): Promise<IncidentContext | null> {
    if (!this.db) return null;
    
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['incidents'], 'readonly');
      const store = transaction.objectStore('incidents');
      const request = store.get(incidentId);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  }

  async getIncidentHistory(timeRange?: { start: Date; end: Date }): Promise<IncidentContext[]> {
    if (!this.db) return [];
    
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['incidents'], 'readonly');
      const store = transaction.objectStore('incidents');
      const index = store.index('officer');
      const request = index.getAll(this.officer.id);
      
      request.onsuccess = () => {
        let incidents = request.result as IncidentContext[];
        
        if (timeRange) {
          incidents = incidents.filter(inc => 
            inc.startTime >= timeRange.start && inc.startTime <= timeRange.end
          );
        }
        
        resolve(incidents.sort((a, b) => b.startTime.getTime() - a.startTime.getTime()));
      };
      
      request.onerror = () => resolve([]);
    });
  }

  async searchMessages(query: string, incidentId?: string): Promise<ConversationMessage[]> {
    // This is a simplified search - in production, you'd want full-text search
    if (!this.db) return [];
    
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['messages'], 'readonly');
      const store = transaction.objectStore('messages');
      const request = store.getAll();
      
      request.onsuccess = () => {
        let messages = request.result as ConversationMessage[];
        
        // Filter by incident if specified
        if (incidentId) {
          messages = messages.filter(msg => msg.incidentId === incidentId);
        }
        
        // Simple text search
        const searchTerm = query.toLowerCase();
        messages = messages.filter(msg => 
          msg.content.toLowerCase().includes(searchTerm)
        );
        
        resolve(messages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
      };
      
      request.onerror = () => resolve([]);
    });
  }

  async getRelatedIncidents(incidentId: string): Promise<IncidentContext[]> {
    const incident = await this.getIncidentById(incidentId);
    if (!incident) return [];
    
    // Find incidents in same location or with related tags
    const allIncidents = await this.getIncidentHistory();
    
    return allIncidents.filter(inc => 
      inc.id !== incidentId && (
        // Same location (within 100m)
        this.calculateDistance(incident.location, inc.location) < 0.1 ||
        // Related tags
        inc.tags.some(tag => incident.tags.includes(tag))
      )
    );
  }

  private calculateDistance(loc1: { latitude: number; longitude: number }, loc2: { latitude: number; longitude: number }): number {
    // Haversine formula for distance in km
    const R = 6371;
    const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
    const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(loc1.latitude * Math.PI / 180) * Math.cos(loc2.latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Queue operations for server sync
  public async queueForSync(operation: string, data: any): Promise<void> {
    if (!this.db) return;
    
    const syncItem = {
      operation,
      data,
      timestamp: new Date(),
      retries: 0
    };
    
    await this.saveToIndexedDB('sync_queue', syncItem);
  }

  async syncToServer(): Promise<void> {
    if (!this.db) return;
    
    try {
      const transaction = this.db.transaction(['sync_queue'], 'readwrite');
      const store = transaction.objectStore('sync_queue');
      const request = store.getAll();
      
      request.onsuccess = async () => {
        const syncItems = request.result;
        
        for (const item of syncItems) {
          try {
            await fetch(`${this.getApiUrl()}/context/sync`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item)
            });
            
            // Remove from queue on successful sync
            const deleteRequest = store.delete(item.id);
          } catch (error) {
            console.error('Sync failed for item:', item, error);
            
            // Increment retry count
            item.retries = (item.retries || 0) + 1;
            if (item.retries < 3) {
              store.put(item);
            } else {
              // Remove after 3 failed attempts
              store.delete(item.id);
            }
          }
        }
      };
    } catch (error) {
      console.error('Sync to server failed:', error);
    }
  }

  async getOfflineCapabilities(): Promise<string[]> {
    return [
      'voice_recognition',
      'incident_creation',
      'message_logging',
      'evidence_collection',
      'location_tracking',
      'status_updates',
      'miranda_rights',
      'statute_lookup_cached'
    ];
  }

  subscribeToAlerts(callback: (alert: Alert) => void): () => void {
    this.alertSubscribers.push(callback);
    return () => {
      const index = this.alertSubscribers.indexOf(callback);
      if (index > -1) {
        this.alertSubscribers.splice(index, 1);
      }
    };
  }

  subscribeToEvents(callback: (event: RealtimeEvent) => void): () => void {
    this.eventSubscribers.push(callback);
    return () => {
      const index = this.eventSubscribers.indexOf(callback);
      if (index > -1) {
        this.eventSubscribers.splice(index, 1);
      }
    };
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    const alert = this.departmental.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      if (!alert.acknowledgedBy) alert.acknowledgedBy = [];
      alert.acknowledgedBy.push(this.officer.id);
      
      await this.queueForSync('acknowledge_alert', { alertId, officerId: this.officer.id });
    }
  }

  // Clean up resources
  dispose(): void {
    if (this.websocket) {
      this.websocket.close();
    }
    if (this.db) {
      this.db.close();
    }
  }
}

// Export singleton instance
export const contextService = new ContextService();
export default contextService;
