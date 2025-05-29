// Dashboard.tsx - Responsive dashboard grid layout
import React, { lazy, Suspense } from 'react';
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import ConversationalAgent from '../ConversationalAgent';
import OfficerMap from '../OfficerMap';

// Lazy load heavy components
const ReportAssistant = lazy(() => import('../ReportAssistant'));
const MirandaWorkflow = lazy(() => import('../MirandaWorkflow'));
const RSCodes = lazy(() => import('../RSCodesSimplified'));

const ResponsiveGridLayout = WidthProvider(Responsive);

// Props for the Dashboard component
interface DashboardProps {
  onLocationChange: (location: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLocationChange }) => {
  // Layout configurations for different screen sizes
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
    <main>
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768 }}
        cols={{ lg: 12, md: 12, sm: 12 }}
        rowHeight={40}
        isResizable
        isDraggable
        draggableHandle=".widget-header"
        margin={[0, 0]}
        containerPadding={[0, 0]}
      >
        <div key="map">
          <div>Officer Location</div>
          <div>
            <OfficerMap onLocationChange={onLocationChange} />
          </div>
        </div>
        <div key="chat">
          <div>LARK Chat</div>
          <div>
            <ConversationalAgent />
          </div>
        </div>
        <div key="report">
          <div>Report Writing</div>
          <div>
            <Suspense fallback={<div>Loading report assistant...</div>}>
              <ReportAssistant />
            </Suspense>
          </div>
        </div>
        <div key="miranda">
          <div>Miranda Workflow</div>
          <div>
            <Suspense fallback={<div>Loading Miranda workflow...</div>}>
              <MirandaWorkflow />
            </Suspense>
          </div>
        </div>
        <div key="statutes">
          <div>Statutes</div>
          <div>
            <Suspense fallback={<div>Loading statutes...</div>}>
              <RSCodes />
            </Suspense>
          </div>
        </div>
      </ResponsiveGridLayout>
    </main>
  );
};

export default Dashboard;
