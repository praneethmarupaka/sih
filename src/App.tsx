import { useState, useEffect, useCallback } from 'react';
import { createWorker } from 'tesseract.js';
import { Header } from './components/Header';
import { CategorySelector } from './components/CategorySelector';
import { ImageUploader } from './components/ImageUploader';
import { OCRProgress } from './components/OCRProgress';
import { ComplianceReportCard } from './components/ComplianceReportCard';
import { ScanHistory } from './components/ScanHistory';
import { PrintReportView } from './components/PrintReportView';
import { extractFields } from './utils/extractor';
import {
  loadScanHistory,
  saveScanToHistory,
  clearScanHistory,
  createThumbnail,
} from './utils/storage';
import type { Category, UserRole } from './rules';
import type { ComplianceReport, ScanHistoryItem } from './types/compliance';
import type { SampleLabel } from './utils/sampleLabels';

export function App() {
  // 1. Role View (Inspector / Manufacturer / Consumer)
  const [role, setRole] = useState<UserRole>('Inspector');

  // 2. Category & Rules
  const [category, setCategory] = useState<Category>('Food & Beverages');
  const [isImported, setIsImported] = useState<boolean>(false);

  // 3. Image State
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // 4. Processing & OCR State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [ocrStatusText, setOcrStatusText] = useState<string>('');

  // 5. Compliance Audit Result
  const [report, setReport] = useState<ComplianceReport | null>(null);

  // 6. Scan History from localStorage
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);

  useEffect(() => {
    setHistory(loadScanHistory());
  }, []);

  const handleClearHistory = () => {
    if (window.confirm('Clear all saved scan history?')) {
      clearScanHistory();
      setHistory([]);
    }
  };

  const handleImageSelected = (dataUrl: string, sampleInfo?: SampleLabel) => {
    setImagePreview(dataUrl);
    setReport(null);
    if (sampleInfo) {
      setCategory(sampleInfo.category);
      setIsImported(sampleInfo.isImported);
    }
  };

  const handleClearImage = () => {
    setImagePreview(null);
    setReport(null);
    setOcrProgress(0);
    setOcrStatusText('');
  };

  // Run Tesseract.js OCR client-side
  const handleRunScan = useCallback(async () => {
    if (!imagePreview) return;

    setIsProcessing(true);
    setOcrProgress(5);
    setOcrStatusText('Initializing Tesseract OCR worker...');

    let worker = null;
    try {
      worker = await createWorker('eng', 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') {
            const pct = Math.round(m.progress * 100);
            setOcrProgress(pct);
            setOcrStatusText(`Analyzing label characters (${pct}%)...`);
          } else {
            setOcrStatusText(m.status);
          }
        },
      });

      setOcrStatusText('Scanning label image for legal declarations...');
      const result = await worker.recognize(imagePreview);

      // Extract lines safely
      const rawLines: string[] = result.data.text.split('\n').filter((l) => l.trim().length > 0);
      const lines = rawLines.map((lineText: string) => ({
        text: lineText,
        confidence: result.data.confidence ?? 80,
      }));

      // Run Rule Engine
      const auditReport = extractFields(
        result.data.text,
        lines,
        result.data.confidence ?? 80,
        category,
        isImported
      );

      auditReport.imagePreviewUrl = imagePreview;
      setReport(auditReport);

      // Save to localStorage Scan History
      try {
        const thumb = await createThumbnail(imagePreview);
        const mfgField = auditReport.fields.find((f) => f.key === 'manufacturerName');
        const mrpField = auditReport.fields.find((f) => f.key === 'mrp');
        const netField = auditReport.fields.find((f) => f.key === 'netQuantity');

        const updatedHistory = saveScanToHistory({
          timestamp: auditReport.timestamp,
          category: auditReport.category,
          isImported: auditReport.isImported,
          score: auditReport.score,
          isCompliant: auditReport.isCompliant,
          thumbnail: thumb,
          productName: mfgField?.value || 'Packaged Product',
          passedCount: auditReport.passedCount,
          totalRequired: auditReport.totalRequired,
          mrp: mrpField?.value || undefined,
          netQuantity: netField?.value || undefined,
        });

        setHistory(updatedHistory);
      } catch (err) {
        console.warn('Could not save to history:', err);
      }
    } catch (err) {
      console.error('OCR Processing failed:', err);
      alert('OCR failed to parse the image. Please try a clearer or higher resolution photo.');
    } finally {
      if (worker) {
        try {
          await worker.terminate();
        } catch {
          // ignore termination error
        }
      }
      setIsProcessing(false);
    }
  }, [imagePreview, category, isImported]);

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans">
      {/* Header with Role Toggle */}
      <Header role={role} onRoleChange={setRole} />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 sm:px-6 space-y-6">
        {/* Printable view (only shown during window.print()) */}
        {report && <PrintReportView report={report} role={role} />}

        {/* Screen view (hidden during window.print()) */}
        <div className="no-print space-y-6">
          {/* 1. Category Selection & Rules Engine */}
          <CategorySelector
            category={category}
            onCategoryChange={setCategory}
            isImported={isImported}
            onImportedChange={setIsImported}
            disabled={isProcessing}
          />

          {/* 2. Image Uploader */}
          <ImageUploader
            imagePreview={imagePreview}
            onImageSelected={handleImageSelected}
            onClearImage={handleClearImage}
            isProcessing={isProcessing}
            onScanClick={handleRunScan}
            onCategorySelect={(cat, imported) => {
              setCategory(cat);
              setIsImported(imported);
            }}
          />

          {/* OCR Processing Spinner */}
          {isProcessing && (
            <OCRProgress statusText={ocrStatusText} progress={ocrProgress} />
          )}

          {/* Compliance Report Card */}
          {report && !isProcessing && (
            <ComplianceReportCard
              report={report}
              role={role}
              onPrintReport={handlePrintReport}
            />
          )}

          {/* 3. Scan History (localStorage) */}
          <ScanHistory
            history={history}
            onClearHistory={handleClearHistory}
          />
        </div>
      </main>

      {/* Minimal clean footer */}
      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400 no-print">
        <p>
          LM Compliance Scanner &bull; 100% Client-Side OCR &bull; Legal Metrology Packaged Commodities (LMPC) Rules
        </p>
      </footer>
    </div>
  );
}

export default App;
