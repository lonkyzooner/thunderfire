const fetch = require('node-fetch');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing OpenRouter API key on server. Please set OPENROUTER_API_KEY in your environment.' });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(req.body)
    });

    // Try to parse JSON, but handle empty or invalid responses gracefully
    let data;
    try {
      data = await response.json();
    } catch (err) {
      data = { error: 'Invalid or empty response from OpenRouter API.' };
    }

    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error calling OpenRouter API:', error);
    return res.status(500).json({ error: 'Internal server error contacting OpenRouter API.' });
  }
};