import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

interface ConversationContextType {
  messages: Message[];
  addMessage: (msg: Message) => void;
  clearMessages: () => void;
  currentIntent: string | null;
  setCurrentIntent: (intent: string | null) => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export const ConversationProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentIntent, setCurrentIntent] = useState<string | null>(null);

  const addMessage = (msg: Message) => {
    setMessages(prev => [...prev, msg]);
  };

  const clearMessages = () => {
    setMessages([]);
    setCurrentIntent(null);
  };

  return (
    <ConversationContext.Provider value={{ messages, addMessage, clearMessages, currentIntent, setCurrentIntent }}>
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversation = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
};