import { promises as dns } from "dns";
import { isIP } from "net";

// Blocks the classic SSRF targets: cloud metadata endpoints, loopback,
// private/link-local ranges, and anything else that shouldn't be reachable
// from a server-side "fetch this URL" feature.

function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}

function inV4Range(ip: string, base: string, bits: number): boolean {
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(base) & mask);
}

const BLOCKED_V4_RANGES: [string, number][] = [
  ["0.0.0.0", 8], // "this" network
  ["10.0.0.0", 8], // private
  ["100.64.0.0", 10], // CGNAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local (includes cloud metadata: 169.254.169.254)
  ["172.16.0.0", 12], // private
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.0.2.0", 24], // TEST-NET-1
  ["192.168.0.0", 16], // private
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24], // TEST-NET-2
  ["203.0.113.0", 24], // TEST-NET-3
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved
];

function isBlockedV4(ip: string): boolean {
  return BLOCKED_V4_RANGES.some(([base, bits]) => inV4Range(ip, base, bits));
}

function isBlockedV6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === "::1" || normalized === "::") return true;
  // IPv4-mapped IPv6 (::ffff:a.b.c.d) — recheck the embedded v4 address.
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isBlockedV4(mapped[1]);
  // Unique local (fc00::/7) and link-local (fe80::/10).
  if (/^f[cd][0-9a-f]{2}:/.test(normalized)) return true;
  if (/^fe[89ab][0-9a-f]:/.test(normalized)) return true;
  return false;
}

export function isBlockedIp(ip: string): boolean {
  const family = isIP(ip);
  if (family === 4) return isBlockedV4(ip);
  if (family === 6) return isBlockedV6(ip);
  return true; // not a parseable IP — fail closed
}

export class UnsafeUrlError extends Error {}

/**
 * Validates a URL is safe to fetch server-side: http(s) only, and its
 * hostname must not resolve to a private/loopback/link-local address.
 * Throws UnsafeUrlError if not. Does not protect against DNS rebinding
 * between this check and the actual request — callers that make a real
 * network request (e.g. a browser navigation) should re-validate each
 * resolved connection, not just the initial URL.
 */
export async function assertSafeUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new UnsafeUrlError("Invalid URL format");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeUrlError("Only http and https URLs are allowed");
  }

  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname === "0") {
    throw new UnsafeUrlError("URL host is not allowed");
  }

  // If the hostname is already a literal IP, check it directly.
  if (isIP(hostname)) {
    if (isBlockedIp(hostname)) throw new UnsafeUrlError("URL resolves to a blocked address");
    return url;
  }

  let addresses;
  try {
    addresses = await dns.lookup(hostname, { all: true });
  } catch {
    throw new UnsafeUrlError("Could not resolve host");
  }
  if (addresses.length === 0 || addresses.some((a) => isBlockedIp(a.address))) {
    throw new UnsafeUrlError("URL resolves to a blocked address");
  }

  return url;
}
