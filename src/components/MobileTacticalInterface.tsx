/**
 * Mobile Tactical Interface Component
 * 
 * Optimized tactical interface for mobile devices with touch-friendly controls
 */

import React, { useState } from 'react';
import { useWakeWord, useWakeWordCommands } from '../hooks/useWakeWord';
import ConversationalAgent from './ConversationalAgent';
import WakeWordIndicator from './WakeWordIndicator';

interface MobileTacticalInterfaceProps {
  className?: string;
}

const MobileTacticalInterface: React.FC<MobileTacticalInterfaceProps> = ({ className = '' }) => {
  const [activePanel, setActivePanel] = useState<'chat' | 'deploy' | 'intel' | 'status'>('chat');
  const { isListening } = useWakeWord(true);
  const { pendingCommand, isProcessing } = useWakeWordCommands();

  const handleQuickAction = (action: string) => {
    console.log(`Mobile Quick Action: ${action}`);
    window.dispatchEvent(new CustomEvent('lark-quick-deploy', {
      detail: { action, timestamp: Date.now() }
    }));
  };

  const getPanelIcon = (panel: string) => {
    switch (panel) {
      case 'chat': return '💬';
      case 'deploy': return '🚨';
      case 'intel': return '📍';
      case 'status': return '📊';
      default: return '📱';
    }
  };

  return (
    <div className={`h-screen bg-tactical-dark text-white flex flex-col ${className}`}>
      {/* Mobile Tactical Header */}
      <header className="bg-tactical-darker border-b-2 border-tactical-accent p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-tactical-accent rounded flex items-center justify-center">
              <span className="text-tactical-dark font-bold text-sm">L</span>
            </div>
            <div>
              <div className="text-tactical-accent font-bold text-lg">LARK</div>
              <div className="text-xs text-gray-400">TACTICAL</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <WakeWordIndicator 
              className="text-xs" 
              showControls={false} 
              autoStart={true} 
            />
            <div className="text-right">
              <div className="text-sm font-mono text-tactical-accent">
                {new Date().toLocaleTimeString('en-US', { hour12: false })}
              </div>
              <div className="text-xs text-green-400">● LIVE</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Active Panel Content */}
        <div className="flex-1 p-4 overflow-hidden">
          {activePanel === 'chat' && (
            <div className="h-full bg-tactical-panel rounded-lg border border-tactical-accent p-4">
              <div className="h-full">
                <ConversationalAgent />
              </div>
            </div>
          )}

          {activePanel === 'deploy' && (
            <div className="h-full space-y-4 overflow-y-auto">
              <div className="bg-tactical-panel rounded-lg border border-tactical-accent p-4">
                <h2 className="text-tactical-accent font-bold mb-4 flex items-center">
                  <span className="mr-2">🎯</span>
                  EMERGENCY DEPLOY
                </h2>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => handleQuickAction('backup')}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-4 rounded border border-red-500 transition-all flex items-center justify-center text-lg"
                  >
                    <span className="mr-3">🚨</span>
                    REQUEST BACKUP
                  </button>
                  <button
                    onClick={() => handleQuickAction('medical')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded border border-blue-500 transition-all flex items-center justify-center text-lg"
                  >
                    <span className="mr-3">🚑</span>
                    MEDICAL EMERGENCY
                  </button>
                  <button
                    onClick={() => handleQuickAction('code3')}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-4 px-4 rounded border border-yellow-500 transition-all flex items-center justify-center text-lg"
                  >
                    <span className="mr-3">🚔</span>
                    CODE 3 RESPONSE
                  </button>
                  <button
                    onClick={() => handleQuickAction('alert')}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-4 rounded border border-purple-500 transition-all flex items-center justify-center text-lg"
                  >
                    <span className="mr-3">📢</span>
                    ALL UNITS ALERT
                  </button>
                </div>
              </div>
            </div>
          )}

          {activePanel === 'intel' && (
            <div className="h-full space-y-4 overflow-y-auto">
              <div className="bg-tactical-panel rounded-lg border border-tactical-accent p-4">
                <h2 className="text-tactical-accent font-bold mb-4 flex items-center">
                  <span className="mr-2">📍</span>
                  INTEL & TOOLS
                </h2>
                <div className="grid grid-cols-1 gap-3">
                  <button className="w-full bg-tactical-darker hover:bg-gray-700 text-white font-medium py-3 px-4 rounded border border-tactical-accent transition-all flex items-center">
                    <span className="mr-3">🗺️</span>
                    TACTICAL MAP
                  </button>
                  <button className="w-full bg-tactical-darker hover:bg-gray-700 text-white font-medium py-3 px-4 rounded border border-tactical-accent transition-all flex items-center">
                    <span className="mr-3">🔍</span>
                    DATABASE SEARCH
                  </button>
                  <button className="w-full bg-tactical-darker hover:bg-gray-700 text-white font-medium py-3 px-4 rounded border border-tactical-accent transition-all flex items-center">
                    <span className="mr-3">⚖️</span>
                    MIRANDA RIGHTS
                  </button>
                  <button className="w-full bg-tactical-darker hover:bg-gray-700 text-white font-medium py-3 px-4 rounded border border-tactical-accent transition-all flex items-center">
                    <span className="mr-3">📝</span>
                    INCIDENT REPORT
                  </button>
                  <button className="w-full bg-tactical-darker hover:bg-gray-700 text-white font-medium py-3 px-4 rounded border border-tactical-accent transition-all flex items-center">
                    <span className="mr-3">🔬</span>
                    EVIDENCE LOG
                  </button>
                </div>
              </div>
            </div>
          )}

          {activePanel === 'status' && (
            <div className="h-full space-y-4 overflow-y-auto">
              {/* Active Units */}
              <div className="bg-tactical-panel rounded-lg border border-tactical-accent p-4">
                <h2 className="text-tactical-accent font-bold mb-4">ACTIVE UNITS</h2>
                <div className="space-y-2">
                  {['Unit 12', 'Unit 07', 'Unit 23'].map((unit, index) => (
                    <div key={index} className="flex items-center justify-between bg-tactical-darker p-3 rounded border border-tactical-accent">
                      <span className="font-mono">{unit}</span>
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Threat Level */}
              <div className="bg-tactical-panel rounded-lg border border-tactical-accent p-4">
                <h2 className="text-tactical-accent font-bold mb-4">THREAT LEVEL</h2>
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-yellow-500 flex items-center justify-center mb-3">
                    <span className="text-white font-bold text-2xl">🟡</span>
                  </div>
                  <div className="font-bold text-xl">MEDIUM</div>
                </div>
              </div>

              {/* Current Incident */}
              <div className="bg-tactical-panel rounded-lg border border-red-500 p-4">
                <div className="bg-red-900 -mx-4 -mt-4 mb-4 px-4 py-2 rounded-t-lg">
                  <h2 className="text-red-300 font-bold">ACTIVE INCIDENT</h2>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">ID:</span>
                    <span className="font-mono">#2024-0847</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Type:</span>
                    <span>Traffic Stop</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Location:</span>
                    <span>Main & 5th St</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-green-400">● ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Command Processing Indicator */}
        {(isProcessing || pendingCommand) && (
          <div className="bg-yellow-600 text-black px-4 py-2 flex items-center justify-center">
            <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full mr-2"></div>
            <span className="font-bold">
              {pendingCommand ? `Processing: "${pendingCommand}"` : 'Processing command...'}
            </span>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-tactical-darker border-t-2 border-tactical-accent p-2 flex-shrink-0">
        <div className="grid grid-cols-4 gap-1">
          {(['chat', 'deploy', 'intel', 'status'] as const).map((panel) => (
            <button
              key={panel}
              onClick={() => setActivePanel(panel)}
              className={`py-3 px-2 rounded transition-all flex flex-col items-center ${
                activePanel === panel
                  ? 'bg-tactical-accent text-tactical-dark'
                  : 'bg-tactical-panel text-gray-400 hover:text-white'
              }`}
            >
              <span className="text-xl mb-1">{getPanelIcon(panel)}</span>
              <span className="text-xs font-bold uppercase">
                {panel}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* Wake Word Status Overlay */}
      {isListening && (
        <div className="absolute top-4 left-4 bg-tactical-accent text-tactical-dark px-3 py-1 rounded-full text-xs font-bold animate-pulse">
          🎤 LISTENING
        </div>
      )}
    </div>
  );
};

export default MobileTacticalInterface;
