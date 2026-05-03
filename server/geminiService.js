import { config } from './config.js';

const delay = (ms) => new Promise(res => setTimeout(res, ms));

const buildPrompt = ({ recipient, tone, purpose, keyPoints, length, language, senderName, senderTitle, referenceNo, fromOffice, letterhead, forwardedTo }) => {
  const constraints = [];
  if (length?.minWords) constraints.push(`Minimum ${length.minWords} words`);
  if (length?.maxWords) constraints.push(`Maximum ${length.maxWords} words`);
  if (length?.maxChars) constraints.push(`Maximum ${length.maxChars} characters`);
  const points = (keyPoints || []).map((p, i) => `${i + 1}. ${p}`).join('\n');
  const forwardList = (forwardedTo || []).map((p, i) => `${i + 1}. ${p}`).join('\n');
  return [
    `CRITICAL INSTRUCTION: You are writing a highly professional ${language || 'English'} document for a government clerk office.`,
    `TONE: 100% natural, strict official government language.`,
    `PROHIBITED: Do not use any generic AI phrasing, robotic transitions, or typical LLM fluff (e.g. "I hope this finds you well", "Furthermore", "In conclusion").`,
    `Write directly, concisely, and exactly as a human civil servant would.`,
    letterhead ? `Letterhead:\n${letterhead}` : '',
    fromOffice ? `From Office: ${fromOffice}` : '',
    `Recipient: ${recipient}`,
    `Purpose: ${purpose}`,
    `Key Points / Input Text:\n${points}`,
    referenceNo ? `Reference: ${referenceNo}` : '',
    constraints.length ? `Constraints: ${constraints.join('; ')}` : '',
    forwardList ? `Forwarded To:\n${forwardList}` : '',
    `Include a standard formal closing and sender block: ${senderName || 'Clerk'}, ${senderTitle || 'Education Office'}.`,
    `Output only the pure plain text document, formatted with paragraphs and proper salutations.`
  ].filter(Boolean).join('\n');
};

export const composeWithGemini = async (payload, attempt = 1) => {
  const prompt = buildPrompt(payload);
  const url = `${config.geminiBaseUrl}/models/${config.geminiModel}:generateContent?key=${encodeURIComponent(config.geminiApiKey)}`;
  
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    safetySettings: config.geminiSafetySettings
  };

  const startedAt = Date.now();
  let tokens = 0;

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      timeout: 30000
    });

    if (!resp.ok) {
      const text = await resp.text();
      if (resp.status === 429) {
        const err = new Error('Quota exceeded');
        err.code = 'QUOTA_EXCEEDED';
        throw err;
      }
      if (resp.status === 400 && text.includes('safety')) {
        const err = new Error('Content blocked by safety policy');
        err.code = 'CONTENT_BLOCKED';
        throw err;
      }
      if (resp.status === 401 || resp.status === 403) {
        const err = new Error('Invalid or missing API key');
        err.code = 'UNAUTHORIZED';
        throw err;
      }
      const err = new Error(`Network error ${resp.status}`);
      err.code = 'NETWORK_ERROR';
      throw err;
    }

    const json = await resp.json();
    const candidate = json?.candidates?.[0];
    const text = candidate?.content?.parts?.map(p => p.text).join('\n') || '';
    tokens = json?.usageMetadata?.totalTokenCount || 0;

    return { text, tokens, ms: Date.now() - startedAt };
  } catch (err) {
    console.error('Exact Gemini Fetch Error:', err);
    if (attempt < 3 && (err.code === 'NETWORK_ERROR' || err.code === 'QUOTA_EXCEEDED')) {
      await delay(500 * attempt);
      return composeWithGemini(payload, attempt + 1);
    }
    throw err;
  }
};
