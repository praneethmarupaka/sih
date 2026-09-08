import React, { useRef, useEffect, useState } from 'react';
import { Eye, EyeOff, Layers } from 'lucide-react';
import type { FieldBoundingBox } from '../types/compliance';

interface EvidenceOverlayProps {
  imageSrc: string;
  fieldBoxes: FieldBoundingBox[];
  className?: string;
}

export const EvidenceOverlay: React.FC<EvidenceOverlayProps> = ({
  imageSrc,
  fieldBoxes,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  // Redraw canvas whenever boxes or dimensions update
  useEffect(() => {
    if (!showOverlay || !imageLoaded) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas || img.naturalWidth === 0) return;

    // Match canvas coordinate space to image natural resolution
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const box of fieldBoxes) {
      const { x0, y0, x1, y1 } = box.bbox;
      const width = x1 - x0;
      const height = y1 - y0;

      if (width <= 0 || height <= 0) continue;

      let strokeColor = '#10B981'; // Green (compliant)
      let fillColor = 'rgba(16, 185, 129, 0.22)';
      let labelBg = '#059669';

      if (box.status === 'warning' || box.status === 'manual_review') {
        strokeColor = '#F59E0B'; // Amber (warning / review)
        fillColor = 'rgba(245, 158, 11, 0.25)';
        labelBg = '#D97706';
      } else if (box.status === 'violation') {
        strokeColor = '#EF4444'; // Red (violation)
        fillColor = 'rgba(239, 68, 68, 0.25)';
        labelBg = '#DC2626';
      }

      // Draw bounding box
      ctx.fillStyle = fillColor;
      ctx.fillRect(x0, y0, width, height);

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = Math.max(3, Math.round(canvas.width / 300));
      ctx.strokeRect(x0, y0, width, height);

      // Draw label pill above box
      const fontSize = Math.max(13, Math.round(canvas.width / 45));
      ctx.font = `bold ${fontSize}px sans-serif`;
      const textMetrics = ctx.measureText(box.label);
      const pillWidth = textMetrics.width + 16;
      const pillHeight = fontSize + 8;
      const pillY = Math.max(0, y0 - pillHeight - 2);

      ctx.fillStyle = labelBg;
      ctx.beginPath();
      ctx.roundRect(x0, pillY, pillWidth, pillHeight, 4);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.textBaseline = 'middle';
      ctx.fillText(box.label, x0 + 8, pillY + pillHeight / 2);
    }
  }, [fieldBoxes, showOverlay, imageLoaded]);

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      {/* Evidence Toggle Bar */}
      <div className="w-full flex items-center justify-between pb-2 px-1 text-xs text-gray-500 no-print">
        <div className="flex items-center gap-1.5 font-semibold text-gray-700">
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          <span>OCR Evidence Overlay</span>
          <span className="text-[10px] text-gray-400 font-normal">
            ({fieldBoxes.length} {fieldBoxes.length === 1 ? 'region' : 'regions'} detected)
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowOverlay(!showOverlay)}
          className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
        >
          {showOverlay ? (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>Hide Highlights</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>Show Highlights</span>
            </>
          )}
        </button>
      </div>

      {/* Image with Overlaid Canvas */}
      <div
        ref={containerRef}
        className="relative rounded-xl border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center max-h-[440px] w-full"
      >
        <img
          ref={imgRef}
          src={imageSrc}
          alt="Packaging Label Preview with Evidence"
          onLoad={() => setImageLoaded(true)}
          className="max-h-[420px] max-w-full object-contain rounded-lg"
        />

        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />
      </div>

      {/* Legend */}
      {showOverlay && fieldBoxes.length > 0 && (
        <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-500 no-print">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
            <span>Compliant Declaration</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
            <span>Warning / Review</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
            <span>Violation Zone</span>
          </div>
        </div>
      )}
    </div>
  );
};
