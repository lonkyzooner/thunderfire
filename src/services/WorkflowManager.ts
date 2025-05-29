/**
 * WorkflowManager
 * Centralized service for managing officer workflow state, proactive suggestions, and next-step logic.
 * 
 * Responsibilities:
 * - Track officer's current situation, recent actions, and workflow state.
 * - Suggest next logical actions (e.g., Miranda after apprehension, report after Miranda).
 * - Integrate with context, OrchestratorService, and DecisionEngine.
 * - Expose methods for UI and backend to query and update workflow state.
 * - Support multi-tenant (orgId/userId) partitioning.
 * 
 * Planned Methods:
 * - getCurrentWorkflowState(orgId: string, userId: string): WorkflowState
 * - updateWorkflowState(orgId: string, userId: string, update: Partial<WorkflowState>): void
 * - suggestNextActions(orgId: string, userId: string): SuggestedAction[]
 * - resetWorkflow(orgId: string, userId: string): void
 * - handleEvent(orgId: string, userId: string, event: WorkflowEvent): void
 * 
 * TODO:
 * - Define WorkflowState, SuggestedAction, WorkflowEvent types.
 * - Implement state persistence (in-memory, localStorage, or backend).
 * - Integrate with OrchestratorService and UI.
 */

export type WorkflowState = {
  currentStep: string;
  lastAction: string;
  situation: string;
  timestamp: number;
  [key: string]: any;
};

export type SuggestedAction = {
  label: string;
  actionType: string;
  params?: Record<string, any>;
};

export type WorkflowEvent = {
  type: string;
  payload?: any;
  timestamp?: number;
};

export class WorkflowManager {
  private static STORAGE_PREFIX = 'lark_workflow_';
  // In-memory state store (replace with persistent storage as needed)
  private static state: Record<string, WorkflowState> = {};
  private static isLoaded = false; // Flag to track if loaded from localStorage

  // Helper to generate storage key
  private static _getWorkflowKey(orgId: string, userId: string): string {
    return `${this.STORAGE_PREFIX}${orgId}:${userId}`;
  }

  // Helper to save workflow state to localStorage
  private static _saveWorkflowState(key: string, workflowState: WorkflowState): void {
    try {
      localStorage.setItem(key, JSON.stringify(workflowState));
    } catch (error) {
      console.error(`[WorkflowManager] Error saving state for key ${key} to localStorage:`, error);
    }
  }

