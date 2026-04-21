exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const { system, prompt } = JSON.parse(event.body);
    
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'ERROR: No API key found in environment' })
      };
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 3000,
        system: system,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const raw = await response.text();
    
    let data;
    try {
      data = JSON.parse(raw);
    } catch(e) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'ERROR parsing response: ' + raw.substring(0, 200) })
      };
    }

    if (data.error) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'API ERROR: ' + JSON.stringify(data.error) })
      };
    }

    const text = (data.content || []).map(b => b.text || '').join('');
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text })
    };

  } catch (err) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'CATCH ERROR: ' + err.message })
    };
  }
};
