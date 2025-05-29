import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider } from "react-grid-layout";
import { 
  Activity, 
  Cpu, 
  CheckCircle, 
  Wifi, 
  MessageSquare,
  MapPin,
  FileText,
  Scale,
  Settings,
  Clock,
  Shield,
  Radio,
  AlertTriangle,
  Terminal,
  Users,
  Database,
  Zap,
  Signal,
  Power,
  Eye,
  Target,
  Radar
} from 'lucide-react';

// Import components
import ConversationalAgent from './ConversationalAgent';
import OfficerMap from './OfficerMap';
import ReportAssistant from './ReportAssistant';
import MirandaWorkflow from './MirandaWorkflow';
import RSCodes from './RSCodesSimplified';

// Import AI Orchestration services
import { performanceMonitor } from '../services/ai/PerformanceMonitor';
import { fallbackManager } from '../services/ai/FallbackManager';

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardProps {
  onLocationChange: (location: string) => void;
}

interface SystemHealth {
  overallHealth: 'excellent' | 'good' | 'degraded' | 'critical';
  responseTimeAvg: number;
  successRate: number;
  activeFallbacks: string[];
  aiModelsAvailable: number;
  currentModel: string;
}

interface AIStatus {
  orchestratorOnline: boolean;
  fallbacksActive: number;
  emergencyMode: boolean;
  networkStatus: 'online' | 'offline' | 'limited';
}

