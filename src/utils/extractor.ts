import { CATEGORY_RULES, type Category } from '../rules';
import type { ExtractedField, ComplianceReport, OCRWord, FieldBoundingBox } from '../types/compliance';

interface OCRLine {
  text: string;
  confidence: number;
}

export function extractFields(
  rawText: string,
  lines: OCRLine[],
  overallConfidence: number,
  category: Category,
  isImported: boolean,
  words: OCRWord[] = []
): ComplianceReport {
  const rulesConfig = CATEGORY_RULES[category];
  const rules = rulesConfig.getRules(isImported);

  const cleanText = rawText.replace(/\r\n/g, '\n');
  const normalizedText = cleanText.toLowerCase();

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

  // 1. Manufacturer Name
  const extractManufacturer = (): { value: string | null; confidence: number; reason?: string } => {
    // Check patterns near Mfg, Manufactured by, Packed by, Marketed by
    const mfgRegex = /(?:mfg\.?\s*(?:by|at)?|manufactured\s*(?:by|at)?|mfd\.?\s*(?:by)?|packed\s*(?:by)?|marketed\s*(?:by)?|bottled\s*(?:by)?|produced\s*(?:by)?)[:\-\s]+([^\n\r,]+(?:,\s*[^\n\r]+)?)/i;
    const match = cleanText.match(mfgRegex);
    if (match && match[1]) {
      const val = match[1].trim().replace(/^[:\-\s]+/, '');
      if (val.length > 2) {
        return {
          value: val,
          confidence: findConfidenceNear(match[0]),
        };
      }
    }

    // Fallback: lines containing Pvt Ltd, Ltd, Foods, Industries, Herbals, Laboratories
    const corpRegex = /([A-Z0-9][A-Za-z0-9\s&]+(?:Pvt\.?\s*Ltd\.?|Private\s*Limited|Limited|Ltd\.?|Industries|Enterprises|Herbals|Foods|Pharma|Laboratories))/;
    const corpMatch = cleanText.match(corpRegex);
    if (corpMatch && corpMatch[1]) {
      return {
        value: corpMatch[1].trim(),
        confidence: findConfidenceNear(corpMatch[1]),
      };
    }

    return {
      value: null,
      confidence: 0,
      reason: 'Manufacturer or brand name prefix (Mfg / Manufactured by) not detected on label',
    };
  };

  // 2. MRP (Feature 1: checks tax phrase "inclusive of all taxes" under Rule 6(1)(f))
  const extractMRP = (): {
    value: string | null;
    confidence: number;
    hasTaxPhrase: boolean;
    reason?: string;
  } => {
    const taxPhraseRegex = /(?:incl(?:usive)?\.?\s*of\s*all\s*taxes|incl\.?\s*all\s*taxes|inclusive\s*all\s*taxes)/i;

    // Matches MRP / ₹ / Rs followed by number, optionally noting tax inclusion
    const mrpRegex = /(?:m\.?r\.?p\.?|max(?:imum)?\s*retail\s*price|mrp\s*\(?incl\.?\)?)[\s:.\-₹Rs]*(?:₹|rs\.?|inr)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i;
    const match = cleanText.match(mrpRegex);

    if (match && match[1]) {
      const price = match[1].replace(/,$/, '');
      const matchIndex = match.index ?? 0;
      const snippetStart = Math.max(0, matchIndex - 60);
      const snippetEnd = Math.min(cleanText.length, matchIndex + match[0].length + 80);
      const nearbyText = cleanText.slice(snippetStart, snippetEnd);
      const hasTaxes = taxPhraseRegex.test(nearbyText) || taxPhraseRegex.test(cleanText);

      return {
        value: `₹ ${price}${hasTaxes ? ' (incl. of all taxes)' : ''}`,
        confidence: findConfidenceNear(match[0]),
        hasTaxPhrase: hasTaxes,
      };
    }

    // Direct ₹ symbol followed by numbers
    const rupeeRegex = /₹\s*([0-9,]+(?:\.[0-9]{1,2})?)/;
    const rupeeMatch = cleanText.match(rupeeRegex);
    if (rupeeMatch && rupeeMatch[1]) {
      const price = rupeeMatch[1].replace(/,$/, '');
      const matchIndex = rupeeMatch.index ?? 0;
      const snippet = cleanText.slice(Math.max(0, matchIndex - 60), Math.min(cleanText.length, matchIndex + 100));
      const hasTaxes = taxPhraseRegex.test(snippet) || taxPhraseRegex.test(cleanText);

      return {
        value: `₹ ${price}${hasTaxes ? ' (incl. of all taxes)' : ''}`,
        confidence: findConfidenceNear(rupeeMatch[0]),
        hasTaxPhrase: hasTaxes,
      };
    }

    // Rs. pattern
    const rsRegex = /\bRs\.?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i;
    const rsMatch = cleanText.match(rsRegex);
    if (rsMatch && rsMatch[1]) {
      const price = rsMatch[1].replace(/,$/, '');
      const matchIndex = rsMatch.index ?? 0;
      const snippet = cleanText.slice(Math.max(0, matchIndex - 60), Math.min(cleanText.length, matchIndex + 100));
      const hasTaxes = taxPhraseRegex.test(snippet) || taxPhraseRegex.test(cleanText);

      return {
        value: `₹ ${price}${hasTaxes ? ' (incl. of all taxes)' : ''}`,
        confidence: findConfidenceNear(rsMatch[0]),
        hasTaxPhrase: hasTaxes,
      };
    }

    return {
      value: null,
      confidence: 0,
      hasTaxPhrase: false,
      reason: 'MRP declaration (with ₹, Rs, or MRP prefix) missing or illegible',
    };
  };

  // 3. Net Quantity
  const extractNetQuantity = (): { value: string | null; confidence: number; reason?: string } => {
    const netQtyPrefixRegex = /(?:net\s*(?:qty|quantity|wt|weight|vol|volume|content)[\s:.\-]*)(\d+(?:\.\d+)?\s*(?:kg|kgs|g|gm|gms|gram|grams|ml|l|ltr|liter|litres|n|units?|pieces?)\b)/i;
    const prefixMatch = cleanText.match(netQtyPrefixRegex);
    if (prefixMatch && prefixMatch[1]) {
      return {
        value: prefixMatch[1].trim(),
        confidence: findConfidenceNear(prefixMatch[0]),
      };
    }

    const metricRegex = /\b(\d+(?:\.\d+)?\s*(?:kg|kgs|gm|gms|gram|grams|ml|ltr|litre|litres|g(?![a-z])|l(?![a-z])))\b/i;
    const metricMatch = cleanText.match(metricRegex);
    if (metricMatch && metricMatch[1]) {
      const val = metricMatch[1].trim();
      return {
        value: val,
        confidence: findConfidenceNear(val),
      };
    }

    const countRegex = /\b(\d+\s*(?:N|Unit|Units|Piece|Pieces))\b/i;
    const countMatch = cleanText.match(countRegex);
    if (countMatch && countMatch[1]) {
      return {
        value: countMatch[1].trim(),
        confidence: findConfidenceNear(countMatch[0]),
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
    const mfgDateRegex = /(?:mfg\.?\s*date|mfd\.?|pkd\.?|packed\s*on|date\s*of\s*(?:mfg|packing))[\s:.\-]*([0-9]{1,2}[\/\-.][0-9]{2,4}|[A-Za-z]{3,9}\.?\s*20[0-9]{2}|20[0-9]{2}[\/\-.][0-9]{2})/i;
    const match = cleanText.match(mfgDateRegex);
    if (match && match[1]) {
      return {
        value: match[1].trim(),
        confidence: findConfidenceNear(match[0]),
      };
    }

    const bbRegex = /(?:best\s*before|use\s*by|exp\.?\s*date)[\s:.\-]*([0-9]{1,2}[\/\-.][0-9]{2,4}|[A-Za-z]{3,9}\.?\s*20[0-9]{2})/i;
    const bbMatch = cleanText.match(bbRegex);
    if (bbMatch && bbMatch[1]) {
      return {
        value: `Best Before: ${bbMatch[1].trim()}`,
        confidence: findConfidenceNear(bbMatch[0]),
      };
    }

    const monthYearRegex = /\b(0[1-9]|1[0-2])[\/\-.](20\d{2})\b/;
    const myMatch = cleanText.match(monthYearRegex);
    if (myMatch && myMatch[0]) {
      return {
        value: myMatch[0],
        confidence: findConfidenceNear(myMatch[0]),
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

    const phoneRegex = /(?:toll\s*free|care|helpline|call|phone|tel)?[\s:.\-]*(1800[\s\-]?\d{3}[\s\-]?\d{3,4}|\+?91[\s\-]?[6-9]\d{9}|\b[6-9]\d{9}\b)/i;
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
        confidence: findConfidenceNear(phoneMatch[1]),
      };
    }

    if (emailMatch && emailMatch[1]) {
      return {
        value: `Email: ${emailMatch[1]}`,
        confidence: findConfidenceNear(emailMatch[1]),
      };
    }

    if (/consumer\s*care|customer\s*care|feedback\s*desk|grievance/i.test(normalizedText)) {
      return {
        value: 'Consumer Care mentioned (Details require manual inspection)',
        confidence: 50,
      };
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
        const mrpExtraction = extractMRP();
        extraction = mrpExtraction;

        if (extraction.value !== null) {
          if (!mrpExtraction.hasTaxPhrase) {
            customStatus = 'warning';
            customReason = "MRP found but missing 'inclusive of all taxes' declaration — required under Rule 6(1)(f)";
            customSuggestion = "Add the phrase 'inclusive of all taxes' next to the MRP.";
          }
        }
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
      default:
        extraction = { value: null, confidence: 0, reason: 'Field not recognized' };
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
