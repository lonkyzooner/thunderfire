import React from "react";

export interface TimelineEvent {
  id: string;
  timestamp: number;
  type: "user" | "assistant" | "flag" | "annotation";
  content: string;
}

interface IncidentTimelineProps {
  events: TimelineEvent[];
}

const IncidentTimeline: React.FC<IncidentTimelineProps> = ({ events }) => {
  return (
    <div style={{ padding: "12px 0", maxHeight: 320, overflowY: "auto" }}>
      <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 10 }}>Incident Timeline</h3>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {events.map((e) => (
          <li key={e.id} style={{ marginBottom: 16, display: "flex", alignItems: "flex-start" }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: e.type === "user" ? "#1976d2" : e.type === "assistant" ? "#43a047" : "#ffa000",
                marginRight: 12,
                marginTop: 6,
              }}
            />
            <div>
              <div style={{ fontSize: 13, color: "#888" }}>
                {new Date(e.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • {e.type}
              </div>
              <div style={{ fontSize: 15, color: "#222", whiteSpace: "pre-line" }}>{e.content}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default IncidentTimeline;