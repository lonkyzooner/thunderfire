import React from 'react';

const TestDashboard: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        background: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <h1 style={{
          color: '#1e293b',
          fontSize: '32px',
          marginBottom: '16px'
        }}>
          🚔 LARK Law Enforcement Platform
        </h1>
        
        <p style={{
          color: '#64748b',
          fontSize: '18px',
          marginBottom: '32px'
        }}>
          System Status: Online ✅
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <div style={{
            background: '#e2e8f0',
            padding: '20px',
            borderRadius: '6px'
          }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>AI Assistant</h3>
            <p style={{ margin: 0, color: '#64748b' }}>Ready</p>
          </div>
          
          <div style={{
            background: '#e2e8f0',
            padding: '20px',
            borderRadius: '6px'
          }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Location Tracking</h3>
            <p style={{ margin: 0, color: '#64748b' }}>Active</p>
          </div>
          
          <div style={{
            background: '#e2e8f0',
            padding: '20px',
            borderRadius: '6px'
          }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Legal Database</h3>
            <p style={{ margin: 0, color: '#64748b' }}>Connected</p>
          </div>
        </div>

        <div style={{
          background: '#f1f5f9',
          padding: '20px',
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>Quick Actions</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              Emergency Alert
            </button>
            <button style={{
              background: '#059669',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              Status Update
            </button>
            <button style={{
              background: '#d97706',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              New Report
            </button>
          </div>
        </div>

        <p style={{
          color: '#94a3b8',
          fontSize: '14px',
          margin: 0
        }}>
          LARK v1.0 | {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default TestDashboard;
