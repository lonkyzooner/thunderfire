import React, { useState, useEffect } from 'react';
import { 
  MessageSquare,
  MapPin,
  FileText,
  Scale,
  Shield,
  Radio,
  AlertTriangle,
  Database,
  Zap,
  CheckCircle
} from 'lucide-react';

interface DashboardProps {
  onLocationChange: (location: string) => void;
}

export const SimpleDashboard: React.FC<DashboardProps> = ({ onLocationChange }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
      alignItems: 'center',
      marginBottom: '16px'
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
            GPT-4 • 7 AI Models Active
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

  // Simple Widget Component
  const SimpleWidget = ({ 
    title, 
    icon: Icon, 
    children, 
    status,
    width = "100%",
    height = "300px"
  }: {
    title: string;
    icon: React.ComponentType<any>;
    children: React.ReactNode;
    status?: string;
    width?: string;
    height?: string;
  }) => (
    <div style={{
      width,
      height,
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      marginBottom: '16px'
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

  // Simple Chat Interface
  const SimpleChatInterface = () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        flex: 1, 
        background: '#f8fafc', 
        borderRadius: '6px', 
        padding: '16px',
        marginBottom: '12px',
        overflow: 'auto'
      }}>
        <div style={{
          background: '#e2e8f0',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '8px'
        }}>
          <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>LARK Agent</div>
          <div style={{ color: '#64748b' }}>LARK Agent online. I'm ready to assist with your patrol duties.</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>1:27:08 PM</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input 
          type="text" 
          placeholder="Speak or type your command..."
          style={{
            flex: 1,
            padding: '12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        />
        <button style={{
          padding: '12px 16px',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}>
          Send
        </button>
      </div>
    </div>
  );

  // Simple Actions
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
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: '"Inter", sans-serif'
          }}
        >
          <action.icon size={16} />
          {action.label}
        </button>
      ))}
    </div>
  );

  // Simple Map Placeholder
  const SimpleMapPlaceholder = () => (
    <div style={{
      background: '#f1f5f9',
      border: '2px dashed #cbd5e1',
      borderRadius: '6px',
      padding: '20px',
      textAlign: 'center',
      color: '#64748b'
    }}>
      <MapPin size={32} style={{ marginBottom: '8px' }} />
      <div style={{ fontWeight: '600', marginBottom: '4px' }}>Officer Map</div>
      <div style={{ fontSize: '12px' }}>Interactive map will load here</div>
      <div style={{ fontSize: '12px', marginTop: '8px' }}>0 officers • 0 recent threats</div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      padding: '16px',
      fontFamily: '"Inter", sans-serif'
    }}>
      <SimpleHeader />
      
      {/* Simple Grid Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '16px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* AI Assistant */}
        <div style={{ gridColumn: 'span 2', minHeight: '400px' }}>
          <SimpleWidget 
            title="AI Assistant" 
            icon={MessageSquare}
            status="Active"
            height="400px"
          >
            <SimpleChatInterface />
          </SimpleWidget>
        </div>

        {/* Quick Actions */}
        <div>
          <SimpleWidget 
            title="Quick Actions" 
            icon={Zap}
            height="400px"
          >
            <SimpleActions />
          </SimpleWidget>
        </div>

        {/* Officer Map */}
        <div>
          <SimpleWidget 
            title="Location Tracking" 
            icon={MapPin}
            status="Live"
            height="300px"
          >
            <SimpleMapPlaceholder />
          </SimpleWidget>
        </div>

        {/* Miranda Rights */}
        <div>
          <SimpleWidget 
            title="Miranda Rights" 
            icon={Scale}
            status="Ready"
            height="300px"
          >
            <div style={{ 
              background: '#f1f5f9', 
              padding: '16px', 
              borderRadius: '6px',
              textAlign: 'center',
              color: '#64748b'
            }}>
              <Scale size={32} style={{ marginBottom: '8px' }} />
              <div>Miranda Rights workflow ready</div>
            </div>
          </SimpleWidget>
        </div>

        {/* Legal Database */}
        <div>
          <SimpleWidget 
            title="Legal Database" 
            icon={Database}
            status="Connected"
            height="300px"
          >
            <div style={{ 
              background: '#f1f5f9', 
              padding: '16px', 
              borderRadius: '6px',
              textAlign: 'center',
              color: '#64748b'
            }}>
              <Database size={32} style={{ marginBottom: '8px' }} />
              <div>RS Codes and statutes database</div>
            </div>
          </SimpleWidget>
        </div>
      </div>
    </div>
  );
};

export default SimpleDashboard;
