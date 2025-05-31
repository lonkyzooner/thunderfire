import React, { useState, useEffect } from "react";
import { toast } from "./ui/use-toast";
import { Skeleton } from "./ui/skeleton";
import { Mic, StopCircle, AlertTriangle, Clock, MapPin, Activity, Volume2, VolumeX } from "lucide-react";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { useConversation } from "../contexts/ConversationContext";
import { useLiveKitVoice } from "../hooks/useLiveKitVoice";

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const SITE_URL = window.location.origin;
const SITE_NAME = "LARK";

// Enhanced LARK system prompt with context awareness
const LARK_SYSTEM_PROMPT = `
You are LARK (Law Enforcement Assistance and Response Kit), a context-aware AI assistant for police officers. You have access to:
- Current incident details and history
- Officer location and status
- Previous conversations and evidence
- Department alerts and protocols

Core capabilities:
- Incident management: Create, update, and close incidents
- Evidence collection: Voice recordings, photos, location data
- Real-time communication: Status updates, backup requests
- Context retention: Remember conversation across the entire incident
- Proactive assistance: Suggest next steps based on incident type and context

Response guidelines:
- Keep responses concise (1-2 sentences) and actionable
- Reference specific incident context when relevant
- Suggest evidence collection opportunities
- Offer to update incident status or request backup when appropriate
- Use professional law enforcement terminology
- Prioritize officer safety in all recommendations
`;

async function fetchLarkReply(history: { role: string; content: string }[], contextInfo: string) {
  const messages = [
    { role: "system", content: LARK_SYSTEM_PROMPT },
    { role: "system", content: `Current Context: ${contextInfo}` },
    ...history.map(m => ({
      role: m.role,
      content: m.content
    }))
  ];

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": SITE_URL,
      "X-Title": SITE_NAME,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro-exp-03-25:free",
      messages
    })
  });

  if (!response.ok) {
    throw new Error("Failed to fetch LARK response");
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";
}

