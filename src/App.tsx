// App.tsx - LARK Voice Assistant
import React from 'react';
import EnhancedDashboard from './components/EnhancedDashboard';

function App() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <EnhancedDashboard onLocationChange={() => {}} />
    </div>
  );
}

export default App;
