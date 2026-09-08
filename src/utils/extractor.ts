import type { Category } from '../rules';
import { getEffectiveRules } from './rulesOverride';
import type { ExtractedField, ComplianceReport, OCRWord, FieldBoundingBox } from '../types/compliance';

interface OCRLine {
  text: string;
  confidence: number;
}

export interface MRPEvidenceContext {
  secondPassAttempted?: boolean;
  secondPassText?: string;
  isUncertain?: boolean;
  isLowConfidence?: boolean;
}

export interface MRPVerificationState {
  mrpValue: string | null;
  mrpDetected: boolean;
  taxInclusiveVerified: boolean;
  taxInclusiveNotDetected: boolean;
  taxInclusiveUnreadable: boolean;
  confidence: number;
  status: 'compliant' | 'warning' | 'violation';
  reason?: string;
  suggestion?: string;
}

export function extractFields(
  rawText: string,
  lines: OCRLine[],
  overallConfidence: number,
  category: Category,
  isImported: boolean,
  words: OCRWord[] = [],
  evidenceContext?: MRPEvidenceContext
): ComplianceReport {
  const rules = getEffectiveRules(category, isImported);

  const cleanText = rawText.replace(/\r\n/g, '\n');

  // Helper to find OCR confidence of text near a match
  const findConfidenceNear = (searchTerm: string): number => {
    if (!searchTerm || lines.length === 0) return overallConfidence || 75;
    const lower = searchTerm.toLowerCase();
    const matchLine = lines.find((l) => l.text.toLowerCase().includes(lower));
    if (matchLine && matchLine.confidence > 0) {
      return Math.round(matchLine.confidence);
    }
    return overallConfidence > 0 ? Math.round(overallConfidence) : 75;
  };

  // 1. Manufacturer Name / Brand
  const extractManufacturer = (): { value: string | null; confidence: number; reason?: string } => {
    const prefixRegex = /(?:mfg\.?\s*(?:by|at|for)?|manufactured\s*(?:by|at|for|in)?|mfd\.?\s*(?:by|at)?|packed\s*(?:by|at)?|pkd\.?\s*(?:by)?|marketed\s*(?:by|at)?|mktd\.?\s*(?:by)?|bottled\s*(?:by)?|produced\s*(?:by)?|mfr\.?\s*(?:by)?|brand\s*[:\-]?|made\s*in\s*india\s*by)/i;

    // Check line by line for prefix
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].text.trim();
      if (prefixRegex.test(line)) {
        // Extract after the prefix on the same line
        const afterPrefix = line.replace(/^.*?(?:mfg\.?\s*(?:by|at|for)?|manufactured\s*(?:by|at|for|in)?|mfd\.?\s*(?:by|at)?|packed\s*(?:by|at)?|pkd\.?\s*(?:by)?|marketed\s*(?:by|at)?|mktd\.?\s*(?:by)?|bottled\s*(?:by)?|produced\s*(?:by)?|mfr\.?\s*(?:by)?|brand\s*[:\-]?|made\s*in\s*india\s*by)[\s:.\-]*/i, '').trim();
        if (afterPrefix.length > 2) {
          return {
            value: afterPrefix.replace(/[;,.\-]+$/, '').trim(),
            confidence: Math.max(65, lines[i].confidence || findConfidenceNear(afterPrefix)),
          };
        }
        // If keyword is at end of line, check next line
        if (i + 1 < lines.length && lines[i + 1].text.trim().length > 2) {
          const nextLine = lines[i + 1].text.trim().replace(/[;,.\-]+$/, '').trim();
          return {
            value: nextLine,
            confidence: Math.max(65, lines[i + 1].confidence || findConfidenceNear(nextLine)),
          };
        }
      }
    }

    // Single-string regex fallback
    const mfgRegex = /(?:mfg\.?\s*(?:by|at|for)?|manufactured\s*(?:by|at|for|in)?|mfd\.?\s*(?:by|at)?|packed\s*(?:by|at)?|pkd\.?\s*(?:by)?|marketed\s*(?:by|at)?|mktd\.?\s*(?:by)?|bottled\s*(?:by)?|produced\s*(?:by)?|brand\s*[:\-]?|made\s*in\s*india\s*by)[\s:.\-]+([^\n\r,]+(?:,\s*[^\n\r]+)?)/i;
    const match = cleanText.match(mfgRegex);
    if (match && match[1]) {
      const val = match[1].trim().replace(/^[:\-\s]+/, '').replace(/[;,.\-]+$/, '').trim();
      if (val.length > 2) {
        return {
          value: val,
          confidence: Math.max(65, findConfidenceNear(match[0])),
        };
      }
    }

    // Corporate entity names (e.g. Britannia Industries Ltd, Parle Products Pvt Ltd)
    const corpLineRegex = /(?:Pvt\.?\s*Ltd\.?|Private\s*Limited|Limited|Ltd\.?|Industries|Enterprises|Herbals|Foods|Pharma|Laboratories|Beverages|Products|Confectionery|Bakery)/i;
    for (const lineObj of lines) {
      const l = lineObj.text.trim();
      if (corpLineRegex.test(l) && l.length > 3 && l.length < 80) {
        return {
          value: l.replace(/[;,.\-]+$/, '').trim(),
          confidence: Math.max(65, lineObj.confidence || 75),
        };
      }
    }

    // Fallback: Check clean text for corporate entity pattern
    const corpRegex = /([A-Za-z0-9][A-Za-z0-9\s&.',-]+?(?:Pvt\.?\s*Ltd\.?|Private\s*Limited|Limited|Ltd\.?|Industries|Enterprises|Herbals|Foods|Pharma|Laboratories|Beverages|Products))/i;
    const corpMatch = cleanText.match(corpRegex);
    if (corpMatch && corpMatch[1] && corpMatch[1].trim().length > 3) {
      return {
        value: corpMatch[1].trim().replace(/[;,.\-]+$/, ''),
        confidence: Math.max(65, findConfidenceNear(corpMatch[1])),
      };
    }

    // Fallback: prominent title/brand from first 2 non-empty lines if they appear to be brand names
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const candidate = lines[i].text.trim();
      if (candidate.length >= 3 && candidate.length <= 40 && !/^(?:mrp|batch|net|pkd|mfg|exp|date|best|lic|fssai)/i.test(candidate)) {
        if (/^[A-Z0-9\s&'-]+$/.test(candidate) || candidate.includes('TM') || candidate.includes('®')) {
          return {
            value: candidate.replace(/[;,.\-]+$/, '').trim(),
            confidence: Math.max(60, lines[i].confidence || 70),
          };
        }
      }
    }

    return {
      value: null,
      confidence: 0,
      reason: 'Manufacturer or brand name prefix (Mfg / Manufactured by / Marketed by) not detected on label',
    };
  };

  // 2. MRP (Feature 1: checks tax phrase "inclusive of all taxes" under Rule 6(1)(f))
  // Helper to normalize OCR text for semantic tax declaration matching
  const normalizeForTaxPhrase = (text: string): string => {
    if (!text) return '';
    return text
      .toLowerCase()
      // Fix common OCR character misreads on "inclusive" (e.g. 1nclusive, lnclusive, |nclusive)
      .replace(/\b[1l|]ncl/g, 'incl')
      // Strip brackets, parentheses, quotes, punctuation into spaces
      .replace(/[()[\]{}'"“”‘’.,;:_\-/\\|]/g, ' ')
      // Collapse whitespace to single space
      .replace(/\s+/g, ' ')
      .trim();
  };

  // 2. MRP: Independent state evaluation separating extraction from verification
  const verifyMRP = (): MRPVerificationState => {
    // 1. MRP extraction (unchanged, preserves existing correct behavior)
    let rawPrice: string | null = null;
    let mrpConfidence = 0;

    const normalizePrice = (rawVal: string): string => {
      const clean = rawVal.replace(/[₹RsInrINR,\s]/gi, '').replace(/[.\-/]+$/, '').trim();
      const num = parseFloat(clean);
      if (isNaN(num)) return clean;
      return num.toFixed(2);
    };

    // Line-by-line inspection for MRP / Maximum Retail Price
    const mrpPrefixRegex = /(?:m\s*\.?\s*r\s*\.?\s*p\.?|max(?:imum)?\s*retail\s*price)/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].text.trim();
      if (mrpPrefixRegex.test(line)) {
        const sameLinePrice = line.match(
          /(?:m\s*\.?\s*r\s*\.?\s*p\.?|max(?:imum)?\s*retail\s*price)[^\d₹\n\r]{0,35}?(?:₹|rs\.?|inr)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i
        );
        if (sameLinePrice && sameLinePrice[1]) {
          rawPrice = sameLinePrice[1];
          mrpConfidence = Math.max(70, lines[i].confidence || findConfidenceNear(sameLinePrice[0]));
          break;
        }

        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].text.trim();
          const nextLinePrice = nextLine.match(
            /^(?:[\s:.\-₹RsInrINR]*|mrp[\s:.]*)?(?:₹|rs\.?|inr)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i
          );
          if (nextLinePrice && nextLinePrice[1]) {
            rawPrice = nextLinePrice[1];
            mrpConfidence = Math.max(70, lines[i + 1].confidence || findConfidenceNear(nextLinePrice[0]));
            break;
          }
        }
      }
    }

    if (!rawPrice) {
      const mrpRegex =
        /(?:m\s*\.?\s*r\s*\.?\s*p\.?|max(?:imum)?\s*retail\s*price|mrp\s*\(?incl\.?\)?)[\s:.\-₹RsInrINR]*(?:₹|rs\.?|inr)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i;
      const match = cleanText.match(mrpRegex);
      if (match && match[1]) {
        rawPrice = match[1].replace(/,$/, '');
        mrpConfidence = Math.max(65, findConfidenceNear(match[0]));
      }
    }

    if (!rawPrice) {
      const rupeeMatch = cleanText.match(/₹\s*([0-9,]+(?:\.[0-9]{1,2})?)/);
      if (rupeeMatch && rupeeMatch[1]) {
        rawPrice = rupeeMatch[1].replace(/,$/, '');
        mrpConfidence = Math.max(65, findConfidenceNear(rupeeMatch[0]));
      }
    }

    if (!rawPrice) {
      const rsMatch = cleanText.match(/\b(?:Rs\.?|INR)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);
      if (rsMatch && rsMatch[1]) {
        rawPrice = rsMatch[1].replace(/,$/, '');
        mrpConfidence = Math.max(65, findConfidenceNear(rsMatch[0]));
      }
    }

    const mrpDetected = rawPrice !== null;
    const mrpValue = mrpDetected ? `Maximum Retail Price: ₹${normalizePrice(rawPrice!)}` : null;

    if (!mrpDetected) {
      return {
        mrpValue: null,
        mrpDetected: false,
        taxInclusiveVerified: false,
        taxInclusiveNotDetected: true,
        taxInclusiveUnreadable: false,
        confidence: 0,
        status: 'violation',
        reason: 'MRP declaration (with ₹, Rs, or MRP prefix) missing or illegible',
        suggestion: 'Declare Maximum Retail Price (MRP) in Rupees on the packaging.',
      };
    }

    // 2. Tax declaration text search across complete OCR block (primary + fallback pass)
    const combinedOcrText = `${rawText}\n${cleanText}\n${lines.map((l) => l.text).join(' ')}${
      evidenceContext?.secondPassText ? `\n${evidenceContext.secondPassText}` : ''
    }`;
    const norm = normalizeForTaxPhrase(combinedOcrText);

    const hasInclRoot = /\bincl\w*\b/.test(norm) || /\binclude[ds]?\b/.test(norm);
    const hasTaxWord = /\btax(?:es)?\b/.test(norm);
    const hasNegation =
      /\b(?:not|without|extra)\s+(?:incl\w*|include[ds]?)\b/.test(norm) ||
      /\btax(?:es)?\s+not\s+include[ds]?\b/.test(norm) ||
      /\bexcl\w*\b/.test(norm);

    const taxInclusiveVerified = hasInclRoot && hasTaxWord && !hasNegation;

    console.debug('[MRP Verification Decision]', {
      mrpValue,
      normalizedText: norm,
      hasInclRoot,
      hasTaxWord,
      hasNegation,
      taxInclusiveVerified,
    });

    // 3. Three-way evidence-based decision
    if (taxInclusiveVerified) {
      return {
        mrpValue,
        mrpDetected: true,
        taxInclusiveVerified: true,
        taxInclusiveNotDetected: false,
        taxInclusiveUnreadable: false,
        confidence: mrpConfidence,
        status: 'compliant',
      };
    }

    // Evaluate whether UNCERTAIN (Unable to Verify) or CLEARLY ABSENT (Tax Declaration Missing)
    const isExplicitlyNegated = hasNegation;
    const isLowConfidence =
      overallConfidence < 80 ||
      mrpConfidence < 75 ||
      evidenceContext?.isLowConfidence === true ||
      evidenceContext?.isUncertain === true;
    const isSparseText = lines.length < 4 || rawText.trim().length < 100;
    const hasPartialTokens = (hasTaxWord || hasInclRoot) && !isExplicitlyNegated;
    const secondPassFailedWithoutEvidence = evidenceContext?.secondPassAttempted === true;

    const taxInclusiveUnreadable =
      !isExplicitlyNegated &&
      (isLowConfidence || isSparseText || hasPartialTokens || secondPassFailedWithoutEvidence);

    if (taxInclusiveUnreadable) {
      return {
        mrpValue,
        mrpDetected: true,
        taxInclusiveVerified: false,
        taxInclusiveNotDetected: false,
        taxInclusiveUnreadable: true,
        confidence: mrpConfidence,
        status: 'warning',
        reason: 'MRP was detected, but the tax-inclusive declaration could not be reliably verified from the available image/OCR evidence.',
        suggestion: 'Ensure packaging image has high resolution and even lighting around the MRP area to verify tax declarations.',
      };
    }

    // CLEARLY ABSENT: Evidence demonstrates full label was cleanly read with high confidence and no declaration present
    return {
      mrpValue,
      mrpDetected: true,
      taxInclusiveVerified: false,
      taxInclusiveNotDetected: true,
      taxInclusiveUnreadable: false,
      confidence: mrpConfidence,
      status: 'violation',
      reason: "MRP detected, but 'inclusive of all taxes' declaration is missing on product label — required under Rule 6(1)(f)",
      suggestion: "Add the phrase 'inclusive of all taxes' or 'incl. of all taxes' next to the MRP.",
    };
  };

  // 3. Net Quantity / Net Weight
  const extractNetQuantity = (): { value: string | null; confidence: number; reason?: string } => {
    // 1. Prefix with optional qualifier like (when packed) or : followed by number and unit
    const prefixRegex = /(?:net\s*(?:qty|quantity|wt|weight|vol|volume|content|contents)|(?:^|\b)(?:weight|quantity)[\s:.\-])[^\d\n\r]{0,30}?(\d+(?:\.\d+)?\s*(?:kg|kgs|g|gm|gms|gram|grams|ml|l|ltr|liter|litres|n|units?|pieces?)\b)/i;
    const prefixMatch = cleanText.match(prefixRegex);
    if (prefixMatch && prefixMatch[1]) {
      return {
        value: prefixMatch[1].trim(),
        confidence: Math.max(70, findConfidenceNear(prefixMatch[0])),
      };
    }

    // Check line by line for NET WT / NET WEIGHT / QTY labels
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].text.trim();
      if (/(?:net\s*(?:wt|weight|qty|quantity|vol|volume|content|contents)|(?:^|\b)weight\b)/i.test(line)) {
        const metricInLine = line.match(/(\d+(?:\.\d+)?\s*(?:kg|kgs|gm|gms|gram|grams|ml|ltr|litre|litres|g|l|n|units?|pieces?)\b)/i);
        if (metricInLine && metricInLine[1]) {
          return {
            value: metricInLine[1].trim(),
            confidence: Math.max(70, lines[i].confidence || 75),
          };
        }
        // Check next line
        if (i + 1 < lines.length) {
          const nextMetric = lines[i + 1].text.trim().match(/(\d+(?:\.\d+)?\s*(?:kg|kgs|gm|gms|gram|grams|ml|ltr|litre|litres|g|l|n|units?|pieces?)\b)/i);
          if (nextMetric && nextMetric[1]) {
            return {
              value: nextMetric[1].trim(),
              confidence: Math.max(70, lines[i + 1].confidence || 75),
            };
          }
        }
      }
    }

    // 2. Metric quantity standalone anywhere in text
    const metricRegex = /\b(\d+(?:\.\d+)?\s*(?:kg|kgs|gm|gms|gram|grams|ml|ltr|litre|litres|g(?![a-z])|l(?![a-z])))\b/i;
    const metricMatch = cleanText.match(metricRegex);
    if (metricMatch && metricMatch[1]) {
      const val = metricMatch[1].trim();
      return {
        value: val,
        confidence: Math.max(65, findConfidenceNear(val)),
      };
    }

    // 3. Count unit e.g. 1 N, 2 Units, 1 Piece
    const countRegex = /\b(\d+\s*(?:N|Unit|Units|Piece|Pieces|Set|Sets))\b/i;
    const countMatch = cleanText.match(countRegex);
    if (countMatch && countMatch[1]) {
      return {
        value: countMatch[1].trim(),
        confidence: Math.max(65, findConfidenceNear(countMatch[0])),
      };
    }

    return {
      value: null,
      confidence: 0,
      reason: 'Net quantity declaration with standard metric unit (g, kg, ml, L, N) not found',
    };
  };

  // 4. Mfg Date (Food & Beverages mandatory)
  const extractMfgDate = (): { value: string | null; confidence: number; reason?: string } => {
    // 3-part or 2-part date or named month near Mfg / Pkd keyword
    const mfgDateRegex = /(?:mfg\.?\s*(?:date|dt)?|mfd\.?|pkd\.?\s*(?:date|dt|on)?|packed\s*(?:on|date)?|date\s*of\s*(?:mfg|packing|pkd)|dom|dop)[\s:.\-]*([0-3]?[0-9][\/\-.][0-1]?[0-9][\/\-.](?:20)?[0-9]{2}|(?:0[1-9]|1[0-2])[\/\-.](?:20)?[0-9]{2}|[0-3]?[0-9][\/\-.][0-9]{2}|[A-Za-z]{3,9}\.?\s*(?:20)?[0-9]{2}|(?:20)?[0-9]{2}[\/\-.][0-9]{2})/i;
    const match = cleanText.match(mfgDateRegex);
    if (match && match[1]) {
      return {
        value: match[1].trim(),
        confidence: Math.max(65, findConfidenceNear(match[0])),
      };
    }

    // Check line by line for Mfg / Pkd line
    for (const lineObj of lines) {
      const l = lineObj.text.trim();
      if (/(?:mfg|mfd|pkd|packed|date\s*of)/i.test(l)) {
        const dateMatch = l.match(/([0-3]?[0-9][\/\-.][0-1]?[0-9][\/\-.](?:20)?[0-9]{2}|(?:0[1-9]|1[0-2])[\/\-.](?:20)?[0-9]{2}|[A-Za-z]{3,9}\.?\s*(?:20)?[0-9]{2})/i);
        if (dateMatch && dateMatch[1]) {
          return {
            value: dateMatch[1].trim(),
            confidence: Math.max(65, lineObj.confidence || 75),
          };
        }
      }
    }

    // Best before or use by
    const bbRegex = /(?:best\s*before|use\s*by|exp\.?\s*(?:date)?)[\s:.\-]*([0-3]?[0-9][\/\-.][0-1]?[0-9][\/\-.](?:20)?[0-9]{2}|(?:0[1-9]|1[0-2])[\/\-.](?:20)?[0-9]{2}|[A-Za-z]{3,9}\.?\s*(?:20)?[0-9]{2})/i;
    const bbMatch = cleanText.match(bbRegex);
    if (bbMatch && bbMatch[1]) {
      return {
        value: `Best Before: ${bbMatch[1].trim()}`,
        confidence: Math.max(65, findConfidenceNear(bbMatch[0])),
      };
    }

    // Standalone MM/YYYY or DD/MM/YYYY date
    const dateRegex = /\b([0-3]?[0-9][\/\-.](?:0[1-9]|1[0-2])[\/\-.](?:20\d{2}|\d{2})|(?:0[1-9]|1[0-2])[\/\-.](?:20\d{2}))\b/;
    const dMatch = cleanText.match(dateRegex);
    if (dMatch && dMatch[0]) {
      return {
        value: dMatch[0],
        confidence: Math.max(60, findConfidenceNear(dMatch[0])),
      };
    }

    return {
      value: null,
      confidence: 0,
      reason: 'Date of manufacture or packaging (Month/Year) not detected',
    };
  };

  // 5. Consumer Care (Food & Beverages mandatory)
  const extractConsumerCare = (): { value: string | null; confidence: number; reason?: string } => {
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
    const emailMatch = cleanText.match(emailRegex);

    // Matches toll-free 1800, landlines (0xx-xxxxxxx), or mobile numbers
    const phoneRegex = /(?:toll\s*free|care|helpline|call|phone|tel|ph)?[\s:.\-]*(1800[\s\-]?\d{3}[\s\-]?\d{3,4}|0\d{2,4}[\s\-]?\d{6,8}|\+?91[\s\-]?[6-9]\d{9}|\b[6-9]\d{9}\b)/i;
    const phoneMatch = cleanText.match(phoneRegex);

    if (emailMatch && phoneMatch && phoneMatch[1]) {
      return {
        value: `${phoneMatch[1]} | ${emailMatch[1]}`,
        confidence: Math.max(findConfidenceNear(phoneMatch[1]), findConfidenceNear(emailMatch[1])),
      };
    }

    if (phoneMatch && phoneMatch[1]) {
      return {
        value: `Helpline: ${phoneMatch[1]}`,
        confidence: Math.max(65, findConfidenceNear(phoneMatch[1])),
      };
    }

    if (emailMatch && emailMatch[1]) {
      return {
        value: `Email: ${emailMatch[1]}`,
        confidence: Math.max(65, findConfidenceNear(emailMatch[1])),
      };
    }

    // Check line-by-line for consumer care contact statements
    for (const lineObj of lines) {
      const l = lineObj.text.trim();
      if (/consumer\s*care|customer\s*care|feedback|helpline|queries|care\s*cell|complaint/i.test(l)) {
        return {
          value: l.length > 50 ? l.slice(0, 50) + '...' : l,
          confidence: Math.max(60, lineObj.confidence || 65),
        };
      }
    }

    return {
      value: null,
      confidence: 0,
      reason: 'Consumer care contact (helpline phone number or email address) missing',
    };
  };

  // 6. Country of Origin (Cosmetics when imported)
  const extractCountryOfOrigin = (): { value: string | null; confidence: number; reason?: string } => {
    const originRegex = /(?:country\s*of\s*origin|made\s*in|imported\s*from|manufactured\s*in)[\s:.\-]+([A-Za-z\s]{3,20})/i;
    const match = cleanText.match(originRegex);
    if (match && match[1]) {
      const country = match[1].trim().replace(/\n.*$/, '');
      return {
        value: country,
        confidence: findConfidenceNear(match[0]),
      };
    }

    const countryNames = ['India', 'China', 'USA', 'United States', 'Germany', 'France', 'Japan', 'Korea', 'Thailand', 'Italy', 'UK', 'United Kingdom'];
    for (const country of countryNames) {
      if (new RegExp(`\\b${country}\\b`, 'i').test(cleanText)) {
        return {
          value: country,
          confidence: findConfidenceNear(country),
        };
      }
    }

    return {
      value: null,
      confidence: 0,
      reason: "Mandatory country of origin declaration missing for imported product (LM Rule 6(1)(n))",
    };
  };

  // 7. Manufacturer Address (Electronics: QR declarable)
  const extractManufacturerAddress = (): { value: string | null; confidence: number; reason?: string } => {
    if (category === 'Electronics') {
      const qrRegex = /(?:qr\s*code|scan\s*qr|scan\s*for\s*(?:details|address)|e-label)/i;
      const hasQR = qrRegex.test(cleanText);

      const addrRegex = /(?:regd\.?\s*office|factory|address|works\s*at)[\s:.\-]+([^\n\r]{10,80})/i;
      const addrMatch = cleanText.match(addrRegex);

      if (hasQR) {
        return {
          value: 'Declarable via on-pack QR code (Compliant under E-Label rules)',
          confidence: 90,
        };
      }

      if (addrMatch && addrMatch[1]) {
        return {
          value: addrMatch[1].trim(),
          confidence: findConfidenceNear(addrMatch[1]),
        };
      }

      return {
        value: 'Not on-pack (Declarable via QR Code / Website)',
        confidence: 85,
      };
    }

    return {
      value: null,
      confidence: 0,
      reason: 'Physical address not specified',
    };
  };

  // Build the field list according to rules
  const fields: ExtractedField[] = [];

  for (const rule of rules) {
    let extraction: { value: string | null; confidence: number; reason?: string };
    let customStatus: ExtractedField['status'] | undefined;
    let customReason: string | undefined;
    let customSuggestion: string | undefined;

    switch (rule.key) {
      case 'manufacturerName':
        extraction = extractManufacturer();
        break;
      case 'mrp': {
        const mrpState = verifyMRP();
        extraction = {
          value: mrpState.mrpValue,
          confidence: mrpState.confidence,
          reason: mrpState.reason,
        };
        customStatus = mrpState.status;
        customReason = mrpState.reason;
        customSuggestion = mrpState.suggestion;
        break;
      }
      case 'netQuantity':
        extraction = extractNetQuantity();
        break;
      case 'mfgDate':
        extraction = extractMfgDate();
        break;
      case 'consumerCare':
        extraction = extractConsumerCare();
        break;
      case 'countryOfOrigin':
        extraction = extractCountryOfOrigin();
        break;
      case 'manufacturerAddress':
        extraction = extractManufacturerAddress();
        break;
      default: {
        // Generic extraction for admin-added rules (e.g. Batch Number, License No, etc.)
        const labelLower = rule.label.toLowerCase();
        const searchTerms = [
          labelLower,
          ...labelLower.split(/[\s/&]+/).filter((t) => t.length >= 3),
        ];
        if (/batch/i.test(rule.label)) {
          searchTerms.push('batch', 'b.no', 'b no', 'lot', 'lot no', 'bn');
        }
        let matchedLine: string | null = null;
        let matchConf = 0;
        for (const lineObj of lines) {
          const lLower = lineObj.text.toLowerCase();
          for (const term of searchTerms) {
            if (lLower.includes(term)) {
              matchedLine = lineObj.text.trim();
              matchConf = Math.max(65, lineObj.confidence || 70);
              break;
            }
          }
          if (matchedLine) break;
        }

        if (matchedLine) {
          extraction = { value: matchedLine, confidence: matchConf };
        } else {
          extraction = {
            value: null,
            confidence: 0,
            reason: `${rule.label} declaration not detected on label`,
          };
        }
        break;
      }
    }

    let status: ExtractedField['status'];

    if (!rule.required) {
      status = 'optional_qr';
    } else if (customStatus) {
      status = customStatus;
    } else if (extraction.value !== null) {
      if (extraction.confidence < 65) {
        status = 'manual_review';
      } else {
        status = 'compliant';
      }
    } else {
      status = 'violation';
    }

    const reason = customReason
      ? customReason
      : status === 'violation'
      ? (extraction.reason || 'Missing required declaration')
      : status === 'manual_review'
      ? 'OCR confidence below 65% - requires visual verification'
      : undefined;

    const suggestion = customSuggestion
      ? customSuggestion
      : status === 'violation'
      ? rule.suggestionIfMissing
      : undefined;

    fields.push({
      key: rule.key,
      label: rule.label,
      value: extraction.value,
      status,
      confidence: extraction.confidence,
      reason,
      suggestion,
      notes: rule.notes,
      isRequired: rule.required,
    });
  }

  // Calculate score
  const requiredFields = fields.filter((f) => f.isRequired);
  // Compliant and manual review count as passed, warnings do not count as fully compliant
  const passedFields = requiredFields.filter((f) => f.status === 'compliant' || f.status === 'manual_review');
  const fullyCompliantFields = requiredFields.filter((f) => f.status === 'compliant');

  const totalRequired = requiredFields.length;
  const passedCount = passedFields.length;
  const score = totalRequired > 0 ? Math.round((passedCount / totalRequired) * 100) : 100;
  // If any required field has violation, warning, or manual review, isCompliant is false
  const isCompliant = totalRequired > 0 && fullyCompliantFields.length === totalRequired;

  // Calculate field bounding boxes for evidence overlay
  const fieldBoxes: FieldBoundingBox[] = [];

  const FIELD_KEYWORDS: Record<string, string[]> = {
    mrp: ['mrp', 'rs', 'inr', 'max', 'taxes'],
    manufacturerName: ['mfg', 'manufactured', 'packed', 'mfd', 'marketed', 'by', 'ltd'],
    netQuantity: ['net', 'qty', 'weight', 'volume', 'wt', 'quantity'],
    mfgDate: ['mfg', 'pkd', 'date', 'best', 'before'],
    consumerCare: ['care', 'toll', 'free', 'helpline', 'email', 'contact', 'call'],
    countryOfOrigin: ['origin', 'country', 'made', 'imported'],
    manufacturerAddress: ['address', 'qr', 'code', 'regd'],
  };

  for (const field of fields) {
    let matchingWords: OCRWord[] = [];

    if (field.value) {
      const tokens = field.value
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length >= 2);

      const keywords = FIELD_KEYWORDS[field.key] || [];

      matchingWords = words.filter((w) => {
        if (!w.bbox || w.bbox.x1 <= w.bbox.x0) return false;
        const wText = w.text.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!wText) return false;
        return tokens.some((tok) => tok.includes(wText) || wText.includes(tok)) || keywords.includes(wText);
      });
    } else if (field.status === 'violation') {
      // Draw red box where violation was expected if keyword is found
      const keywords = FIELD_KEYWORDS[field.key] || [];
      matchingWords = words.filter((w) => {
        if (!w.bbox || w.bbox.x1 <= w.bbox.x0) return false;
        const wText = w.text.toLowerCase().replace(/[^a-z0-9]/g, '');
        return keywords.includes(wText);
      });
    }

    if (matchingWords.length > 0) {
      const x0 = Math.min(...matchingWords.map((w) => w.bbox.x0));
      const y0 = Math.min(...matchingWords.map((w) => w.bbox.y0));
      const x1 = Math.max(...matchingWords.map((w) => w.bbox.x1));
      const y1 = Math.max(...matchingWords.map((w) => w.bbox.y1));

      const bbox = {
        x0: Math.max(0, x0 - 4),
        y0: Math.max(0, y0 - 4),
        x1: x1 + 4,
        y1: y1 + 4,
      };

      field.bbox = bbox;
      fieldBoxes.push({
        fieldKey: field.key,
        label: field.label.split('(')[0].trim(),
        status: field.status,
        bbox,
      });
    }
  }

  return {
    category,
    isImported,
    fields,
    fieldBoxes,
    score,
    passedCount,
    totalRequired,
    isCompliant,
    rawText,
    averageConfidence: Math.round(overallConfidence || 80),
    timestamp: new Date().toISOString(),
  };
}
