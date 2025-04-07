const fetch = require('node-fetch');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { reportText } = req.body;

  if (!reportText) {
    return res.status(400).json({ error: 'Missing reportText' });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VITE_OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: 'quasar-alpha',
        messages: [
          {
            role: 'user',
            content: `Please review this report and provide feedback:\n\n${reportText}`
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error calling OpenRouter API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};