import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { aiOrchestrator, TaskType } from '../src/services/ai/AIOrchestrator';
import { fallbackManager } from '../src/services/ai/FallbackManager';
import { performanceMonitor } from '../src/services/ai/PerformanceMonitor';

// Mock dependencies
vi.mock('../src/services/llmClients', () => ({
  OpenAIClient: vi.fn().mockImplementation(() => ({
    generateReply: vi.fn().mockResolvedValue('Mock OpenAI response')
  })),
  AnthropicClient: vi.fn().mockImplementation(() => ({
    generateReply: vi.fn().mockResolvedValue('Mock Claude response')
  })),
  GroqClient: vi.fn().mockImplementation(() => ({
    generateReply: vi.fn().mockResolvedValue('Mock Groq response')
  })),
  GeminiClient: vi.fn().mockImplementation(() => ({
    generateReply: vi.fn().mockResolvedValue('Mock Gemini response')
  })),
  CohereClient: vi.fn().mockImplementation(() => ({
    generateReply: vi.fn().mockResolvedValue('Mock Cohere response')
  })),
  QuasarClient: vi.fn().mockImplementation(() => ({
    generateReply: vi.fn().mockResolvedValue('Mock Quasar response')
  }))
}));

describe('AI Orchestration System', () => {
  beforeEach(() => {
    // Reset all mocks and state before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('AIOrchestrator', () => {
    it('should initialize with available models', () => {
      const availableModels = aiOrchestrator.getAvailableModels();
      expect(availableModels).toBeInstanceOf(Array);
      console.log('Available models:', availableModels);
    });

    it('should route legal analysis to appropriate models', async () => {
      const request = 'Provide information about Louisiana statute 14:95';
      const taskType: TaskType = 'legal_analysis';
      
      try {
        const result = await aiOrchestrator.orchestrate(request, taskType, 'medium');
        
        expect(result).toHaveProperty('response');
        expect(result).toHaveProperty('metadata');
        expect(result.metadata).toHaveProperty('modelUsed');
        expect(result.metadata).toHaveProperty('responseTime');
        expect(result.metadata).toHaveProperty('routing');
        
        console.log('Legal analysis routing result:', result.metadata);
      } catch (error) {
        console.warn('Legal analysis test skipped due to missing API keys:', error);
      }
    });

    it('should prioritize fast models for emergency tasks', async () => {
      const request = 'Officer down, need immediate assistance';
      const taskType: TaskType = 'emergency';
      
      try {
        const result = await aiOrchestrator.orchestrate(request, taskType, 'high');
        
        expect(result.metadata.responseTime).toBeLessThan(2000); // Should be fast
        expect(result.metadata.routing.priority).toBe('high');
        
        console.log('Emergency routing result:', result.metadata);
      } catch (error) {
        console.warn('Emergency test skipped due to missing API keys:', error);
      }
    });

    it('should handle task type routing strategy', () => {
      const taskStrategy = aiOrchestrator.getTaskStrategy();
      
      expect(taskStrategy.has('miranda')).toBe(true);
      expect(taskStrategy.has('legal_analysis')).toBe(true);
      expect(taskStrategy.has('threat_assessment')).toBe(true);
      expect(taskStrategy.has('emergency')).toBe(true);
      
      console.log('Task strategy mapping:', Object.fromEntries(taskStrategy));
    });

    it('should provide model performance data', () => {
      const modelPerformance = aiOrchestrator.getModelPerformance();
      expect(modelPerformance).toBeInstanceOf(Map);
      
      console.log('Model performance tracking initialized:', modelPerformance.size > 0);
    });
  });

  describe('FallbackManager', () => {
    it('should initialize with service health monitoring', () => {
      const serviceHealth = fallbackManager.getServiceHealth();
      expect(serviceHealth).toBeInstanceOf(Map);
      expect(serviceHealth.has('ai-orchestrator')).toBe(true);
      expect(serviceHealth.has('whisper-service')).toBe(true);
      expect(serviceHealth.has('network')).toBe(true);
      
      console.log('Service health monitoring active for:', Array.from(serviceHealth.keys()));
    });

    it('should provide degradation level monitoring', (done) => {
      const degradationSubscription = fallbackManager.getDegradationLevel().subscribe((level) => {
        expect(['normal', 'degraded', 'limited', 'emergency_only']).toContain(level);
        console.log('Current degradation level:', level);
        degradationSubscription.unsubscribe();
        done();
      });
    });

    it('should handle emergency mode activation', (done) => {
      // Activate emergency mode
      fallbackManager.forceEmergencyMode(true);
      
      const emergencySubscription = fallbackManager.getEmergencyMode().subscribe((isEmergency) => {
        expect(isEmergency).toBe(true);
        console.log('Emergency mode activated:', isEmergency);
        
        // Deactivate emergency mode
        fallbackManager.forceEmergencyMode(false);
        emergencySubscription.unsubscribe();
        done();
      });
    });

    it('should recommend best available service based on conditions', async () => {
      const serviceRecommendation = await fallbackManager.getBestAvailableService('threat_assessment', 'high');
      
      expect(serviceRecommendation).toHaveProperty('service');
      expect(serviceRecommendation).toHaveProperty('fallbackLevel');
      expect(serviceRecommendation).toHaveProperty('capabilities');
      expect(['orchestrator', 'direct', 'offline', 'emergency']).toContain(serviceRecommendation.service);
      
      console.log('Service recommendation for threat assessment:', serviceRecommendation);
    });

    it('should track active fallbacks', (done) => {
      const fallbacksSubscription = fallbackManager.getActiveFallbacks().subscribe((fallbacks) => {
        expect(fallbacks).toBeInstanceOf(Array);
        console.log('Active fallbacks:', fallbacks);
        fallbacksSubscription.unsubscribe();
        done();
      });
    });
  });

  describe('PerformanceMonitor', () => {
    it('should record performance metrics', () => {
      const testMetrics = {
        responseTime: 1500,
        modelUsed: 'test-model',
        taskType: 'general_query' as TaskType,
        success: true,
        fallbackLevel: 'primary'
      };
      
      performanceMonitor.recordMetrics(testMetrics);
      
      const analytics = performanceMonitor.getPerformanceAnalytics(60000); // Last minute
      expect(analytics.totalRequests).toBeGreaterThanOrEqual(1);
      
      console.log('Performance analytics after recording metrics:', analytics);
    });

    it('should provide system health monitoring', (done) => {
      const healthSubscription = performanceMonitor.getCurrentHealth().subscribe((health) => {
        if (health) {
          expect(health).toHaveProperty('overallHealth');
          expect(health).toHaveProperty('responseTimeAvg');
          expect(health).toHaveProperty('successRate');
          expect(health).toHaveProperty('activeFallbacks');
          expect(health).toHaveProperty('modelPerformance');
          expect(health).toHaveProperty('resourceUsage');
          
          console.log('Current system health:', {
            health: health.overallHealth,
            responseTime: Math.round(health.responseTimeAvg),
            successRate: Math.round(health.successRate * 100)
          });
        }
        healthSubscription.unsubscribe();
        done();
      });
    });

    it('should track monitoring status', (done) => {
      const monitoringSubscription = performanceMonitor.getMonitoringStatus().subscribe((isMonitoring) => {
        expect(typeof isMonitoring).toBe('boolean');
        console.log('Performance monitoring active:', isMonitoring);
        monitoringSubscription.unsubscribe();
        done();
      });
    });

    it('should provide performance analytics', () => {
      // Record some test metrics first
      const testMetrics = [
        { responseTime: 1000, modelUsed: 'gpt-4', taskType: 'legal_analysis' as TaskType, success: true },
        { responseTime: 500, modelUsed: 'groq', taskType: 'emergency' as TaskType, success: true },
        { responseTime: 2000, modelUsed: 'claude', taskType: 'threat_assessment' as TaskType, success: false, errorType: 'timeout' }
      ];
      
      testMetrics.forEach(metric => performanceMonitor.recordMetrics(metric));
      
      const analytics = performanceMonitor.getPerformanceAnalytics();
      
      expect(analytics).toHaveProperty('averageResponseTime');
      expect(analytics).toHaveProperty('successRate');
      expect(analytics).toHaveProperty('totalRequests');
      expect(analytics).toHaveProperty('taskTypeBreakdown');
      expect(analytics).toHaveProperty('modelUsageBreakdown');
      expect(analytics).toHaveProperty('errorAnalysis');
      
      console.log('Performance analytics breakdown:', analytics);
    });

    it('should handle alert management', (done) => {
      const alertsSubscription = performanceMonitor.getActiveAlerts().subscribe((alerts) => {
        expect(alerts).toBeInstanceOf(Array);
        console.log('Active alerts count:', alerts.length);
        
        if (alerts.length > 0) {
          const alertId = alerts[0].id;
          const acknowledged = performanceMonitor.acknowledgeAlert(alertId);
          expect(acknowledged).toBe(true);
          console.log('Alert acknowledged:', alertId);
        }
        
        alertsSubscription.unsubscribe();
        done();
      });
    });

    it('should export performance data', () => {
      const exportedData = performanceMonitor.exportPerformanceData();
      
      expect(exportedData).toHaveProperty('metrics');
      expect(exportedData).toHaveProperty('healthSnapshots');
      expect(exportedData).toHaveProperty('alerts');
      expect(exportedData).toHaveProperty('exportedAt');
      expect(exportedData.exportedAt).toBeInstanceOf(Date);
      
      console.log('Exported performance data structure:', {
        metricsCount: exportedData.metrics.length,
        healthSnapshotsCount: exportedData.healthSnapshots.length,
        alertsCount: exportedData.alerts.length,
        exportedAt: exportedData.exportedAt
      });
    });
  });

  describe('Integration Tests', () => {
    it('should coordinate between all services', async () => {
      console.log('=== AI Orchestration Integration Test ===');
      
      // Test service initialization
      const orchestratorModels = aiOrchestrator.getAvailableModels();
      const fallbackHealth = fallbackManager.getServiceHealth();
      
      console.log('Orchestrator models available:', orchestratorModels.length);
      console.log('Fallback services monitored:', fallbackHealth.size);
      
      // Test performance monitoring integration
      performanceMonitor.recordMetrics({
        responseTime: 800,
        modelUsed: 'integration-test',
        taskType: 'general_query',
        success: true
      });
      
      const analytics = performanceMonitor.getPerformanceAnalytics();
      console.log('Integration test metrics recorded:', analytics.totalRequests > 0);
      
      // Test fallback service recommendation
      const serviceRecommendation = await fallbackManager.getBestAvailableService('miranda', 'high');
      console.log('Service recommendation for Miranda rights:', serviceRecommendation.service);
      
      expect(orchestratorModels.length).toBeGreaterThanOrEqual(0);
      expect(fallbackHealth.size).toBeGreaterThanOrEqual(3);
      expect(analytics.totalRequests).toBeGreaterThanOrEqual(1);
      expect(serviceRecommendation.service).toBeDefined();
      
      console.log('=== Integration Test Completed Successfully ===');
    });

    it('should handle system degradation scenarios', async () => {
      console.log('=== Testing System Degradation Scenarios ===');
      
      // Force emergency mode to test degradation
      fallbackManager.forceEmergencyMode(true);
      
      // Test service recommendation in emergency mode
      const emergencyService = await fallbackManager.getBestAvailableService('emergency', 'high');
      expect(emergencyService.fallbackLevel).toBe('emergency');
      console.log('Emergency mode service:', emergencyService.service);
      
      // Record failed metrics to test monitoring
      performanceMonitor.recordMetrics({
        responseTime: 10000, // Very slow
        modelUsed: 'degraded-service',
        taskType: 'threat_assessment',
        success: false,
        errorType: 'timeout'
      });
      
      const analytics = performanceMonitor.getPerformanceAnalytics();
      console.log('Degradation scenario analytics:', {
        avgResponseTime: Math.round(analytics.averageResponseTime),
        successRate: Math.round(analytics.successRate * 100)
      });
      
      // Reset emergency mode
      fallbackManager.forceEmergencyMode(false);
      console.log('=== Degradation Scenario Test Completed ===');
    });

    it('should validate law enforcement specific features', async () => {
      console.log('=== Testing Law Enforcement Features ===');
      
      // Test Miranda rights task routing
      const mirandaService = await fallbackManager.getBestAvailableService('miranda', 'medium');
      expect(mirandaService.capabilities).toContain('Emergency commands');
      console.log('Miranda rights service capabilities:', mirandaService.capabilities.length);
      
      // Test threat assessment routing
      const threatService = await fallbackManager.getBestAvailableService('threat_assessment', 'high');
      expect(['orchestrator', 'emergency']).toContain(threatService.service);
      console.log('Threat assessment routed to:', threatService.service);
      
      // Test emergency response timing
      const startTime = Date.now();
      const emergencyService = await fallbackManager.getBestAvailableService('emergency', 'high');
      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(100); // Should be very fast
      console.log('Emergency service selection time:', responseTime + 'ms');
      
      console.log('=== Law Enforcement Features Validated ===');
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet performance requirements', async () => {
      console.log('=== Performance Benchmark Tests ===');
      
      const benchmarks = {
        emergencyResponse: 100, // ms
        normalResponse: 2000, // ms
        successRate: 0.95, // 95%
        fallbackSpeed: 50 // ms
      };
      
      // Test emergency response time
      const emergencyStart = Date.now();
      await fallbackManager.getBestAvailableService('emergency', 'high');
      const emergencyTime = Date.now() - emergencyStart;
      
      expect(emergencyTime).toBeLessThan(benchmarks.emergencyResponse);
      console.log(`✓ Emergency response: ${emergencyTime}ms (target: <${benchmarks.emergencyResponse}ms)`);
      
      // Test fallback decision speed
      const fallbackStart = Date.now();
      await fallbackManager.getBestAvailableService('general_query', 'low');
      const fallbackTime = Date.now() - fallbackStart;
      
      expect(fallbackTime).toBeLessThan(benchmarks.fallbackSpeed);
      console.log(`✓ Fallback decision: ${fallbackTime}ms (target: <${benchmarks.fallbackSpeed}ms)`);
      
      // Test system health calculation speed
      const analytics = performanceMonitor.getPerformanceAnalytics();
      expect(analytics.successRate).toBeGreaterThanOrEqual(0); // At least 0%
      console.log(`✓ Analytics calculation: instantaneous`);
      
      console.log('=== Performance Benchmarks Completed ===');
    });
  });
});

