import { z } from 'zod';

const lengthSchema = z.object({
  minWords: z.number().int().positive().optional(),
  maxWords: z.number().int().positive().optional(),
  maxChars: z.number().int().positive().optional()
}).optional();

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
  webhookUrl: z.string().url().optional()
});

export const sanitizePayload = (payload) => {
  const clean = { ...payload };
  const cleanString = (v) => typeof v === 'string' ? v.replace(/[\u0000-\u001F\u007F]/g, '').trim() : v;
  Object.keys(clean).forEach((k) => {
    if (Array.isArray(clean[k])) {
      clean[k] = clean[k].map(cleanString);
    } else if (typeof clean[k] === 'object' && clean[k] !== null) {
      Object.keys(clean[k]).forEach((inner) => {
        clean[k][inner] = cleanString(clean[k][inner]);
      });
    } else {
      clean[k] = cleanString(clean[k]);
    }
  });
  return clean;
};
