import { config } from './config.js';

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const MAX_ATTEMPTS = 3;

const buildPrompt = ({
  recipient,
  purpose,
  keyPoints,
  length,
  language,
  senderName,
  senderTitle,
  referenceNo,
  fromOffice,
  letterhead,
  forwardedTo,
}) => {
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
    `Output only the pure plain text document, formatted with paragraphs and proper salutations.`,
  ]
    .filter(Boolean)
    .join('\n');
};

/**
 * Tag an Error with a stable machine-readable code so `toErrorResponse` can map
 * it to an HTTP status without string matching at the edge.
 */
const taggedError = (message, code) => Object.assign(new Error(message), { code });

export const composeWithGemini = async (payload, attempt = 1) => {
  const prompt = buildPrompt(payload);
  const url = `${config.geminiBaseUrl}/models/${config.geminiModel}:generateContent`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    safetySettings: config.geminiSafetySettings,
  };

  const startedAt = Date.now();

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Sent as a header rather than a `?key=` query parameter: query strings
        // end up in proxy, CDN and access logs in cleartext.
        'x-goog-api-key': config.geminiApiKey,
      },
      body: JSON.stringify(body),
      // `fetch` has no `timeout` option — an AbortSignal is the only thing that
      // actually bounds this request.
      signal: AbortSignal.timeout(config.geminiTimeoutMs),
    });

    if (!resp.ok) {
      const text = await resp.text();
      if (resp.status === 429) throw taggedError('Quota exceeded', 'QUOTA_EXCEEDED');
      if (resp.status === 400 && text.includes('safety')) {
        throw taggedError('Content blocked by safety policy', 'CONTENT_BLOCKED');
      }
      if (resp.status === 401 || resp.status === 403) {
        throw taggedError('Invalid or missing API key', 'UNAUTHORIZED');
      }
      throw taggedError(`Network error ${resp.status}`, 'NETWORK_ERROR');
    }

    const json = await resp.json();
    const candidate = json?.candidates?.[0];
    const text = candidate?.content?.parts?.map((p) => p.text).join('\n') || '';
    const tokens = json?.usageMetadata?.totalTokenCount || 0;

    return { text, tokens, ms: Date.now() - startedAt };
  } catch (err) {
    const retryable = err?.code === 'NETWORK_ERROR' || err?.code === 'QUOTA_EXCEEDED';
    // Never log the message for auth failures — upstream bodies can echo request
    // material back, and the API key must not reach the log sink.
    if (err?.code !== 'UNAUTHORIZED') {
      console.error(`[gemini] attempt ${attempt}/${MAX_ATTEMPTS} failed:`, err?.code || err?.message);
    }
    if (attempt < MAX_ATTEMPTS && retryable) {
      await delay(500 * attempt);
      return composeWithGemini(payload, attempt + 1);
    }
    throw err;
  }
};
