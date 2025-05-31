import React, { useState, useRef } from 'react';
import { liveKitVoiceService } from '../../services/livekit/LiveKitVoiceService';
import { OrchestratorInput, OrchestratorResponse } from '../../services/OrchestratorService';

const ChatAssistant: React.FC = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const speak = (text: string) => liveKitVoiceService.speak(text, 'ash');
  const stopSpeaking = () => liveKitVoiceService.stop();

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { role: 'user' as const, content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      // Call OrchestratorService (simulate with fetch or direct call)
      const orgInput: OrchestratorInput = {
        orgId: 'demo',
        userId: 'officer',
        type: 'text',
        content: userMsg.content,
      };
      // Replace with actual orchestrator call in real app
      const response = await fetch('/api/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orgInput),
      });
      const data: OrchestratorResponse = await response.json();
      const assistantMsg = { role: 'assistant' as const, content: data.content };
      setMessages((prev) => [...prev, assistantMsg]);
      stopSpeaking();
      speak(data.content);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, there was an error processing your command.' }]);
    }
    setLoading(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-lg shadow-lg overflow-hidden">
      <div className="flex-none p-4 border-b border-border">
        <h2 className="text-lg font-semibold">LARK Chat Assistant</h2>
      </div>
      <div className="flex-1 p-4 space-y-2 overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-muted-foreground text-sm">Ask LARK a question or issue a command.</div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}> 
            <div className={`inline-block px-3 py-2 rounded-lg ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>{msg.content}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="flex-none p-3 border-t border-border flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-3 py-2 rounded border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={loading}
        />
        <button
          type="submit"
          className="px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatAssistant;

