import React, { useState, useEffect, useRef } from "react";
import { Mic, StopCircle, MapPin, Shield, AlertTriangle, Send, User, Bot } from "lucide-react";

interface AgentMessage {
  id: string;
  text: string;
  sender: "user" | "lark" | "system";
  timestamp: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

const ConversationalAgent: React.FC = () => {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(true);
  const [listening, setListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: AgentMessage = {
      id: `msg-${Date.now()}`,
      text: "LARK Agent online. I'm ready to assist with your patrol duties.",
      sender: "lark",
      timestamp: Date.now(),
      priority: 'medium'
    };
    setMessages([welcomeMessage]);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: AgentMessage = {
      id: `msg-${Date.now()}`,
      text: input,
      sender: "user",
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const response: AgentMessage = {
        id: `msg-${Date.now()}`,
        text: `Understood. I've logged your message: "${input}". How can I assist you further?`,
        sender: "lark",
        timestamp: Date.now(),
        priority: 'medium'
      };
      setMessages(prev => [...prev, response]);
      setLoading(false);
    }, 1000);
  };

  const getPriorityStyles = (priority?: string) => {
    switch (priority) {
      case 'critical': 
        return { backgroundColor: '#fee2e2', borderColor: '#fca5a5', color: '#991b1b' };
      case 'high': 
        return { backgroundColor: '#fef3c7', borderColor: '#fcd34d', color: '#92400e' };
      case 'medium': 
        return { backgroundColor: '#dbeafe', borderColor: '#93c5fd', color: '#1e40af' };
      default: 
        return { backgroundColor: '#f8fafc', borderColor: '#e2e8f0', color: '#475569' };
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      {/* Professional Agent Status Bar */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af, #2563eb)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Shield size={20} style={{ color: '#f59e0b' }} />
            <span style={{
              fontWeight: '600',
              fontSize: '16px',
              fontFamily: '"Inter", sans-serif'
            }}>
              LARK Agent
            </span>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isInitialized ? '#10b981' : '#ef4444'
            }} />
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            fontSize: '14px',
            fontFamily: '"Inter", sans-serif'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={16} />
              <span>Patrol</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={16} style={{ color: '#10b981' }} />
              <span>Low</span>
            </div>
            
            <button
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: '#10b981',
                color: 'white',
                fontFamily: '"Inter", sans-serif'
              }}
            >
              AUTO
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Message History */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        backgroundColor: '#f8fafc'
      }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              marginBottom: '20px',
              display: 'flex',
              justifyContent: msg.sender === "user" ? "flex-end" : "flex-start"
            }}
          >
            <div style={{
              maxWidth: '70%',
              display: 'flex',
              flexDirection: msg.sender === "user" ? "row-reverse" : "row",
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              {/* Avatar */}
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 
                  msg.sender === "user" ? '#1e40af' :
                  msg.sender === "system" ? '#dc2626' : '#10b981',
                flexShrink: 0
              }}>
                {msg.sender === "user" ? (
                  <User size={20} style={{ color: 'white' }} />
                ) : msg.sender === "system" ? (
                  <AlertTriangle size={20} style={{ color: 'white' }} />
                ) : (
                  <Bot size={20} style={{ color: 'white' }} />
                )}
              </div>

              {/* Message Content */}
              <div style={{
                backgroundColor: 
                  msg.sender === "user" ? '#1e40af' :
                  msg.sender === "system" ? getPriorityStyles(msg.priority).backgroundColor : '#ffffff',
                color: 
                  msg.sender === "user" ? 'white' :
                  msg.sender === "system" ? getPriorityStyles(msg.priority).color : '#374151',
                padding: '16px 20px',
                borderRadius: '12px',
                border: msg.sender === "system" ? 
                  `2px solid ${getPriorityStyles(msg.priority).borderColor}` : 
                  msg.sender === "user" ? 'none' : '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                position: 'relative'
              }}>
                {/* Message Header */}
                {msg.sender !== "user" && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
                  }}>
                    <span style={{
                      fontWeight: '600',
                      fontSize: '14px',
                      color: msg.sender === "system" ? getPriorityStyles(msg.priority).color : '#1e40af'
                    }}>
                      {msg.sender === "system" ? "System Alert" : "LARK Agent"}
                    </span>
                    {msg.priority && msg.sender === "system" && (
                      <span style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: getPriorityStyles(msg.priority).borderColor,
                        color: 'white',
                        textTransform: 'uppercase'
                      }}>
                        {msg.priority}
                      </span>
                    )}
                  </div>
                )}

                {/* Message Text */}
                <div style={{
                  fontSize: '15px',
                  lineHeight: '1.5',
                  fontFamily: '"Inter", sans-serif'
                }}>
                  {msg.text}
                </div>
                
                {/* Timestamp */}
                <div style={{
                  fontSize: '12px',
                  opacity: 0.7,
                  marginTop: '8px',
                  textAlign: msg.sender === "user" ? "right" : "left",
                  fontFamily: '"SF Mono", monospace'
                }}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Loading Indicator */}
        {loading && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#10b981'
              }}>
                <Bot size={20} style={{ color: 'white' }} />
              </div>
              <div style={{
                backgroundColor: '#ffffff',
                padding: '16px 20px',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#6b7280',
                  fontSize: '14px',
                  fontFamily: '"Inter", sans-serif'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    animation: 'pulse 1.5s infinite'
                  }} />
                  LARK is processing...
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input Form */}
      <form onSubmit={handleSend} style={{
        padding: '20px',
        backgroundColor: 'white',
        borderTop: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Speak or type your command..."
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '15px',
                fontFamily: '"Inter", sans-serif',
                outline: 'none',
                transition: 'all 0.2s ease',
                backgroundColor: '#f8fafc'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#1e40af';
                e.currentTarget.style.backgroundColor = 'white';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.backgroundColor = '#f8fafc';
              }}
            />
          </div>
          
          <button
            type="button"
            onClick={() => setListening(!listening)}
            disabled={loading}
            style={{
              padding: '14px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: listening ? '#dc2626' : '#1e40af',
              color: 'white',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {listening ? <StopCircle size={20} /> : <Mic size={20} />}
          </button>
          
          <button
            type="submit"
            disabled={!input.trim() || loading}
            style={{
              padding: '14px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: (!input.trim() || loading) ? '#9ca3af' : '#10b981',
              color: 'white',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Send size={20} />
          </button>
        </div>
      </form>

      {/* Professional CSS */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default ConversationalAgent;
