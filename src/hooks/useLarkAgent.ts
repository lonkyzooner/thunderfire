import { useState } from 'react';

interface LarkMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface UseLarkAgentResult {
  messages: LarkMessage[];
  loading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
}

export function useLarkAgent(): UseLarkAgentResult {
  const [messages, setMessages] = useState<LarkMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (content: string) => {
    setLoading(true);
    setError(null);

    const newMessages: LarkMessage[] = [...messages, { role: 'user' as const, content }];
    setMessages(newMessages);

    try {
      const response = await fetch('/api/openrouter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'openrouter/quasar-alpha',
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        }),
      });
      const data = await response.json();
      const aiReply = data.choices?.[0]?.message?.content || 'No response generated.';
      setMessages([...newMessages, { role: 'assistant' as const, content: aiReply }]);
    } catch (err) {
      console.error('LarkAgent error:', err);
      setError('Error communicating with Lark.');
    } finally {
      setLoading(false);
    }
  };

  return { messages, loading, error, sendMessage };
}