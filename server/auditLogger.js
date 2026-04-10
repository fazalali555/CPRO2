import fs from 'fs';
import path from 'path';
import { config } from './config.js';

const ensureDir = (filePath) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

export const logAudit = async (entry) => {
  const record = JSON.stringify({ ...entry, at: new Date().toISOString() }) + '\n';
  ensureDir(config.auditLogPath);
  await fs.promises.appendFile(config.auditLogPath, record, 'utf8');
};
