import React from 'react';
import App from './App';
import { ContextProvider } from './contexts/ContextProvider';

/**
 * App Entry Component
 * 
 * This component serves as the entry point for the LARK application.
 */
function AppEntry() {
  return (
    <ContextProvider>
      <App />
    </ContextProvider>
  );
}

export default AppEntry;
