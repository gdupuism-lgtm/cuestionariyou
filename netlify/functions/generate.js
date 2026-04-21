exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const { system, prompt } = JSON.parse(event.body);
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': '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',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        system: system,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await response.json();
    const text = (data.content || []).map(b => b.text || '').join('');
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
