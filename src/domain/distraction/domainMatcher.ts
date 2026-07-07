export function isDistractionDomain(
  hostname: string,
  distractionSites: readonly string[],
): boolean {
  const normalizedHost = hostname.toLowerCase();
  return distractionSites.some((site) => {
    const normalizedSite = site.toLowerCase();
    return normalizedHost === normalizedSite || normalizedHost.endsWith(`.${normalizedSite}`);
  });
}
