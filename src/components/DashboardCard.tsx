import React from 'react';
import { useUserDepartment } from '../contexts/UserDepartmentContext';
import WorkflowSuggestions from './WorkflowSuggestions';

const DashboardCard: React.FC = () => {
  const { user, department } = useUserDepartment();

  return (
    <div className="dashboard-card max-w-4xl mx-auto mt-8 bg-white rounded-2xl shadow-xl border border-blue-100 p-6 flex flex-col md:flex-row gap-6 items-center">
      {/* Department Logo and Title */}
      <div className="flex flex-col items-center md:items-start gap-2 min-w-[120px]">
        {department.logoUrl ? (
          <img
            src={department.logoUrl}
            alt={department.name + ' Logo'}
            width={80}
            height={80}
            className="rounded-full border border-blue-200 shadow-md bg-white"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div
            className="flex items-center justify-center rounded-full border border-blue-200 shadow-md bg-white text-blue-700 font-bold"
            style={{ width: 80, height: 80, fontSize: 32 }}
          >
            {department.name
              .split(' ')
              .map(word => word[0])
              .join('')
              .slice(0, 3)
              .toUpperCase()}
          </div>
        )}
        <h2 className="text-2xl font-bold text-blue-900">{department.name}</h2>
        <span className="text-xs text-blue-400">{department.theme?.primary ? 'Custom Theme' : 'Default Theme'}</span>
      </div>
      {/* Main Info */}
      <div className="flex-1 flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-semibold text-blue-800">Law Enforcement Assistance and Response Kit</h3>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-sm text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              {user.role === 'officer' ? 'Officer' : user.role}
            </span>
            <span className="text-sm text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              {user.name}
            </span>
          </div>
        </div>
        {/* Workflow Suggestions */}
        <WorkflowSuggestions orgId={department.id} userId={user.id} />
        {/* Status */}
        <div className="flex items-center gap-4 mt-2">
          <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">Active</span>
          <span className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded-full">Online</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;