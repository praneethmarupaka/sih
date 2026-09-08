import type { ScanHistoryItem } from '../types/compliance';

const HISTORY_KEY = 'lm_compliance_scanner_history_v1';
const MAX_HISTORY_ITEMS = 20;

export function loadScanHistory(): ScanHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to load scan history from localStorage:', err);
    return [];
  }
}

export function saveScanToHistory(item: Omit<ScanHistoryItem, 'id'>): ScanHistoryItem[] {
  try {
    const history = loadScanHistory();
    const newItem: ScanHistoryItem = {
      ...item,
      id: `scan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    };

    // Prepend most recent first
    const updated = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Failed to save scan to localStorage:', err);
    return loadScanHistory();
  }
}

export function clearScanHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
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
