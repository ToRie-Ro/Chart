import { useState, useEffect } from 'react';
import { UserProfile } from './types';

// Threshold in seconds to consider a user still active even if network was slow
const ONLINE_THRESHOLD_SECONDS = 120; // 2 minutes

/**
 * Determines whether a user is currently online based on status and last_seen timestamp
 */
export function isUserOnline(profile?: Partial<UserProfile> | null): boolean {
  if (!profile) return false;
  if (profile.status === 'offline') return false;
  if (profile.status !== 'online') return false;

  // If last_seen is available, verify it was within the threshold
  if (profile.last_seen) {
    const lastSeenTime = new Date(profile.last_seen).getTime();
    if (!isNaN(lastSeenTime)) {
      const diffSeconds = (Date.now() - lastSeenTime) / 1000;
      // If last_seen is more than 2 minutes ago, treat as offline
      if (diffSeconds > ONLINE_THRESHOLD_SECONDS) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Formats user status into a friendly readable string:
 * - "🟢 Online"
 * - "Offline just now"
 * - "Offline 5 mins ago"
 * - "Offline 2 hours ago"
 * - "Offline 3 days ago"
 */
export function formatUserStatus(
  profile?: Partial<UserProfile> | null,
  options: { short?: boolean; withDot?: boolean } = {}
): string {
  if (!profile) return 'Offline';

  const online = isUserOnline(profile);
  const { short = false, withDot = true } = options;

  if (online) {
    if (short) return 'Online';
    return withDot ? '🟢 Online' : 'Online';
  }

  if (!profile.last_seen) {
    return 'Offline';
  }

  const lastSeenTime = new Date(profile.last_seen).getTime();
  if (isNaN(lastSeenTime)) {
    return 'Offline';
  }

  const diffMs = Math.max(0, Date.now() - lastSeenTime);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (short) {
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    return `${diffDay}d ago`;
  }

  if (diffMin < 1) {
    return 'Offline just now';
  }

  if (diffMin < 60) {
    return diffMin === 1 ? 'Offline 1 min ago' : `Offline ${diffMin} mins ago`;
  }

  if (diffHour < 24) {
    return diffHour === 1 ? 'Offline 1 hour ago' : `Offline ${diffHour} hours ago`;
  }

  return diffDay === 1 ? 'Offline 1 day ago' : `Offline ${diffDay} days ago`;
}

/**
 * React hook that returns live online status and formatted text,
 * re-evaluating every 30 seconds so time descriptions tick upwards live.
 */
export function useLiveStatus(
  profile?: Partial<UserProfile> | null,
  options?: { short?: boolean; withDot?: boolean }
) {
  const [, setTick] = useState(0);

  useEffect(() => {
    // Tick every 30 seconds to update relative time ("5 mins ago" -> "6 mins ago")
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const online = isUserOnline(profile);
  const text = formatUserStatus(profile, options);

  return { isOnline: online, statusText: text };
}
