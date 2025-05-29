import { BehaviorSubject, Observable } from 'rxjs';
import { aiOrchestrator, TaskType } from './AIOrchestrator';
import { whisperService } from '../whisper/WhisperService';

// Define fallback levels
export type FallbackLevel = 'primary' | 'secondary' | 'offline' | 'emergency';

// Define service degradation states
export type ServiceDegradation = 'normal' | 'degraded' | 'limited' | 'emergency_only';

// Fallback strategy configuration
interface FallbackStrategy {
  level: FallbackLevel;
  description: string;
  capabilities: string[];
  responseTime: number; // expected response time in ms
  reliability: number; // 0-1 score
}

// Service health status
interface ServiceHealth {
  serviceName: string;
  isHealthy: boolean;
  lastCheck: Date;
  responseTime: number;
  errorRate: number;
  degradationLevel: ServiceDegradation;
}

/**
 * FallbackManager - Intelligent service degradation and recovery management
 * 
 * This service manages the graceful degradation of AI services, ensuring that
 * critical law enforcement functions remain available even when primary services fail.
 */
export class FallbackManager {
  private fallbackStrategies: Map<FallbackLevel, FallbackStrategy> = new Map();
  private serviceHealth: Map<string, ServiceHealth> = new Map();
  private currentDegradationLevel = new BehaviorSubject<ServiceDegradation>('normal');
  private activeFallbacks = new BehaviorSubject<FallbackLevel[]>([]);
  private emergencyMode = new BehaviorSubject<boolean>(false);
  
  // Health check interval (30 seconds)
  private healthCheckInterval = 30000;
  private healthCheckTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeFallbackStrategies();
    this.initializeServiceHealth();
    this.startHealthMonitoring();
    
