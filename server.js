const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const API_KEY = process.env.ANTHROPIC_API_KEY;
const TOOL_SECRET = process.env.TOOL_SECRET;

app.post('/api/claude', async (req, res) => {
  // Optional secret check - if TOOL_SECRET is set, enforce it
  if (TOOL_SECRET && req.headers['x-tool-secret'] !== TOOL_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

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
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('FX Lead Finder running on port ' + PORT));
