// ConversationalAgent.tsx
import { toast } from "./ui/use-toast";
import { Skeleton } from "./ui/skeleton";
import { useEffect } from "react";
import { Mic, StopCircle } from "lucide-react";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
// ConversationalAgent.tsx
import React, { useState } from "react";

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const SITE_URL = window.location.origin;
const SITE_NAME = "LARK";

const LARK_SYSTEM_PROMPT = `
You are LARK (Law Enforcement Assistance and Response Kit), a voice-activated AI assistant for solo police officers in Louisiana. 
Primary responsibilities:
- Manage all system functionality through natural conversation, guiding officers through tasks (e.g., “I’ll update dispatch with your location—let me know if you need backup”).
- Maintain conversation context across exchanges, understanding the entire situation and managing workflows (e.g., “You’ve apprehended the suspect—shall I deliver Miranda Rights now?”).
- Anticipate officer needs and suggest next steps (e.g., “I can start the arrest report for you—would you like to proceed?”).
- Transition between voice and text input (e.g., “I’ve prepared the report—would you like to dictate or type?”).
- Make decisions about information collection and actions (e.g., “I’ve requested backup due to the detected gunshot”).
Features:
- Respond to voice commands in law enforcement scenarios (e.g., foot pursuits, traffic stops, domestic disturbances).
- Deliver Miranda Rights in multiple languages using local translation libraries.
- Monitor audio for threats (e.g., gunshots, raised voices) and alert officers/dispatch.
- Send location updates, situation reports, and backup requests to dispatch autonomously.
- Provide instant access to Louisiana criminal statutes.
- Offer tactical feedback and pre-fill arrest report forms, supporting dictation or text input.
- Activate the officer’s camera and update status.
- Assess situational risk and function offline using cached data.
Guidelines:
- Interpret commands within the context of the ongoing situation, tracking history across exchanges.
- Proactively suggest and execute next steps.
- Anticipate needs and take autonomous actions.
- Transition between voice and text input.
- Make autonomous decisions to enhance safety.
- Respond in a clear, professional tone, keeping responses concise (1–2 sentences) and actionable.
- Handle offline scenarios by relying on local resources and confirming limitations.
`;

async function fetchLarkReply(history: { role: string; content: string }[]) {
  const messages = [
    { role: "system", content: LARK_SYSTEM_PROMPT },
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
  // OpenRouter returns choices[0].message.content
  return data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";
}

const ConversationalAgent = () => {
  const [messages, setMessages] = useState<{ text: string; sender: "user" | "lark" }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

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
      setInput(transcript);
    }
  }, [listening, transcript]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMessage = { text: input, sender: "user" as const };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Prepare chat history for LARK (role: user/assistant, content: string)
      const history = [
        ...messages.map(m => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text,
        })),
        { role: "user", content: input }
      ];
      const larkReply = await fetchLarkReply(history);
      setMessages(prev => [...prev, { text: larkReply, sender: "lark" }]);
      toast({
        title: "Message sent",
        description: "LARK has replied.",
        variant: "success"
      });
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { text: "Sorry, there was an error communicating with LARK.", sender: "lark" }
      ]);
      toast({
        title: "Error",
        description: "There was an error communicating with LARK.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto mt-8 p-4 bg-white/80 rounded-2xl shadow-lg border border-gray-200 text-gray-800">
      <div className="mb-4 h-64 overflow-y-auto flex flex-col gap-2">
        {messages.length === 0 && (
          <div className="text-gray-400 text-center mt-16">No messages yet. Start the conversation!</div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`px-4 py-2 rounded-lg max-w-[80%] ${
              msg.sender === "user"
                ? "bg-blue-100 self-end text-right text-gray-800"
                : "bg-green-100 self-start text-left text-gray-800"
            }`}
          >
            {msg.sender === "lark" && <span className="font-bold text-green-700 mr-2">LARK:</span>}
            {msg.text}
          </div>
        ))}
        {loading && (
          <div className="px-4 py-2 rounded-lg bg-green-50 text-green-700 self-start max-w-[80%] flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full bg-green-200 animate-pulse" />
            <span>LARK is typing...</span>
          </div>
        )}
      </div>
      <form onSubmit={handleSend} className="flex gap-2 items-center">
        <input
          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 placeholder-gray-500"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={loading}
        />
        {hasRecognitionSupport && (
          <button
            type="button"
            className={`p-2 rounded-full border ${listening ? "bg-red-100 border-red-400" : "bg-blue-100 border-blue-400"} text-blue-700 hover:bg-blue-200 transition flex items-center`}
            onClick={listening ? stopListening : startListening}
            aria-label={listening ? "Stop voice input" : "Start voice input"}
            disabled={loading}
            tabIndex={0}
          >
            {listening ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
          disabled={loading}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ConversationalAgent;