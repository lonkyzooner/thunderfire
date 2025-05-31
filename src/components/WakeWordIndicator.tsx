/**
 * Wake Word Indicator Component
 * 
 * Visual indicator showing wake word detection status and audio levels
 */

import React, { useState } from 'react';
import { useWakeWord, useWakeWordCommands } from '../hooks/useWakeWord';
import { useStripe } from '../contexts/StripeContext';

interface WakeWordIndicatorProps {
  className?: string;
  showControls?: boolean;
  autoStart?: boolean;
}

const WakeWordIndicator: React.FC<WakeWordIndicatorProps> = ({
  className = '',
  showControls = true,
  autoStart = false
}) => {
  const { 
    isListening, 
    lastDetection, 
    audioLevel, 
    startListening, 
    stopListening, 
    updateOptions, 
    error 
  } = useWakeWord(autoStart);
  
  const { pendingCommand, isProcessing } = useWakeWordCommands();
  const { hasFeature } = useStripe();
  
  const [showSettings, setShowSettings] = useState(false);
  const [sensitivity, setSensitivity] = useState(0.7);
  const [audioFeedback, setAudioFeedback] = useState(true);

  // Check if user has wake word feature
  const hasWakeWordFeature = hasFeature('voice_activation');

  const handleToggleListening = async () => {
    if (!hasWakeWordFeature) {
      alert('Wake word detection requires Standard subscription or higher.');
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      try {
        await startListening({
          sensitivity,
          enableAudioFeedback: audioFeedback,
          backgroundListening: true
        });
      } catch (err) {
        console.error('Failed to start wake word detection:', err);
      }
    }
  };

  const handleUpdateSettings = () => {
    updateOptions({
      sensitivity,
      enableAudioFeedback: audioFeedback
    });
    setShowSettings(false);
  };

  // Get indicator color based on state
  const getIndicatorColor = () => {
    if (!hasWakeWordFeature) return 'bg-gray-400';
    if (error) return 'bg-red-500';
    if (isProcessing) return 'bg-yellow-500 animate-pulse';
    if (lastDetection && Date.now() - lastDetection.timestamp < 3000) return 'bg-green-500 animate-pulse';
    if (isListening) return 'bg-blue-500';
    return 'bg-gray-400';
  };

  // Get status text
  const getStatusText = () => {
    if (!hasWakeWordFeature) return 'Wake word locked';
    if (error) return 'Error';
    if (isProcessing) return 'Processing...';
    if (lastDetection && Date.now() - lastDetection.timestamp < 3000) return 'Wake word detected!';
    if (isListening) return 'Listening for "Hey LARK"';
    return 'Wake word inactive';
  };

  // Audio level visualization
  const audioLevelPercentage = Math.min(100, audioLevel * 100);

  return (
    <div className={`relative ${className}`}>
      {/* Main Indicator */}
      <div className="flex items-center space-x-3">
        {/* Status Indicator */}
        <div className="relative">
          <div className={`w-3 h-3 rounded-full ${getIndicatorColor()}`}></div>
          
          {/* Audio Level Ring */}
          {isListening && (
            <div className="absolute inset-0 w-3 h-3">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-gray-300"
                  opacity="0.3"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-blue-500"
                  strokeDasharray={`${audioLevelPercentage * 0.628} 62.8`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Status Text */}
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900">
            {getStatusText()}
          </div>
          
          {pendingCommand && (
            <div className="text-xs text-gray-600">
              Processing: "{pendingCommand}"
            </div>
          )}
          
          {lastDetection && !isProcessing && (
            <div className="text-xs text-green-600">
              Last: "{lastDetection.transcript}" ({Math.round(lastDetection.confidence * 100)}%)
            </div>
          )}
          
          {error && (
            <div className="text-xs text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* Controls */}
        {showControls && (
          <div className="flex items-center space-x-2">
            {/* Toggle Button */}
            <button
              onClick={handleToggleListening}
              disabled={!hasWakeWordFeature}
              className={`px-3 py-1 text-xs rounded transition-all ${
                isListening
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : hasWakeWordFeature
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              title={!hasWakeWordFeature ? 'Upgrade to Standard to use wake word detection' : ''}
            >
              {isListening ? 'Stop' : 'Start'} {!hasWakeWordFeature && '🔒'}
            </button>

            {/* Settings Button */}
            {hasWakeWordFeature && (
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
              >
                ⚙️
              </button>
            )}
          </div>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-full left-0 mt-2 p-4 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-64">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Wake Word Settings</h3>
          
          <div className="space-y-3">
            {/* Sensitivity */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Sensitivity ({Math.round(sensitivity * 100)}%)
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={sensitivity}
                onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-xs text-gray-500 mt-1">
                Higher = more sensitive but may trigger falsely
              </div>
            </div>

            {/* Audio Feedback */}
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-700">
                Audio Feedback
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={audioFeedback}
                  onChange={(e) => setAudioFeedback(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Apply Button */}
            <button
              onClick={handleUpdateSettings}
              className="w-full px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Apply Settings
            </button>
          </div>
        </div>
      )}

      {/* Feature Upgrade Prompt */}
      {!hasWakeWordFeature && (
        <div className="absolute top-full left-0 mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200 z-50 min-w-64">
          <div className="text-sm font-medium text-blue-900 mb-1">
            Wake Word Detection
          </div>
          <div className="text-xs text-blue-700 mb-2">
            Enable hands-free "Hey LARK" activation with Standard subscription or higher.
          </div>
          <a
            href="/pricing"
            className="inline-block px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Upgrade Now
          </a>
        </div>
      )}
    </div>
  );
};

export default WakeWordIndicator;
