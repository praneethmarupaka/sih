import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, X, RefreshCw } from 'lucide-react';
import { SAMPLE_LABELS, generateSampleImage, type SampleLabel } from '../utils/sampleLabels';
import type { Category } from '../rules';

interface ImageUploaderProps {
  imagePreview: string | null;
  onImageSelected: (dataUrl: string, sampleInfo?: SampleLabel) => void;
  onClearImage: () => void;
  isProcessing: boolean;
  onScanClick: () => void;
  onCategorySelect?: (cat: Category, isImported: boolean) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  imagePreview,
  onImageSelected,
  onClearImage,
  isProcessing,
  onScanClick,
  onCategorySelect,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onImageSelected(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleLoadSample = async (sample: SampleLabel) => {
    try {
      setLoadingSample(true);
      if (onCategorySelect) {
        onCategorySelect(sample.category, sample.isImported);
      }
      const dataUrl = await generateSampleImage(sample);
      onImageSelected(dataUrl, sample);
    } finally {
      setLoadingSample(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            2. Product Label Photo
          </h2>
          <p className="text-xs text-gray-500">
            Upload clear photo of the packaging, or load a pre-built compliance test label
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileChange(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {!imagePreview ? (
        <div>
          {/* Dropzone & Primary Blue Button */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-gray-300 hover:border-blue-400 bg-gray-50/50'
            }`}
          >
            <div className="mx-auto w-14 h-14 mb-4 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
              <UploadCloud className="w-7 h-7" />
            </div>

            <p className="text-base font-semibold text-gray-800 mb-1">
              Drag & drop packaging photo here, or browse
            </p>
            <p className="text-xs text-gray-500 mb-5">
              Supports JPEG, PNG, WEBP (front/back label with MRP & Mfg details)
            </p>

            {/* The single prominent blue upload button specified in prompt */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-all cursor-pointer focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <UploadCloud className="w-4 h-4" />
              Upload Label Photo
            </button>
          </div>

          {/* Instant Test Presets */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-gray-700">
                Or test instantly with pre-verified packaging labels:
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SAMPLE_LABELS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  disabled={loadingSample || isProcessing}
                  onClick={() => handleLoadSample(sample)}
                  className="flex items-start gap-2.5 p-2.5 text-left rounded-lg border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-200 transition-all text-xs group cursor-pointer disabled:opacity-50"
                >
                  <span
                    className={`mt-0.5 inline-block w-2 h-2 rounded-full shrink-0 ${
                      sample.expectedOutcome === 'Compliant' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 group-hover:text-blue-700 truncate">
                      {sample.name}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">{sample.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Image Preview State */
        <div className="space-y-4">
          <div className="relative rounded-xl border border-gray-200 bg-gray-50 p-2 overflow-hidden flex items-center justify-center max-h-[380px]">
            <img
              src={imagePreview}
              alt="Label Preview"
              className="max-h-[360px] max-w-full object-contain rounded-lg shadow-xs"
            />
            <button
              type="button"
              onClick={onClearImage}
              disabled={isProcessing}
              className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white text-gray-700 hover:text-rose-600 rounded-full shadow-md transition-colors cursor-pointer border border-gray-200 disabled:opacity-50"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-gray-300 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Replace Photo
            </button>

            {/* Trigger Scan Button */}
            <button
              type="button"
              onClick={onScanClick}
              disabled={isProcessing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <ImageIcon className="w-4 h-4" />
              {isProcessing ? 'Processing OCR...' : 'Run Compliance Scan'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
