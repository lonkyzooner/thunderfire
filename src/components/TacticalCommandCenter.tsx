/**
 * Tactical Command Center - Main Layout Component
 * 
 * Professional police dispatch center interface with military-grade tactical elements
 */

import React, { useState, useEffect } from 'react';
import { useUserDepartment } from '../contexts/UserDepartmentContext';
import ConversationalAgent from './ConversationalAgent';
import WakeWordIndicator from './WakeWordIndicator';
import LarkLogo from './LarkLogo';
import MobileTacticalInterface from './MobileTacticalInterface';

// Tactical icons (using Unicode symbols for now, can be replaced with proper icon library)
const TacticalIcons = {
  backup: '🚨',
  medical: '🚑',
  code3: '🚔',
  alert: '📢',
  map: '🗺️',
  database: '🔍',
  surveillance: '📡',
  threat: '📊',
  miranda: '⚖️',
  report: '📝',
  evidence: '🔬',
  checklist: '📋',
  target: '🎯',
  intel: '📍',
  tools: '📋'
};

interface TacticalCommandCenterProps {
  className?: string;
}

const TacticalCommandCenter: React.FC<TacticalCommandCenterProps> = ({ className = '' }) => {
  const { user, department } = useUserDepartment();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [incidentActive, setIncidentActive] = useState(true);
  const [threatLevel, setThreatLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [activeUnits] = useState(['Unit 12', 'Unit 07', 'Unit 23']);
  const [connectionStatus] = useState<'LIVE' | 'DELAYED' | 'OFFLINE'>('LIVE');
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false 
    });
  };

  const handleQuickDeploy = (action: string) => {
    console.log(`Quick Deploy: ${action}`);
    // Integration with existing LARK functionality
    window.dispatchEvent(new CustomEvent('lark-quick-deploy', {
      detail: { action, timestamp: Date.now() }
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE': return 'text-green-400';
      case 'DELAYED': return 'text-yellow-400';
      case 'OFFLINE': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'bg-green-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'HIGH': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Return mobile interface for small screens
  if (isMobile) {
    return <MobileTacticalInterface className={className} />;
  }

  return (
    <div className={`min-h-screen bg-tactical-dark text-white ${className}`}>
      {/* Tactical Header */}
      <header className="bg-tactical-darker border-b-2 border-tactical-accent">
        <div className="max-w-full mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Badge and Command Info */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                {department.logoUrl ? (
                  <img
                    src={department.logoUrl}
                    alt={department.name}
                    className="w-8 h-8 rounded border border-tactical-accent"
                  />
                ) : (
                  <LarkLogo width={32} height={32} className="rounded border border-tactical-accent" />
                )}
                <div className="text-tactical-accent font-bold text-lg tracking-wider">
                  LARK COMMAND
                </div>
              </div>
              
              <div className="hidden md:flex items-center space-x-6 text-sm">
                <div>
                  <span className="text-gray-400">SECTOR:</span>
                  <span className="ml-2 text-white font-mono">DOWNTOWN</span>
                </div>
                <div>
                  <span className="text-gray-400">BEAT:</span>
                  <span className="ml-2 text-white font-mono">CENTRAL-7</span>
                </div>
                <div>
                  <span className="text-gray-400">SHIFT:</span>
                  <span className="ml-2 text-white font-mono">DAY-1</span>
                </div>
              </div>
            </div>

            {/* Center: Time and Status */}
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-mono font-bold text-tactical-accent">
                  {formatTime(currentTime)}
                </div>
                <div className="text-xs text-gray-400">MISSION TIME</div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(connectionStatus)} animate-pulse`}></div>
                <span className={`font-bold text-sm ${getStatusColor(connectionStatus)}`}>
                  {connectionStatus}
                </span>
              </div>
            </div>

            {/* Right: Officer Info */}
            <div className="flex items-center space-x-4">
              <WakeWordIndicator 
                className="bg-tactical-panel border border-tactical-accent rounded px-3 py-1" 
                showControls={false} 
                autoStart={true} 
              />
              
              <div className="flex items-center space-x-3">
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border-2 border-tactical-accent"
                />
                <div className="text-right hidden md:block">
                  <div className="text-sm font-bold text-white">{user.name}</div>
                  <div className="text-xs text-gray-400">BADGE #{user.badgeNumber || '1247'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Tactical Interface */}
      <main className="flex h-[calc(100vh-80px)]">
        {/* Mission Control - Primary Chat Area */}
        <div className="flex-1 flex flex-col bg-tactical-panel m-4 mr-2 rounded-lg border border-tactical-accent">
          <div className="bg-tactical-darker px-4 py-2 rounded-t-lg border-b border-tactical-accent">
            <h2 className="text-lg font-bold text-tactical-accent flex items-center">
              <span className="mr-2">🎯</span>
              MISSION CONTROL
            </h2>
          </div>
          <div className="flex-1 p-4">
            <ConversationalAgent />
          </div>
        </div>

        {/* Tactical Sidebar */}
        <div className="w-80 flex flex-col space-y-4 m-4 ml-2">
          {/* Quick Deploy Actions */}
          <div className="bg-tactical-panel rounded-lg border border-tactical-accent">
            <div className="bg-tactical-darker px-4 py-2 rounded-t-lg border-b border-tactical-accent">
              <h3 className="font-bold text-tactical-accent flex items-center">
                <span className="mr-2">{TacticalIcons.target}</span>
                DEPLOY ACTIONS
              </h3>
            </div>
            <div className="p-4 space-y-2">
              <button
                onClick={() => handleQuickDeploy('backup')}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded border border-red-500 transition-all flex items-center"
              >
                <span className="mr-2">{TacticalIcons.backup}</span>
                REQUEST BACKUP
              </button>
              <button
                onClick={() => handleQuickDeploy('medical')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded border border-blue-500 transition-all flex items-center"
              >
                <span className="mr-2">{TacticalIcons.medical}</span>
                MEDICAL EMERGENCY
              </button>
              <button
                onClick={() => handleQuickDeploy('code3')}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded border border-yellow-500 transition-all flex items-center"
              >
                <span className="mr-2">{TacticalIcons.code3}</span>
                CODE 3 RESPONSE
              </button>
              <button
                onClick={() => handleQuickDeploy('alert')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded border border-purple-500 transition-all flex items-center"
              >
                <span className="mr-2">{TacticalIcons.alert}</span>
                ALL UNITS ALERT
              </button>
            </div>
          </div>

          {/* Intel & Recon */}
          <div className="bg-tactical-panel rounded-lg border border-tactical-accent">
            <div className="bg-tactical-darker px-4 py-2 rounded-t-lg border-b border-tactical-accent">
              <h3 className="font-bold text-tactical-accent flex items-center">
                <span className="mr-2">{TacticalIcons.intel}</span>
                INTEL & RECON
              </h3>
            </div>
            <div className="p-4 space-y-2">
              <button className="w-full bg-tactical-darker hover:bg-gray-700 text-white font-medium py-2 px-4 rounded border border-tactical-accent transition-all flex items-center">
                <span className="mr-2">{TacticalIcons.map}</span>
                TACTICAL MAP
              </button>
              <button className="w-full bg-tactical-darker hover:bg-gray-700 text-white font-medium py-2 px-4 rounded border border-tactical-accent transition-all flex items-center">
                <span className="mr-2">{TacticalIcons.database}</span>
                DATABASE SEARCH
              </button>
              <button className="w-full bg-tactical-darker hover:bg-gray-700 text-white font-medium py-2 px-4 rounded border border-tactical-accent transition-all flex items-center">
                <span className="mr-2">{TacticalIcons.surveillance}</span>
                SURVEILLANCE
              </button>
              <button className="w-full bg-tactical-darker hover:bg-gray-700 text-white font-medium py-2 px-4 rounded border border-tactical-accent transition-all flex items-center">
                <span className="mr-2">{TacticalIcons.threat}</span>
                THREAT ANALYSIS
              </button>
            </div>
          </div>

          {/* Mission Tools */}
          <div className="bg-tactical-panel rounded-lg border border-tactical-accent">
            <div className="bg-tactical-darker px-4 py-2 rounded-t-lg border-b border-tactical-accent">
              <h3 className="font-bold text-tactical-accent flex items-center">
                <span className="mr-2">{TacticalIcons.tools}</span>
                MISSION TOOLS
              </h3>
            </div>
            <div className="p-4 space-y-2">
              <button className="w-full bg-tactical-darker hover:bg-gray-700 text-white font-medium py-2 px-4 rounded border border-tactical-accent transition-all flex items-center">
                <span className="mr-2">{TacticalIcons.miranda}</span>
                MIRANDA RIGHTS
              </button>
              <button className="w-full bg-tactical-darker hover:bg-gray-700 text-white font-medium py-2 px-4 rounded border border-tactical-accent transition-all flex items-center">
                <span className="mr-2">{TacticalIcons.report}</span>
                INCIDENT REPORT
              </button>
              <button className="w-full bg-tactical-darker hover:bg-gray-700 text-white font-medium py-2 px-4 rounded border border-tactical-accent transition-all flex items-center">
                <span className="mr-2">{TacticalIcons.evidence}</span>
                EVIDENCE LOG
              </button>
              <button className="w-full bg-tactical-darker hover:bg-gray-700 text-white font-medium py-2 px-4 rounded border border-tactical-accent transition-all flex items-center">
                <span className="mr-2">{TacticalIcons.checklist}</span>
                CHECKLIST
              </button>
            </div>
          </div>
        </div>

        {/* Right Status Panel */}
        <div className="w-64 flex flex-col space-y-4 m-4 ml-2">
          {/* Active Units */}
          <div className="bg-tactical-panel rounded-lg border border-tactical-accent">
            <div className="bg-tactical-darker px-4 py-2 rounded-t-lg border-b border-tactical-accent">
              <h3 className="font-bold text-tactical-accent">ACTIVE UNITS</h3>
            </div>
            <div className="p-4 space-y-2">
              {activeUnits.map((unit, index) => (
                <div key={index} className="flex items-center justify-between bg-tactical-darker p-2 rounded border border-tactical-accent">
                  <span className="font-mono text-sm">{unit}</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Threat Level */}
          <div className="bg-tactical-panel rounded-lg border border-tactical-accent">
            <div className="bg-tactical-darker px-4 py-2 rounded-t-lg border-b border-tactical-accent">
              <h3 className="font-bold text-tactical-accent">THREAT LEVEL</h3>
            </div>
            <div className="p-4">
              <div className="text-center">
                <div className={`w-16 h-16 mx-auto rounded-full ${getThreatColor(threatLevel)} flex items-center justify-center mb-2`}>
                  <span className="text-white font-bold text-lg">
                    {threatLevel === 'LOW' ? '🟢' : threatLevel === 'MEDIUM' ? '🟡' : '🔴'}
                  </span>
                </div>
                <div className="font-bold text-lg">{threatLevel}</div>
              </div>
            </div>
          </div>

          {/* Current Incident */}
          {incidentActive && (
            <div className="bg-tactical-panel rounded-lg border border-red-500">
              <div className="bg-red-900 px-4 py-2 rounded-t-lg border-b border-red-500">
                <h3 className="font-bold text-red-300">ACTIVE INCIDENT</h3>
              </div>
              <div className="p-4 space-y-2 text-sm">
                <div>
                  <span className="text-gray-400">ID:</span>
                  <span className="ml-2 font-mono">#2024-0847</span>
                </div>
                <div>
                  <span className="text-gray-400">Type:</span>
                  <span className="ml-2">Traffic Stop</span>
                </div>
                <div>
                  <span className="text-gray-400">Location:</span>
                  <span className="ml-2">Main & 5th St</span>
                </div>
                <div>
                  <span className="text-gray-400">Units:</span>
                  <span className="ml-2">1 Primary</span>
                </div>
                <div className="mt-3 pt-2 border-t border-tactical-accent">
                  <span className="text-green-400 text-xs">● ACTIVE</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TacticalCommandCenter;
