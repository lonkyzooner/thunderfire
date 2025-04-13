import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserDepartmentProvider } from './UserDepartmentContext';

interface ContextData {
  location: string | null;
  time: string;
  caseNumber: string | null;
  conversationHistory: Array<{ role: string; content: string; timestamp: number }>;
  setConversationHistory: React.Dispatch<React.SetStateAction<Array<{ role: string; content: string; timestamp: number }>>>;
  preferences: Record<string, any>;
  setPreferences: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  ongoingTasks: Array<{ id: string; description: string; status: string }>;
  setOngoingTasks: React.Dispatch<React.SetStateAction<Array<{ id: string; description: string; status: string }>>>;
}

const Context = createContext<ContextData>({
  location: null,
  time: new Date().toLocaleString(),
  caseNumber: null,
  conversationHistory: [],
  setConversationHistory: () => {},
  preferences: {},
  setPreferences: () => {},
  ongoingTasks: [],
  setOngoingTasks: () => {},
});

export const useLarkContext = () => useContext(Context);

export const ContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<string | null>(null);
  const [caseNumber, setCaseNumber] = useState<string | null>(null);
  const [time, setTime] = useState<string>(new Date().toLocaleString());

  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; content: string; timestamp: number }>>([]);
  const [preferences, setPreferences] = useState<Record<string, any>>({});
  const [ongoingTasks, setOngoingTasks] = useState<Array<{ id: string; description: string; status: string }>>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleString());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <UserDepartmentProvider>
      <Context.Provider value={{
        location,
        time,
        caseNumber,
        conversationHistory,
        setConversationHistory,
        preferences,
        setPreferences,
        ongoingTasks,
        setOngoingTasks
      }}>
        {children}
      </Context.Provider>
    </UserDepartmentProvider>
  );
};