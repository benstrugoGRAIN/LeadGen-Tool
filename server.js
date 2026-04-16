const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const API_KEY = process.env.ANTHROPIC_API_KEY;
const TOOL_SECRET = process.env.TOOL_SECRET;

app.post('/api/claude', async (req, res) => {
  console.log('Request received at /api/claude');

  if (TOOL_SECRET && req.headers['x-tool-secret'] !== TOOL_SECRET) {
    console.log('Unauthorized request');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!API_KEY) {
    console.log('ERROR: ANTHROPIC_API_KEY not set');
    return res.status(500).json({ error: 'API key not configured' });
  }

  console.log('API key found, forwarding to Anthropic...');

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    console.log('Anthropic responded with status:', response.status);
    res.json(data);
  } catch (err) {
    console.log('ERROR calling Anthropic:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('FX Lead Finder running on port ' + PORT));
