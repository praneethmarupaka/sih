import React from 'react';
import { Loader2 } from 'lucide-react';

interface OCRProgressProps {
  statusText: string;
  progress: number; // 0 to 100
}

export const OCRProgress: React.FC<OCRProgressProps> = ({ statusText, progress }) => {
  return (
    <div className="bg-white border border-blue-200 rounded-xl p-6 shadow-xs text-center space-y-4">
      <div className="flex items-center justify-center">
        <div className="relative">
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto space-y-2">
        <h3 className="text-sm font-bold text-gray-900">
          Scanning Packaging Label (Tesseract.js OCR)
        </h3>
        <p className="text-xs text-gray-500 capitalize">
          {statusText || 'Extracting label text on device...'}
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.max(5, Math.min(100, progress))}%` }}
          />
        </div>

        <div className="flex justify-between text-[11px] text-gray-400 font-medium">
          <span>Client-side WebWorker</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
};
