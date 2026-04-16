const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const API_KEY = process.env.ANTHROPIC_API_KEY;
const TOOL_SECRET = process.env.TOOL_SECRET;

async function callAnthropic(body, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (response.status === 529) {
      console.log(`Anthropic overloaded (529), retry ${i + 1}/${retries}...`);
      await new Promise(r => setTimeout(r, 2000 * (i + 1))); // wait 2s, 4s, 6s
      continue;
    }

    const data = await response.json();
    console.log('Anthropic responded with status:', response.status);
    return { status: response.status, data };
  }
  throw new Error('Anthropic API overloaded after retries. Please try again in a moment.');
}

app.post('/api/claude', async (req, res) => {
  console.log('Request received at /api/claude');

  if (TOOL_SECRET && req.headers['x-tool-secret'] !== TOOL_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!API_KEY) {
    console.log('ERROR: ANTHROPIC_API_KEY not set');
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { status, data } = await callAnthropic(req.body);
    res.status(status).json(data);
  } catch (err) {
    console.log('ERROR:', err.message);
    res.status(503).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('FX Lead Finder running on port ' + PORT));
