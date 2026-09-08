import type { Category } from '../rules';

export interface SampleLabel {
  id: string;
  name: string;
  category: Category;
  isImported: boolean;
  expectedOutcome: 'Compliant' | 'Violation';
  description: string;
  lines: string[];
}

export const SAMPLE_LABELS: SampleLabel[] = [
  {
    id: 'food_compliant',
    name: 'Food & Beverages: Compliant Biscuit Pack',
    category: 'Food & Beverages',
    isImported: false,
    expectedOutcome: 'Compliant',
    description: 'All 5 mandatory fields present (Mfg, MRP, Net Qty, Mfg Date, Consumer Care)',
    lines: [
      'PARLE-G GLUCOSE BISCUITS',
      'Mfg by: Parle Products Pvt. Ltd., Vile Parle, Mumbai - 400057',
      'Net Quantity: 250 g',
      'MRP: ₹ 30.00 (inclusive of all taxes)',
      'Mfg Date: 08/2026',
      'Consumer Care Helpline: 1800-222-211',
      'Email: care@parle.biz',
      'Batch No: PG-2026-X8',
    ],
  },
  {
    id: 'electronics_qr',
    name: 'Electronics: Wireless Earbuds (QR Declarable)',
    category: 'Electronics',
    isImported: false,
    expectedOutcome: 'Compliant',
    description: 'Compliant with Address declarable via on-pack QR Code',
    lines: [
      'BOAT AIRDOPES 141 TWS',
      'Brand: Imagine Marketing Ltd. (boAt Lifestyle)',
      'Mfg by: Imagine Marketing Limited, Mumbai 400093',
      'Net Quantity: 1 N (1 Pair Earbuds, Case, Cable)',
      'MRP: ₹ 1,499.00 (inclusive of all taxes)',
      'Country of Origin: India',
      'Scan QR code on pack for verified manufacturer address',
    ],
  },
  {
    id: 'cosmetics_imported',
    name: 'Cosmetics: Imported French Face Cream',
    category: 'Cosmetics & Personal Care',
    isImported: true,
    expectedOutcome: 'Compliant',
    description: 'Imported cosmetic with Country of Origin & Importer details',
    lines: [
      "L'OREAL PARIS REVITALIFT DAY CREAM",
      "Mfg by: L'Oreal Paris S.A., 14 Rue Royale, Paris",
      'Country of Origin: France',
      "Imported by: L'Oreal India Pvt. Ltd., Lower Parel, Mumbai",
      'Net Quantity: 50 ml',
      'MRP: ₹ 899.00 (inclusive of all taxes)',
      'Batch No: FR88219B',
    ],
  },
  {
    id: 'food_violation',
    name: 'Food: Missing MRP & Mfg Date (Violation)',
    category: 'Food & Beverages',
    isImported: false,
    expectedOutcome: 'Violation',
    description: 'Incomplete packaging label missing mandatory MRP and Mfg Date',
    lines: [
      'CRUNCHY POTATO CHIPS - SALTED',
      'Mfg by: Snacko Foods Ltd., Pune, Maharashtra',
      'Net Quantity: 100 g',
      'Consumer Care: care@snackofoods.com',
      'Phone: 9876543210',
    ],
  },
];

/**
 * Renders sample label text onto an HTML Canvas and exports as an image data URL.
 * High contrast black text on white background ensures high OCR confidence.
 */
export function generateSampleImage(sample: SampleLabel): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const width = 640;
    const height = 440;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve('');
      return;
    }

    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Subtle border
    ctx.strokeStyle = '#D1D5DB';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    // Inner header badge
    ctx.fillStyle = '#F3F4F6';
    ctx.fillRect(12, 12, width - 24, 46);
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 17px sans-serif';
    ctx.fillText('PRODUCT PACKAGING SPECIFICATION LABEL', 28, 42);

    // Text specifications
    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 15px monospace';

    let y = 92;
    for (const line of sample.lines) {
      // Highlight certain keys
      if (line.startsWith('MRP') || line.startsWith('Net') || line.startsWith('Mfg')) {
        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 16px sans-serif';
      } else {
        ctx.fillStyle = '#374151';
        ctx.font = '15px sans-serif';
      }
      ctx.fillText(line, 28, y);
      y += 34;
    }

    // Barcode mock at bottom
    ctx.fillStyle = '#000000';
    let barX = 28;
    const barY = height - 50;
    const barHeight = 24;
    for (let i = 0; i < 48; i++) {
      const barWidth = (i % 3 === 0) ? 3 : 1.5;
      ctx.fillRect(barX, barY, barWidth, barHeight);
      barX += barWidth + ((i % 2 === 0) ? 2.5 : 1.5);
    }
    ctx.font = '11px monospace';
    ctx.fillText('8 901234 567890', 28, height - 14);

    resolve(canvas.toDataURL('image/png'));
  });
}
