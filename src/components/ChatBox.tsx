import React, { useRef, useEffect, useState } from 'react';
import { UserIcon, BotIcon, SendIcon, MicIcon } from 'lucide-react';
import { orchestratorService } from '../services/OrchestratorService';
import { voiceSynthesisService } from '../services/voice/VoiceSynthesisService';

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
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('lark_chat_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [inputText, setInputText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    localStorage.setItem('lark_chat_history', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    const userId = 'demo-user';
    const listener = (response: any) => {
      if (response.type === 'text') {
        setMessages(prev => [...prev, { role: 'assistant', content: response.content, timestamp: Date.now() }]);
      }
      if (response.content) {
        voiceSynthesisService.speak(response.content).catch(console.error);
      }
    };
    orchestratorService.onResponse(userId, listener);
    return () => {
      orchestratorService.offResponse(userId, listener);
    };
  }, []);

  const handleMicClick = () => {
    const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);

    if (!isSupported || isIOS) {
      alert('Voice input is not supported on this device or browser. Please use a compatible browser like Chrome on Android or desktop.');
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
    <div className="flex flex-col h-full border border-border rounded-2xl shadow-lg overflow-hidden max-w-full bg-gray-900 text-white">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-gray-800">
        <h2 className="text-xl font-bold">LARK Assistant</h2>
        <span className="text-sm text-gray-400">Secure Chat</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-900">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] sm:max-w-[75%] p-3 rounded-2xl shadow-md transition-all duration-300 transform animate-fade-in ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
              <div className="flex items-center gap-2">
                {msg.role === 'user' ? <UserIcon className="h-5 w-5" /> : <BotIcon className="h-5 w-5" />}
                <div className="flex flex-col">
                  <span className="text-xs font-semibold">
                    {msg.role === 'user' ? 'You' : 'LARK'}
                  </span>
                  <span className="text-sm">{msg.content}</span>
                  {msg.timestamp && (
                    <span className="text-[10px] text-gray-400 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 sm:p-4 border-t border-border bg-background">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type your message or use the mic"
          className="flex-1 px-4 py-3 rounded-full border border-gray-700 bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 text-base shadow-sm"
          aria-label="Type your message"
        />
        <button
          onClick={() => {
            if (!inputText.trim()) return;
            setMessages(prev => [...prev, { role: 'user', content: inputText, timestamp: Date.now() }]);
            orchestratorService.receiveInput({ userId: 'demo-user', type: 'text', content: inputText });
            setInputText('');
          }}
          className="p-3 rounded-full bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 w-full sm:w-auto transition shadow"
          aria-label="Send message"
          disabled={!inputText.trim()}
        >
          <SendIcon size={20} />
        </button>
        <button
          onClick={handleMicClick}
          className="p-3 rounded-full bg-green-600 hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-400 w-full sm:w-auto transition shadow"
          aria-label={isSpeaking ? 'Stop voice input' : 'Start voice input'}
        >
          <MicIcon size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatBox;