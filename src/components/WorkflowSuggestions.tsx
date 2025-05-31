import React, { useEffect, useState } from 'react';
import { SuggestedAction, WorkflowState } from '../services/WorkflowManager';
import { orchestratorService } from '../services/OrchestratorService';

type OrchestratorInput = {
  orgId: string;
  userId: string;
  type: 'ui';
  content: string;
  metadata?: Record<string, any>;
};

interface WorkflowSuggestionsProps {
  orgId: string;
  userId: string;
  onAction?: (action: SuggestedAction) => void;
}

const WorkflowSuggestions: React.FC<WorkflowSuggestionsProps> = ({ orgId, userId, onAction }) => {
  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestedAction[]>([]);

  useEffect(() => {
    setWorkflowState(orchestratorService.getWorkflowState(orgId, userId));
    setSuggestions(orchestratorService.getWorkflowSuggestions(orgId, userId));
    // Optionally, subscribe to updates if available
  }, [orgId, userId]);

  const handleActionClick = (action: SuggestedAction) => {
    // Send the suggested action as a UI input to the orchestrator
    const input: OrchestratorInput = {
      orgId,
      userId,
      type: 'ui',
      content: action.label,
      metadata: { actionType: action.actionType, ...action.params }
    };
    orchestratorService.receiveInput(input);
    if (onAction) onAction(action);
  };

  return (
    <div className="workflow-suggestions bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-bold mb-2">Next Steps</h3>
      {workflowState && (
        <div className="mb-2 text-sm text-blue-900">
          <span className="font-semibold">Current Step:</span> {workflowState.currentStep}
        </div>
      )}
      <ul className="space-y-2">
        {suggestions.map((action, idx) => (
          <li key={idx}>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              onClick={() => handleActionClick(action)}
            >
              {action.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WorkflowSuggestions;