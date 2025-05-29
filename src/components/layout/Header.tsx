import React from 'react';
import LarkLogo from '../LarkLogo';
import { BatteryMedium, Clock, MapPin, WifiIcon } from 'lucide-react';
import { useUserDepartment } from '../../contexts/UserDepartmentContext';

interface HeaderProps {
  currentTime: Date;
  batteryLevel: number;
  connected: boolean;
  location: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentTime, 
  batteryLevel, 
  connected, 
  location 
}) => {
  const { user, department } = useUserDepartment();

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <header style={{
      background: 'linear-gradient(135deg, #1e40af, #2563eb)',
      color: 'white',
      padding: '16px 20px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* LARK Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <LarkLogo />
          <div>
            <h1 style={{ 
              fontSize: '20px', 
              fontWeight: '700', 
              margin: '0',
              color: '#f59e0b' 
            }}>
              LARK
            </h1>
            <p style={{ 
              fontSize: '12px', 
              margin: '0', 
              opacity: 0.8,
              fontWeight: '500' 
            }}>
              Law Enforcement Assistant
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '24px',
          fontSize: '14px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} />
            <span>{formatTime(currentTime)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={16} />
            <span>{location}</span>
          </div>
        </div>

        {/* Department & User Info */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '20px',
          fontSize: '14px' 
        }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: '600' }}>{department.name}</div>
            <div style={{ opacity: 0.8 }}>Officer {user.rank}</div>
          </div>

          {/* System Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <BatteryMedium size={16} />
              <span>{batteryLevel}%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <WifiIcon size={16} style={{ color: connected ? '#10b981' : '#ef4444' }} />
              <span>{connected ? 'Online' : 'Offline'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img
                src={user.avatarUrl}
                alt={user.name + " Avatar"}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: '2px solid rgba(255, 255, 255, 0.2)'
                }}
              />
              <span style={{ fontWeight: '500' }}>{user.name}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
