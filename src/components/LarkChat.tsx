// LarkChat.tsx
// Basic multi-modal chat interface for LARK

import React, { useState } from 'react';
import { useLiveKitVoice } from '../contexts/LiveKitVoiceContext';
import { useVoiceAssistantCore } from '../hooks/useVoiceAssistantCore';
import { processVoiceCommand, CommandResponse } from '../lib/openai-service';
import OfficerMap from './OfficerMap';
export function LarkChat() {
  const { inputMode, setInputMode } = useLiveKitVoice();
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [mapCommand, setMapCommand] = useState<CommandResponse | null>(null);

  // Optionally, integrate useVoiceAssistantCore for more advanced features
  // const voiceCore = useVoiceAssistantCore();

  const handleSend = async () => {
    if (!text.trim()) return;
    const userMsg = { role: 'user' as const, content: text };
    setMessages((prev) => [...prev, userMsg]);
    setText('');
    try {
      const response = await processVoiceCommand(text);
      // If the response is a map action, trigger map update
      if (
        response.action === 'show_location' ||
        response.action === 'plot_perimeter' ||
        response.action === 'highlight_route' ||
        response.action === 'center_map' ||
        response.action === 'mark_point' ||
        response.action === 'show_nearest_resource' ||
        response.action === 'draw_zone'
      ) {
        setMapCommand(response);
      }
      // Add assistant message to chat
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.result || '[Map action executed]' }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, there was an error processing your command.' }
      ]);
    }
  };

  return (
    <div className="lark-chat-container" style={{ maxWidth: 480, margin: '0 auto', padding: 16 }}>
      <OfficerMap mapCommand={mapCommand} />
      <div style={{ margin: '16px 0' }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              textAlign: msg.role === 'user' ? 'right' : 'left',
              margin: '4px 0',
              color: msg.role === 'user' ? '#1976d2' : '#333'
            }}
          >
            <span style={{ fontWeight: msg.role === 'user' ? 600 : 400 }}>
              {msg.role === 'user' ? 'You: ' : 'LARK: '}
            </span>
            {msg.content}
          </div>
        ))}
      </div>
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
    </div>
  );
}
