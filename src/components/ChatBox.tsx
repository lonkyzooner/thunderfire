import React, { useRef, useEffect, useState } from 'react';
import { UserIcon, BotIcon, SendIcon, MicIcon } from 'lucide-react';
import { orchestratorService } from '../services/OrchestratorService';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

interface ChatBoxProps {
  onMicClick?: () => void;
  isSpeaking?: boolean;
  messages?: ChatMessage[];
  setMessages?: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  sendMessage?: (text: string) => void;
}

const ChatBox: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const userId = 'demo-user';
    const listener = (response: any) => {
      setMessages(prev => [...prev, { role: 'assistant', content: response.content, timestamp: Date.now() }]);
    };
    orchestratorService.onResponse(userId, listener);
    return () => {
      orchestratorService.offResponse(userId, listener);
    };
  }, []);

  const handleMicClick = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser.');
      return;
    }

    if (!recognitionRef.current) {
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognitionClass();
      if (recognitionRef.current) {
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';
      }

      if (recognitionRef.current) {
        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          setMessages(prev => [...prev, { role: 'user', content: transcript, timestamp: Date.now() }]);
          orchestratorService.receiveInput({ userId: 'demo-user', type: 'text', content: transcript });
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event);
          setIsSpeaking(false);
        };

        recognitionRef.current.onend = () => {
          setIsSpeaking(false);
        };
      }
    }

    if (isSpeaking) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsSpeaking(false);
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
      setIsSpeaking(true);
    }
  };

  return (
    <div className="flex flex-col h-full border border-border rounded-lg overflow-hidden">
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-background">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] p-2 rounded-lg ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
              <div className="flex items-center gap-2">
                {msg.role === 'user' ? <UserIcon className="h-4 w-4" /> : <BotIcon className="h-4 w-4" />}
                <span className="text-sm">{msg.content}</span>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex items-center gap-2 p-3 border-t border-border bg-background">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-3 py-2 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm text-foreground"
          aria-label="Type your message"
        />
        <button
          onClick={() => {
            if (!inputText.trim()) return;
            setMessages(prev => [...prev, { role: 'user', content: inputText, timestamp: Date.now() }]);
            orchestratorService.receiveInput({ userId: 'demo-user', type: 'text', content: inputText });
            setInputText('');
          }}
          className="p-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          aria-label="Send message"
          disabled={!inputText.trim()}
        >
          <SendIcon size={18} />
        </button>
        <button
          onClick={handleMicClick}
          className="p-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30"
          aria-label={isSpeaking ? 'Stop voice input' : 'Start voice input'}
        >
          <MicIcon size={18} />
        </button>
      </div>
    </div>
  );
};

export default ChatBox;