exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ text: 'GEMINI_API_KEY eksik' }) };
  }

  let prompt;
  try {
    const body = JSON.parse(event.body);
    prompt = body.prompt;
  } catch(e) {
    return { statusCode: 400, headers, body: JSON.stringify({ text: 'Geçersiz istek: ' + e.message }) };
  }

  try {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    
    const data = await response.json();
    console.log('Gemini response status:', response.status);
    console.log('Gemini data:', JSON.stringify(data).slice(0, 200));
    
    if (!response.ok) {
      return { statusCode: 200, headers, body: JSON.stringify({ text: 'Gemini hata: ' + JSON.stringify(data) }) };
    }
    
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Boş yanıt';
    return { statusCode: 200, headers, body: JSON.stringify({ text }) };
  } catch (err) {
    console.log('Error:', err.message);
    return { statusCode: 200, headers, body: JSON.stringify({ text: 'Hata: ' + err.message }) };
  }
};
