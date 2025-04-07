import React, { useState } from 'react';
import ChatBox from './ChatBox';
import { orchestratorService } from '../services/OrchestratorService';
import { useEffect } from 'react';

export const VoiceAssistantV2: React.FC = () => {
  useEffect(() => {
    const listener = (response: any) => {
      setMessages(prev => [...prev, { role: 'assistant', content: response.content, timestamp: Date.now() }]);
    };
    orchestratorService.onResponse('demo-user', listener);
    return () => {
      orchestratorService.offResponse('demo-user', listener);
    };
  }, []);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant' | 'system'; content: string; timestamp?: number }[]>([]);
  const [inputText, setInputText] = useState('');
  const [speaking, setSpeaking] = useState(false);

  const handleSend = () => {
    if (!inputText.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: inputText.trim(), timestamp: Date.now() }]);
    orchestratorService.receiveInput({ userId: 'demo-user', type: 'text', content: inputText.trim() });
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full p-4 bg-card rounded-xl border border-border">
      <ChatBox
        messages={messages}
        onMicClick={() => {
          // TODO: Trigger voice input
        }}
        isSpeaking={speaking}
      />
      <div className="flex gap-2 mt-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-3 py-2 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm text-foreground"
        />
        <button
          onClick={handleSend}
          className="p-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          disabled={!inputText.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default VoiceAssistantV2;