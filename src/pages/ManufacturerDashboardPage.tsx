import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createWorker } from 'tesseract.js';
import { useAuth } from '../context/AuthContext';
import { Briefcase, LogOut } from 'lucide-react';
import { CategorySelector } from '../components/CategorySelector';
import { ImageUploader } from '../components/ImageUploader';
import { OCRProgress } from '../components/OCRProgress';
import { ComplianceReportCard } from '../components/ComplianceReportCard';
import { ScanHistory } from '../components/ScanHistory';
import { PrintReportView } from '../components/PrintReportView';
import { extractFields } from '../utils/extractor';
import { performMrpRegionFallback } from '../utils/mrpRegionFallback';
import {
  loadScanHistory,
  saveScanToHistory,
  clearScanHistory,
  createThumbnail,
} from '../utils/storage';
import type { Category } from '../rules';
import type { ComplianceReport, ScanHistoryItem } from '../types/compliance';
import type { SampleLabel } from '../utils/sampleLabels';

export const ManufacturerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, currentUserId, currentRole, logout } = useAuth();

  const [category, setCategory] = useState<Category>('Food & Beverages');
  const [isImported, setIsImported] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [ocrStatusText, setOcrStatusText] = useState<string>('');
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);

  // Guard against asynchronous OCR race conditions / stale scan overrides
  const activeScanIdRef = useRef<string>('');

  useEffect(() => {
    setHistory(loadScanHistory(currentUserId, currentRole));
  }, [currentUserId, currentRole]);

  const handleClearHistory = () => {
    if (window.confirm('Clear all saved scan history?')) {
      clearScanHistory(currentUserId, currentRole);
      setHistory([]);
    }
  };

  const handleImageSelected = (dataUrl: string, sampleInfo?: SampleLabel) => {
    activeScanIdRef.current = '';
    setImagePreview(dataUrl);
    setReport(null);
    setOcrProgress(0);
    setOcrStatusText('');
    if (sampleInfo) {
      setCategory(sampleInfo.category);
      setIsImported(sampleInfo.isImported);
    }
  };

  const handleClearImage = () => {
    activeScanIdRef.current = '';
    setImagePreview(null);
    setReport(null);
    setOcrProgress(0);
    setOcrStatusText('');
  };

  const handleRunScan = useCallback(async () => {
    if (!imagePreview) return;

    const currentScanId = `scan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    activeScanIdRef.current = currentScanId;

    // Reset previous extraction state completely
    setReport(null);
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

      if (activeScanIdRef.current !== currentScanId) return;

      const rawLines = result.data.text.split('\n').filter((l) => l.trim().length > 0);
      const lines = rawLines.map((lineText: string) => ({
        text: lineText,
        confidence: result.data.confidence ?? 80,
      }));
      const rawWords = (((result.data as any).words || []) as Array<{
        text: string; confidence: number;
        bbox: { x0: number; y0: number; x1: number; y1: number };
      }>);
      const words = rawWords.map((w) => ({
        text: w.text || '',
        confidence: w.confidence ?? 80,
        bbox: w.bbox || { x0: 0, y0: 0, x1: 0, y1: 0 },
      }));
      let auditReport = extractFields(result.data.text, lines, result.data.confidence ?? 80, category, isImported, words);

      // Fallback verification pass: when MRP is detected but tax declaration not verified
      const initialMrp = auditReport.fields.find((f) => f.key === 'mrp');
      if (initialMrp?.value && initialMrp.status !== 'compliant') {
        setOcrStatusText('Refining MRP region verification...');
        const fallbackRes = await performMrpRegionFallback(imagePreview, words, worker);
        if (fallbackRes) {
          auditReport = extractFields(
            result.data.text,
            lines,
            result.data.confidence ?? 80,
            category,
            isImported,
            words,
            {
              secondPassAttempted: true,
              secondPassText: fallbackRes.fallbackText,
              isLowConfidence: fallbackRes.fallbackConfidence < 70,
            }
          );
        }
      }

      if (activeScanIdRef.current !== currentScanId) return;

      auditReport.imagePreviewUrl = imagePreview;
      setReport(auditReport);
      try {
        const thumb = await createThumbnail(imagePreview);
        const mfgField = auditReport.fields.find((f) => f.key === 'manufacturerName');
        const mrpField = auditReport.fields.find((f) => f.key === 'mrp');
        const netField = auditReport.fields.find((f) => f.key === 'netQuantity');
        const updatedHistory = saveScanToHistory(
          {
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
          },
          currentUserId,
          currentRole
        );

        if (activeScanIdRef.current === currentScanId) {
          setHistory(updatedHistory);
        }
      } catch (err) {
        console.warn('Could not save to history:', err);
      }
    } catch (err) {
      if (activeScanIdRef.current === currentScanId) {
        console.error('OCR Processing failed:', err);
        alert('OCR failed to parse the image. Please try a clearer or higher resolution photo.');
      }
    } finally {
      if (worker) { try { await worker.terminate(); } catch { /* ignore */ } }
      if (activeScanIdRef.current === currentScanId) {
        setIsProcessing(false);
      }
    }
  }, [imagePreview, category, isImported]);

  const handleSignOut = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 flex flex-col font-sans">
      {report && <PrintReportView report={report} role="Manufacturer" />}

      {/* Header */}
      <header className="border-b border-gray-200 bg-white no-print">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-600 text-white rounded-lg shadow-sm">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 tracking-tight leading-tight">
                LM Compliance — Manufacturer Portal
              </h1>
              <p className="text-[11px] text-gray-500 leading-tight">
                {currentUser || 'Manufacturer'} &bull; LMPC Self-Compliance Verification
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300">
              Manufacturer
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-rose-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:px-8 space-y-6 no-print">
        <CategorySelector category={category} onCategoryChange={setCategory}
          isImported={isImported} onImportedChange={setIsImported} disabled={isProcessing} />
        <ImageUploader imagePreview={imagePreview} onImageSelected={handleImageSelected}
          onClearImage={handleClearImage} isProcessing={isProcessing} onScanClick={handleRunScan}
          onCategorySelect={(cat, imported) => { setCategory(cat); setIsImported(imported); }} />
        {isProcessing && <OCRProgress statusText={ocrStatusText} progress={ocrProgress} />}
        {report && !isProcessing && (
          <ComplianceReportCard report={report} role="Manufacturer"
            onPrintReport={() => window.print()} />
        )}
        <ScanHistory history={history} onClearHistory={handleClearHistory} />
      </main>

      <footer className="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-400 no-print mt-auto">
        <p>LM Compliance Scanner &bull; 100% Client-Side OCR &bull; Legal Metrology Packaged Commodities (LMPC) Rules</p>
      </footer>
    </div>
  );
};
