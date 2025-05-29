-- LARK Trial Schema Migration
-- Creates tables for officer location tracking and threat detection
-- Designed for Supabase realtime channels

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Officer locations table for realtime geo tracking
CREATE TABLE IF NOT EXISTS officer_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    officer_id UUID NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    altitude DECIMAL(8, 2),
    accuracy DECIMAL(8, 2),
    heading DECIMAL(5, 2),
    speed DECIMAL(8, 2),
    status VARCHAR(50) DEFAULT 'active',
    incident_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Threat events table for real-time threat detection
CREATE TABLE IF NOT EXISTS threat_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    officer_id UUID NOT NULL,
    threat_type VARCHAR(100) NOT NULL, -- 'gunshot', 'aggressive_tone', 'elevated_voice', etc.
    confidence_score DECIMAL(3, 2) NOT NULL, -- 0.00 to 1.00
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    audio_snippet_url TEXT,
    context TEXT,
    severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by UUID,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    incident_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage events table for compliance tracking
CREATE TABLE IF NOT EXISTS usage_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    officer_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL, -- 'miranda_delivered', 'camera_activated', 'compliance_violation'
    event_data JSONB DEFAULT '{}',
    compliance_status VARCHAR(50), -- 'compliant', 'violation', 'warning'
    incident_id UUID,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_officer_locations_officer_id ON officer_locations(officer_id);
CREATE INDEX IF NOT EXISTS idx_officer_locations_created_at ON officer_locations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_officer_locations_status ON officer_locations(status);

CREATE INDEX IF NOT EXISTS idx_threat_events_officer_id ON threat_events(officer_id);
CREATE INDEX IF NOT EXISTS idx_threat_events_threat_type ON threat_events(threat_type);
CREATE INDEX IF NOT EXISTS idx_threat_events_created_at ON threat_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_threat_events_severity ON threat_events(severity);

CREATE INDEX IF NOT EXISTS idx_usage_events_officer_id ON usage_events(officer_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_event_type ON usage_events(event_type);
CREATE INDEX IF NOT EXISTS idx_usage_events_created_at ON usage_events(created_at DESC);

-- Row Level Security (RLS) policies
ALTER TABLE officer_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE threat_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (officers can only see their own data)
CREATE POLICY officer_locations_policy ON officer_locations
    FOR ALL USING (auth.uid() = officer_id OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY threat_events_policy ON threat_events
    FOR ALL USING (auth.uid() = officer_id OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY usage_events_policy ON usage_events
    FOR ALL USING (auth.uid() = officer_id OR auth.jwt() ->> 'role' = 'admin');

-- Enable realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE officer_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE threat_events;
ALTER PUBLICATION supabase_realtime ADD TABLE usage_events;

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_officer_locations_updated_at 
    BEFORE UPDATE ON officer_locations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_threat_events_updated_at 
    BEFORE UPDATE ON threat_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_events_updated_at 
    BEFORE UPDATE ON usage_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing (optional - can be removed in production)
-- INSERT INTO officer_locations (officer_id, latitude, longitude, status) VALUES
-- (uuid_generate_v4(), 30.4515, -91.1871, 'active'); -- Baton Rouge, LA

-- INSERT INTO threat_events (officer_id, threat_type, confidence_score, severity) VALUES
-- (uuid_generate_v4(), 'gunshot', 0.95, 'critical');

-- INSERT INTO usage_events (officer_id, event_type, compliance_status) VALUES
-- (uuid_generate_v4(), 'miranda_delivered', 'compliant');
