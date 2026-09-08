import React from 'react';
import { Globe, Info } from 'lucide-react';
import { CATEGORY_RULES, type Category } from '../rules';

interface CategorySelectorProps {
  category: Category;
  onCategoryChange: (category: Category) => void;
  isImported: boolean;
  onImportedChange: (imported: boolean) => void;
  disabled?: boolean;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  category,
  onCategoryChange,
  isImported,
  onImportedChange,
  disabled = false,
}) => {
  const currentRules = CATEGORY_RULES[category].getRules(isImported);
  const requiredCount = currentRules.filter((r) => r.required).length;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1">
          <label
            htmlFor="category-select"
            className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5"
          >
            1. Select Product Category
          </label>
          <div className="relative">
            <select
              id="category-select"
              value={category}
              onChange={(e) => onCategoryChange(e.target.value as Category)}
              disabled={disabled}
              className="w-full appearance-none bg-white text-gray-900 text-sm font-medium pl-3.5 pr-9 py-2.5 rounded-lg border border-gray-300 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="Food & Beverages">Food & Beverages (FSSAI + Legal Metrology)</option>
              <option value="Electronics">Electronics (E-Label & QR Declarations)</option>
              <option value="Cosmetics & Personal Care">Cosmetics & Personal Care</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500 text-xs">
              ▼
            </div>
          </div>
        </div>

        {/* Imported Product Checkbox */}
        <div className="sm:self-end pt-1">
          <label
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all select-none ${
              isImported
                ? 'bg-blue-50 border-blue-300 text-blue-800'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <input
              type="checkbox"
              checked={isImported}
              onChange={(e) => onImportedChange(e.target.checked)}
              disabled={disabled}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>Imported Product</span>
          </label>
        </div>
      </div>

      {/* Rules summary strip */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between text-xs text-gray-500 gap-2">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span>
            <strong className="font-semibold text-gray-700">{requiredCount} mandatory fields</strong> required under LMPC Rules 2011:
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {currentRules.map((rule) => (
            <span
              key={rule.key}
              className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                rule.required
                  ? 'bg-gray-100 text-gray-700 border border-gray-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200 italic'
              }`}
              title={rule.notes || (rule.required ? 'Mandatory' : 'Optional')}
            >
              {rule.label}
              {!rule.required && ' (QR)'}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
