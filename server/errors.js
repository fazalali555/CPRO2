export const toErrorResponse = (err) => {
  const message = err?.message || 'Unexpected error';
  const status = err?.status || 500;

  if (err?.code === 'QUOTA_EXCEEDED' || message.toLowerCase().includes('quota')) {
    return { status: 429, error: 'Quota exceeded', code: 'QUOTA_EXCEEDED' };
  }

  if (message.toLowerCase().includes('safety') || message.toLowerCase().includes('policy') || err?.code === 'CONTENT_BLOCKED') {
    return { status: 400, error: 'Content blocked by safety policy', code: 'CONTENT_BLOCKED' };
  }

  if (message.toLowerCase().includes('network') || message.toLowerCase().includes('fetch') || err?.code === 'NETWORK_ERROR') {
    return { status: 502, error: 'Network error while contacting AI service', code: 'NETWORK_ERROR' };
  }

  return { status, error: message, code: err?.code || 'SERVER_ERROR' };
};
