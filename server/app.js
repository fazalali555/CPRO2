import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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

/**
 * Locate the OpenAPI spec next to this module.
 *
 * Deriving the path from `import.meta.url` keeps it correct regardless of the
 * process working directory, unlike the previous `path.resolve('./server/…')`
 * which silently 500'd when the server was started from anywhere but the repo
 * root. Resolution is lazy and defensive: `import.meta.url` is not a `file:` URL
 * in some bundler/test runtimes, and a failure here must degrade to a 500
 * response rather than break the module import.
 *
 * @returns {string|null}
 */
const resolveOpenApiPath = () => {
  try {
    return fileURLToPath(new URL('./openapi.json', import.meta.url));
  } catch {
    return path.resolve(process.cwd(), 'server', 'openapi.json');
  }
};

/** Webhook delivery is best-effort, so it gets a short, hard timeout. */
const WEBHOOK_TIMEOUT_MS = 10000;

/**
 * Fire-and-forget webhook delivery. Failures are swallowed on purpose: the
 * caller already has the result via polling, and a dead webhook must not fail the
 * job. The URL has already passed `isSafeWebhookUrl` during validation.
 */
const postWebhook = async (url, body) => {
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
    });
  } catch {
    return;
  }
};

/**
 * Audit writes must never take the request down with them, so every call site
 * goes through this wrapper and logs locally on failure.
 */
const safeAudit = async (entry) => {
  try {
    await logAudit(entry);
  } catch (err) {
    console.error('[audit] failed to write audit entry:', err?.message || err);
  }
};

/**
 * Build a CORS options object that only echoes origins on the configured allow
 * list. Requests from other origins get no `Access-Control-Allow-Origin` header,
 * so browsers block them.
 */
const buildCorsOptions = () => {
  const allowed = new Set(config.cors.origins);
  return {
    credentials: config.cors.credentials,
    origin(origin, callback) {
      // Non-browser clients (curl, server-to-server) send no Origin header.
      if (!origin || allowed.has(origin)) return callback(null, true);
      return callback(null, false);
    },
  };
};

export const createApp = () => {
  const app = express();

  // Trust the first proxy hop so express-rate-limit keys on the real client IP
  // rather than the load balancer's address.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // Security headers before anything that can respond.
  app.use(helmet());
  app.use(cors(buildCorsOptions()));
  app.use(express.json({ limit: '1mb' }));

  app.use(
    '/api/',
    rateLimit({
      windowMs: config.security.rateLimitWindowMs,
      max: config.security.rateLimitMaxRequests,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

  app.get('/openapi.json', async (_req, res) => {
    const specPath = resolveOpenApiPath();
    if (!specPath) {
      return res.status(500).json({ error: 'OpenAPI spec not available', code: 'SPEC_UNAVAILABLE' });
    }
    try {
      const text = await fs.readFile(specPath, 'utf8');
      res.json(JSON.parse(text));
    } catch {
      res.status(500).json({ error: 'OpenAPI spec not available', code: 'SPEC_UNAVAILABLE' });
    }
  });

  app.post('/api/ai/compose-letter', async (req, res) => {
    try {
      if (!config.geminiApiKey) {
        return res
          .status(503)
          .json({ error: 'AI service not configured', code: 'SERVICE_UNAVAILABLE' });
      }
      const sanitized = sanitizePayload(req.body || {});
      const parsed = composeLetterSchema.safeParse(sanitized);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Invalid request',
          details: parsed.error.flatten(),
          code: 'VALIDATION_ERROR',
        });
      }
      const payload = parsed.data;
      const jobId = payload.async ? createJob(payload) : null;

      await safeAudit({
        action: 'AI_REQUEST',
        payload: { ...payload, ...(jobId ? { jobId } : {}) },
      });

      if (payload.async) {
        // Detached background work. Every path is wrapped so nothing can escape
        // as an unhandled rejection, which would terminate the process on
        // Node >= 15.
        void (async () => {
          try {
            updateJob(jobId, { status: 'processing' });
            const result = await composeWithGemini(payload);
            const done = updateJob(jobId, { status: 'completed', result });
            await safeAudit({
              action: 'AI_COMPLETED',
              payload: { jobId, tokens: result.tokens, ms: result.ms },
            });
            if (payload.webhookUrl) await postWebhook(payload.webhookUrl, done);
          } catch (err) {
            const er = toErrorResponse(err);
            const done = updateJob(jobId, { status: 'failed', error: er });
            await safeAudit({ action: 'AI_FAILED', payload: { jobId, error: er } });
            if (payload.webhookUrl) await postWebhook(payload.webhookUrl, done);
          }
        })();
        return res.status(202).json({ jobId, status: 'queued' });
      }

      const result = await composeWithGemini(payload);
      await safeAudit({ action: 'AI_COMPLETED', payload: { tokens: result.tokens, ms: result.ms } });
      return res.json({ text: result.text, usage: { tokens: result.tokens, ms: result.ms } });
    } catch (err) {
      const er = toErrorResponse(err);
      await safeAudit({ action: 'AI_ERROR', payload: er });
      return res.status(er.status).json(er);
    }
  });

  app.get('/api/ai/jobs/:id', (req, res) => {
    const job = getJob(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found', code: 'NOT_FOUND' });
    res.json(job);
  });

  // Consistent JSON 404 for unknown API routes.
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' }));

  // Malformed JSON bodies surface here instead of as an HTML stack trace.
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err?.type === 'entity.parse.failed' || err instanceof SyntaxError) {
      return res.status(400).json({ error: 'Malformed JSON body', code: 'MALFORMED_JSON' });
    }
    const er = toErrorResponse(err);
    console.error('[server] unhandled error:', err?.message || err);
    return res.status(er.status).json(er);
  });

  return app;
};
