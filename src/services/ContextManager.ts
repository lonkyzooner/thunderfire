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
  // Keyed by `${orgId}:${userId}` for multi-tenant isolation
  private static contexts: Record<string, OfficerContext> = {};

  static getContext(orgId: string, userId: string): OfficerContext {
    const key = `${orgId}:${userId}`;
    if (!this.contexts[key]) {
      this.contexts[key] = {
        orgId,
        userId,
        conversationHistory: [],
        actions: [],
        situationalData: {},
        lastUpdated: Date.now(),
      };
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
  }

  static addMessage(orgId: string, userId: string, role: 'user' | 'system' | 'assistant', content: string) {
    const ctx = this.getContext(orgId, userId);
    ctx.conversationHistory.push({
      role,
      content,
      timestamp: Date.now(),
    });
    ctx.lastUpdated = Date.now();
  }

  static addAction(orgId: string, userId: string, type: string, details?: Record<string, any>) {
    const ctx = this.getContext(orgId, userId);
    ctx.actions.push({
      type,
      details,
      timestamp: Date.now(),
    });
    ctx.lastUpdated = Date.now();
  }

  static updateSituationalData(orgId: string, userId: string, data: Record<string, any>) {
    const ctx = this.getContext(orgId, userId);
    ctx.situationalData = {
      ...ctx.situationalData,
      ...data,
    };
    ctx.lastUpdated = Date.now();
  }

  static resetContext(orgId: string, userId: string) {
    const key = `${orgId}:${userId}`;
    delete this.contexts[key];
  }
}

/**
 * Usage:
 * ContextManager.addMessage(orgId, userId, 'user', 'Arriving at scene');
 * ContextManager.addAction(orgId, userId, 'ArrivedAtScene', { location });
 * ContextManager.updateSituationalData(orgId, userId, { riskLevel: 'high' });
 * const ctx = ContextManager.getContext(orgId, userId);
 */