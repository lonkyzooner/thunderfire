import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UnifiedVoiceAssistant } from '../components/UnifiedVoiceAssistant';

describe('UnifiedVoiceAssistant', () => {
  it('renders without crashing', () => {
    render(<UnifiedVoiceAssistant />);
    expect(screen.getByText(/LARK Assistant/i)).toBeInTheDocument();
  });
});