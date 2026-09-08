import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createWorker } from 'tesseract.js';
import { useAuth } from '../context/AuthContext';
import { Sidebar, type AppPage } from '../components/Sidebar';
import { Dashboard } from '../components/Dashboard';
import { AllProductsPage } from '../components/AllProductsPage';
import { LMPCRulesPage } from '../components/LMPCRulesPage';
import { ReportsPage } from '../components/ReportsPage';
import { CategorySelector } from '../components/CategorySelector';
import { ImageUploader } from '../components/ImageUploader';
import { OCRProgress } from '../components/OCRProgress';
import { ComplianceReportCard } from '../components/ComplianceReportCard';
import { ScanHistory } from '../components/ScanHistory';
import { IssuesList } from '../components/IssuesList';
import { PrintReportView } from '../components/PrintReportView';
import { extractFields } from '../utils/extractor';
import {
  loadScanHistory,
  saveScanToHistory,
  clearScanHistory,
  createThumbnail,
} from '../utils/storage';
import {
  loadIssues,
  saveNewIssue,
  updateIssueStatus,
  updateIssueComments,
  deleteIssue,
} from '../utils/issuesStorage';
import type { Category } from '../rules';
import type {
  ComplianceReport,
  ScanHistoryItem,
  ComplianceIssue,
  IssueStatus,
  ExtractedField,
} from '../types/compliance';
import type { SampleLabel } from '../utils/sampleLabels';

export const InspectorDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  // Page Navigation
  const [activePage, setActivePage] = useState<AppPage>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

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

  // Compliance Issues Tracker
  const [issues, setIssues] = useState<ComplianceIssue[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setHistory(loadScanHistory());
    setIssues(loadIssues());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

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

  const handlePrintReport = () => window.print();

  const handleCreateIssue = (field: ExtractedField) => {
    const productName =
      report?.fields.find((f) => f.key === 'manufacturerName')?.value || 'Scanned Product';
    const violationText = field.reason || `${field.label}: Declaration Missing`;
    const updated = saveNewIssue(
      productName,
      violationText,
      field.key,
      category,
      field.suggestion ? `Recommended: ${field.suggestion}` : ''
    );
    setIssues(updated);
    const newIssue = updated[0];
    showToast(`Issue ${newIssue.id} created! View in the "Violations" page.`);
  };

  const handleStatusChange = (id: string, newStatus: IssueStatus) => {
    setIssues(updateIssueStatus(id, newStatus));
  };

  const handleCommentsChange = (id: string, comments: string) => {
    setIssues(updateIssueComments(id, comments));
  };

  const handleDeleteIssue = (id: string) => {
    setIssues(deleteIssue(id));
  };

  const handlePrintScanItem = (item: ScanHistoryItem) => {
    if (report && report.timestamp === item.timestamp) {
      window.print();
    } else {
      const reconstructedReport: ComplianceReport = {
        category: item.category,
        isImported: item.isImported,
        fields: [
          {
            key: 'manufacturerName',
            label: 'Manufacturer Name',
            value: item.productName || null,
            status: item.productName ? 'compliant' : 'violation',
            confidence: 90,
            isRequired: true,
          },
          {
            key: 'mrp',
            label: 'Maximum Retail Price (MRP)',
            value: item.mrp || null,
            status: item.mrp ? 'compliant' : 'violation',
            confidence: 90,
            isRequired: true,
          },
          {
            key: 'netQuantity',
            label: 'Net Quantity',
            value: item.netQuantity || null,
            status: item.netQuantity ? 'compliant' : 'violation',
            confidence: 90,
            isRequired: true,
          },
        ],
        fieldBoxes: [],
        score: item.score,
        passedCount: item.passedCount,
        totalRequired: item.totalRequired,
        isCompliant: item.isCompliant,
        rawText: `Past Scan Record: ${item.productName}\nCategory: ${item.category}\nScore: ${item.score}%\nDate: ${item.timestamp}`,
        averageConfidence: 88,
        timestamp: item.timestamp,
        thumbnailUrl: item.thumbnail,
      };
      setReport(reconstructedReport);
      setTimeout(() => window.print(), 100);
    }
  };

  const openIssuesCount = issues.filter((i) => i.status === 'Open').length;

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const renderScannerContent = () => (
    <>
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
          role="Inspector"
          onPrintReport={handlePrintReport}
          onCreateIssue={handleCreateIssue}
        />
      )}
      <ScanHistory
        history={history}
        onClearHistory={handleClearHistory}
      />
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 flex font-sans">
      {/* Printable view */}
      {report && <PrintReportView report={report} role="Inspector" />}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold flex items-center gap-2 border border-gray-700 no-print">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setActivePage('violations')}
            className="underline ml-2 text-blue-400 hover:text-blue-300 cursor-pointer"
          >
            Go to Violations →
          </button>
        </div>
      )}

      {/* Sidebar */}
      <Sidebar
        role="Inspector"
        currentUserName={currentUser}
        activePage={activePage}
        onNavigate={(page) => setActivePage(page)}
        onSignOut={handleSignOut}
        issuesCount={openIssuesCount}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:px-8 space-y-6 no-print">
          {activePage === 'dashboard' ? (
            <Dashboard
              history={history}
              issues={issues}
              role="Inspector"
              onNavigate={(page) => setActivePage(page)}
            />
          ) : activePage === 'scanner' ? (
            renderScannerContent()
          ) : activePage === 'all-products' ? (
            <AllProductsPage
              history={history}
              onClearHistory={handleClearHistory}
              onSelectScan={() => setActivePage('scanner')}
            />
          ) : activePage === 'violations' ? (
            <IssuesList
              issues={issues}
              onStatusChange={handleStatusChange}
              onCommentsChange={handleCommentsChange}
              onDeleteIssue={handleDeleteIssue}
            />
          ) : activePage === 'rules' ? (
            <LMPCRulesPage />
          ) : activePage === 'reports' ? (
            <ReportsPage
              history={history}
              role="Inspector"
              onPrintScan={handlePrintScanItem}
            />
          ) : null}
        </main>

        <footer className="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-400 no-print mt-auto">
          <p>
            LM Compliance Scanner &bull; 100% Client-Side OCR &bull; Legal Metrology Packaged Commodities (LMPC) Rules
          </p>
        </footer>
      </div>
    </div>
  );
};
