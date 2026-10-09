import { supabase } from './supabase';

// In-memory cache for resolved banner URLs
const bannerCache = new Map<string, string>();

/**
 * Checks if an image URL loads successfully.
 */
export function checkImageExists(url: string, timeoutMs: number = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    let finished = false;
    const timer = setTimeout(() => {
      if (!finished) {
        finished = true;
        resolve(false);
      }
    }, timeoutMs);

    img.onload = () => {
      if (!finished) {
        finished = true;
        clearTimeout(timer);
        resolve(true);
      }
    };

    img.onerror = () => {
      if (!finished) {
        finished = true;
        clearTimeout(timer);
        resolve(false);
      }
    };

    img.src = url;
  });
}

/**
 * Resolves the banner URL for a user:
 * 1. Returns currentBannerUrl if already provided and valid.
 * 2. Checks in-memory cache.
 * 3. Probes the public storage bucket for uploaded banners (e.g. animated GIF, PNG, JPG).
 */
export async function resolveBannerUrl(userId: string, currentBannerUrl?: string | null): Promise<string | null> {
  if (currentBannerUrl && currentBannerUrl.trim()) {
    bannerCache.set(userId, currentBannerUrl);
    return currentBannerUrl;
  }
  if (!userId) return null;

  if (bannerCache.has(userId)) {
    const cached = bannerCache.get(userId);
    return cached && cached.length > 0 ? cached : null;
  }

  // Extensions to check in order (GIF first for animated banners)
  const extensions = ['gif', 'png', 'jpg', 'jpeg', 'webp'];
  for (const ext of extensions) {
    const path = `banners/${userId}.${ext}`;
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    if (data?.publicUrl) {
      // Add timestamp to bust browser cache
      const testUrl = `${data.publicUrl}?v=${Date.now()}`;
      const exists = await checkImageExists(testUrl);
      if (exists) {
        bannerCache.set(userId, testUrl);
        return testUrl;
      }
    }
  }

  bannerCache.set(userId, '');
  return null;
}

/**
 * Manually update the banner cache for a user (e.g. after fresh upload).
 */
export function setCachedBannerUrl(userId: string, url: string) {
  bannerCache.set(userId, url);
}
