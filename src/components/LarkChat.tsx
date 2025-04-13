// LarkChat.tsx
// Basic multi-modal chat interface for LARK

import React, { useState } from 'react';
import { useLiveKitVoice } from '../contexts/LiveKitVoiceContext';

export function LarkChat() {
  const { inputMode, setInputMode } = useLiveKitVoice();
  const [text, setText] = useState('');

  const handleSend = () => {
    // TODO: Integrate with OrchestratorService or context
    setText('');
  };

  return (
    <div className="lark-chat-container" style={{ maxWidth: 480, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button
          onClick={() => setInputMode(inputMode === 'voice' ? 'text' : 'voice')}
          style={{
            padding: '6px 12px',
            borderRadius: 4,
            border: '1px solid #ccc',
            background: inputMode === 'voice' ? '#e0f7fa' : '#fff',
            marginRight: 8,
            cursor: 'pointer'
          }}
        >
          {inputMode === 'voice' ? 'Switch to Text' : 'Switch to Voice'}
        </button>
      </div>
      {inputMode === 'text' ? (
        <div style={{ display: 'flex' }}>
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type your message..."
            style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
          />
          <button
            onClick={handleSend}
            style={{
              marginLeft: 8,
              padding: '8px 16px',
              borderRadius: 4,
              background: '#1976d2',
              color: '#fff',
              border: 'none',
              cursor: 'pointer'
            }}
            disabled={!text.trim()}
          >
            Send
          </button>
        </div>
      ) : (
        <div style={{ padding: 16, textAlign: 'center', color: '#1976d2' }}>
          <strong>Voice input mode enabled.</strong>
          <div style={{ marginTop: 8, fontSize: 14 }}>
            {/* Placeholder for voice input controls */}
            Tap the mic button to speak, or switch to text input.
          </div>
        </div>
      )}
    </div>
  );
}
