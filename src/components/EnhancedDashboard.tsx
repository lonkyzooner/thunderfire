import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider } from "react-grid-layout";
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
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
  Zap
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

export const EnhancedDashboard: React.FC<DashboardProps> = ({ onLocationChange }) => {
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

  // Professional layout - optimized for workflow efficiency
  const layouts = {
    lg: [
      { i: "status-bar", x: 0, y: 0, w: 12, h: 3, static: true },
      { i: "chat", x: 3, y: 3, w: 6, h: 20, minW: 4, minH: 15 },
      { i: "map", x: 0, y: 3, w: 3, h: 12, minW: 2, minH: 8 },
      { i: "quick-actions", x: 0, y: 15, w: 3, h: 8, minW: 2, minH: 6 },
      { i: "miranda", x: 9, y: 3, w: 3, h: 10, minW: 2, minH: 8 },
      { i: "statutes", x: 9, y: 13, w: 3, h: 10, minW: 2, minH: 8 },
      { i: "reports", x: 0, y: 23, w: 12, h: 8, minW: 6, minH: 6 },
    ],
    md: [
      { i: "status-bar", x: 0, y: 0, w: 10, h: 3, static: true },
      { i: "chat", x: 0, y: 3, w: 6, h: 18 },
      { i: "map", x: 6, y: 3, w: 4, h: 9 },
      { i: "quick-actions", x: 6, y: 12, w: 4, h: 5 },
      { i: "miranda", x: 0, y: 21, w: 5, h: 8 },
      { i: "statutes", x: 5, y: 21, w: 5, h: 8 },
      { i: "reports", x: 0, y: 29, w: 10, h: 8 },
    ],
    sm: [
      { i: "status-bar", x: 0, y: 0, w: 6, h: 3, static: true },
      { i: "chat", x: 0, y: 3, w: 6, h: 15 },
      { i: "map", x: 0, y: 18, w: 6, h: 8 },
      { i: "quick-actions", x: 0, y: 26, w: 6, h: 6 },
      { i: "miranda", x: 0, y: 32, w: 6, h: 8 },
      { i: "statutes", x: 0, y: 40, w: 6, h: 8 },
      { i: "reports", x: 0, y: 48, w: 6, h: 8 },
    ]
  };

  // Law Enforcement Status Bar
  const StatusBar = () => (
    <div style={{
      background: 'linear-gradient(135deg, #1e3a8a, #1e40af)',
      border: '2px solid #1e40af',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 4px 16px rgba(30, 58, 138, 0.2)',
      color: 'white'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Shield size={28} style={{ color: '#f59e0b' }} />
            <div>
              <h1 style={{
                fontSize: '28px',
                fontWeight: '600',
                color: '#ffffff',
                margin: 0,
                letterSpacing: '0.5px',
                fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif'
              }}>
                LARK Law Enforcement Command
              </h1>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px', 
                marginTop: '8px' 
              }}>
                <span style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: '#f8fafc',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  fontFamily: '"SF Mono", "Monaco", "Cascadia Code", monospace'
                }}>
                  {systemHealth.currentModel}
                </span>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  color: '#34d399' 
                }}>
                  <Cpu size={18} />
                  <span style={{ 
                    fontSize: '15px', 
                    fontWeight: '500',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                    System Operational
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#f59e0b',
            fontFamily: '"SF Mono", "Monaco", "Cascadia Code", monospace',
            lineHeight: 1.2
          }}>
            {currentTime.toLocaleTimeString()}
          </div>
          <div style={{
            fontSize: '14px',
            color: '#cbd5e1',
            fontFamily: '"SF Mono", "Monaco", "Cascadia Code", monospace',
            marginTop: '4px'
          }}>
            {currentTime.toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* System Metrics Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px' 
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '8px',
          padding: '16px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            marginBottom: '8px' 
          }}>
            <CheckCircle size={20} style={{ color: '#34d399' }} />
            <span style={{ 
              fontSize: '13px', 
              color: '#e2e8f0', 
              fontWeight: '500',
              fontFamily: '"Inter", sans-serif'
            }}>
              System Status
            </span>
          </div>
          <div style={{ 
            color: '#ffffff', 
            fontWeight: '600', 
            fontSize: '18px',
            fontFamily: '"Inter", sans-serif'
          }}>
            {systemHealth.overallHealth === 'good' ? 'Operational' : 'Degraded'}
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '8px',
          padding: '16px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            marginBottom: '8px' 
          }}>
            <Wifi size={20} style={{ color: '#60a5fa' }} />
            <span style={{ 
              fontSize: '13px', 
              color: '#e2e8f0', 
              fontWeight: '500',
              fontFamily: '"Inter", sans-serif'
            }}>
              Network
            </span>
          </div>
          <div style={{ 
            color: '#ffffff', 
            fontWeight: '600', 
            fontSize: '18px',
            fontFamily: '"Inter", sans-serif'
          }}>
            {aiStatus.networkStatus === 'online' ? 'Connected' : 'Limited'}
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '8px',
          padding: '16px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            marginBottom: '8px' 
          }}>
            <Activity size={20} style={{ color: '#a78bfa' }} />
            <span style={{ 
              fontSize: '13px', 
              color: '#e2e8f0', 
              fontWeight: '500',
              fontFamily: '"Inter", sans-serif'
            }}>
              AI Models
            </span>
          </div>
          <div style={{ 
            color: '#ffffff', 
            fontWeight: '600', 
            fontSize: '18px',
            fontFamily: '"Inter", sans-serif'
          }}>
            {systemHealth.aiModelsAvailable} Active
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '8px',
          padding: '16px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            marginBottom: '8px' 
          }}>
            <Clock size={20} style={{ color: '#fbbf24' }} />
            <span style={{ 
              fontSize: '13px', 
              color: '#e2e8f0', 
              fontWeight: '500',
              fontFamily: '"Inter", sans-serif'
            }}>
              Response Time
            </span>
          </div>
          <div style={{ 
            color: '#ffffff', 
            fontWeight: '600', 
            fontSize: '18px',
            fontFamily: '"SF Mono", monospace'
          }}>
            {Math.round(systemHealth.responseTimeAvg)}ms
          </div>
        </div>
      </div>
    </div>
  );

  // Law Enforcement Widget Component
  const LEWidget = ({ 
    title, 
    icon: Icon, 
    children, 
    status,
    priority = "normal"
  }: {
    title: string;
    icon: React.ComponentType<any>;
    children: React.ReactNode;
    status?: string;
    priority?: "normal" | "high" | "critical";
  }) => {
    const borderColors = {
      normal: "#1e40af",
      high: "#f59e0b", 
      critical: "#dc2626"
    };

    const statusColors = {
      normal: { bg: "#dbeafe", color: "#1e40af", border: "#93c5fd" },
      high: { bg: "#fef3c7", color: "#92400e", border: "#fcd34d" },
      critical: { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5" }
    };

    return (
      <div style={{
        height: '100%',
        background: '#ffffff',
        border: `2px solid ${borderColors[priority]}`,
        borderRadius: '12px',
        boxShadow: `0 4px 12px rgba(30, 64, 175, 0.08)`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1e40af, #2563eb)',
          color: 'white',
          padding: '20px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                padding: '10px',
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <Icon size={22} style={{ color: '#ffffff' }} />
              </div>
              <div>
                <h3 style={{
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '18px',
                  margin: 0,
                  fontFamily: '"Inter", "SF Pro Display", sans-serif',
                  lineHeight: 1.3
                }}>{title}</h3>
                {status && (
                  <div style={{
                    marginTop: '6px',
                    background: statusColors[priority].bg,
                    color: statusColors[priority].color,
                    border: `1px solid ${statusColors[priority].border}`,
                    padding: '2px 8px',
                    borderRadius: '5px',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'inline-block',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                    {status}
                  </div>
                )}
              </div>
            </div>
            <div style={{
              width: '10px',
              height: '10px',
              background: '#34d399',
              borderRadius: '50%',
            }} />
          </div>
        </div>
        
        {/* Content */}
        <div style={{ 
          padding: '20px', 
          flex: '1', 
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {children}
        </div>
      </div>
    );
  };

  // Law Enforcement Quick Actions
  const LEQuickActions = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {[
        { icon: AlertTriangle, label: "Emergency Alert", color: "#dc2626", bgColor: "#fee2e2", borderColor: "#fca5a5" },
        { icon: Radio, label: "Status Check", color: "#1e40af", bgColor: "#dbeafe", borderColor: "#93c5fd" },
        { icon: MapPin, label: "Location Update", color: "#059669", bgColor: "#d1fae5", borderColor: "#a7f3d0" },
        { icon: FileText, label: "Incident Report", color: "#7c2d12", bgColor: "#fed7aa", borderColor: "#fdba74" }
      ].map((action, index) => (
        <button
          key={index}
          style={{
            width: '100%',
            background: action.bgColor,
            border: `2px solid ${action.borderColor}`,
            borderRadius: '8px',
            padding: '16px 18px',
            color: action.color,
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.5px',
            fontFamily: '"Inter", sans-serif'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <action.icon size={20} />
          {action.label}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
      padding: '20px',
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768 }}
        cols={{ lg: 12, md: 10, sm: 6 }}
        rowHeight={25}
        isResizable
        isDraggable
        margin={[16, 16]}
        containerPadding={[0, 0]}
      >
        {/* Status Bar */}
        <div key="status-bar">
          <StatusBar />
        </div>

        {/* Chat Interface */}
        <div key="chat">
          <LEWidget 
            title="AI Assistant" 
            icon={MessageSquare}
            status="Active"
            priority="high"
          >
            <ConversationalAgent />
          </LEWidget>
        </div>

        {/* Officer Map */}
        <div key="map">
          <LEWidget 
            title="Location Tracking" 
            icon={MapPin}
            status="Live"
            priority="critical"
          >
            <OfficerMap onLocationChange={onLocationChange} />
          </LEWidget>
        </div>

        {/* Quick Actions */}
        <div key="quick-actions">
          <LEWidget 
            title="Quick Actions" 
            icon={Zap}
            priority="high"
          >
            <LEQuickActions />
          </LEWidget>
        </div>

        {/* Miranda Workflow */}
        <div key="miranda">
          <LEWidget 
            title="Miranda Rights" 
            icon={Scale}
            status="Ready"
          >
            <MirandaWorkflow />
          </LEWidget>
        </div>

        {/* Statutes Database */}
        <div key="statutes">
          <LEWidget 
            title="Legal Database" 
            icon={Database}
            status="Connected"
          >
            <RSCodes />
          </LEWidget>
        </div>

        {/* Reports Section */}
        <div key="reports">
          <LEWidget 
            title="Incident Reports" 
            icon={FileText}
            status="Ready"
          >
            <ReportAssistant />
          </LEWidget>
        </div>
      </ResponsiveGridLayout>

      {/* Enhanced Professional CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        .layout {
          font-family: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .react-grid-item {
          transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .react-grid-item.react-grid-placeholder {
          background: rgba(30, 64, 175, 0.08) !important;
          border: 2px dashed #1e40af !important;
          border-radius: 12px !important;
        }
        
        .react-grid-item:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(30, 64, 175, 0.12);
        }

        /* Improved scrollbar styling */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default EnhancedDashboard;
