/**
 * ContextManager for LARK
 * Tracks conversation history, officer actions, and situational data per user/session.
 * Enables proactive, context-aware assistance and workflow management.
 */

export interface OfficerContext {
  orgId: string;
  userId: string;
  sessionId?: string;
  conversationHistory: Array<{
    role: 'user' | 'system' | 'assistant';
    content: string;
    timestamp: number;
  }>;
  actions: Array<{
    type: string;
    details?: Record<string, any>;
    timestamp: number;
  }>;
  situationalData: Record<string, any>;
  lastUpdated: number;
}

export class ContextManager {
  private static STORAGE_PREFIX = 'lark_context_';
  // Keyed by `${orgId}:${userId}` for multi-tenant isolation
  private static contexts: Record<string, OfficerContext> = {};
  private static isLoaded = false; // Flag to track if loaded from localStorage

  // Helper to generate storage key
  private static _getContextKey(orgId: string, userId: string): string {
    return `${this.STORAGE_PREFIX}${orgId}:${userId}`;
  }

  // Helper to save context to localStorage
  private static _saveContext(key: string, context: OfficerContext): void {
    try {
      localStorage.setItem(key, JSON.stringify(context));
    } catch (error) {
      console.error(`[ContextManager] Error saving context for key ${key} to localStorage:`, error);
    }
  }

  // Helper to load all contexts from localStorage on first access
  private static _loadContexts(): void {
    if (typeof window === 'undefined' || !localStorage) return; // Guard for non-browser environments

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_PREFIX)) {
          const item = localStorage.getItem(key);
          if (item) {
            try {
              const context = JSON.parse(item) as OfficerContext;
              // Use the orgId and userId from the stored context to create the in-memory key
              const inMemoryKey = `${context.orgId}:${context.userId}`;
              this.contexts[inMemoryKey] = context;
            } catch (parseError) {
              console.error(`[ContextManager] Error parsing context for key ${key} from localStorage:`, parseError);
              // Optionally remove corrupted item
              // localStorage.removeItem(key);
            }
          }
        }
      }
    } catch (error) {
        console.error(`[ContextManager] Error loading contexts from localStorage:`, error);
    }
    this.isLoaded = true;
  }

  static getContext(orgId: string, userId: string): OfficerContext {
    // Load from localStorage on first call if not already loaded
    if (!this.isLoaded) {
      this._loadContexts();
    }

    const key = `${orgId}:${userId}`; // In-memory key
    const storageKey = this._getContextKey(orgId, userId); // localStorage key

    if (!this.contexts[key]) {
      // Try loading from localStorage if missed initial load or created after load
      try {
        const storedItem = localStorage.getItem(storageKey);
        if (storedItem) {
          this.contexts[key] = JSON.parse(storedItem) as OfficerContext;
        }
      } catch (error) {
        console.error(`[ContextManager] Error parsing context for key ${storageKey} from localStorage:`, error);
      }

      // If still not found, create a new one
      if (!this.contexts[key]) {
        const newContext: OfficerContext = {
          orgId,
          userId,
          conversationHistory: [],
          actions: [],
          situationalData: {},
          lastUpdated: Date.now(),
        };
        this.contexts[key] = newContext;
        this._saveContext(storageKey, newContext); // Save the new context
      }
    }
    return this.contexts[key];
  }

  static updateContext(orgId: string, userId: string, update: Partial<OfficerContext>) {
    const key = `${orgId}:${userId}`;
    const ctx = this.getContext(orgId, userId);
    this.contexts[key] = {
      ...ctx,
      ...update,
      lastUpdated: Date.now(),
    };
    this._saveContext(this._getContextKey(orgId, userId), this.contexts[key]);
  }

  static addMessage(orgId: string, userId: string, role: 'user' | 'system' | 'assistant', content: string) {
    const ctx = this.getContext(orgId, userId);
    ctx.conversationHistory.push({
      role,
      content,
      timestamp: Date.now(),
    });
    ctx.lastUpdated = Date.now();
    this._saveContext(this._getContextKey(orgId, userId), ctx);
  }

  static addAction(orgId: string, userId: string, type: string, details?: Record<string, any>) {
    const ctx = this.getContext(orgId, userId);
    ctx.actions.push({
      type,
      details,
      timestamp: Date.now(),
    });
    ctx.lastUpdated = Date.now();
    this._saveContext(this._getContextKey(orgId, userId), ctx);
  }

  static updateSituationalData(orgId: string, userId: string, data: Record<string, any>) {
    const ctx = this.getContext(orgId, userId);
    ctx.situationalData = {
      ...ctx.situationalData,
      ...data,
    };
    ctx.lastUpdated = Date.now();
    this._saveContext(this._getContextKey(orgId, userId), ctx);
  }

  static resetContext(orgId: string, userId: string) {
    const key = `${orgId}:${userId}`;
    delete this.contexts[key];
    try {
      localStorage.removeItem(this._getContextKey(orgId, userId));
    } catch (error) {
      console.error(`[ContextManager] Error removing context for key ${key} from localStorage:`, error);
    }
  }
}

/**
 * Usage:
 * ContextManager.addMessage(orgId, userId, 'user', 'Arriving at scene');
 * ContextManager.addAction(orgId, userId, 'ArrivedAtScene', { location });
 * ContextManager.updateSituationalData(orgId, userId, { riskLevel: 'high' });
 * const ctx = ContextManager.getContext(orgId, userId);
 */