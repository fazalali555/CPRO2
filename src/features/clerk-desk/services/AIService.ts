// services/AIService.ts - AI Integration Service

import { AIGenerationRequest, AIGenerationResponse } from '../types';

class AIServiceClass {
  private baseUrl: string;
  private healthStatus: 'checking' | 'online' | 'offline' = 'checking';
  private lastHealthCheck: number = 0;
  private readonly HEALTH_CHECK_INTERVAL = 60000; // 1 minute

  constructor() {
    this.baseUrl = this.getBaseUrl();
  }

  private getBaseUrl(): string {
    const envUrl = (import.meta.env?.VITE_AI_BASE_URL || '').trim();
    if (envUrl) return envUrl;
    
    if (typeof window !== 'undefined') {
      return `${window.location.protocol}//${window.location.hostname}:8787`;
    }
    
    return 'http://localhost:8787';
  }

  /**
   * Check AI service health
   */
  async checkHealth(): Promise<'online' | 'offline'> {
    const now = Date.now();
    
    // Use cached result if recent
    if (now - this.lastHealthCheck < this.HEALTH_CHECK_INTERVAL && this.healthStatus !== 'checking') {
      return this.healthStatus as 'online' | 'offline';
    }

    this.healthStatus = 'checking';
    this.lastHealthCheck = now;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}/health`, {
        signal: controller.signal,
      });

      clearTimeout(timeout);
      this.healthStatus = response.ok ? 'online' : 'offline';
    } catch {
      this.healthStatus = 'offline';
    }

    return this.healthStatus as 'online' | 'offline';
  }

  /**
   * Get current health status
   */
  getHealthStatus(): 'checking' | 'online' | 'offline' {
    return this.healthStatus;
  }

  /**
   * Generate letter content using AI
   */
  async generateLetter(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`${this.baseUrl}/api/ai/compose-letter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const data = await response.json();

      if (!response.ok) {
        return {
          text: '',
          error: this.getErrorMessage(data),
          code: data.code,
        };
      }

      return {
        text: data.text || '',
        suggestions: data.suggestions,
      };
    } catch (error) {
      clearTimeout(timeout);
      
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          text: '',
          error: 'Request timed out. Please try again.',
          code: 'TIMEOUT',
        };
      }

      return {
        text: '',
        error: 'AI service is unavailable. Please check your connection.',
        code: 'NETWORK_ERROR',
      };
    }
  }

  /**
   * Generate summary or notes
   */
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
   * Suggest improvements for text
   */
  async suggestImprovements(text: string): Promise<AIGenerationResponse> {
    return this.generateLetter({
      recipient: 'Improvement',
      tone: 'analytical',
      purpose: 'Suggest improvements',
      keyPoints: [
        `Review and suggest improvements for: ${text}`,
        'Focus on clarity, tone, and professionalism',
      ],
      length: { maxWords: 200 },
      language: 'English',
      senderName: '',
      senderTitle: '',
    });
  }

  /**
   * Get error message from response
   */
  private getErrorMessage(data: any): string {
    switch (data?.code) {
      case 'NETWORK_ERROR':
        return 'AI network error. Check GEMINI_API_KEY and internet access.';
      case 'UNAUTHORIZED':
        return 'AI key rejected. Update GEMINI_API_KEY in .env.local.';
      case 'SERVICE_UNAVAILABLE':
        return 'AI service not configured. Add GEMINI_API_KEY to .env.local.';
      case 'RATE_LIMITED':
        return 'Too many requests. Please wait a moment and try again.';
      default:
        return data?.error || 'AI generation failed. Please try again.';
    }
  }

  /**
   * Build AI request from letter context
   */
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
    const keyPoints = options.prompt
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length >= 2);

    const safePoints = keyPoints.length > 0
      ? keyPoints
      : ['Draft a formal letter based on the provided context.'];

    return {
      recipient: options.recipient || 'Recipient',
      tone: options.tone || 'formal, professional, humanized',
      purpose: options.subject || 'Official correspondence',
      keyPoints: [...safePoints, `Use salutation: Respected ${options.salutation}.`],
      length: { maxWords: options.maxWords || 350 },
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