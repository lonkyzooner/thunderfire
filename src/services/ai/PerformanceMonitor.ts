import { BehaviorSubject, Observable } from 'rxjs';
import { aiOrchestrator, TaskType } from './AIOrchestrator';
import { fallbackManager, ServiceDegradation } from './FallbackManager';

// Performance metrics interfaces
interface PerformanceMetrics {
  timestamp: Date;
  responseTime: number;
  modelUsed: string;
  taskType: TaskType;
  success: boolean;
  fallbackLevel?: string;
  errorType?: string;
}

interface SystemHealthSnapshot {
  timestamp: Date;
  overallHealth: 'excellent' | 'good' | 'degraded' | 'critical';
  responseTimeAvg: number;
  successRate: number;
  activeFallbacks: string[];
  modelPerformance: ModelPerformanceSnapshot[];
  resourceUsage: ResourceUsage;
}

interface ModelPerformanceSnapshot {
  modelName: string;
  responseTime: number;
  successRate: number;
  requestCount: number;
  errorRate: number;
  lastUsed: Date;
}

interface ResourceUsage {
  memoryUsage: number; // MB
  networkLatency: number; // ms
  activeConnections: number;
  queueLength: number;
}

interface AlertRule {
  id: string;
  name: string;
  condition: (metrics: SystemHealthSnapshot) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  enabled: boolean;
}

interface PerformanceAlert {
  id: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  metrics: SystemHealthSnapshot;
  acknowledged: boolean;
}

