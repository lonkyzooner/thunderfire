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
  Clock,
  Shield,
  Radio,
  AlertTriangle,
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

export const CleanDashboard: React.FC<DashboardProps> = ({ onLocationChange }) => {
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

  // Clean, professional layout
  const layouts = {
    lg: [
      { i: "header", x: 0, y: 0, w: 12, h: 2, static: true },
      { i: "chat", x: 0, y: 2, w: 8, h: 16, minW: 6, minH: 12 },
      { i: "map", x: 8, y: 2, w: 4, h: 8, minW: 3, minH: 6 },
      { i: "actions", x: 8, y: 10, w: 4, h: 8, minW: 3, minH: 6 },
      { i: "miranda", x: 0, y: 18, w: 4, h: 8, minW: 3, minH: 6 },
      { i: "legal", x: 4, y: 18, w: 4, h: 8, minW: 3, minH: 6 },
      { i: "reports", x: 8, y: 18, w: 4, h: 8, minW: 3, minH: 6 },
    ],
    md: [
      { i: "header", x: 0, y: 0, w: 10, h: 2, static: true },
      { i: "chat", x: 0, y: 2, w: 6, h: 14 },
      { i: "map", x: 6, y: 2, w: 4, h: 7 },
      { i: "actions", x: 6, y: 9, w: 4, h: 7 },
      { i: "miranda", x: 0, y: 16, w: 5, h: 7 },
      { i: "legal", x: 5, y: 16, w: 5, h: 7 },
      { i: "reports", x: 0, y: 23, w: 10, h: 7 },
    ],
    sm: [
      { i: "header", x: 0, y: 0, w: 6, h: 2, static: true },
      { i: "chat", x: 0, y: 2, w: 6, h: 12 },
      { i: "map", x: 0, y: 14, w: 6, h: 6 },
      { i: "actions", x: 0, y: 20, w: 6, h: 6 },
      { i: "miranda", x: 0, y: 26, w: 6, h: 6 },
      { i: "legal", x: 0, y: 32, w: 6, h: 6 },
      { i: "reports", x: 0, y: 38, w: 6, h: 6 },
    ]
  };

  // Simple Header
  const SimpleHeader = () => (
    <div style={{
      background: 'linear-gradient(135deg, #1e293b, #334155)',
      border: '1px solid #475569',
      borderRadius: '8px',
      padding: '16px 24px',
      color: '#f1f5f9',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Shield size={24} style={{ color: '#3b82f6' }} />
        <div>
          <h1 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#f1f5f9',
            margin: 0,
            fontFamily: '"Inter", sans-serif'
          }}>
            LARK Law Enforcement
          </h1>
          <div style={{
            fontSize: '12px',
            color: '#94a3b8',
            marginTop: '2px'
          }}>
            {systemHealth.currentModel} • {systemHealth.aiModelsAvailable} AI Models Active
          </div>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '20px' 
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px' 
        }}>
          <CheckCircle size={16} style={{ color: '#22c55e' }} />
          <span style={{ fontSize: '14px', color: '#22c55e' }}>Online</span>
        </div>
        <div style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#f1f5f9',
          fontFamily: '"SF Mono", monospace'
        }}>
          {currentTime.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );

  // Clean Widget Component
  const CleanWidget = ({ 
    title, 
    icon: Icon, 
    children, 
    status
  }: {
    title: string;
    icon: React.ComponentType<any>;
    children: React.ReactNode;
    status?: string;
  }) => (
    <div style={{
      height: '100%',
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        background: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon size={18} style={{ color: '#64748b' }} />
          <h3 style={{
            color: '#1e293b',
            fontWeight: '600',
            fontSize: '14px',
            margin: 0,
            fontFamily: '"Inter", sans-serif'
          }}>{title}</h3>
          {status && (
            <span style={{
              background: '#dbeafe',
              color: '#1e40af',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: '500'
            }}>
              {status}
            </span>
          )}
        </div>
        <div style={{
          width: '6px',
          height: '6px',
          background: '#22c55e',
          borderRadius: '50%'
        }} />
      </div>
      
      {/* Content */}
      <div style={{ 
        padding: '16px',
        flex: '1', 
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {children}
      </div>
    </div>
  );

  // Simple Quick Actions
  const SimpleActions = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {[
        { icon: AlertTriangle, label: "Emergency Alert", color: "#dc2626" },
        { icon: Radio, label: "Status Check", color: "#2563eb" },
        { icon: MapPin, label: "Location Update", color: "#059669" },
        { icon: FileText, label: "New Report", color: "#d97706" }
      ].map((action, index) => (
        <button
          key={index}
          style={{
            width: '100%',
            background: '#ffffff',
            border: `1px solid ${action.color}20`,
            borderRadius: '6px',
            padding: '10px 12px',
            color: action.color,
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: '"Inter", sans-serif'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = action.color + '10';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#ffffff';
          }}
        >
          <action.icon size={16} />
          {action.label}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      padding: '16px',
      fontFamily: '"Inter", sans-serif'
    }}>
      <ResponsiveGridLayout
        className="clean-layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768 }}
        cols={{ lg: 12, md: 10, sm: 6 }}
        rowHeight={30}
        isResizable
        isDraggable
        margin={[12, 12]}
        containerPadding={[0, 0]}
      >
        {/* Header */}
        <div key="header">
          <SimpleHeader />
        </div>

        {/* AI Assistant */}
        <div key="chat">
          <CleanWidget 
            title="AI Assistant" 
            icon={MessageSquare}
            status="Active"
          >
            <ConversationalAgent />
          </CleanWidget>
        </div>

        {/* Officer Map */}
        <div key="map">
          <CleanWidget 
            title="Location Tracking" 
            icon={MapPin}
            status="Live"
          >
            <OfficerMap onLocationChange={onLocationChange} />
          </CleanWidget>
        </div>

        {/* Quick Actions */}
        <div key="actions">
          <CleanWidget 
            title="Quick Actions" 
            icon={Zap}
          >
            <SimpleActions />
          </CleanWidget>
        </div>

        {/* Miranda Rights */}
        <div key="miranda">
          <CleanWidget 
            title="Miranda Rights" 
            icon={Scale}
            status="Ready"
          >
            <MirandaWorkflow />
          </CleanWidget>
        </div>

        {/* Legal Database */}
        <div key="legal">
          <CleanWidget 
            title="Legal Database" 
            icon={Database}
            status="Connected"
          >
            <RSCodes />
          </CleanWidget>
        </div>

        {/* Reports */}
        <div key="reports">
          <CleanWidget 
            title="Incident Reports" 
            icon={FileText}
            status="Ready"
          >
            <ReportAssistant />
          </CleanWidget>
        </div>
      </ResponsiveGridLayout>

      {/* Clean CSS Styling */}
      <style>{`
        .clean-layout {
          font-family: 'Inter', sans-serif;
        }
        
        .react-grid-item {
          transition: all 200ms ease;
        }
        
        .react-grid-item.react-grid-placeholder {
          background: rgba(59, 130, 246, 0.1) !important;
          border: 1px dashed #3b82f6 !important;
          borderRadius: 8px !important;
        }

        /* Clean scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default CleanDashboard;
