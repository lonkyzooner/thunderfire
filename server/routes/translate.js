const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY;
const OPENROUTER_API_KEY = process.env.VITE_OPENROUTER_API_KEY;

router.post('/', async (req, res) => {
  console.log('[Translate API] Incoming request:', req.body);
  const { text, targetLanguage, provider } = req.body;

  if (!text || !targetLanguage) {
    return res.status(400).json({ error: 'Missing text or targetLanguage' });
  }

  try {
    let translatedText = text;

    if (provider === 'openrouter' && OPENROUTER_API_KEY) {
      // Use OpenRouter API for translation (assume GPT-4 or similar)
      const prompt = `Translate the following text to ${targetLanguage}:\n\n${text}`;
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:8080',
          'X-Title': 'LARK App'
        },
        body: JSON.stringify({
          model: 'openai/gpt-4', // or another model if preferred
          messages: [
            { role: 'system', content: 'You are a professional legal translator.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 256
        })
      });
      const data = await response.json();
      translatedText = data.choices?.[0]?.message?.content?.trim() || text;
    } else if (OPENAI_API_KEY) {
      // Use OpenAI API for translation
      const prompt = `Translate the following text to ${targetLanguage}:\n\n${text}`;
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'You are a professional legal translator.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 256
        })
      });
      const data = await response.json();
      translatedText = data.choices?.[0]?.message?.content?.trim() || text;
    } else {
      return res.status(500).json({ error: 'No API key available for translation' });
    }

    res.json({ translatedText });
  } catch (error) {
    console.error('Translation error:', error);
    if (error.response) {
      try {
        const errText = await error.response.text();
        console.error('OpenRouter API error response:', errText);
      } catch (e) {
        console.error('Error reading error response:', e);
      }
    }
    res.status(500).json({ error: 'Translation failed', details: error.message });
  }
});

module.exports = router;