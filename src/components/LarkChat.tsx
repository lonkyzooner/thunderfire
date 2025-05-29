// LarkChat.tsx
// Basic multi-modal chat interface for LARK

import React, { useState, useContext } from 'react';
import SuggestionsBar, { Suggestion } from './SuggestionsBar';
import IncidentTimeline, { TimelineEvent } from './IncidentTimeline';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useLiveKitVoice } from '../hooks/useLiveKitVoice';
import { useVoiceAssistantCore } from '../hooks/useVoiceAssistantCore';
import { CommandResponse } from '../lib/openai-service';
import OfficerMap from './OfficerMap';
import AuthContext, { AuthContextType } from '../contexts/AuthContext';
import { ConversationContext } from '../contexts/ConversationContext';
import { orchestratorService } from '../services/OrchestratorService';

interface LarkChatProps {}

export function LarkChat() {
  const { user } = useContext(AuthContext) as AuthContextType;
  const { conversationHistory, addMessage } = useContext(ConversationContext);
  const orgId = user?.orgId;
  const userId = user?.sub;

  if (!orgId || !userId) {
    return (<div>Error: Could not retrieve orgId or userId from AuthContext. Please ensure the user is logged in and has a valid profile.</div>);
  }
  const { speak, stopSpeaking, isSpeaking } = useLiveKitVoice();
  const {
    listening,
    transcript,
    startListening,
    stopListening,
    hasRecognitionSupport,
    error: speechError
  } = useSpeechRecognition();
  const [text, setText] = useState('');
  const [summary, setSummary] = useState<string | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // Suggestions state and throttling
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [lastSuggestionTime, setLastSuggestionTime] = useState<number>(0);
  const SUGGESTION_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes

  // Placeholder: Simulate summarization with a timeout
  async function handleSummarizeConversation() {
    setSummary(null);
    setShowSummaryModal(true);
    // In production, send messages to an LLM endpoint with a summarization prompt
    // Example: await fetch('/api/summarize', { ... })
    setTimeout(() => {
      setSummary(
        "This is a placeholder summary. The conversation covered key points, actions, and next steps. (Replace with real LLM output.)"
      );
    }, 1200);
  }

  function maybeShowSuggestions(context: "afterSend") {
    const now = Date.now();
    if (now - lastSuggestionTime < SUGGESTION_COOLDOWN_MS) return;
    // Example: Only show after user sends a message, not after every LARK reply
    if (context === "afterSend") {
      setSuggestions([
        {
          id: "summarize",
          text: "Summarize Conversation",
          onClick: handleSummarizeConversation,
        },
        {
          id: "flag",
          text: "Flag for Supervisor Review",
          onClick: () => {
            alert("Flagged for supervisor review (placeholder)");
            setSuggestions([]);
          },
        },
      ]);
      setLastSuggestionTime(now);
    }
  }
  //const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  // For timeline: store timestamps for each message
  const [messageTimestamps, setMessageTimestamps] = useState<number[]>([]);
  const [mapCommand, setMapCommand] = useState<CommandResponse | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  // Optionally, integrate useVoiceAssistantCore for more advanced features
  // const voiceCore = useVoiceAssistantCore();

  const handleSend = async () => {
    if (!text.trim()) return;
    const userMsg = { role: 'user' as const, content: text };
    //setMessages((prev) => [...prev, userMsg]);
    addMessage(orgId, userId, 'user', text);
    setMessageTimestamps((prev) => [...prev, Date.now()]);
    setText('');
    maybeShowSuggestions("afterSend");
    try {
      const response = await orchestratorService.receiveInput({
        orgId,
        userId,
        type: 'text',
        content: text,
      });
      // If the response is a map action, trigger map update
      if (
        (response as any).action === 'show_location' ||
        (response as any).action === 'plot_perimeter' ||
        (response as any).action === 'highlight_route' ||
        (response as any).action === 'center_map' ||
        (response as any).action === 'mark_point' ||
        (response as any).action === 'show_nearest_resource' ||
        (response as any).action === 'draw_zone'
      ) {
        setMapCommand(response as any);
      }
      // Add assistant message to chat
      //setMessages((prev) => {
        const assistantMsg: { role: "assistant"; content: string } = {
          role: "assistant",
          content: (response as any).content || '[Map action executed]'
        };
        // Speak the assistant's reply using LiveKit TTS
        stopSpeaking();
        speak(assistantMsg.content);
        setMessageTimestamps((prev) => [...prev, Date.now()]);
        addMessage(orgId, userId, 'assistant', assistantMsg.content);
        //return [...prev, assistantMsg];
      //});
    } catch (err) {
      //setMessages((prev) => [
      //  ...prev,
      //  { role: 'assistant', content: 'Sorry, there was an error processing your command.' }
      //]);
      addMessage(orgId, userId, 'assistant', 'Sorry, there was an error processing your command.');
    }
  };

  // Dismiss suggestions
  function handleDismissSuggestions() {
    setSuggestions([]);
  }

  return (
    <div className="flex flex-col h-full w-full bg-card rounded-lg shadow-lg overflow-hidden">
      <div className="flex-none p-4">
        <OfficerMap mapCommand={mapCommand} />
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {conversationHistory.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}
          >
            <div className={`max-w-[80%] rounded-lg p-3 ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground ml-auto'
                : 'bg-secondary text-secondary-foreground'
            }`}>
              <div className="font-semibold mb-1">
                {msg.role === 'user' ? 'You' : 'LARK'}
              </div>
              <div>{msg.content}</div>
            </div>
          </div>
        ))}
      </div>
      {/* Suggestions Bar */}
      <SuggestionsBar suggestions={suggestions} onDismiss={handleDismissSuggestions} />
      {/* Incident Timeline */}
      <IncidentTimeline
        events={conversationHistory.map((msg, idx) => ({
          id: `msg-${idx}`,
          timestamp: Date.now(), //messageTimestamps[idx] || Date.now(),
          type: msg.role,
          content: msg.content,
        }))}
      />
      <div className="flex-none p-4 border-t border-border">
        <div className="flex justify-end mb-4">
          <button
            onClick={handleSummarizeConversation}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 transition-colors"
          >
            Summarize Conversation
          </button>
        </div>
      {/* Summary Modal */}
      {showSummaryModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.25)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setShowSummaryModal(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 2px 16px 0 #0002',
              padding: 32,
              minWidth: 320,
              maxWidth: 480,
              maxHeight: '80vh',
              overflowY: 'auto',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Conversation Summary</h2>
            {summary ? (
              <div style={{ fontSize: 16, color: '#222', whiteSpace: 'pre-line' }}>{summary}</div>
            ) : (
              <div style={{ color: '#888', fontStyle: 'italic' }}>Generating summary...</div>
            )}
            <button
              onClick={() => setShowSummaryModal(false)}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: '#eee',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                fontWeight: 700,
                fontSize: 18,
                cursor: 'pointer'
              }}
              aria-label="Close summary"
            >
              ×
            </button>
          </div>
        </div>
      )}
        {/* Voice input and text input area */}
        {showTranscript && transcript && !listening ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={transcript}
              readOnly
              className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-md"
            />
            <button
              onClick={() => {
                setText(transcript);
                setShowTranscript(false);
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Use
            </button>
            <button
              onClick={() => {
                setShowTranscript(false);
                stopListening();
              }}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Type your message or use the mic..."
              className="flex-1 px-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={listening}
            />
            {hasRecognitionSupport && (
              <button
                onClick={() => {
                  if (listening) {
                    stopListening();
                  } else {
                    setShowTranscript(true);
                    stopSpeaking();
                    startListening();
                  }
                }}
                className={`p-2 rounded-full ${
                  listening
                    ? 'bg-warning text-warning-foreground'
                    : 'bg-secondary text-secondary-foreground'
                } hover:opacity-90 transition-colors`}
                aria-label={listening ? "Stop listening" : "Start voice input"}
              >
                {listening ? '🎤...' : '🎤'}
              </button>
            )}
            <button
              onClick={handleSend}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              disabled={!text.trim() || listening}
            >
              Send
            </button>
          </div>
        )}
      </div>
      {/* UI feedback for voice input */}
      {listening && (
        <div className="mt-2 text-warning font-medium">
          Listening... Speak your message.
        </div>
      )}
      {speechError && (
        <div className="mt-2 text-destructive font-medium">
          Voice input error: {speechError}
        </div>
      )}
    </div>
  );
}
