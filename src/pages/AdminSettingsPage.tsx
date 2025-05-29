import React, { useState } from "react";
import { useUserDepartment } from "../contexts/UserDepartmentContext";

const AdminSettingsPage: React.FC = () => {
  const { department, setDepartment } = useUserDepartment();
  const [name, setName] = useState(department.name);
  const [logoUrl, setLogoUrl] = useState(department.logoUrl);
  const [primary, setPrimary] = useState(department.theme.primary);
  const [accent, setAccent] = useState(department.theme.accent);
  const [background, setBackground] = useState(department.theme.background);
  const [saving, setSaving] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // In a real app, upload to backend/cloud and get URL
      const url = URL.createObjectURL(e.target.files[0]);
      setLogoUrl(url);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      // Update local state immediately for better UX
      setDepartment({
        ...department,
        name,
        logoUrl,
        theme: { primary, accent, background }
      });

      // Simulate API call with realistic delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // In production, this would be:
      // await fetch('/api/admin/department', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ name, logoUrl, theme: { primary, accent, background } })
      // });

      alert("Department settings saved successfully!");
    } catch (error) {
      console.error('Error saving department settings:', error);
      alert("Error saving settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      maxWidth: '500px',
      margin: '40px auto',
      padding: '24px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb',
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      <h2 style={{
        fontSize: '24px',
        fontWeight: '700',
        marginBottom: '24px',
        color: '#1e40af',
        textAlign: 'center'
      }}>
        Admin: Department Settings
      </h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'block',
          fontWeight: '600',
          marginBottom: '8px',
          color: '#374151'
        }}>
          Department Name
        </label>
        <input
          style={{
            width: '100%',
            padding: '12px',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s ease'
          }}
          value={name}
          onChange={e => setName(e.target.value)}
          onFocus={(e) => e.currentTarget.style.borderColor = '#1e40af'}
          onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
        />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'block',
          fontWeight: '600',
          marginBottom: '8px',
          color: '#374151'
        }}>
          Department Logo
        </label>
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleLogoUpload}
          style={{
            width: '100%',
            padding: '8px',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px'
          }}
        />
        {logoUrl && (
          <img 
            src={logoUrl} 
            alt="Logo Preview" 
            style={{
              marginTop: '12px',
              height: '64px',
              borderRadius: '8px',
              border: '2px solid #e5e7eb'
            }}
          />
        )}
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'block',
          fontWeight: '600',
          marginBottom: '8px',
          color: '#374151'
        }}>
          Primary Color
        </label>
        <input
          type="color"
          value={primary}
          onChange={e => setPrimary(e.target.value)}
          style={{
            width: '48px',
            height: '32px',
            padding: '0',
            border: '2px solid #e5e7eb',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'block',
          fontWeight: '600',
          marginBottom: '8px',
          color: '#374151'
        }}>
          Accent Color
        </label>
        <input
          type="color"
          value={accent}
          onChange={e => setAccent(e.target.value)}
          style={{
            width: '48px',
            height: '32px',
            padding: '0',
            border: '2px solid #e5e7eb',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        />
      </div>
      
      <div style={{ marginBottom: '24px' }}>
        <label style={{
          display: 'block',
          fontWeight: '600',
          marginBottom: '8px',
          color: '#374151'
        }}>
          Background Color
        </label>
        <input
          type="color"
          value={background}
          onChange={e => setBackground(e.target.value)}
          style={{
            width: '48px',
            height: '32px',
            padding: '0',
            border: '2px solid #e5e7eb',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        />
      </div>
      
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: '100%',
          padding: '14px 24px',
          borderRadius: '8px',
          backgroundColor: saving ? '#9ca3af' : '#1e40af',
          color: 'white',
          fontWeight: '600',
          fontSize: '16px',
          border: 'none',
          cursor: saving ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          if (!saving) {
            e.currentTarget.style.backgroundColor = '#1e3a8a';
          }
        }}
        onMouseLeave={(e) => {
          if (!saving) {
            e.currentTarget.style.backgroundColor = '#1e40af';
          }
        }}
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
};

export default AdminSettingsPage;
