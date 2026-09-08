import { z } from 'zod';
import { isSafeWebhookUrl } from './webhook.js';

const lengthSchema = z
  .object({
    minWords: z.number().int().positive().optional(),
    maxWords: z.number().int().positive().optional(),
    maxChars: z.number().int().positive().optional(),
  })
  .optional();

/**
 * `webhookUrl` is fetched server-side, so a bare `.url()` check is not enough —
 * it happily accepts `http://169.254.169.254/`. Route it through the SSRF guard
 * so the rejection happens at the edge with a clear reason.
 */
const safeWebhookUrl = z
  .string()
  .url()
  .refine((value) => isSafeWebhookUrl(value).ok, {
    message: 'webhookUrl must be a public https:// URL',
  });

export const composeLetterSchema = z.object({
  recipient: z.string().min(2).max(200),
  tone: z.string().min(2).max(120),
  purpose: z.string().min(5).max(400),
  keyPoints: z.array(z.string().min(2).max(300)).min(1).max(12),
  length: lengthSchema,
  language: z.string().min(2).max(40).optional(),
  senderName: z.string().min(2).max(120).optional(),
  senderTitle: z.string().min(2).max(120).optional(),
  fromOffice: z.string().min(2).max(200).optional(),
  letterhead: z.string().min(2).max(600).optional(),
  forwardedTo: z.array(z.string().min(2).max(200)).max(12).optional(),
  referenceNo: z.string().min(2).max(80).optional(),
  async: z.boolean().optional(),
  webhookUrl: safeWebhookUrl.optional(),
});

/** Strip C0 control characters and DEL, then trim. */
const cleanString = (value) =>
  typeof value === 'string' ? value.replace(/[\u0000-\u001F\u007F]/g, '').trim() : value;

/**
 * Recursively strip control characters from a payload.
 *
 * Returns a fresh object graph — the previous implementation mutated nested
 * objects of the caller's request body in place, which is surprising for any
 * middleware that inspects `req.body` afterwards.
 *
 * @param {unknown} payload
 * @returns {Record<string, unknown>}
 */
export const sanitizePayload = (payload) => {
  if (payload === null || typeof payload !== 'object') return {};

  const walk = (value) => {
    if (Array.isArray(value)) return value.map(walk);
    if (value !== null && typeof value === 'object') {
      const out = {};
      for (const [key, inner] of Object.entries(value)) out[key] = walk(inner);
      return out;
    }
    return cleanString(value);
  };

  return walk(payload);
};
