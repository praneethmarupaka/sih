import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  QrCode,
  Printer,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
  Lightbulb,
  ShoppingBag,
  Building2,
  Tag,
  Scale,
  ShieldAlert,
} from 'lucide-react';
import type { ComplianceReport, UserRole, ExtractedField } from '../types/compliance';
import { EvidenceOverlay } from './EvidenceOverlay';

interface ComplianceReportCardProps {
  report: ComplianceReport;
  role: UserRole;
  onPrintReport: () => void;
  onCreateIssue?: (field: ExtractedField) => void;
}

export const ComplianceReportCard: React.FC<ComplianceReportCardProps> = ({
  report,
  role,
  onPrintReport,
  onCreateIssue,
}) => {
  const [showRawText, setShowRawText] = useState(false);

  // Status badge styling helper
  const getStatusBadge = (field: ExtractedField) => {
    switch (field.status) {
      case 'compliant':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
          label: 'Compliant',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
          label: field.key === 'mrp' ? 'Warning (Unable to Verify)' : 'Warning',
          badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
          dot: 'bg-amber-500',
        };
      case 'violation':
        return {
          icon: <XCircle className="w-5 h-5 text-rose-600 shrink-0" />,
          label: field.key === 'mrp' && field.value ? 'Non-Compliant (Tax Declaration Missing)' : 'Violation',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
        };
      case 'manual_review':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
          label: `Manual Review (${field.confidence}% OCR)`,
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
        };
      case 'optional_qr':
        return {
          icon: <QrCode className="w-5 h-5 text-blue-600 shrink-0" />,
          label: 'QR Declarable',
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
        };
    }
  };

  // Overall Score Color Styling
  const getScoreColor = (score: number) => {
    if (score === 100) return 'text-emerald-700 bg-emerald-50 border-emerald-300';
    if (score >= 60) return 'text-amber-700 bg-amber-50 border-amber-300';
    return 'text-rose-700 bg-rose-50 border-rose-300';
  };

  // Helpers for Consumer Quick View
  const manufacturerField = report.fields.find((f) => f.key === 'manufacturerName');
  const mrpField = report.fields.find((f) => f.key === 'mrp');
  const netQtyField = report.fields.find((f) => f.key === 'netQuantity');

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden print-break-inside-avoid">
      {/* Top Header Strip */}
      <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900">
              LMPC Compliance Audit Report
            </h2>
            <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700 font-medium">
              {report.category}
              {report.isImported && ' (Imported)'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Audit generated on {new Date(report.timestamp).toLocaleString()}
          </p>
        </div>

        {/* Feature 4: Download Report Button (uses window.print()) */}
        <div className="flex items-center gap-3 no-print">
          <button
            type="button"
            onClick={onPrintReport}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            title="Download or print this report as PDF using system print"
          >
            <Printer className="w-3.5 h-3.5 text-gray-600" />
            Download Report (PDF)
          </button>
        </div>
      </div>

      {/* Main Score Banner */}
      <div className="p-6 border-b border-gray-100 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {/* Big Compliance Score Badge */}
            <div
              className={`flex flex-col items-center justify-center w-24 h-24 rounded-2xl border-2 font-black ${getScoreColor(
                report.score
              )}`}
            >
              <span className="text-3xl tracking-tight">{report.score}%</span>
              <span className="text-[10px] uppercase font-bold tracking-wider">Score</span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                    report.isCompliant
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300'
                  }`}
                >
                  {report.isCompliant ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Compliant Packaging
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      Incomplete / Non-Compliant
                    </>
                  )}
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  {report.passedCount} of {report.totalRequired} mandatory fields satisfied
                </span>
              </div>
              <p className="text-xs text-gray-600 max-w-xl">
                {report.isCompliant
                  ? 'All mandatory Legal Metrology Package Commodities declarations are identified on this pack label.'
                  : 'Action required: Key mandatory consumer declarations are missing or illegible. Review the suggestions below to avoid regulatory notice.'}
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-4 text-xs text-gray-500 border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-6 shrink-0">
            <div>
              <p className="text-[10px] uppercase font-semibold text-gray-400">OCR Engine</p>
              <p className="font-medium text-gray-800">Tesseract Client v7</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold text-gray-400">Avg Confidence</p>
              <p className="font-medium text-gray-800">{report.averageConfidence}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature 3: Evidence Highlighting Overlay */}
      {report.imagePreviewUrl && (
        <div className="p-6 border-b border-gray-100 bg-gray-50/40">
          <EvidenceOverlay
            imageSrc={report.imagePreviewUrl}
            fieldBoxes={report.fieldBoxes || []}
          />
        </div>
      )}

      {/* Feature 5: CONSUMER VIEW - Simplified layout */}
      {role === 'Consumer' ? (
        <div className="p-6 bg-gray-50/50 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
              Consumer Quick Information
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Product / Manufacturer */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold mb-1">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span>Brand / Manufacturer</span>
              </div>
              <p className="text-sm font-bold text-gray-900 break-words">
                {manufacturerField?.value || (
                  <span className="text-rose-600 italic">Not Declared on Pack</span>
                )}
              </p>
            </div>

            {/* MRP */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold mb-1">
                <Tag className="w-4 h-4 text-gray-400" />
                <span>Maximum Retail Price</span>
              </div>
              <p className="text-lg font-black text-emerald-700 break-words">
                {mrpField?.value || (
                  <span className="text-sm text-rose-600 font-bold italic">Not Specified</span>
                )}
              </p>
            </div>

            {/* Net Quantity / Net Weight */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold mb-1">
                <Scale className="w-4 h-4 text-gray-400" />
                <span>Net Quantity / Net Weight</span>
              </div>
              <p className="text-base font-bold text-gray-900 break-words">
                {netQtyField?.value || (
                  <span className="text-sm text-rose-600 font-bold italic">Not Specified</span>
                )}
              </p>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
            <strong>Consumer Tip:</strong> Always ensure the price charged at the counter does not
            exceed the printed Maximum Retail Price (MRP).
          </div>
        </div>
      ) : (
        /* INSPECTOR & MANUFACTURER VIEW: Full Field-by-Field Report Card */
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              {role === 'Manufacturer' ? 'Packaging Compliance Checklist' : 'Field-by-Field Inspection Record'}
            </h3>
            <span className="text-xs text-gray-400">
              Evaluated against LMPC Rules, 2011
            </span>
          </div>

          <div className="space-y-3">
            {report.fields.map((field) => {
              const badge = getStatusBadge(field);

              return (
                <div
                  key={field.key}
                  className={`p-4 rounded-xl border transition-all ${
                    field.status === 'violation'
                      ? 'bg-rose-50/40 border-rose-200'
                      : field.status === 'warning' || field.status === 'manual_review'
                      ? 'bg-amber-50/40 border-amber-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {badge.icon}
                      <div>
                        <span className="text-xs font-bold text-gray-900">
                          {field.label}
                        </span>
                        {!field.isRequired && (
                          <span className="ml-2 text-[10px] text-blue-600 font-semibold uppercase bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            Optional (E-Label)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badge.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>

                      {/* Feature 4: Inspector Create Issue Button - Only for actual violations */}
                      {role === 'Inspector' && field.status === 'violation' && onCreateIssue && (
                        <button
                          type="button"
                          onClick={() => onCreateIssue(field)}
                          className="no-print inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                          title="Log this packaging violation to issues tracker"
                        >
                          <ShieldAlert className="w-3 h-3" />
                          <span>Create Issue</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Extracted Value */}
                  <div className="ml-7 space-y-1.5">
                    {field.value ? (
                      <div className="bg-white/80 p-2 rounded-md border border-gray-200 text-xs font-mono text-gray-900 break-words">
                        {field.value}
                      </div>
                    ) : (
                      <div className="text-xs text-rose-600 font-semibold italic">
                        Not Found on Label
                      </div>
                    )}

                    {/* Reason if failed, warning, or manual review */}
                    {field.reason && (
                      <div className="flex items-start gap-1.5 text-xs text-gray-700">
                        {field.status === 'warning' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        )}
                        <span>{field.reason}</span>
                      </div>
                    )}

                    {/* Hardcoded suggestion if violation or warning */}
                    {field.suggestion && (
                      <div className="flex items-start gap-1.5 p-2 rounded-lg bg-amber-50/80 border border-amber-200 text-xs text-amber-900">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-semibold">Remediation Suggestion:</strong>{' '}
                          {field.suggestion}
                        </div>
                      </div>
                    )}

                    {/* Special Notes (e.g. QR for electronics) */}
                    {field.notes && (
                      <p className="text-[11px] text-blue-700 italic">
                        ℹ️ Note: {field.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Raw Extracted OCR Text Audit Section */}
      <div className="border-t border-gray-200 bg-gray-50/70 p-4 no-print">
        <button
          type="button"
          onClick={() => setShowRawText(!showRawText)}
          className="flex items-center justify-between w-full text-xs font-semibold text-gray-700 hover:text-gray-900 cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-gray-500" />
            <span>Raw OCR Extracted Text (Audit Proof)</span>
            <span className="text-[10px] text-gray-400 font-normal">
              ({report.rawText.length} characters)
            </span>
          </div>
          {showRawText ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showRawText && (
          <div className="mt-3">
            <pre className="p-3 bg-gray-900 text-gray-100 rounded-lg text-xs font-mono overflow-x-auto max-h-56 leading-relaxed whitespace-pre-wrap select-all">
              {report.rawText || 'No text extracted.'}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
