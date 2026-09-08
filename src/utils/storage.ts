import type { ScanHistoryItem } from '../types/compliance';

const HISTORY_KEY = 'lm_compliance_scanner_history_v1';
const MAX_HISTORY_ITEMS = 20;

function getCurrentSession(): { id: string; role: string } | null {
  try {
    const raw = localStorage.getItem('auth_session');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          id: String(parsed.id || ''),
          role: String(parsed.role || ''),
        };
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export function loadScanHistory(userId?: string | null, role?: string | null): ScanHistoryItem[] {
  try {
    const session = (!userId || !role) ? getCurrentSession() : null;
    const targetUserId = userId || session?.id;
    const targetRole = role || session?.role;

    if (!targetUserId || !targetRole) {
      return [];
    }

    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Isolated: only return scans matching this user's id AND role
    // Records without userId/role are safely excluded
    return parsed.filter(
      (item: ScanHistoryItem) => item.userId === targetUserId && item.role === targetRole
    );
  } catch (err) {
    console.warn('Failed to load scan history from localStorage:', err);
    return [];
  }
}

export function saveScanToHistory(
  item: Omit<ScanHistoryItem, 'id'>,
  userId?: string | null,
  role?: string | null
): ScanHistoryItem[] {
  try {
    const session = (!userId || !role) ? getCurrentSession() : null;
    const targetUserId = userId || session?.id || item.userId || '';
    const targetRole = role || session?.role || item.role || '';

    // Load full raw history
    const raw = localStorage.getItem(HISTORY_KEY);
    const allHistory: ScanHistoryItem[] = raw ? JSON.parse(raw) : [];

    const newItem: ScanHistoryItem = {
      ...item,
      id: `scan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId: targetUserId,
      role: targetRole,
    };

    // Prepend new item to global history (keep up to 100 scans total)
    const updated = [newItem, ...allHistory].slice(0, 100);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));

    // Return only this user's isolated scans
    return updated
      .filter((h) => h.userId === targetUserId && h.role === targetRole)
      .slice(0, MAX_HISTORY_ITEMS);
  } catch (err) {
    console.warn('Failed to save scan to localStorage:', err);
    return loadScanHistory(userId, role);
  }
}

export function clearScanHistory(userId?: string | null, role?: string | null): void {
  try {
    const session = (!userId || !role) ? getCurrentSession() : null;
    const targetUserId = userId || session?.id;
    const targetRole = role || session?.role;

    if (!targetUserId || !targetRole) {
      return;
    }

    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return;
    const allHistory = JSON.parse(raw);
    if (!Array.isArray(allHistory)) return;

    // Clear only this user's scans, keeping all other users' scans intact
    const remaining = allHistory.filter(
      (item: ScanHistoryItem) => !(item.userId === targetUserId && item.role === targetRole)
    );
    localStorage.setItem(HISTORY_KEY, JSON.stringify(remaining));
  } catch (err) {
    console.warn('Failed to clear scan history:', err);
  }
}

/**
 * Creates a lightweight base64 thumbnail from an image file or object URL
 * to avoid exceeding browser localStorage 5MB quota.
 */
export async function createThumbnail(imageUrl: string, maxWidth = 120, maxHeight = 120): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.65));
      } catch {
        resolve(imageUrl);
      }
    };
    img.onerror = () => resolve(imageUrl);
    img.src = imageUrl;
  });
}
