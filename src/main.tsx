import React from 'react'
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import './index.css'

// Minimal test component
const MinimalApp = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '600px'
      }}>
        <h1 style={{
          color: '#1e293b',
          fontSize: '32px',
          marginBottom: '16px'
        }}>
          🚔 LARK Platform
        </h1>
        
        <p style={{
          color: '#64748b',
          fontSize: '18px',
          marginBottom: '24px'
        }}>
          System Online ✅
        </p>

        <div style={{
          background: '#e2e8f0',
          padding: '20px',
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Status Check</h3>
          <p style={{ margin: 0, color: '#64748b' }}>
            React: Working ✅<br/>
            CSS: Loading ✅<br/>
            Build: Success ✅
          </p>
        </div>

        <button style={{
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '16px'
        }} onClick={() => alert('LARK System Online!')}>
          Test Interaction
        </button>
        
        <p style={{
          color: '#94a3b8',
          fontSize: '14px',
          marginTop: '20px'
        }}>
          {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
};

// Create a root element
const rootElement = document.getElementById("root");

// Render the application
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <MinimalApp />
    </StrictMode>
  );
} else {
  console.error('Root element not found. Cannot mount application.');
}