/**
 * PerformanceMonitor - Real-time monitoring and analytics for AI orchestration
 * 
 * This service provides comprehensive monitoring of AI performance, system health,
 * and intelligent alerting for law enforcement operations.
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private healthSnapshots: SystemHealthSnapshot[] = [];
  private alerts: PerformanceAlert[] = [];
  private alertRules: AlertRule[] = [];
  
  private currentHealth = new BehaviorSubject<SystemHealthSnapshot | null>(null);
  private activeAlerts = new BehaviorSubject<PerformanceAlert[]>([]);
  private isMonitoring = new BehaviorSubject<boolean>(false);
  
  // Configuration
  private maxMetricsHistory = 1000; // Keep last 1000 performance records
  private maxHealthHistory = 100; // Keep last 100 health snapshots
  private maxAlerts = 50; // Keep last 50 alerts
  private monitoringInterval = 10000; // 10 seconds
  
  private monitoringTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeAlertRules();
    this.startMonitoring();
    
    console.log('[PerformanceMonitor] Initialized with real-time AI performance monitoring');
  }

  /**
   * Initialize default alert rules for law enforcement scenarios
   */
  private initializeAlertRules(): void {
    this.alertRules = [
      {
        id: 'response-time-critical',
        name: 'Critical Response Time',
        condition: (metrics) => metrics.responseTimeAvg > 5000, // 5 seconds
        severity: 'critical',
        description: 'Average response time exceeds 5 seconds - may impact officer safety',
        enabled: true
      },
      {
        id: 'success-rate-low',
        name: 'Low Success Rate',
        condition: (metrics) => metrics.successRate < 0.8, // 80%
        severity: 'high',
        description: 'AI success rate below 80% - system reliability compromised',
        enabled: true
      },
      {
        id: 'emergency-fallback-active',
        name: 'Emergency Fallback Active',
        condition: (metrics) => metrics.activeFallbacks.includes('emergency'),
        severity: 'high',
        description: 'System operating in emergency mode - limited functionality',
        enabled: true
      },
      {
        id: 'multiple-fallbacks',
        name: 'Multiple Fallbacks Active',
        condition: (metrics) => metrics.activeFallbacks.length >= 2,
        severity: 'medium',
        description: 'Multiple fallback systems active - performance degraded',
        enabled: true
      },
      {
        id: 'model-failure-rate',
        name: 'High Model Failure Rate',
        condition: (metrics) => metrics.modelPerformance.some(m => m.errorRate > 0.3),
        severity: 'medium',
        description: 'One or more AI models experiencing high failure rates',
        enabled: true
      },
      {
        id: 'network-latency-high',
        name: 'High Network Latency',
        condition: (metrics) => metrics.resourceUsage.networkLatency > 2000, // 2 seconds
        severity: 'medium',
        description: 'Network latency high - may affect real-time operations',
        enabled: true
      },
      {
        id: 'system-health-critical',
        name: 'Critical System Health',
        condition: (metrics) => metrics.overallHealth === 'critical',
        severity: 'critical',
        description: 'Overall system health critical - immediate attention required',
        enabled: true
      }
    ];
  }

  /**
   * Start real-time monitoring
   */
  private startMonitoring(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
    }

    this.monitoringTimer = setInterval(async () => {
      await this.collectSystemHealth();
    }, this.monitoringInterval);

    this.isMonitoring.next(true);
    console.log('[PerformanceMonitor] Real-time monitoring started');
  }

  /**
   * Record performance metrics from AI operations
   */
  public recordMetrics(metrics: Omit<PerformanceMetrics, 'timestamp'>): void {
    const performanceRecord: PerformanceMetrics = {
      ...metrics,
      timestamp: new Date()
    };

    this.metrics.push(performanceRecord);

    // Maintain history limit
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    // Log significant events
    if (!metrics.success) {
      console.warn(`[PerformanceMonitor] AI operation failed: ${metrics.taskType} using ${metrics.modelUsed}`);
    } else if (metrics.responseTime > 3000) {
      console.warn(`[PerformanceMonitor] Slow response: ${metrics.responseTime}ms for ${metrics.taskType}`);
    }
  }

  /**
   * Collect comprehensive system health snapshot
   */
  private async collectSystemHealth(): Promise<void> {
    try {
      const now = new Date();
      const recentMetrics = this.getRecentMetrics(300000); // Last 5 minutes

      // Calculate performance statistics
      const responseTimeAvg = recentMetrics.length > 0 
        ? recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length
        : 0;

      const successRate = recentMetrics.length > 0
        ? recentMetrics.filter(m => m.success).length / recentMetrics.length
        : 1.0;

      // Get fallback manager status
      const fallbackHealth = fallbackManager.getServiceHealth();
      const activeFallbacks = await this.getActiveFallbacks();

      // Calculate model performance
      const modelPerformance = await this.calculateModelPerformance(recentMetrics);

      // Get resource usage
      const resourceUsage = await this.getResourceUsage();

      // Determine overall health
      const overallHealth = this.calculateOverallHealth(responseTimeAvg, successRate, activeFallbacks.length);

      const healthSnapshot: SystemHealthSnapshot = {
        timestamp: now,
        overallHealth,
        responseTimeAvg,
        successRate,
        activeFallbacks,
        modelPerformance,
        resourceUsage
      };

      this.healthSnapshots.push(healthSnapshot);

      // Maintain history limit
      if (this.healthSnapshots.length > this.maxHealthHistory) {
        this.healthSnapshots = this.healthSnapshots.slice(-this.maxHealthHistory);
      }

      // Update current health
      this.currentHealth.next(healthSnapshot);

      // Check for alerts
      this.checkAlertRules(healthSnapshot);

      // Log health status
      this.logHealthStatus(healthSnapshot);

    } catch (error) {
      console.error('[PerformanceMonitor] Error collecting system health:', error);
    }
  }

  /**
   * Get recent performance metrics within time window
   */
  private getRecentMetrics(timeWindowMs: number): PerformanceMetrics[] {
    const cutoffTime = new Date(Date.now() - timeWindowMs);
    return this.metrics.filter(m => m.timestamp >= cutoffTime);
  }

  /**
   * Get active fallbacks from fallback manager
   */
  private async getActiveFallbacks(): Promise<string[]> {
    try {
      // This would integrate with the fallback manager
      const serviceHealth = fallbackManager.getServiceHealth();
      const unhealthyServices = Array.from(serviceHealth.entries())
        .filter(([_, health]) => !health.isHealthy)
        .map(([name, _]) => name);
      
      return unhealthyServices;
    } catch (error) {
      console.warn('[PerformanceMonitor] Error getting active fallbacks:', error);
      return [];
    }
  }

  /**
   * Calculate model performance statistics
   */
  private async calculateModelPerformance(recentMetrics: PerformanceMetrics[]): Promise<ModelPerformanceSnapshot[]> {
    const modelStats = new Map<string, {
      responseTimes: number[];
      successes: number;
      total: number;
      lastUsed: Date;
    }>();

    // Aggregate metrics by model
    recentMetrics.forEach(metric => {
      if (!modelStats.has(metric.modelUsed)) {
        modelStats.set(metric.modelUsed, {
          responseTimes: [],
          successes: 0,
          total: 0,
          lastUsed: metric.timestamp
        });
      }

      const stats = modelStats.get(metric.modelUsed)!;
      stats.responseTimes.push(metric.responseTime);
      if (metric.success) stats.successes++;
      stats.total++;
      if (metric.timestamp > stats.lastUsed) {
        stats.lastUsed = metric.timestamp;
      }
    });

    // Calculate performance snapshots
    return Array.from(modelStats.entries()).map(([modelName, stats]) => ({
      modelName,
      responseTime: stats.responseTimes.reduce((sum, rt) => sum + rt, 0) / stats.responseTimes.length,
      successRate: stats.successes / stats.total,
      requestCount: stats.total,
      errorRate: 1 - (stats.successes / stats.total),
      lastUsed: stats.lastUsed
    }));
  }

  /**
   * Get current resource usage
   */
  private async getResourceUsage(): Promise<ResourceUsage> {
    // In a real implementation, this would collect actual system metrics
    // For now, simulate based on current state
    return {
      memoryUsage: (performance as any).memory?.usedJSHeapSize / (1024 * 1024) || 0,
      networkLatency: await this.measureNetworkLatency(),
      activeConnections: this.metrics.length > 0 ? 1 : 0,
      queueLength: 0 // Would be actual queue length in production
    };
  }

  /**
   * Measure network latency
   */
  private async measureNetworkLatency(): Promise<number> {
    try {
      const start = performance.now();
      await fetch('https://api.openai.com/v1', { method: 'HEAD', signal: AbortSignal.timeout(5000) });
      return performance.now() - start;
    } catch (error) {
      return 5000; // Assume high latency on error
    }
  }

  /**
   * Calculate overall system health
   */
  private calculateOverallHealth(
    responseTimeAvg: number,
    successRate: number,
    activeFallbackCount: number
  ): 'excellent' | 'good' | 'degraded' | 'critical' {
    // Critical conditions
    if (successRate < 0.7 || responseTimeAvg > 5000) {
      return 'critical';
    }

    // Degraded conditions
    if (successRate < 0.9 || responseTimeAvg > 2000 || activeFallbackCount >= 2) {
      return 'degraded';
    }

    // Good conditions
    if (successRate >= 0.95 && responseTimeAvg <= 1000 && activeFallbackCount === 0) {
      return 'excellent';
    }

    return 'good';
  }

  /**
   * Check alert rules and generate alerts
   */
  private checkAlertRules(healthSnapshot: SystemHealthSnapshot): void {
    this.alertRules
      .filter(rule => rule.enabled)
      .forEach(rule => {
        try {
          if (rule.condition(healthSnapshot)) {
            // Check if we already have a recent alert for this rule
            const recentAlert = this.alerts.find(alert => 
              alert.id.startsWith(rule.id) && 
              Date.now() - alert.timestamp.getTime() < 300000 // 5 minutes
            );

            if (!recentAlert) {
              this.generateAlert(rule, healthSnapshot);
            }
          }
        } catch (error) {
          console.error(`[PerformanceMonitor] Error checking alert rule ${rule.id}:`, error);
        }
      });
  }

  /**
   * Generate performance alert
   */
  private generateAlert(rule: AlertRule, metrics: SystemHealthSnapshot): void {
    const alert: PerformanceAlert = {
      id: `${rule.id}-${Date.now()}`,
      timestamp: new Date(),
      severity: rule.severity,
      title: rule.name,
      description: rule.description,
      metrics,
      acknowledged: false
    };

    this.alerts.push(alert);

    // Maintain alert history limit
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(-this.maxAlerts);
    }

    // Update active alerts
    const activeAlerts = this.alerts.filter(a => !a.acknowledged);
    this.activeAlerts.next(activeAlerts);

    // Log alert
    console.warn(`[PerformanceMonitor] ${alert.severity.toUpperCase()} ALERT: ${alert.title} - ${alert.description}`);

    // For critical alerts, also log to console with more visibility
    if (alert.severity === 'critical') {
      console.error(`🚨 CRITICAL ALERT: ${alert.title}`);
      console.error(`Description: ${alert.description}`);
      console.error(`System Health:`, metrics);
    }
  }

  /**
   * Log health status for monitoring
   */
  private logHealthStatus(health: SystemHealthSnapshot): void {
    const status = {
      health: health.overallHealth,
      responseTime: Math.round(health.responseTimeAvg),
      successRate: Math.round(health.successRate * 100),
      activeFallbacks: health.activeFallbacks.length,
      modelCount: health.modelPerformance.length
    };

    console.log('[PerformanceMonitor] System Health:', status);

    // Detailed logging for degraded states
    if (health.overallHealth === 'degraded' || health.overallHealth === 'critical') {
      console.warn('[PerformanceMonitor] Detailed Health Report:', {
        responseTimeAvg: health.responseTimeAvg,
        successRate: health.successRate,
        activeFallbacks: health.activeFallbacks,
        modelPerformance: health.modelPerformance.map(m => ({
          model: m.modelName,
          responseTime: Math.round(m.responseTime),
          successRate: Math.round(m.successRate * 100),
          errorRate: Math.round(m.errorRate * 100)
        })),
        resourceUsage: health.resourceUsage
      });
    }
  }

  /**
   * Get performance analytics for specified time period
   */
  public getPerformanceAnalytics(timeRangeMs: number = 3600000): {
    averageResponseTime: number;
    successRate: number;
    totalRequests: number;
    taskTypeBreakdown: Record<TaskType, number>;
    modelUsageBreakdown: Record<string, number>;
    errorAnalysis: Record<string, number>;
  } {
    const metrics = this.getRecentMetrics(timeRangeMs);

    if (metrics.length === 0) {
      return {
        averageResponseTime: 0,
        successRate: 1.0,
        totalRequests: 0,
        taskTypeBreakdown: {} as Record<TaskType, number>,
        modelUsageBreakdown: {},
        errorAnalysis: {}
      };
    }

    const averageResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
    const successRate = metrics.filter(m => m.success).length / metrics.length;

    // Task type breakdown
    const taskTypeBreakdown = metrics.reduce((acc, m) => {
      acc[m.taskType] = (acc[m.taskType] || 0) + 1;
      return acc;
    }, {} as Record<TaskType, number>);

    // Model usage breakdown
    const modelUsageBreakdown = metrics.reduce((acc, m) => {
      acc[m.modelUsed] = (acc[m.modelUsed] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Error analysis
    const errorAnalysis = metrics
      .filter(m => !m.success && m.errorType)
      .reduce((acc, m) => {
        acc[m.errorType!] = (acc[m.errorType!] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      averageResponseTime,
      successRate,
      totalRequests: metrics.length,
      taskTypeBreakdown,
      modelUsageBreakdown,
      errorAnalysis
    };
  }

  /**
   * Acknowledge an alert
   */
  public acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      
      // Update active alerts
      const activeAlerts = this.alerts.filter(a => !a.acknowledged);
      this.activeAlerts.next(activeAlerts);
      
      console.log(`[PerformanceMonitor] Alert acknowledged: ${alertId}`);
      return true;
    }
    return false;
  }

  /**
   * Get observables for monitoring
   */
  public getCurrentHealth(): Observable<SystemHealthSnapshot | null> {
    return this.currentHealth.asObservable();
  }

  public getActiveAlerts(): Observable<PerformanceAlert[]> {
    return this.activeAlerts.asObservable();
  }

  public getMonitoringStatus(): Observable<boolean> {
    return this.isMonitoring.asObservable();
  }

  /**
   * Export performance data for analysis
   */
  public exportPerformanceData(): {
    metrics: PerformanceMetrics[];
    healthSnapshots: SystemHealthSnapshot[];
    alerts: PerformanceAlert[];
    exportedAt: Date;
  } {
    return {
      metrics: [...this.metrics],
      healthSnapshots: [...this.healthSnapshots],
      alerts: [...this.alerts],
      exportedAt: new Date()
    };
  }

  /**
   * Stop monitoring and cleanup
   */
  public dispose(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }

    this.isMonitoring.next(false);
    console.log('[PerformanceMonitor] Monitoring stopped and resources cleaned up');
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();