    console.log('[FallbackManager] Initialized with intelligent service degradation');
  }

  /**
   * Initialize fallback strategies for different degradation levels
   */
  private initializeFallbackStrategies(): void {
    this.fallbackStrategies.set('primary', {
      level: 'primary',
      description: 'Full AI orchestration with optimal model selection',
      capabilities: [
        'Multi-model routing',
        'Performance optimization',
        'Full feature set',
        'Real-time analytics'
      ],
      responseTime: 500,
      reliability: 0.95
    });

    this.fallbackStrategies.set('secondary', {
      level: 'secondary',
      description: 'Reduced model options with basic orchestration',
      capabilities: [
        'Limited model routing',
        'Basic optimization',
        'Core features only',
        'Reduced analytics'
      ],
      responseTime: 1000,
      reliability: 0.85
    });

    this.fallbackStrategies.set('offline', {
      level: 'offline',
      description: 'Local processing with cached responses',
      capabilities: [
        'Local speech recognition',
        'Cached legal information',
        'Pre-loaded templates',
        'Emergency protocols'
      ],
      responseTime: 200,
      reliability: 0.70
    });

    this.fallbackStrategies.set('emergency', {
      level: 'emergency',
      description: 'Critical functions only with maximum reliability',
      capabilities: [
        'Emergency commands',
        'Officer safety protocols',
        'Basic communication',
        'Offline Miranda rights'
      ],
      responseTime: 100,
      reliability: 0.99
    });
  }

  /**
   * Initialize service health monitoring
   */
  private initializeServiceHealth(): void {
    // Monitor AIOrchestrator
    this.serviceHealth.set('ai-orchestrator', {
      serviceName: 'AI Orchestrator',
      isHealthy: true,
      lastCheck: new Date(),
      responseTime: 500,
      errorRate: 0,
      degradationLevel: 'normal'
    });

    // Monitor Whisper Service
    this.serviceHealth.set('whisper-service', {
      serviceName: 'Whisper Service',
      isHealthy: true,
      lastCheck: new Date(),
      responseTime: 200,
      errorRate: 0,
      degradationLevel: 'normal'
    });

    // Monitor Network Connectivity
    this.serviceHealth.set('network', {
      serviceName: 'Network Connectivity',
      isHealthy: navigator.onLine,
      lastCheck: new Date(),
      responseTime: 0,
      errorRate: 0,
      degradationLevel: navigator.onLine ? 'normal' : 'limited'
    });
  }

  /**
   * Start continuous health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthChecks();
    }, this.healthCheckInterval);

    // Monitor network status changes
    window.addEventListener('online', (_event: Event) => this.handleNetworkChange(true));
    window.addEventListener('offline', (_event: Event) => this.handleNetworkChange(false));
  }

  /**
   * Perform comprehensive health checks on all services
   */
  private async performHealthChecks(): Promise<void> {
    const startTime = Date.now();

    try {
      // Check AI Orchestrator health
      await this.checkAIOrchestratorHealth();
      
      // Check Whisper Service health
      await this.checkWhisperServiceHealth();
      
      // Check network connectivity
      await this.checkNetworkHealth();
      
      // Evaluate overall system health and adjust degradation level
      this.evaluateSystemHealth();
      
      console.log(`[FallbackManager] Health check completed in ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error('[FallbackManager] Error during health check:', error);
    }
  }

  /**
   * Check AI Orchestrator service health
   */
  private async checkAIOrchestratorHealth(): Promise<void> {
    const serviceName = 'ai-orchestrator';
    const startTime = Date.now();

    try {
      // Test with a simple orchestration request
      const testResult = await aiOrchestrator.orchestrate(
        'Test health check',
        'fast_response' as TaskType,
        'low',
        { healthCheck: true }
      );

      const responseTime = Date.now() - startTime;
      const health = this.serviceHealth.get(serviceName)!;
      
      health.isHealthy = !!testResult.response;
      health.responseTime = responseTime;
      health.lastCheck = new Date();
      health.errorRate = health.isHealthy ? Math.max(0, health.errorRate - 0.1) : Math.min(1, health.errorRate + 0.2);
      health.degradationLevel = this.calculateDegradationLevel(health);

      this.serviceHealth.set(serviceName, health);
    } catch (error) {
      console.warn('[FallbackManager] AI Orchestrator health check failed:', error);
      this.markServiceUnhealthy(serviceName);
    }
  }

  /**
   * Check Whisper Service health
   */
  private async checkWhisperServiceHealth(): Promise<void> {
    const serviceName = 'whisper-service';
    
    try {
      const isReady = whisperService.isServiceReady();
      const health = this.serviceHealth.get(serviceName)!;
      
      health.isHealthy = isReady;
      health.lastCheck = new Date();
      health.errorRate = isReady ? Math.max(0, health.errorRate - 0.1) : Math.min(1, health.errorRate + 0.1);
      health.degradationLevel = this.calculateDegradationLevel(health);

      this.serviceHealth.set(serviceName, health);
    } catch (error) {
      console.warn('[FallbackManager] Whisper Service health check failed:', error);
      this.markServiceUnhealthy(serviceName);
    }
  }

  /**
   * Check network connectivity health
   */
  private async checkNetworkHealth(): Promise<void> {
    const serviceName = 'network';
    const startTime = Date.now();

    try {
      // Test network connectivity with a lightweight request
      const response = await fetch('https://api.openai.com/v1', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      const responseTime = Date.now() - startTime;
      const health = this.serviceHealth.get(serviceName)!;
      
      health.isHealthy = response.ok;
      health.responseTime = responseTime;
      health.lastCheck = new Date();
      health.errorRate = response.ok ? Math.max(0, health.errorRate - 0.1) : Math.min(1, health.errorRate + 0.2);
      health.degradationLevel = this.calculateDegradationLevel(health);

      this.serviceHealth.set(serviceName, health);
    } catch (error) {
      console.warn('[FallbackManager] Network health check failed:', error);
      this.markServiceUnhealthy(serviceName);
    }
  }

  /**
   * Handle network status changes
   */
  private handleNetworkChange(isOnline: boolean): void {
    console.log(`[FallbackManager] Network status changed: ${isOnline ? 'online' : 'offline'}`);
    
    const health = this.serviceHealth.get('network')!;
    health.isHealthy = isOnline;
    health.degradationLevel = isOnline ? 'normal' : 'limited';
    health.lastCheck = new Date();
    
    this.serviceHealth.set('network', health);
    this.evaluateSystemHealth();
  }

  /**
   * Mark a service as unhealthy
   */
  private markServiceUnhealthy(serviceName: string): void {
    const health = this.serviceHealth.get(serviceName);
    if (health) {
      health.isHealthy = false;
      health.errorRate = Math.min(1, health.errorRate + 0.3);
      health.lastCheck = new Date();
      health.degradationLevel = this.calculateDegradationLevel(health);
      this.serviceHealth.set(serviceName, health);
    }
  }

  /**
   * Calculate degradation level based on service health metrics
   */
  private calculateDegradationLevel(health: ServiceHealth): ServiceDegradation {
    if (!health.isHealthy && health.errorRate > 0.8) {
      return 'emergency_only';
    } else if (health.errorRate > 0.5 || health.responseTime > 5000) {
      return 'limited';
    } else if (health.errorRate > 0.2 || health.responseTime > 2000) {
      return 'degraded';
    } else {
      return 'normal';
    }
  }

  /**
   * Evaluate overall system health and determine appropriate fallback level
   */
  private evaluateSystemHealth(): void {
    const services = Array.from(this.serviceHealth.values());
    const unhealthyServices = services.filter(s => !s.isHealthy);
    const degradedServices = services.filter(s => s.degradationLevel !== 'normal');

    let newDegradationLevel: ServiceDegradation = 'normal';
    let activeFallbacks: FallbackLevel[] = [];

    // Determine degradation level based on service health
    if (unhealthyServices.length >= 2 || services.some(s => s.degradationLevel === 'emergency_only')) {
      newDegradationLevel = 'emergency_only';
      activeFallbacks = ['emergency', 'offline'];
    } else if (unhealthyServices.length >= 1 || degradedServices.length >= 2) {
      newDegradationLevel = 'limited';
      activeFallbacks = ['secondary', 'offline'];
    } else if (degradedServices.length >= 1) {
      newDegradationLevel = 'degraded';
      activeFallbacks = ['secondary'];
    }

    // Update state if changed
    if (newDegradationLevel !== this.currentDegradationLevel.value) {
      console.log(`[FallbackManager] Degradation level changed: ${this.currentDegradationLevel.value} → ${newDegradationLevel}`);
      this.currentDegradationLevel.next(newDegradationLevel);
    }

    this.activeFallbacks.next(activeFallbacks);
    this.emergencyMode.next(newDegradationLevel === 'emergency_only');

    // Log health status for monitoring
    this.logHealthStatus();
  }

  /**
   * Log current health status for monitoring
   */
  private logHealthStatus(): void {
    const healthSummary = Array.from(this.serviceHealth.entries()).map(([name, health]) => ({
      service: name,
      healthy: health.isHealthy,
      degradation: health.degradationLevel,
      errorRate: Math.round(health.errorRate * 100),
      responseTime: health.responseTime
    }));

    console.log('[FallbackManager] Health Status:', {
      degradationLevel: this.currentDegradationLevel.value,
      emergencyMode: this.emergencyMode.value,
      activeFallbacks: this.activeFallbacks.value,
      services: healthSummary
    });
  }

  /**
   * Get the best available service for a specific task
   */
  public async getBestAvailableService(taskType: TaskType, priority: 'high' | 'medium' | 'low'): Promise<{
    service: 'orchestrator' | 'direct' | 'offline' | 'emergency';
    fallbackLevel: FallbackLevel;
    capabilities: string[];
  }> {
    const degradationLevel = this.currentDegradationLevel.value;
    const isEmergency = priority === 'high' || this.emergencyMode.value;

    // Emergency mode - use most reliable service
    if (isEmergency || degradationLevel === 'emergency_only') {
      return {
        service: 'emergency',
        fallbackLevel: 'emergency',
        capabilities: this.fallbackStrategies.get('emergency')!.capabilities
      };
    }

    // Check AI Orchestrator availability
    const orchestratorHealth = this.serviceHealth.get('ai-orchestrator');
    if (orchestratorHealth?.isHealthy && degradationLevel === 'normal') {
      return {
        service: 'orchestrator',
        fallbackLevel: 'primary',
        capabilities: this.fallbackStrategies.get('primary')!.capabilities
      };
    }

    // Use secondary fallback if available
    if (orchestratorHealth?.isHealthy && degradationLevel === 'degraded') {
      return {
        service: 'orchestrator',
        fallbackLevel: 'secondary',
        capabilities: this.fallbackStrategies.get('secondary')!.capabilities
      };
    }

    // Use offline capabilities
    const whisperHealth = this.serviceHealth.get('whisper-service');
    if (whisperHealth?.isHealthy) {
      return {
        service: 'offline',
        fallbackLevel: 'offline',
        capabilities: this.fallbackStrategies.get('offline')!.capabilities
      };
    }

    // Last resort - emergency mode
    return {
      service: 'emergency',
      fallbackLevel: 'emergency',
      capabilities: this.fallbackStrategies.get('emergency')!.capabilities
    };
  }

  /**
   * Force emergency mode (for testing or critical situations)
   */
  public forceEmergencyMode(enabled: boolean): void {
    console.log(`[FallbackManager] Emergency mode ${enabled ? 'enabled' : 'disabled'} manually`);
    this.emergencyMode.next(enabled);
    
    if (enabled) {
      this.currentDegradationLevel.next('emergency_only');
      this.activeFallbacks.next(['emergency', 'offline']);
    } else {
      this.evaluateSystemHealth(); // Re-evaluate based on actual health
    }
  }

  /**
   * Get observables for monitoring
   */
  public getDegradationLevel(): Observable<ServiceDegradation> {
    return this.currentDegradationLevel.asObservable();
  }

  public getActiveFallbacks(): Observable<FallbackLevel[]> {
    return this.activeFallbacks.asObservable();
  }

  public getEmergencyMode(): Observable<boolean> {
    return this.emergencyMode.asObservable();
  }

  public getServiceHealth(): Map<string, ServiceHealth> {
    return new Map(this.serviceHealth);
  }

  /**
   * Cleanup method
   */
  public dispose(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    window.removeEventListener('online', this.handleNetworkChange);
    window.removeEventListener('offline', this.handleNetworkChange);
    
    console.log('[FallbackManager] Service disposed');
  }
}

// Create singleton instance
export const fallbackManager = new FallbackManager();