  // Helper to load all workflow states from localStorage on first access
  private static _loadWorkflowStates(): void {
    if (typeof window === 'undefined' || !localStorage) return; // Guard for non-browser environments

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_PREFIX)) {
          const item = localStorage.getItem(key);
          if (item) {
            try {
              const workflowState = JSON.parse(item) as WorkflowState;
              // Use the orgId and userId from the storage key to create the in-memory key
              // Assuming key format is lark_workflow_orgId:userId
              const parts = key.substring(this.STORAGE_PREFIX.length).split(':');
              if (parts.length === 2) {
                  const inMemoryKey = `${parts[0]}:${parts[1]}`;
                  this.state[inMemoryKey] = workflowState;
              } else {
                  console.warn(`[WorkflowManager] Could not parse orgId/userId from key: ${key}`);
              }
            } catch (parseError) {
              console.error(`[WorkflowManager] Error parsing state for key ${key} from localStorage:`, parseError);
              // Optionally remove corrupted item
              // localStorage.removeItem(key);
            }
          }
        }
      }
    } catch (error) {
        console.error(`[WorkflowManager] Error loading workflow states from localStorage:`, error);
    }
    this.isLoaded = true;
  }

  static getCurrentWorkflowState(orgId: string, userId: string): WorkflowState | null {
    // Load from localStorage on first call if not already loaded
    if (!this.isLoaded) {
      this._loadWorkflowStates();
    }

    const key = `${orgId}:${userId}`; // In-memory key
    const storageKey = this._getWorkflowKey(orgId, userId); // localStorage key

    if (!this.state[key]) {
      // Try loading from localStorage if missed initial load or created after load
      try {
        const storedItem = localStorage.getItem(storageKey);
        if (storedItem) {
          this.state[key] = JSON.parse(storedItem) as WorkflowState;
        }
      } catch (error) {
        console.error(`[WorkflowManager] Error parsing state for key ${storageKey} from localStorage:`, error);
      }
    }
    // Return the state if found, otherwise null (don't create default state here)
    return this.state[key] || null;
  }

  static updateWorkflowState(orgId: string, userId: string, update: Partial<WorkflowState>): void {
    const key = `${orgId}:${userId}`;
    // Ensure current state exists before updating, potentially loading it first
    const currentState = this.getCurrentWorkflowState(orgId, userId) || {
        // Define a default initial state if needed, or handle null case appropriately
        currentStep: 'initial',
        lastAction: '',
        situation: '',
        timestamp: 0
    };
    const newState = { ...currentState, ...update, timestamp: Date.now() };
    this.state[key] = newState;
    this._saveWorkflowState(this._getWorkflowKey(orgId, userId), newState);
  }

  static suggestNextActions(orgId: string, userId: string): SuggestedAction[] {
    const state = this.getCurrentWorkflowState(orgId, userId);
    const suggestions: SuggestedAction[] = [];

    if (!state || state.currentStep === 'initial') {
      // Suggest initial actions or common tools
      suggestions.push({ label: "Search Statutes", actionType: "search_statutes_ui" }); // Example UI action
      suggestions.push({ label: "Check Weather", actionType: "tool_use", params: { toolId: 'fetch_weather', city: 'Current Location' } });
    } else if (state.currentStep === 'suspect_detained') {
      suggestions.push({ label: "Deliver Miranda Rights", actionType: "miranda" });
    } else if (state.currentStep === 'miranda_delivered') {
       suggestions.push({ label: "Start Arrest Report", actionType: "tool_use", params: { toolId: 'start_arrest_report' } }); // Example tool
       suggestions.push({ label: "Request Transport", actionType: "tool_use", params: { toolId: 'request_transport' } }); // Example tool
    } else if (state.currentStep === 'report_started') {
        suggestions.push({ label: "Add Narrative to Report", actionType: "tool_use", params: { toolId: 'add_report_narrative' } });
        suggestions.push({ label: "Complete Report", actionType: "tool_use", params: { toolId: 'complete_report' } });
    }
    // Add more state-based suggestions as needed

    return suggestions;
  }

  static resetWorkflow(orgId: string, userId: string): void {
    const key = `${orgId}:${userId}`;
    delete this.state[key];
    try {
      localStorage.removeItem(this._getWorkflowKey(orgId, userId));
    } catch (error) {
      console.error(`[WorkflowManager] Error removing state for key ${key} from localStorage:`, error);
    }
  }

  static handleEvent(orgId: string, userId: string, event: WorkflowEvent): void {
    const currentState = this.getCurrentWorkflowState(orgId, userId);
    let nextState: Partial<WorkflowState> = {};

    console.log(`[WorkflowManager] Handling event: ${event.type}`, { orgId, userId, event, currentState });

    // Simple state transitions based on event type
    // This should be expanded into a more robust state machine
    switch (event.type) {
      case 'UserInputReceived':
        // Example: Detect detainment keyword (very naive)
        if (event.payload?.content?.toLowerCase().includes('detained') || event.payload?.content?.toLowerCase().includes('cuffed')) {
          nextState = { currentStep: 'suspect_detained', lastAction: event.type, situation: 'Suspect likely detained based on input.' };
        }
        break;
      case 'MirandaRightsDelivered': // This type should match the action logged in ContextManager/Orchestrator
         nextState = { currentStep: 'miranda_delivered', lastAction: event.type, situation: `Miranda delivered in ${event.payload?.language || 'unknown language'}.` };
        break;
      case 'ToolInvocationSuccess':
        // Example: Update state based on specific tools used
        if (event.payload?.toolId === 'start_arrest_report') {
          nextState = { currentStep: 'report_started', lastAction: event.type, situation: 'Arrest report initiated.' };
        } else if (event.payload?.toolId === 'complete_report') {
           nextState = { currentStep: 'report_completed', lastAction: event.type, situation: 'Report marked as complete.' };
        }
        // Add more tool-specific state updates
        break;
      // Add more event handlers (e.g., ArrivedAtScene, TransportRequested, ReportCompleted)
      default:
        // No state change for unhandled events
        console.log(`[WorkflowManager] Unhandled event type: ${event.type}`);
        return;
    }

    // Only update if there's a change
    if (Object.keys(nextState).length > 0) {
        // Ensure lastAction is always updated if not explicitly set
        if (!nextState.lastAction) {
            nextState.lastAction = event.type;
        }
        console.log(`[WorkflowManager] Updating state:`, nextState);
        this.updateWorkflowState(orgId, userId, nextState);
    }
  }
}