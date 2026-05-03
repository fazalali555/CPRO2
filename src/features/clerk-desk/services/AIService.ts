// services/AIService.ts - AI Integration Service

import { AIGenerationRequest, AIGenerationResponse } from '../types';

class AIServiceClass {
  private baseUrl: string;
  private healthStatus: 'checking' | 'online' | 'offline' = 'checking';
  private apiKey: string = (import.meta.env as any)?.VITE_GEMINI_API_KEY || 'AIzaSyCIi_33sJbzFBbAhOCHQ2iB7HbXZfoGhUg';

  constructor() {
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';
  }

  async checkHealth(): Promise<'online' | 'offline'> {
    this.healthStatus = 'online';
    return 'online';
  }

  getHealthStatus(): 'checking' | 'online' | 'offline' {
    return this.healthStatus;
  }

  /**
   * Scenario A: Generate full official body from scratch
   */
  async generateLetter(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const promptText = `You are an expert Senior Superintendent in a Pakistani Government Office (KPK) with 35 years of experience in administrative correspondence. 
Your task is to generate a COMPLETE and COMPREHENSIVE body of a highly professional official letter. Do not write half-letters or short snippets. Write a full, detailed document.

### HIERARCHY LOGIC:
- If [Sender] is a higher office (Directorate, DEO, SDEO) writing to a lower office (School, HM, Teacher), use "I am directed to refer to the subject noted above and to state that..."
- If [Sender] is a lower office writing to a higher authority (Director, Secretary, DEO), use "I have the honor to refer to the subject cited above and to state that..."

### RULES FOR TONE AND CONTENT:
1. Tone: Formal, objective, authoritative yet respectful, and strictly professional.
2. Terminology: Use standard Pakistani bureaucratic jargon ("prompt compliance", "for information and necessary action", "with reference to your letter No", "submitted for perusal", "pertaining to", "the undersigned").
3. Completeness: Ensure the letter covers:
   - Clear reference to the subject.
   - Background or reason for the correspondence.
   - Specific details, names, or figures provided.
   - Clear instruction or request for action.
4. Formatting: Numbered paragraphs (2, 3, 4...) for multiple points. The first paragraph is NEVER numbered.
5. NO AI preamble, NO "Certainly", NO markdown headers, NO "Here is your letter". Output ONLY the paragraphs.

### CONTEXT:
- Sender Office: ${request.senderTitle || 'Government Office'}
- Recipient: ${request.recipient}
- Subject: ${request.purpose}
- Key Points to Expand: ${request.keyPoints?.join('. ')}

### REQUIRED OUTPUT STRUCTURE:
Paragraph 1 (Unnumbered): Detailed opening statement referencing the subject and initial background.
Paragraph 2, 3, 4... (Numbered): Detailed body paragraphs expanding on each key point. Do not skip details.
Final Paragraph (Numbered): Formal closing/action required statement (e.g., "The matter may be treated as most urgent please").

Output the FULL COMPLETE body text now:`;

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 1500 }
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const data = await response.json();
      if (!response.ok || data.error) return { text: '', error: data.error?.message || 'API Error', code: 'API_ERROR' };
      return { text: data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '' };
    } catch (error) {
      clearTimeout(timeout);
      return { text: '', error: 'Service unavailable.', code: 'NETWORK_ERROR' };
    }
  }

  /**
   * Scenario B: Refine rough notes into flawless official English
   */
  async refineLetter(request: AIGenerationRequest, currentBody: string): Promise<AIGenerationResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const promptText = `You are a Senior Superintendent in a Pakistani Government Office. Treat the [Rough_Notes] as a base and REWRITE them into a COMPLETE, flawless, and long-form official body. 
Do not provide a summary; provide a full, detailed, professional expansion of these notes.

### EXECUTION LOGIC:
- Restructure, expand, and refine the rough notes into perfect administrative tone.
- Add missing professional transition phrases and formal justifications where appropriate.
- HIERARCHY: Use "I am directed to" for higher-to-lower and "I have the honor to" for lower-to-higher.
- FORMATTING: Para 1 is unnumbered. Para 2, 3, 4... MUST be numbered.
- TERMINOLOGY: Use jargon like "prompt compliance", "it is submitted that", "for information and necessary action", "accorded priority".

### CONTEXT:
- Sender Office: ${request.senderTitle || 'Government Office'}
- Recipient: ${request.recipient}
- Subject: ${request.purpose}

### ROUGH NOTES TO EXPAND & REFINE:
${currentBody}

Output the FULL COMPLETE refined body (Para 1 unnumbered, Paras 2+ numbered):`;

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 1500 }
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await response.json();
      if (!response.ok || data.error) return { text: '', error: data.error?.message || 'API Error', code: 'API_ERROR' };
      return { text: data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '' };
    } catch (error) {
      clearTimeout(timeout);
      return { text: '', error: 'Service unavailable.', code: 'NETWORK_ERROR' };
    }
  }

  /**
   * Legacy wrapper
   */
  async refineText(text: string): Promise<AIGenerationResponse> {
    return this.refineLetter({
      recipient: 'Authority',
      purpose: 'Official Matter',
      senderTitle: 'Government Office',
      keyPoints: [],
      tone: 'official',
      length: { maxWords: 500 },
      language: 'English',
      senderName: ''
    }, text);
  }

  async generateSummary(content: string, maxWords: number = 100): Promise<AIGenerationResponse> {
    return this.generateLetter({
      recipient: 'Summary',
      tone: 'concise',
      purpose: 'Create a brief summary',
      keyPoints: [`Summarize: ${content}`],
      length: { maxWords },
      language: 'English',
      senderName: '',
      senderTitle: '',
    });
  }

  /**
   * Scenario C: Extract structured fields from a raw letter text
   */
  async extractLetterData(text: string): Promise<any> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const promptText = `You are a precision data extractor for Pakistani Government correspondence. 
Extract the following fields from the provided [Letter_Text] and return ONLY a valid JSON object.

### JSON FIELDS:
- institutionName: The name of the office/institution the letter is from (e.g. SDEO (M) Allai).
- to: The recipient's designation and address (one or multiple lines).
- subject: The subject of the letter (short and uppercase if appropriate).
- reference: The letter reference number/index.
- letterDate: The date of the letter (convert to YYYY-MM-DD if possible).
- body: The main content of the letter (clean text, no HTML).
- signatureName: The name of the person signing the letter.
- signatureTitle: The designation/title of the person signing.
- forwardedTo: An array of strings for "Copy forwarded to" entries.
- enclosures: An array of strings for "Enclosures" entries.

### RULES:
1. If a field is not found, use an empty string "" (or empty array []).
2. DO NOT include any AI preamble or Markdown formatting. 
3. Return ONLY the raw JSON object.

[Letter_Text]:
${text}

### OUTPUT (JSON ONLY):`;

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 2000, responseMimeType: "application/json" }
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await response.json();
      if (!response.ok || data.error) return { error: data.error?.message || 'API Error' };
      
      const jsonStr = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';
      try {
        return JSON.parse(jsonStr);
      } catch (e) {
        // Fallback for non-json-mode models or poor formatting
        const match = jsonStr.match(/\{[\s\S]*\}/);
        return match ? JSON.parse(match[0]) : { error: 'Failed to parse AI response' };
      }
    } catch (error) {
      clearTimeout(timeout);
      return { error: 'Service unavailable.' };
    }
  }

  buildLetterRequest(options: {
    prompt: string;
    recipient: string;
    subject: string;
    salutation: string;
    senderName: string;
    senderTitle: string;
    fromOffice?: string;
    letterhead?: string;
    forwardedTo?: string[];
    tone?: string;
    maxWords?: number;
  }): AIGenerationRequest {
    return {
      recipient: options.recipient || 'Recipient',
      tone: options.tone || '100% official administrative',
      purpose: options.subject || 'Official Matter',
      keyPoints: [options.prompt],
      length: { maxWords: options.maxWords || 500 },
      language: 'English',
      senderName: options.senderName,
      senderTitle: options.senderTitle,
      fromOffice: options.fromOffice,
      letterhead: options.letterhead,
      forwardedTo: options.forwardedTo,
    };
  }
}

export const AIService = new AIServiceClass();