export const TacticalDashboard: React.FC<DashboardProps> = ({ onLocationChange }) => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    overallHealth: 'good',
    responseTimeAvg: 150,
    successRate: 0.98,
    activeFallbacks: [],
    aiModelsAvailable: 7,
    currentModel: 'GPT-4'
  });

  const [aiStatus, setAiStatus] = useState<AIStatus>({
    orchestratorOnline: true,
    fallbacksActive: 2,
    emergencyMode: false,
    networkStatus: 'online'
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Monitor AI system health
  useEffect(() => {
    const healthSubscription = performanceMonitor.getCurrentHealth().subscribe((health) => {
      if (health) {
        setSystemHealth({
          overallHealth: health.overallHealth,
          responseTimeAvg: health.responseTimeAvg,
          successRate: health.successRate,
          activeFallbacks: health.activeFallbacks,
          aiModelsAvailable: health.modelPerformance.length,
          currentModel: health.modelPerformance[0]?.modelName || 'GPT-4'
        });
      }
    });

    const emergencySubscription = fallbackManager.getEmergencyMode().subscribe((isEmergency) => {
      setAiStatus(prev => ({ ...prev, emergencyMode: isEmergency }));
    });

    const fallbacksSubscription = fallbackManager.getActiveFallbacks().subscribe((fallbacks) => {
      setAiStatus(prev => ({ 
        ...prev, 
        fallbacksActive: fallbacks.length,
        networkStatus: fallbacks.some(f => f.includes('network')) ? 'offline' : 'online'
      }));
    });

    return () => {
      healthSubscription.unsubscribe();
      emergencySubscription.unsubscribe();
      fallbacksSubscription.unsubscribe();
    };
  }, []);

  // Tactical layout - optimized for law enforcement workflow
  const layouts = {
    lg: [
      { i: "command-header", x: 0, y: 0, w: 12, h: 3, static: true },
      { i: "chat", x: 3, y: 3, w: 6, h: 18, minW: 4, minH: 15 },
      { i: "map", x: 0, y: 3, w: 3, h: 10, minW: 2, minH: 8 },
      { i: "tactical-actions", x: 0, y: 13, w: 3, h: 8, minW: 2, minH: 6 },
      { i: "miranda", x: 9, y: 3, w: 3, h: 8, minW: 2, minH: 6 },
      { i: "legal-db", x: 9, y: 11, w: 3, h: 7, minW: 2, minH: 6 },
      { i: "status-monitor", x: 9, y: 18, w: 3, h: 3, minW: 2, minH: 3 },
      { i: "reports", x: 0, y: 21, w: 9, h: 6, minW: 6, minH: 4 },
    ],
    md: [
      { i: "command-header", x: 0, y: 0, w: 10, h: 3, static: true },
      { i: "chat", x: 0, y: 3, w: 6, h: 16 },
      { i: "map", x: 6, y: 3, w: 4, h: 8 },
      { i: "tactical-actions", x: 6, y: 11, w: 4, h: 5 },
      { i: "miranda", x: 0, y: 19, w: 5, h: 6 },
      { i: "legal-db", x: 5, y: 19, w: 5, h: 6 },
      { i: "status-monitor", x: 6, y: 16, w: 4, h: 3 },
      { i: "reports", x: 0, y: 25, w: 10, h: 6 },
    ],
    sm: [
      { i: "command-header", x: 0, y: 0, w: 6, h: 3, static: true },
      { i: "chat", x: 0, y: 3, w: 6, h: 12 },
      { i: "map", x: 0, y: 15, w: 6, h: 6 },
      { i: "tactical-actions", x: 0, y: 21, w: 6, h: 5 },
      { i: "miranda", x: 0, y: 26, w: 6, h: 6 },
      { i: "legal-db", x: 0, y: 32, w: 6, h: 6 },
      { i: "status-monitor", x: 0, y: 38, w: 6, h: 3 },
      { i: "reports", x: 0, y: 41, w: 6, h: 6 },
    ]
  };

  // Tactical Command Header
  const TacticalHeader = () => (
    <div style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      border: '2px solid #475569',
      borderRadius: '8px',
      padding: '16px 24px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      color: '#f1f5f9',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23475569' fill-opacity='0.05'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
        zIndex: 0
      }} />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                padding: '12px',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                borderRadius: '8px',
                border: '1px solid #f87171',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
              }}>
                <Shield size={32} style={{ color: '#ffffff' }} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: '#f1f5f9',
                  margin: 0,
                  letterSpacing: '0.5px',
                  fontFamily: '"JetBrains Mono", "SF Mono", "Monaco", monospace',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
                }}>
                  LARK TACTICAL COMMAND
                </h1>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px', 
                  marginTop: '6px' 
                }}>
                  <div style={{
                    background: 'rgba(34, 197, 94, 0.15)',
                    color: '#22c55e',
                    border: '1px solid #22c55e',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    fontFamily: '"JetBrains Mono", monospace',
                    letterSpacing: '0.5px'
                  }}>
                    {systemHealth.currentModel} ONLINE
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    color: '#22c55e'
                  }}>
                    <Signal size={16} />
                    <span style={{ 
                      fontSize: '13px', 
                      fontWeight: '600',
                      fontFamily: '"JetBrains Mono", monospace'
                    }}>
                      SYSTEM OPERATIONAL
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ 
            textAlign: 'right',
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '16px 20px',
            borderRadius: '8px',
            border: '1px solid #475569'
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#fbbf24',
              fontFamily: '"JetBrains Mono", monospace',
              lineHeight: 1,
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
            }}>
              {currentTime.toLocaleTimeString('en-US', { hour12: false })}
            </div>
            <div style={{
              fontSize: '13px',
              color: '#94a3b8',
              fontFamily: '"JetBrains Mono", monospace',
              marginTop: '4px',
              letterSpacing: '0.5px'
            }}>
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'short',
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              }).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Tactical Status Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '12px' 
        }}>
          {[
            {
              icon: CheckCircle,
              label: 'System Status',
              value: systemHealth.overallHealth === 'good' ? 'OPERATIONAL' : 'DEGRADED',
              status: systemHealth.overallHealth === 'good' ? 'good' : 'warning',
              color: systemHealth.overallHealth === 'good' ? '#22c55e' : '#f59e0b'
            },
            {
              icon: Wifi,
              label: 'Network',
              value: aiStatus.networkStatus === 'online' ? 'CONNECTED' : 'LIMITED',
              status: aiStatus.networkStatus === 'online' ? 'good' : 'warning',
              color: aiStatus.networkStatus === 'online' ? '#22c55e' : '#f59e0b'
            },
            {
              icon: Cpu,
              label: 'AI Models',
              value: `${systemHealth.aiModelsAvailable} ACTIVE`,
              status: 'good',
              color: '#3b82f6'
            },
            {
              icon: Clock,
              label: 'Response Time',
              value: `${Math.round(systemHealth.responseTimeAvg)}MS`,
              status: systemHealth.responseTimeAvg < 200 ? 'good' : 'warning',
              color: systemHealth.responseTimeAvg < 200 ? '#22c55e' : '#f59e0b'
            },
            {
              icon: Activity,
              label: 'Success Rate',
              value: `${Math.round(systemHealth.successRate * 100)}%`,
              status: systemHealth.successRate > 0.95 ? 'good' : 'warning',
              color: systemHealth.successRate > 0.95 ? '#22c55e' : '#f59e0b'
            }
          ].map((metric, index) => (
            <div key={index} style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: `1px solid ${metric.color}`,
              borderRadius: '6px',
              padding: '12px 16px',
              backdropFilter: 'blur(8px)',
              boxShadow: `0 4px 12px rgba(0, 0, 0, 0.2), 0 0 0 1px ${metric.color}20`
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginBottom: '6px' 
              }}>
                <metric.icon size={16} style={{ color: metric.color }} />
                <span style={{ 
                  fontSize: '11px', 
                  color: '#94a3b8', 
                  fontWeight: '600',
                  fontFamily: '"JetBrains Mono", monospace',
                  letterSpacing: '0.5px'
                }}>
                  {metric.label}
                </span>
              </div>
              <div style={{ 
                color: metric.color, 
                fontWeight: '700', 
                fontSize: '14px',
                fontFamily: '"JetBrains Mono", monospace',
                letterSpacing: '0.5px'
              }}>
                {metric.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Tactical Widget Component
  const TacticalWidget = ({ 
    title, 
    icon: Icon, 
    children, 
    status,
    priority = "normal",
    compact = false
  }: {
    title: string;
    icon: React.ComponentType<any>;
    children: React.ReactNode;
    status?: string;
    priority?: "normal" | "high" | "critical";
    compact?: boolean;
  }) => {
    const priorityStyles = {
      normal: { 
        border: '#475569', 
        accent: '#3b82f6',
        bg: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
      },
      high: { 
        border: '#f59e0b', 
        accent: '#f59e0b',
        bg: 'linear-gradient(135deg, #451a03 0%, #78350f 100%)'
      },
      critical: { 
        border: '#ef4444', 
        accent: '#ef4444',
        bg: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%)'
      }
    };

    const style = priorityStyles[priority];

    return (
      <div style={{
        height: '100%',
        background: '#0f172a',
        border: `2px solid ${style.border}`,
        borderRadius: '8px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          background: style.bg,
          color: '#f1f5f9',
          padding: compact ? '12px 16px' : '16px 20px',
          borderBottom: `1px solid ${style.border}`
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                padding: '8px',
                background: `rgba(${style.accent === '#3b82f6' ? '59, 130, 246' : style.accent === '#f59e0b' ? '245, 158, 11' : '239, 68, 68'}, 0.15)`,
                borderRadius: '6px',
                border: `1px solid ${style.accent}`
              }}>
                <Icon size={compact ? 18 : 20} style={{ color: style.accent }} />
              </div>
              <div>
                <h3 style={{
                  color: '#f1f5f9',
                  fontWeight: '600',
                  fontSize: compact ? '14px' : '16px',
                  margin: 0,
                  fontFamily: '"JetBrains Mono", monospace',
                  letterSpacing: '0.5px'
                }}>{title}</h3>
                {status && (
                  <div style={{
                    marginTop: '4px',
                    background: `rgba(${style.accent === '#3b82f6' ? '59, 130, 246' : style.accent === '#f59e0b' ? '245, 158, 11' : '239, 68, 68'}, 0.15)`,
                    color: style.accent,
                    border: `1px solid ${style.accent}`,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '600',
                    display: 'inline-block',
                    fontFamily: '"JetBrains Mono", monospace',
                    letterSpacing: '0.5px'
                  }}>
                    {status}
                  </div>
                )}
              </div>
            </div>
            <div style={{
              width: '8px',
              height: '8px',
              background: priority === 'critical' ? '#ef4444' : priority === 'high' ? '#f59e0b' : '#22c55e',
              borderRadius: '50%',
              boxShadow: `0 0 8px ${priority === 'critical' ? '#ef4444' : priority === 'high' ? '#f59e0b' : '#22c55e'}`
            }} />
          </div>
        </div>
        
        {/* Content */}
        <div style={{ 
          padding: compact ? '12px 16px' : '16px 20px',
          flex: '1', 
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          background: '#0f172a'
        }}>
          {children}
        </div>
      </div>
    );
  };

  // Tactical Quick Actions
  const TacticalActions = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {[
        { 
          icon: AlertTriangle, 
          label: "EMERGENCY", 
          color: "#ef4444", 
          bg: "rgba(239, 68, 68, 0.1)",
          border: "#ef4444"
        },
        { 
          icon: Radio, 
          label: "STATUS CHECK", 
          color: "#3b82f6", 
          bg: "rgba(59, 130, 246, 0.1)",
          border: "#3b82f6"
        },
        { 
          icon: Target, 
          label: "LOCATION", 
          color: "#22c55e", 
          bg: "rgba(34, 197, 94, 0.1)",
          border: "#22c55e"
        },
        { 
          icon: FileText, 
          label: "REPORT", 
          color: "#f59e0b", 
          bg: "rgba(245, 158, 11, 0.1)",
          border: "#f59e0b"
        }
      ].map((action, index) => (
        <button
          key={index}
          style={{
            width: '100%',
            background: action.bg,
            border: `2px solid ${action.border}`,
            borderRadius: '6px',
            padding: '12px 16px',
            color: action.color,
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.5px',
            fontFamily: '"JetBrains Mono", monospace'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = `0 6px 20px ${action.color}40`;
            e.currentTarget.style.background = action.color + '20';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.background = action.bg;
          }}
        >
          <action.icon size={16} />
          {action.label}
        </button>
      ))}
    </div>
  );

  // System Status Monitor
  const StatusMonitor = () => (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: '1fr 1fr', 
      gap: '8px',
      height: '100%'
    }}>
      {[
        { icon: Power, label: 'PWR', status: 'ON', color: '#22c55e' },
        { icon: Wifi, label: 'NET', status: 'OK', color: '#3b82f6' },
        { icon: Eye, label: 'MON', status: 'ACT', color: '#f59e0b' },
        { icon: Radar, label: 'SYS', status: 'RDY', color: '#22c55e' }
      ].map((item, index) => (
        <div key={index} style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: `1px solid ${item.color}`,
          borderRadius: '4px',
          padding: '8px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px'
        }}>
          <item.icon size={14} style={{ color: item.color }} />
          <div style={{
            fontSize: '9px',
            color: '#94a3b8',
            fontFamily: '"JetBrains Mono", monospace',
            fontWeight: '600'
          }}>
            {item.label}
          </div>
          <div style={{
            fontSize: '10px',
            color: item.color,
            fontFamily: '"JetBrains Mono", monospace',
            fontWeight: '700'
          }}>
            {item.status}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e293b 100%)',
      padding: '16px',
      fontFamily: '"JetBrains Mono", "SF Mono", "Monaco", monospace'
    }}>
      <ResponsiveGridLayout
        className="tactical-layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768 }}
        cols={{ lg: 12, md: 10, sm: 6 }}
        rowHeight={20}
        isResizable
        isDraggable
        margin={[12, 12]}
        containerPadding={[0, 0]}
      >
        {/* Command Header */}
        <div key="command-header">
          <TacticalHeader />
        </div>

        {/* AI Assistant */}
        <div key="chat">
          <TacticalWidget 
            title="AI ASSISTANT" 
            icon={MessageSquare}
            status="ACTIVE"
            priority="high"
          >
            <ConversationalAgent />
          </TacticalWidget>
        </div>

        {/* Officer Map */}
        <div key="map">
          <TacticalWidget 
            title="LOCATION TRACKING" 
            icon={MapPin}
            status="LIVE"
            priority="critical"
          >
            <OfficerMap onLocationChange={onLocationChange} />
          </TacticalWidget>
        </div>

        {/* Tactical Actions */}
        <div key="tactical-actions">
          <TacticalWidget 
            title="TACTICAL ACTIONS" 
            icon={Zap}
            priority="high"
          >
            <TacticalActions />
          </TacticalWidget>
        </div>

        {/* Miranda Rights */}
        <div key="miranda">
          <TacticalWidget 
            title="MIRANDA RIGHTS" 
            icon={Scale}
            status="READY"
          >
            <MirandaWorkflow />
          </TacticalWidget>
        </div>

        {/* Legal Database */}
        <div key="legal-db">
          <TacticalWidget 
            title="LEGAL DATABASE" 
            icon={Database}
            status="CONNECTED"
          >
            <RSCodes />
          </TacticalWidget>
        </div>

        {/* Status Monitor */}
        <div key="status-monitor">
          <TacticalWidget 
            title="SYSTEM STATUS" 
            icon={Activity}
            compact={true}
          >
            <StatusMonitor />
          </TacticalWidget>
        </div>

        {/* Reports Section */}
        <div key="reports">
          <TacticalWidget 
            title="INCIDENT REPORTS" 
            icon={FileText}
            status="READY"
          >
            <ReportAssistant />
          </TacticalWidget>
        </div>
      </ResponsiveGridLayout>

      {/* Tactical CSS Styling */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        
        .tactical-layout {
          font-family: 'JetBrains Mono', 'SF Mono', 'Monaco', monospace;
        }
        
        .react-grid-item {
          transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .react-grid-item.react-grid-placeholder {
          background: rgba(59, 130, 246, 0.1) !important;
          border: 2px dashed #3b82f6 !important;
          borderRadius: 8px !important;
          backdropFilter: blur(8px);
        }
        
        .react-grid-item:hover {
          transform: translateY(-2px);
          filter: brightness(1.05);
        }

        /* Custom scrollbar for tactical theme */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #0f172a;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 4px;
          border: 1px solid #334155;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }

        /* Selection styling */
        ::selection {
          background: rgba(59, 130, 246, 0.3);
          color: #f1f5f9;
        }
      `}</style>
    </div>
  );
};

export default TacticalDashboard;
