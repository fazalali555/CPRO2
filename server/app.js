import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { composeLetterSchema, sanitizePayload } from './validation.js';
import { composeWithGemini } from './geminiService.js';
import { toErrorResponse } from './errors.js';
import { logAudit } from './auditLogger.js';
import { createJob, updateJob, getJob } from './jobStore.js';

const postWebhook = async (url, body) => {
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch {
    return;
  }
};

export const createApp = () => {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use(helmet());
  app.use(cors({ origin: true }));

  const limiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
  });
  app.use('/api/', limiter);

  app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));
  app.get('/openapi.json', async (_req, res) => {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const p = path.resolve('./server/openapi.json');
      const text = await fs.promises.readFile(p, 'utf8');
      const json = JSON.parse(text);
      res.json(json);
    } catch {
      res.status(500).json({ error: 'OpenAPI spec not available' });
    }
  });

  app.post('/api/ai/compose-letter', async (req, res) => {
    try {
      if (!config.geminiApiKey) {
        return res.status(503).json({ error: 'AI service not configured', code: 'SERVICE_UNAVAILABLE' });
      }
      const sanitized = sanitizePayload(req.body || {});
      const parsed = composeLetterSchema.safeParse(sanitized);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten(), code: 'VALIDATION_ERROR' });
      }
      const payload = parsed.data;
      const jobId = payload.async ? createJob(payload) : null;

      await logAudit({ action: 'AI_REQUEST', payload: { ...payload, ...(jobId ? { jobId } : {}) } });

      if (payload.async) {
        (async () => {
          try {
            updateJob(jobId, { status: 'processing' });
            const result = await composeWithGemini(payload);
            const done = updateJob(jobId, { status: 'completed', result });
            await logAudit({ action: 'AI_COMPLETED', payload: { jobId, tokens: result.tokens, ms: result.ms } });
            if (payload.webhookUrl) {
              await postWebhook(payload.webhookUrl, done);
            }
          } catch (err) {
            const er = toErrorResponse(err);
            const done = updateJob(jobId, { status: 'failed', error: er });
            await logAudit({ action: 'AI_FAILED', payload: { jobId, error: er } });
            if (payload.webhookUrl) {
              await postWebhook(payload.webhookUrl, done);
            }
          }
        })();
        return res.status(202).json({ jobId, status: 'queued' });
      }

      const result = await composeWithGemini(payload);
      await logAudit({ action: 'AI_COMPLETED', payload: { tokens: result.tokens, ms: result.ms } });
      return res.json({ text: result.text, usage: { tokens: result.tokens, ms: result.ms } });
    } catch (err) {
      const er = toErrorResponse(err);
      await logAudit({ action: 'AI_ERROR', payload: er });
      return res.status(er.status).json(er);
    }
  });

  app.get('/api/ai/jobs/:id', (req, res) => {
    const job = getJob(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found', code: 'NOT_FOUND' });
    res.json(job);
  });

  return app;
};
