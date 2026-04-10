import { v4 as uuidv4 } from 'uuid';

const jobs = new Map();

export const createJob = (payload) => {
  const id = uuidv4();
  jobs.set(id, { id, status: 'queued', payload, createdAt: new Date().toISOString() });
  return id;
};

export const updateJob = (id, patch) => {
  const existing = jobs.get(id);
  if (!existing) return null;
  const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  jobs.set(id, updated);
  return updated;
};

export const getJob = (id) => jobs.get(id);