const ConversationalAgent = () => {
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [voiceResponsesEnabled, setVoiceResponsesEnabled] = useState(true);
  
  // Voice synthesis for LARK responses
  const { speak: speakResponse, isSpeaking: larkIsSpeaking, stopSpeaking } = useLiveKitVoice();
  
  // Use our enhanced conversation context
  const {
    messages,
    isLoading,
    error,
    currentIncident,
    officer,
    addMessage,
    addVoiceMessage,
    startNewIncident,
    endCurrentIncident,
    broadcastStatusUpdate,
    requestBackup,
    getConversationAnalytics
  } = useConversation();

  // Voice input state
  const {
    transcript,
    listening,
    startListening,
    stopListening,
    hasRecognitionSupport
  } = useSpeechRecognition();

  // Update input with transcript when listening stops
  useEffect(() => {
    if (!listening && transcript) {
      // If we were recording for evidence, save it as voice message
      if (isRecording) {
        addVoiceMessage(transcript, 0.9); // Assume high confidence for demo
        setIsRecording(false);
        setInput(""); // Don't set input for evidence recording
      } else {
        setInput(transcript);
      }
    }
  }, [listening, transcript, isRecording, addVoiceMessage]);

  // Build context information for LARK
  const buildContextInfo = () => {
    const analytics = getConversationAnalytics();
    
    return `
Incident: ${currentIncident ? `${currentIncident.type} (${currentIncident.status}) - Priority: ${currentIncident.priority}` : 'No active incident'}
Officer: ${officer.name} (${officer.badgeNumber}) - Status: ${officer.status}
Location: ${officer.currentLocation.latitude.toFixed(4)}, ${officer.currentLocation.longitude.toFixed(4)}
Duration: ${analytics.currentIncidentDuration} minutes
Messages: ${analytics.totalMessages} total, ${analytics.voiceMessages} voice
Beat: ${officer.beat} | Vehicle: ${officer.vehicle}
    `.trim();
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      // Add user message to context
      await addMessage({
        sender: 'officer',
        content: input,
        messageType: 'text'
      });

      // Clear input immediately
      const userInput = input;
      setInput("");

      // Prepare chat history for LARK
      const history = [
        ...messages.map(m => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text,
        })),
        { role: "user", content: userInput }
      ];

      // Get LARK response with context
      const contextInfo = buildContextInfo();
      const larkReply = await fetchLarkReply(history, contextInfo);

      // Add LARK response to context
      await addMessage({
        sender: 'lark',
        content: larkReply,
        messageType: 'text'
      });

      // Speak LARK's response if voice responses are enabled
      if (voiceResponsesEnabled && larkReply) {
        try {
          await speakResponse(larkReply);
        } catch (voiceError) {
          console.error('Error speaking LARK response:', voiceError);
        }
      }

      toast({
        title: "Message sent",
        description: "LARK has replied with contextual information.",
      });
    } catch (err) {
      await addMessage({
        sender: 'lark',
        content: "Sorry, there was an error communicating with LARK.",
        messageType: 'text'
      });
      
      toast({
        title: "Error",
        description: "There was an error communicating with LARK.",
        variant: "destructive"
      });
    }
  };

  const handleVoiceInput = () => {
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleVoiceEvidence = () => {
    setIsRecording(true);
    startListening();
    toast({
      title: "Recording Evidence",
      description: "Voice recording will be saved as evidence when you stop.",
    });
  };

  const handleQuickAction = async (action: string) => {
    switch (action) {
      case 'start_traffic_stop':
        await startNewIncident('traffic_stop');
        toast({ title: "Traffic Stop Started", description: "New incident created and logged." });
        break;
      case 'start_patrol':
        await startNewIncident('patrol');
        toast({ title: "Patrol Started", description: "Patrol incident logged." });
        break;
      case 'request_backup':
        await requestBackup('Officer requested backup via quick action', 'medium');
        toast({ title: "Backup Requested", description: "Backup request sent to dispatch." });
        break;
      case 'update_available':
        await broadcastStatusUpdate('available');
        toast({ title: "Status Updated", description: "Officer status set to Available." });
        break;
      case 'update_busy':
        await broadcastStatusUpdate('busy');
        toast({ title: "Status Updated", description: "Officer status set to Busy." });
        break;
      case 'end_incident':
        if (currentIncident) {
          await endCurrentIncident('Incident completed via quick action');
          toast({ title: "Incident Closed", description: "Current incident has been closed and logged." });
        }
        break;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="w-full h-full flex flex-col bg-white/90 rounded-lg shadow-lg border border-gray-200">
      {/* Context Header */}
      <div className="p-3 border-b bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <Activity className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-blue-800">
              {currentIncident ? `${currentIncident.type.replace('_', ' ').toUpperCase()}` : 'No Active Incident'}
            </span>
            {currentIncident && (
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                currentIncident.priority === 'critical' ? 'bg-red-100 text-red-700' :
                currentIncident.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                currentIncident.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {currentIncident.priority.toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <button
              onClick={() => setVoiceResponsesEnabled(!voiceResponsesEnabled)}
              className={`p-1 rounded transition-colors ${
                voiceResponsesEnabled 
                  ? 'text-blue-600 hover:bg-blue-100' 
                  : 'text-gray-400 hover:bg-gray-100'
              }`}
              title={voiceResponsesEnabled ? 'Disable voice responses' : 'Enable voice responses'}
            >
              {voiceResponsesEnabled ? '🔊' : '🔇'}
            </button>
            <Clock className="w-3 h-3" />
            <span>{formatTime(new Date())}</span>
          </div>
        </div>
        
        {currentIncident && (
          <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{currentIncident.location.latitude.toFixed(4)}, {currentIncident.location.longitude.toFixed(4)}</span>
            </div>
            <span>Duration: {getConversationAnalytics().currentIncidentDuration}m</span>
            <span>Messages: {messages.length}</span>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-2 border-b bg-gray-50">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => handleQuickAction('start_traffic_stop')}
            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
            disabled={isLoading}
          >
            Traffic Stop
          </button>
          <button
            onClick={() => handleQuickAction('start_patrol')}
            className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
            disabled={isLoading}
          >
            Start Patrol
          </button>
          <button
            onClick={() => handleQuickAction('request_backup')}
            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
            disabled={isLoading}
          >
            Request Backup
          </button>
          <button
            onClick={() => handleQuickAction('update_available')}
            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
            disabled={isLoading}
          >
            Available
          </button>
          {currentIncident && (
            <button
              onClick={() => handleQuickAction('end_incident')}
              className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition"
              disabled={isLoading}
            >
              End Incident
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Error: {error}</span>
            </div>
          </div>
        )}
        
        {messages.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No messages yet. Start a conversation with LARK!</p>
            <p className="text-xs mt-1">Try asking about incident procedures or request an update.</p>
          </div>
        )}
        
        <div className="space-y-3">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-2 rounded-lg ${
                msg.sender === 'user'
                  ? 'bg-blue-500 text-white'
                  : msg.sender === 'system'
                  ? 'bg-gray-100 text-gray-700 text-sm'
                  : 'bg-green-100 text-green-800'
              }`}>
                {msg.sender === 'lark' && <span className="font-semibold text-green-600 text-xs">LARK: </span>}
                {msg.sender === 'system' && <span className="font-semibold text-gray-500 text-xs">SYSTEM: </span>}
                <span className="whitespace-pre-wrap">{msg.text}</span>
                <div className="text-xs opacity-75 mt-1">
                  {formatTime(msg.timestamp)}
                  {msg.type === 'voice' && <span className="ml-2">🎤</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {isLoading && (
          <div className="flex justify-start mt-3">
            <div className="max-w-[80%] px-4 py-2 rounded-lg bg-green-50 text-green-700 flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full bg-green-200 animate-pulse" />
              <span className="text-sm">LARK is processing...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-4 border-t bg-white rounded-b-lg">
        <div className="flex gap-2 items-center">
          <input
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 placeholder-gray-500"
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Message LARK..."
            disabled={isLoading}
          />
          
          {hasRecognitionSupport && (
            <>
              <button
                type="button"
                className={`p-2 rounded-full border transition ${
                  listening 
                    ? 'bg-red-100 border-red-400 text-red-700' 
                    : 'bg-blue-100 border-blue-400 text-blue-700 hover:bg-blue-200'
                }`}
                onClick={handleVoiceInput}
                disabled={isLoading}
                title={listening ? "Stop voice input" : "Start voice input"}
              >
                {listening ? <StopCircle className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
              
              <button
                type="button"
                className="p-2 rounded-full border bg-orange-100 border-orange-400 text-orange-700 hover:bg-orange-200 transition"
                onClick={handleVoiceEvidence}
                disabled={isLoading || listening}
                title="Record voice evidence"
              >
                🎤📁
              </button>
            </>
          )}
          
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            disabled={isLoading || !input.trim()}
          >
            Send
          </button>
        </div>
        
        {(listening || isRecording) && (
          <div className="mt-2 text-sm text-center">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
              isRecording ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
            }`}>
              <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
              {isRecording ? 'Recording evidence...' : 'Listening...'}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default ConversationalAgent;
