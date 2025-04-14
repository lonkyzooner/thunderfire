// App.tsx - LARK Voice Assistant
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useUserDepartment } from './contexts/UserDepartmentContext';
import './styles/voice-assistant.css';
import ConversationalAgent from './components/ConversationalAgent';
import './styles/fluid-theme.css';
import LarkLogo from './components/LarkLogo';
import OfficerMap from './components/OfficerMap';

import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

const ReportAssistant = lazy(() => import('./components/ReportAssistant'));
const MirandaWorkflow = lazy(() => import('./components/MirandaWorkflow'));
const RSCodes = lazy(() => import('./components/RSCodes').then(module => ({ default: module.RSCodes })));

import { 
  BatteryMedium,
  Clock,
  MapPin,
  WifiIcon
} from 'lucide-react';

function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [batteryLevel, setBatteryLevel] = useState(87);
  const [connected, setConnected] = useState(true);
  const [location, setLocation] = useState('Baton Rouge, LA');

  // Use user/department context
  const { user, department } = useUserDepartment();

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Simulate battery drain
  useEffect(() => {
    const interval = setInterval(() => {
      setBatteryLevel(prev => Math.max(prev - 1, 5));
    }, 300000); // Every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Layout for widgets (x, y, w, h are grid units)
  const layouts = {
    lg: [
      { i: "map", x: 0, y: 0, w: 4, h: 10, minW: 3, minH: 8 },
      { i: "chat", x: 4, y: 0, w: 4, h: 12, minW: 3, minH: 8 },
      { i: "report", x: 8, y: 0, w: 4, h: 12, minW: 3, minH: 8 },
      { i: "miranda", x: 0, y: 12, w: 6, h: 10, minW: 3, minH: 8 },
      { i: "statutes", x: 6, y: 12, w: 6, h: 10, minW: 3, minH: 8 },
    ],
    md: [
      { i: "map", x: 0, y: 0, w: 6, h: 10 },
      { i: "chat", x: 6, y: 0, w: 6, h: 12 },
      { i: "report", x: 0, y: 10, w: 6, h: 12 },
      { i: "miranda", x: 6, y: 12, w: 6, h: 10 },
      { i: "statutes", x: 0, y: 22, w: 6, h: 10 },
    ],
    sm: [
      { i: "map", x: 0, y: 0, w: 12, h: 10 },
      { i: "chat", x: 0, y: 10, w: 12, h: 12 },
      { i: "report", x: 0, y: 22, w: 12, h: 12 },
      { i: "miranda", x: 0, y: 34, w: 12, h: 10 },
      { i: "statutes", x: 0, y: 44, w: 12, h: 10 },
    ]
  };

  return (
    <div className="min-h-screen flex flex-col fluid-background text-foreground p-2 md:p-6 overflow-hidden antialiased selection:bg-primary/20 selection:text-primary relative">
      {/* Decorative wave elements for fluid design */}
      <div className="fluid-wave pointer-events-none"></div>
      <div className="fluid-wave-gold pointer-events-none"></div>
      {/* Main container */}
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col relative">
        {/* Modern glassmorphic header with bold font and gradient accent */}
        <header
          className="mb-8 relative rounded-3xl border border-[rgba(255,255,255,0.25)] shadow-xl overflow-hidden glass-panel"
          style={{
            background:
              "linear-gradient(120deg, rgba(255,255,255,0.65) 60%, rgba(180,220,255,0.25) 100%)",
            backdropFilter: "blur(var(--glass-blur, 18px))",
            WebkitBackdropFilter: "blur(var(--glass-blur, 18px))",
          }}
        >
          {/* Gradient accent bar */}
          <div
            className="h-2 w-full"
            style={{
              background:
                "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--primary)) 90%)",
            }}
          />
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-4 py-3">
            <div className="flex items-center gap-4">
              {department.logoUrl ? (
                <img
                  src={department.logoUrl}
                  alt={department.name + " Logo"}
                  width={52}
                  height={52}
                  className="mr-1 drop-shadow-lg rounded-full bg-white border border-primary"
                />
              ) : (
                <LarkLogo width={52} height={52} className="mr-1 drop-shadow-lg rounded-full bg-white border border-primary" />
              )}
              <div>
                <h1 className="text-4xl md:text-5xl font-heading font-extrabold tracking-tight leading-none flex items-center text-[hsl(var(--primary))] drop-shadow-sm">
                  <span className="fluid-heading">{department.name}</span>
                  <span className="ml-3 text-xs font-semibold fluid-badge px-2 py-1 rounded-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] text-white shadow">
                    {/* Optionally show version or department code */}
                    {/* 1.0 */}
                  </span>
                </h1>
                <p className="text-muted-foreground text-base font-light tracking-wide mt-1">
                  Law Enforcement Assistance and Response Kit
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-2 md:mt-0 w-full md:w-auto justify-end">
              {/* Location indicator */}
              <div className="flex items-center px-4 py-2 rounded-full bg-card/80 text-card-foreground border border-border/10 shadow-md transition-all hover:bg-secondary/20 group">
                <MapPin className="w-5 h-5 text-accent group-hover:text-primary" />
                <span className="text-foreground text-base font-medium ml-2 group-hover:text-primary">
                  {location}
                </span>
              </div>
              {/* Status indicators group */}
              <div className="flex items-center gap-4 px-5 py-2 rounded-full bg-card/80 text-card-foreground border border-border/10 shadow-md backdrop-blur-md">
                {/* Time */}
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground text-base font-mono font-semibold ml-1.5">
                    {formatTime(currentTime)}
                  </span>
                </div>
                <span className="w-[1px] h-5 bg-border"></span>
                {/* Battery */}
                <div className="flex items-center gap-1.5">
                  <BatteryMedium
                    className={`w-5 h-5 ${
                      batteryLevel < 20
                        ? "text-destructive"
                        : batteryLevel > 50
                        ? "text-success"
                        : "text-warning"
                    }`}
                  />
                  <span
                    className={`text-xs font-bold ml-0.5 ${
                      batteryLevel < 20
                        ? "text-destructive"
                        : batteryLevel > 50
                        ? "text-foreground"
                        : "text-warning"
                    }`}
                  >
                    {batteryLevel}%
                  </span>
                </div>
                {/* Connection status */}
                {connected ? (
                  <div className="flex items-center gap-1">
                    <WifiIcon className="w-5 h-5 text-success" />
                    <span className="text-xs font-bold text-success">Online</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <WifiIcon className="w-5 h-5 text-destructive" />
                    <span className="text-xs font-bold text-destructive">Offline</span>
                  </div>
                )}
                {/* User personalization */}
                <div className="flex items-center gap-2 ml-4">
                  <img
                    src={user.avatarUrl}
                    alt={user.name + " Avatar"}
                    className="w-9 h-9 rounded-full border-2 border-primary shadow"
                  />
                  <span className="font-semibold text-base text-foreground">{user.name}</span>
                  <div className="relative group">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Customizable dashboard grid */}
        <main className="relative mb-8 z-10">
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768 }}
            cols={{ lg: 12, md: 12, sm: 12 }}
            rowHeight={40}
            isResizable
            isDraggable
            draggableHandle=".widget-header"
            margin={[20, 20]}
            containerPadding={[0, 0]}
          >
            <div key="map" className="widget">
              <div className="widget-header">Officer Location</div>
              <div className="widget-content">
                <OfficerMap onLocationChange={setLocation} />
              </div>
            </div>
            <div key="chat" className="widget">
              <div className="widget-header">LARK Chat</div>
              <div className="widget-content">
                <ConversationalAgent />
              </div>
            </div>
            <div key="report" className="widget">
              <div className="widget-header">Report Writing</div>
              <div className="widget-content">
                <Suspense fallback={<div className="flex items-center justify-center h-full">Loading report assistant...</div>}>
                  <ReportAssistant />
                </Suspense>
              </div>
            </div>
            <div key="miranda" className="widget">
              <div className="widget-header">Miranda Workflow</div>
              <div className="widget-content">
                <Suspense fallback={<div className="flex items-center justify-center h-full">Loading Miranda workflow...</div>}>
                  <MirandaWorkflow />
                </Suspense>
              </div>
            </div>
            <div key="statutes" className="widget">
              <div className="widget-header">Statutes</div>
              <div className="widget-content">
                <Suspense fallback={<div className="flex items-center justify-center h-full">Loading statutes...</div>}>
                  <RSCodes />
                </Suspense>
              </div>
            </div>
          </ResponsiveGridLayout>
        </main>
      </div>
    </div>
  );
}

export default App;
