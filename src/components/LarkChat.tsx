// LarkChat.tsx
// Basic multi-modal chat interface for LARK

import React, { useState } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useLiveKitVoice } from '../hooks/useLiveKitVoice';
import { useVoiceAssistantCore } from '../hooks/useVoiceAssistantCore';
import { processVoiceCommand, CommandResponse } from '../lib/openai-service';
import OfficerMap from './OfficerMap';
export function LarkChat() {
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
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [mapCommand, setMapCommand] = useState<CommandResponse | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  // Optionally, integrate useVoiceAssistantCore for more advanced features
  // const voiceCore = useVoiceAssistantCore();

  const handleSend = async () => {
    if (!text.trim()) return;
    const userMsg = { role: 'user' as const, content: text };
    setMessages((prev) => [...prev, userMsg]);
    setText('');
    try {
      const response = await processVoiceCommand(text);
      // If the response is a map action, trigger map update
      if (
        response.action === 'show_location' ||
        response.action === 'plot_perimeter' ||
        response.action === 'highlight_route' ||
        response.action === 'center_map' ||
        response.action === 'mark_point' ||
        response.action === 'show_nearest_resource' ||
        response.action === 'draw_zone'
      ) {
        setMapCommand(response);
      }
      // Add assistant message to chat
      setMessages((prev) => {
        const assistantMsg: { role: "assistant"; content: string } = {
          role: "assistant",
          content: response.result || '[Map action executed]'
        };
        // Speak the assistant's reply using LiveKit TTS
        stopSpeaking();
        speak(assistantMsg.content);
        return [...prev, assistantMsg];
      });
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, there was an error processing your command.' }
      ]);
    }
  };

  return (
    <div className="lark-chat-container" style={{ maxWidth: 480, margin: '0 auto', padding: 16 }}>
      <OfficerMap mapCommand={mapCommand} />
      <div style={{ margin: '16px 0' }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              textAlign: msg.role === 'user' ? 'right' : 'left',
              margin: '4px 0',
              color: msg.role === 'user' ? '#1976d2' : '#333'
            }}
          >
            <span style={{ fontWeight: msg.role === 'user' ? 600 : 400 }}>
              {msg.role === 'user' ? 'You: ' : 'LARK: '}
            </span>
            {msg.content}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex' }}>
      {/* Summarize Conversation Button */}
      <div style={{ marginBottom: 12, textAlign: 'right' }}>
        <button
          onClick={handleSummarizeConversation}
          style={{
            background: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '6px 16px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 1px 4px 0 #1976d222'
          }}
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
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="text"
              value={transcript}
              readOnly
              style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc', background: '#f9f9f9' }}
            />
            <button
              onClick={() => {
                setText(transcript);
                setShowTranscript(false);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 4,
                background: '#1976d2',
                color: '#fff',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Use
            </button>
            <button
              onClick={() => {
                setShowTranscript(false);
                stopListening();
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 4,
                background: '#eee',
                color: '#333',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Type your message or use the mic..."
              style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              disabled={listening}
            />
            {hasRecognitionSupport && (
              <button
                onClick={() => {
                  if (listening) {
                    stopListening();
                  } else {
                    setShowTranscript(true);
                    stopSpeaking(); // Stop TTS if user starts speaking
                    startListening();
                  }
                }}
                style={{
                  marginLeft: 8,
                  padding: '8px',
                  borderRadius: '50%',
                  background: listening ? '#ff9800' : '#eee',
                  color: listening ? '#fff' : '#333',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
                aria-label={listening ? "Stop listening" : "Start voice input"}
              >
                {listening ? '🎤...' : '🎤'}
              </button>
            )}
            <button
              onClick={handleSend}
              style={{
                marginLeft: 8,
                padding: '8px 16px',
                borderRadius: 4,
                background: '#1976d2',
                color: '#fff',
                border: 'none',
                cursor: 'pointer'
              }}
              disabled={!text.trim() || listening}
            >
              Send
            </button>
          </>
        )}
      </div>
      {/* UI feedback for voice input */}
      {listening && (
        <div style={{ marginTop: 8, color: '#ff9800', fontWeight: 500 }}>
          Listening... Speak your message.
        </div>
      )}
      {speechError && (
        <div style={{ marginTop: 8, color: '#d32f2f', fontWeight: 500 }}>
          Voice input error: {speechError}
        </div>
      )}
    </div>
  );
}