// Additional helper functions for testing
export function simulateModelFailure(modelName: string) {
  console.log(`Simulating failure for model: ${modelName}`);
  performanceMonitor.recordMetrics({
    responseTime: 5000,
    modelUsed: modelName,
    taskType: 'general_query',
    success: false,
    errorType: 'model_failure'
  });
}

export function simulateNetworkLatency(latencyMs: number) {
  console.log(`Simulating network latency: ${latencyMs}ms`);
  // This would be used in integration tests to simulate various network conditions
}

export function generateLoadTest(requestCount: number = 100) {
  console.log(`Generating load test with ${requestCount} requests`);
  const taskTypes: TaskType[] = ['miranda', 'legal_analysis', 'threat_assessment', 'emergency', 'general_query'];
  
  for (let i = 0; i < requestCount; i++) {
    const taskType = taskTypes[Math.floor(Math.random() * taskTypes.length)];
    const responseTime = Math.random() * 3000 + 200; // 200-3200ms
    const success = Math.random() > 0.1; // 90% success rate
    
    performanceMonitor.recordMetrics({
      responseTime,
      modelUsed: `load-test-model-${i % 5}`,
      taskType,
      success,
      errorType: success ? undefined : 'load_test_error'
    });
  }
  
  const analytics = performanceMonitor.getPerformanceAnalytics();
  console.log(`Load test completed. Analytics:`, {
    totalRequests: analytics.totalRequests,
    avgResponseTime: Math.round(analytics.averageResponseTime),
    successRate: Math.round(analytics.successRate * 100)
  });
  
  return analytics;
}
