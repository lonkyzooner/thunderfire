import React from 'react';

interface IncidentEvent {
  id: string;
  timestamp: number;
  type: 'command' | 'miranda' | 'evidence' | 'note' | 'alert';
  description: string;
}

const mockEvents: IncidentEvent[] = [
  { id: '1', timestamp: Date.now() - 60000, type: 'command', description: 'Asked for suspect info' },
  { id: '2', timestamp: Date.now() - 50000, type: 'miranda', description: 'Read Miranda rights in English' },
  { id: '3', timestamp: Date.now() - 40000, type: 'evidence', description: 'Captured suspect photo' },
  { id: '4', timestamp: Date.now() - 30000, type: 'note', description: 'Suspect appeared nervous' },
  { id: '5', timestamp: Date.now() - 20000, type: 'alert', description: 'Gunshot detected nearby' },
];

const IncidentTimeline: React.FC = () => {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Incident Timeline</h2>
      <div className="border-l-2 border-primary pl-4 space-y-4">
        {mockEvents.map(event => (
          <div key={event.id} className="relative">
            <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-primary border-2 border-white"></div>
            <div className="ml-4">
              <p className="text-xs text-muted-foreground">{new Date(event.timestamp).toLocaleTimeString()}</p>
              <p className="font-medium">{event.type.toUpperCase()}</p>
              <p className="text-sm">{event.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IncidentTimeline;