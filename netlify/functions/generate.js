const nodemailer = require('nodemailer');
exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const body = JSON.parse(event.body);
    // EMAIL sending via Gmail
    if (body.type === 'email') {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'eriorcenter@gmail.com',
          pass: process.env.GMAIL_APP_PASSWORD
        }
      });
      await transporter.sendMail({
        from: 'ERIORCENTER <eriorcenter@gmail.com>',
        to: body.to,
        subject: body.subject,
        html: body.html
      });
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true })
      };
    }
    // SCRIPT generation via Anthropic
    const { system, prompt } = body;

    // Smart max_tokens detection:
    // EMERGENCY needs ~4500+ tokens for 4 scripts. Detect by markers.
    let maxTokens = 3000;
    const sysStr = (system || '').toString();
    const promptStr = (prompt || '').toString();
    const isMultiBlock =
      sysStr.includes('EMERGENCY') ||
      sysStr.includes('===SCRIPT2===') ||
      sysStr.includes('===MINISCRIPT===') ||
      promptStr.includes('===SCRIPT2===') ||
      promptStr.includes('===MINISCRIPT===');
    if (isMultiBlock) {
      maxTokens = 8000;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model:'claude-haiku-4-5',
        max_tokens: maxTokens,
        system: system,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await response.json();
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
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
