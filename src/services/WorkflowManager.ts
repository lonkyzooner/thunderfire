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
    // TODO: Implement logic based on current workflow state
    return [
      { label: "Deliver Miranda Rights", actionType: "miranda" },
      { label: "Start Arrest Report", actionType: "report" }
    ];
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
    // TODO: Implement logic to update workflow state based on event
    // Example: const currentState = this.getCurrentWorkflowState(orgId, userId);
    // const newState = { ...currentState, ...updatedFields };
    // this.updateWorkflowState(orgId, userId, newState); // This will save automatically
  }
}