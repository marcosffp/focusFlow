import { createChromeStorageRepository, type Repository } from "@services/storage/repository";
import type { DistractionSite } from "@domain/types";

const STORAGE_KEY = "distractionSites";

export const DEFAULT_DISTRACTION_DOMAINS = [
  "youtube.com",
  "instagram.com",
  "reddit.com",
  "x.com",
  "twitter.com",
  "facebook.com",
  "discord.com",
  "tiktok.com",
  "netflix.com",
  "twitch.tv",
] as const;

const DEFAULT_DISTRACTION_SITES: readonly DistractionSite[] = DEFAULT_DISTRACTION_DOMAINS.map(
  (domain) => ({ domain, isActive: true }),
);

export const distractionSiteRepository: Repository<readonly DistractionSite[]> =
  createChromeStorageRepository({
    storageKey: STORAGE_KEY,
    defaultValue: DEFAULT_DISTRACTION_SITES,
  });
