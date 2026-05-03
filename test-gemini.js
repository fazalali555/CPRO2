const fetch = globalThis.fetch || (await import('node-fetch')).default;

async function testGemini() {
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=AIzaSyCIi_33sJbzFBbAhOCHQ2iB7HbXZfoGhUg";
  const body = {
    contents: [{ parts: [{ text: "Hello" }] }]
  };

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    console.log('Status:', resp.status);
    const json = await resp.json();
    console.log('Response:', JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

testGemini();
