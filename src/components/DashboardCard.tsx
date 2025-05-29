import React from 'react';
import { useUserDepartment } from '../contexts/UserDepartmentContext';
import WorkflowSuggestions from './WorkflowSuggestions';

const DashboardCard: React.FC = () => {
  const { user, department } = useUserDepartment();

  return (
    <div>
      {/* Department Logo and Title */}
      <div>
        {department.logoUrl ? (
          <img
            src={department.logoUrl}
            alt={department.name + ' Logo'}
            width={80}
            height={80}

            
          />
        ) : (
          <div
          >
            {department.name
              .split(' ')
              .map(word => word[0])
              .join('')
              .slice(0, 3)
              .toUpperCase()}
          </div>
        )}
        <h2>{department.name}</h2>
        <span>{department.theme?.primary ? 'Custom Theme' : 'Default Theme'}</span>
      </div>
      {/* Main Info */}
      <div>
        <div>
          <h3>Law Enforcement Assistance and Response Kit</h3>
          <div>
            <span>
              {user.role === 'officer' ? 'Officer' : user.role}
            </span>
            <span>
              {user.name}
            </span>
          </div>
        </div>
        {/* Workflow Suggestions */}
        <WorkflowSuggestions orgId={department.id} userId={user.id} />
        {/* Status */}
        <div>
          <span>Active</span>
          <span>Online</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;