/**
 * Webhook delivery with SSRF protection.
 *
 * `POST /api/ai/compose-letter` accepts a caller-supplied `webhookUrl` that the
 * server later fetches. Letting an unvalidated URL through turns the server into
 * an open proxy: an attacker can reach cloud metadata endpoints
 * (169.254.169.254), loopback services, or hosts on the internal network that are
 * not otherwise reachable. `isSafeWebhookUrl` is the single choke point that
 * decides what we are willing to call.
 */

/** Schemes we will deliver to. `http:` is allowed only for loopback in tests. */
const ALLOWED_PROTOCOLS = new Set(['https:']);

/** Hostnames that always resolve to the machine or the local network. */
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata',
]);

/**
 * Parse a dotted-quad into a 32-bit number, or null when the input is not IPv4.
 * @param {string} host
 * @returns {number|null}
 */
const ipv4ToInt = (host) => {
  const parts = host.split('.');
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet > 255) return null;
    value = value * 256 + octet;
  }
  return value;
};

/**
 * True when the IPv4 address is in a range that must never be fetched.
 * @param {string} host dotted-quad
 * @returns {boolean}
 */
const isBlockedIpv4 = (host) => {
  const ip = ipv4ToInt(host);
  if (ip === null) return false;
  const inRange = (cidr, bits) => (ip >>> (32 - bits)) === (cidr >>> (32 - bits));
  return (
    inRange(0x00000000, 8) || // 0.0.0.0/8     "this" network
    inRange(0x0a000000, 8) || // 10.0.0.0/8    private
    inRange(0x7f000000, 8) || // 127.0.0.0/8   loopback
    inRange(0xa9fe0000, 16) || // 169.254.0.0/16 link-local + cloud metadata
    inRange(0xac100000, 12) || // 172.16.0.0/12 private
    inRange(0xc0a80000, 16) || // 192.168.0.0/16 private
    inRange(0xc0000200, 24) || // 192.0.2.0/24  TEST-NET-1
    inRange(0xe0000000, 4) // 224.0.0.0/4   multicast
  );
};

/**
 * True when the IPv6 literal is loopback, unspecified, link-local or unique local.
 *
 * Note that `new URL()` normalises the IPv4-mapped form, so `::ffff:127.0.0.1`
 * arrives here as `::ffff:7f00:1`. Both spellings are handled.
 *
 * @param {string} host raw host, brackets already stripped
 * @returns {boolean}
 */
const isBlockedIpv6 = (host) => {
  const normalized = host.toLowerCase();
  if (normalized === '::' || normalized === '::1') return true;
  if (normalized.startsWith('fe80')) return true; // link-local
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true; // ULA
  if (normalized.startsWith('ff')) return true; // multicast

  // IPv4-mapped IPv6 (::ffff:a.b.c.d, normalised to ::ffff:XXXX:YYYY).
  if (normalized.startsWith('::ffff:')) {
    const tail = normalized.slice('::ffff:'.length);
    const dotted = tail.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
    if (dotted) return isBlockedIpv4(dotted[1]);

    const hex = tail.match(/^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if (hex) {
      const ip = (parseInt(hex[1], 16) << 16) | parseInt(hex[2], 16);
      return isBlockedIpv4(
        `${(ip >>> 24) & 255}.${(ip >>> 16) & 255}.${(ip >>> 8) & 255}.${ip & 255}`
      );
    }
  }
  return false;
};

/**
 * Validate a caller-supplied webhook target.
 *
 * @param {string} rawUrl
 * @returns {{ ok: true, url: string } | { ok: false, reason: string }}
 */
export const isSafeWebhookUrl = (rawUrl) => {
  if (typeof rawUrl !== 'string' || rawUrl.trim() === '') {
    return { ok: false, reason: 'MISSING_URL' };
  }

  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { ok: false, reason: 'MALFORMED_URL' };
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return { ok: false, reason: 'DISALLOWED_PROTOCOL' };
  }

  // Reject embedded credentials (https://user:pass@host) — they leak into logs
  // and are a classic phishing/credential-capture vector.
  if (parsed.username || parsed.password) {
    return { ok: false, reason: 'CREDENTIALS_IN_URL' };
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (!hostname) return { ok: false, reason: 'MISSING_HOST' };

  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.localhost')) {
    return { ok: false, reason: 'LOOPBACK_HOST' };
  }

  // Block IP literals that point at private/link-local ranges. A DNS *name* that
  // resolves to such an address is a rebinding risk we cannot rule out here, so
  // callers that need that flexibility must allow-list hosts explicitly.
  if (hostname.includes(':')) {
    if (isBlockedIpv6(hostname)) return { ok: false, reason: 'BLOCKED_ADDRESS' };
  } else if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    if (isBlockedIpv4(hostname)) return { ok: false, reason: 'BLOCKED_ADDRESS' };
  }

  return { ok: true, url: parsed.toString() };
};
