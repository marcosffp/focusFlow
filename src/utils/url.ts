const NON_TRACKABLE_PROTOCOLS = new Set([
  "chrome:",
  "chrome-extension:",
  "about:",
  "edge:",
  "file:",
]);

export function extractHostname(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (NON_TRACKABLE_PROTOCOLS.has(parsed.protocol)) {
      return null;
    }
    return parsed.hostname.toLowerCase();
  } catch {
    return null;
  }
}
