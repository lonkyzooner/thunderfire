export interface LLMClient {
  generateReply(userId: string, history: { role: string; content: string }[], retrievedSnippets: string[]): Promise<string>;
}

export class OpenAIClient implements LLMClient {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = 'gpt-3.5-turbo') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateReply(userId: string, history: { role: string; content: string }[], retrievedSnippets: string[]): Promise<string> {
    const larkPersona = `You are LARK (Law Enforcement Assistance and Response Kit), a voice-activated AI assistant designed for solo police officers in Louisiana. You act as an autonomous conversational agent, managing all system functionality through natural, context-aware conversation. Your primary goal is to enhance officer safety and efficiency by automating critical tasks, anticipating needs, and providing proactive support during high-pressure situations. Respond in a professional, concise, and authoritative tone, keeping responses to 1–2 sentences.`;

    const systemPrompt = retrievedSnippets.length
      ? `${larkPersona}\nUse the following information to answer:\n${retrievedSnippets.join('\n')}`
      : larkPersona;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...history,
          ],
        }),
      });

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
      return reply;
    } catch (error) {
      console.error('[OpenAIClient] API error:', error);
      return 'Sorry, I encountered an error generating a response.';
    }
  }
}

export class AnthropicClient implements LLMClient {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = 'claude-3-opus-20240229') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateReply(userId: string, history: { role: string; content: string }[], retrievedSnippets: string[]): Promise<string> {
    const systemPrompt = retrievedSnippets.length
      ? `Use the following information to answer:\n${retrievedSnippets.join('\n')}`
      : 'You are a helpful assistant.';
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1024,
          system: systemPrompt,
          messages: history.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await response.json();
      return data.content?.[0]?.text || 'Sorry, I could not generate a response.';
    } catch (error) {
      console.error('[AnthropicClient] API error:', error);
      return 'Sorry, I encountered an error generating a response.';
    }
  }
}

export class GroqClient implements LLMClient {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = 'mixtral-8x7b-32768') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateReply(userId: string, history: { role: string; content: string }[], retrievedSnippets: string[]): Promise<string> {
    const systemPrompt = retrievedSnippets.length
      ? `Use the following information to answer:\n${retrievedSnippets.join('\n')}`
      : 'You are a helpful assistant.';
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...history,
          ],
        }),
      });
      const data = await response.json();
      return data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
    } catch (error) {
      console.error('[GroqClient] API error:', error);
      return 'Sorry, I encountered an error generating a response.';
    }
  }
}

export class GeminiClient implements LLMClient {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = 'gemini-1.5-pro') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateReply(userId: string, history: { role: string; content: string }[], retrievedSnippets: string[]): Promise<string> {
    const systemPrompt = retrievedSnippets.length
      ? `Use the following information to answer:\n${retrievedSnippets.join('\n')}`
      : 'You are a helpful assistant.';
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: `${systemPrompt}\n${history.map(m => m.content).join('\n')}` }
              ]
            }
          ]
        }),
      });
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';
    } catch (error) {
      console.error('[GeminiClient] API error:', error);
      return 'Sorry, I encountered an error generating a response.';
    }
  }
}

export class CohereClient implements LLMClient {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = 'command-r-plus') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateReply(userId: string, history: { role: string; content: string }[], retrievedSnippets: string[]): Promise<string> {
    const systemPrompt = retrievedSnippets.length
      ? `Use the following information to answer:\n${retrievedSnippets.join('\n')}`
      : 'You are a helpful assistant.';
    try {
      const response = await fetch('https://api.cohere.ai/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          message: history.map(m => m.content).join('\n'),
          chat_history: history.map(m => ({ role: m.role, message: m.content })),
          prompt_truncation: 'AUTO',
          connectors: [],
        }),
      });
      const data = await response.json();
      return data.text || 'Sorry, I could not generate a response.';
    } catch (error) {
      console.error('[CohereClient] API error:', error);
      return 'Sorry, I encountered an error generating a response.';
    }
  }
}

export class QuasarClient implements LLMClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateReply(userId: string, history: { role: string; content: string }[], retrievedSnippets: string[]): Promise<string> {
    const larkPersona = `You are LARK (Law Enforcement Assistance and Response Kit), a voice-activated AI assistant designed for solo police officers in Louisiana. You act as an autonomous conversational agent, managing all system functionality through natural, context-aware conversation. Your primary goal is to enhance officer safety and efficiency by automating critical tasks, anticipating needs, and providing proactive support during high-pressure situations. Respond in a professional, concise, and authoritative tone, keeping responses to 1–2 sentences.`;

    const systemPrompt = retrievedSnippets.length
      ? `${larkPersona}\nUse the following information to answer:\n${retrievedSnippets.join('\n')}`
      : larkPersona;

    try {
      const response = await fetch('/api/openrouter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openrouter/optimus-alpha',
          messages: [
            { role: 'system', content: systemPrompt },
            ...history,
          ],
        }),
      });
      const data = await response.json();
      return data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
    } catch (error) {
      console.error('[QuasarClient] API error:', error);
      return 'Sorry, I encountered an error generating a response.';
    }
  }
}
