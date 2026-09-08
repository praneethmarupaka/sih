import type { Category, FieldStatus, UserRole } from '../rules';

export type { UserRole, Category, FieldStatus };

export type IssueStatus = 'Open' | 'Under Review' | 'Resolved';

export interface ComplianceIssue {
  id: string; // e.g. LM-2026-00001
  productName: string;
  violation: string;
  fieldKey: string;
  category: string;
  status: IssueStatus;
  inspectorComments: string;
  createdAt: string;
}

export interface BoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface OCRWord {
  text: string;
  confidence: number;
  bbox: BoundingBox;
}

export interface FieldBoundingBox {
  fieldKey: string;
  label: string;
  status: FieldStatus;
  bbox: BoundingBox;
}

export interface ExtractedField {
  key: string;
  label: string;
  value: string | null;
  status: FieldStatus;
  confidence: number;
  reason?: string;
  suggestion?: string;
  notes?: string;
  isRequired: boolean;
  bbox?: BoundingBox;
}

export interface ComplianceReport {
  category: Category;
  isImported: boolean;
  fields: ExtractedField[];
  fieldBoxes: FieldBoundingBox[];
  score: number; // 0 to 100
  passedCount: number;
  totalRequired: number;
  isCompliant: boolean;
  rawText: string;
  averageConfidence: number;
  timestamp: string;
  imagePreviewUrl?: string;
  thumbnailUrl?: string;
}

export interface ScanHistoryItem {
  id: string;
  timestamp: string;
  category: Category;
  isImported: boolean;
  score: number;
  isCompliant: boolean;
  thumbnail: string;
  productName: string;
  passedCount: number;
  totalRequired: number;
  mrp?: string;
  netQuantity?: string;
}

export interface ExtractorInput {
  text: string;
  lines: Array<{ text: string; confidence: number }>;
  words?: OCRWord[];
  overallConfidence: number;
  category: Category;
  isImported: boolean;
}
