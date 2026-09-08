import { createWorker } from 'tesseract.js';
import type { OCRWord } from '../types/compliance';

/**
 * Fallback verification pass on top of existing OCR:
 * When an MRP is detected, identifies its approximate OCR bounding box/region,
 * expands vertically/horizontally, crops the MRP declaration area onto a canvas,
 * upscales the image, applies contrast/grayscale enhancement, and runs a second-pass
 * OCR scoped specifically to this region.
 */
export async function performMrpRegionFallback(
  imageSrc: string,
  words: OCRWord[],
  existingWorker?: any
): Promise<{ fallbackText: string; fallbackConfidence: number } | null> {
  if (typeof window === 'undefined' || !imageSrc || words.length === 0) {
    return null;
  }

  try {
    // 1. Find words associated with MRP to locate declaration region
    const mrpKeywords = ['mrp', 'rs', 'inr', 'max', 'maximum', 'retail', 'price', '₹'];
    const matchingWords = words.filter((w) => {
      const t = w.text.toLowerCase().replace(/[^a-z0-9₹]/g, '');
      return mrpKeywords.some((kw) => t.includes(kw) || kw.includes(t)) || /^\d+/.test(t);
    });

    if (matchingWords.length === 0) return null;

    const minX = Math.min(...matchingWords.map((w) => w.bbox.x0));
    const maxX = Math.max(...matchingWords.map((w) => w.bbox.x1));
    const minY = Math.min(...matchingWords.map((w) => w.bbox.y0));
    const maxY = Math.max(...matchingWords.map((w) => w.bbox.y1));

    // 2. Load image into HTMLImageElement
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = imageSrc;
    });

    const imgWidth = img.naturalWidth || img.width;
    const imgHeight = img.naturalHeight || img.height;

    // 3. Expand region: tax declaration is almost always adjacent or underneath MRP
    const boxHeight = maxY - minY;
    const padTop = Math.round(Math.max(25, boxHeight * 0.8));
    const padBottom = Math.round(Math.max(45, boxHeight * 2.5));
    const padLeft = Math.round(Math.max(40, (maxX - minX) * 0.5));
    const padRight = Math.round(Math.max(140, (maxX - minX) * 2.5));

    const cropX = Math.max(0, minX - padLeft);
    const cropY = Math.max(0, minY - padTop);
    const cropW = Math.min(imgWidth - cropX, maxX + padRight - cropX);
    const cropH = Math.min(imgHeight - cropY, maxY + padBottom - cropY);

    if (cropW <= 10 || cropH <= 10) return null;

    // 4. Create offscreen canvas, upscale by 2.5x, apply contrast
    const scale = 2.5;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(cropW * scale);
    canvas.height = Math.round(cropH * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);

    // Image enhancement: grayscale & contrast stretch
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const contrast = (gray - 128) * 1.4 + 128;
      const v = Math.min(255, Math.max(0, contrast));
      d[i] = v;
      d[i + 1] = v;
      d[i + 2] = v;
    }
    ctx.putImageData(imgData, 0, 0);

    const croppedDataUrl = canvas.toDataURL('image/png');

    // 5. Run OCR second pass scoped specifically to this crop
    let worker = existingWorker;
    let ownWorker = false;
    if (!worker) {
      worker = await createWorker('eng', 1);
      ownWorker = true;
    }

    const reScan = await worker.recognize(croppedDataUrl);
    if (ownWorker) {
      await worker.terminate();
    }

    return {
      fallbackText: reScan.data.text || '',
      fallbackConfidence: reScan.data.confidence || 75,
    };
  } catch (err) {
    console.debug('[MRP Region Fallback Re-scan Error]', err);
    return null;
  }
}
