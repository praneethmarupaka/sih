import React from 'react';
import type { ComplianceReport, UserRole } from '../types/compliance';

interface PrintReportViewProps {
  report: ComplianceReport;
  role: UserRole;
}

export const PrintReportView: React.FC<PrintReportViewProps> = ({ report, role }) => {
  return (
    <div className="hidden print:block p-8 bg-white text-black font-serif text-sm leading-relaxed max-w-4xl mx-auto">
      {/* Official Header */}
      <div className="border-b-2 border-black pb-4 mb-6 text-center">
        <h1 className="text-xl font-bold uppercase tracking-widest">
          Legal Metrology Compliance Audit Report
        </h1>
        <p className="text-xs uppercase tracking-wider text-gray-700 mt-1">
          Verification under Legal Metrology (Packaged Commodities) Rules, 2011
        </p>
        <div className="mt-3 flex justify-between text-xs font-mono text-gray-600 border-t border-gray-300 pt-2">
          <span>Date: {new Date(report.timestamp).toLocaleString()}</span>
          <span>Category: {report.category}</span>
          <span>Auditor Role: {role}</span>
        </div>
      </div>

      {/* Summary Box */}
      <div className="border border-black p-4 mb-6 flex justify-between items-center bg-gray-50">
        <div>
          <p className="text-sm font-bold uppercase">
            Audit Verdict:{' '}
            <span className={report.isCompliant ? 'text-green-700' : 'text-red-700'}>
              {report.isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT / VIOLATIONS DETECTED'}
            </span>
          </p>
          <p className="text-xs text-gray-700 mt-1">
            Mandatory Declarations Satisfied: {report.passedCount} of {report.totalRequired}
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold font-mono">{report.score}%</span>
          <p className="text-[10px] uppercase tracking-wider">Compliance Index</p>
        </div>
      </div>

      {/* Detailed Field Audit Table */}
      <table className="w-full border-collapse border border-black text-xs mb-6">
        <thead>
          <tr className="bg-gray-100 border-b border-black">
            <th className="border border-black p-2 text-left">Mandatory Declaration</th>
            <th className="border border-black p-2 text-left">Status</th>
            <th className="border border-black p-2 text-left">Declared Content (OCR)</th>
            <th className="border border-black p-2 text-left">Auditor Observation / Remedy</th>
          </tr>
        </thead>
        <tbody>
          {report.fields.map((field) => (
            <tr key={field.key} className="border-b border-gray-300">
              <td className="border border-black p-2 font-semibold">
                {field.label}
                {!field.isRequired && ' (Optional/QR)'}
              </td>
              <td className="border border-black p-2 uppercase font-bold">
                {field.status === 'compliant' && 'COMPLIANT'}
                {field.status === 'violation' && 'VIOLATION'}
                {field.status === 'manual_review' && 'REVIEW REQUIRED'}
                {field.status === 'optional_qr' && 'QR DECLARABLE'}
              </td>
              <td className="border border-black p-2 font-mono">
                {field.value || 'NOT DECLARED'}
              </td>
              <td className="border border-black p-2 text-gray-700">
                {field.status === 'violation' ? field.suggestion : (field.reason || 'Verified on package')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Raw OCR Extract Transcript */}
      <div className="mb-8 border border-gray-400 p-3 bg-gray-50 text-[11px]">
        <p className="font-bold uppercase mb-1">OCR Transcript Extract:</p>
        <p className="font-mono whitespace-pre-wrap">{report.rawText}</p>
      </div>

      {/* Sign-off footer */}
      <div className="mt-12 pt-6 border-t border-black flex justify-between text-xs">
        <div>
          <p className="font-semibold">Automated Scanner Engine:</p>
          <p className="text-gray-600">LM Compliance Scanner v2026 (Client-side Tesseract OCR)</p>
        </div>
        <div className="text-right">
          <p className="border-b border-black w-48 inline-block mb-1"></p>
          <p className="font-semibold">Authorized Signatory / Seal</p>
        </div>
      </div>
    </div>
  );
};
