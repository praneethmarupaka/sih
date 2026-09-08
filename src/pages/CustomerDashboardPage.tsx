import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createWorker } from 'tesseract.js';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { CategorySelector } from '../components/CategorySelector';
import { ImageUploader } from '../components/ImageUploader';
import { OCRProgress } from '../components/OCRProgress';
import { ComplianceReportCard } from '../components/ComplianceReportCard';
import { ScanHistory } from '../components/ScanHistory';
import { PrintReportView } from '../components/PrintReportView';
import { extractFields } from '../utils/extractor';
import {
  loadScanHistory,
  saveScanToHistory,
  clearScanHistory,
  createThumbnail,
} from '../utils/storage';
import type { Category } from '../rules';
import type { ComplianceReport, ScanHistoryItem } from '../types/compliance';
import type { SampleLabel } from '../utils/sampleLabels';

export const CustomerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  // Category & Rules
  const [category, setCategory] = useState<Category>('Food & Beverages');
  const [isImported, setIsImported] = useState<boolean>(false);

  // Image State
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Processing & OCR State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [ocrStatusText, setOcrStatusText] = useState<string>('');

  // Compliance Audit Result
  const [report, setReport] = useState<ComplianceReport | null>(null);

  // Scan History from localStorage
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

      const rawLines: string[] = result.data.text.split('\n').filter((l) => l.trim().length > 0);
      const lines = rawLines.map((lineText: string) => ({
        text: lineText,
        confidence: result.data.confidence ?? 80,
      }));

      const rawWords = (((result.data as any).words || []) as Array<{
        text: string;
        confidence: number;
        bbox: { x0: number; y0: number; x1: number; y1: number };
      }>);
      const words = rawWords.map((w) => ({
        text: w.text || '',
        confidence: w.confidence ?? 80,
        bbox: w.bbox || { x0: 0, y0: 0, x1: 0, y1: 0 },
      }));

      const auditReport = extractFields(
        result.data.text,
        lines,
        result.data.confidence ?? 80,
        category,
        isImported,
        words
      );

      auditReport.imagePreviewUrl = imagePreview;
      setReport(auditReport);

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

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 flex flex-col font-sans">
      {/* Printable view */}
      {report && <PrintReportView report={report} role="Consumer" />}

      {/* Header with logout */}
      <Header
        role="Consumer"
        currentUserName={currentUser}
        onSignOut={handleSignOut}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:px-8 space-y-6 no-print">
        <CategorySelector
          category={category}
          onCategoryChange={setCategory}
          isImported={isImported}
          onImportedChange={setIsImported}
          disabled={isProcessing}
        />

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

        {isProcessing && (
          <OCRProgress statusText={ocrStatusText} progress={ocrProgress} />
        )}

        {report && !isProcessing && (
          <ComplianceReportCard
            report={report}
            role="Consumer"
            onPrintReport={() => window.print()}
          />
        )}

        <ScanHistory
          history={history}
          onClearHistory={handleClearHistory}
        />
      </main>

      <footer className="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-400 no-print mt-auto">
        <p>
          LM Compliance Scanner &bull; 100% Client-Side OCR &bull; Legal Metrology Packaged Commodities (LMPC) Rules
        </p>
      </footer>
    </div>
  );
};
