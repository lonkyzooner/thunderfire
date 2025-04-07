import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatBox from '../components/ChatBox';

describe('ChatBox', () => {
  it('renders chat input and messages', () => {
    const messages = [{ sender: 'user', content: 'Hello', role: 'user' as 'user' }];
    const setInputText = jest.fn();
    const onSend = jest.fn();
    const onMicClick = jest.fn();

    render(
      <ChatBox
        messages={messages}
        inputText=""
        setInputText={setInputText}
        onSend={onSend}
        onMicClick={onMicClick}
        isSpeaking={false}
      />
    );

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});