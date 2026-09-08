import React from 'react';
import { BookOpen } from 'lucide-react';
import { CATEGORY_RULES, type Category } from '../rules';
import { getEffectiveRules, getAllCategories, getCustomCategories } from '../utils/rulesOverride';

export const LMPCRulesPage: React.FC = () => {
  const categories = getAllCategories();

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Legal Metrology (Packaged Commodities) Rules Matrix
            </h2>
            <p className="text-xs text-gray-500">
              Official mandatory declarations, tax phrase clauses, and QR code exemptions under LMPC Rules 2011 &amp; amendments
            </p>
          </div>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((catKey) => {
          const isBuiltIn = catKey in CATEGORY_RULES;
          const config = isBuiltIn ? CATEGORY_RULES[catKey as Category] : null;
          const customCats = getCustomCategories();
          const customInfo = customCats.find((c) => c.name === catKey);

          const categoryTitle = config ? config.category : catKey;
          const categoryDesc = config
            ? config.description
            : (customInfo ? customInfo.description : 'Custom product category');

          const domesticRules = getEffectiveRules(catKey, false);
          const importedRules = getEffectiveRules(catKey, true);
          const hasImportedDifference = importedRules.length !== domesticRules.length;

          return (
            <div
              key={catKey}
              className="rounded-xl border border-gray-200 bg-white p-5 space-y-3 flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-sm font-bold text-gray-900">{categoryTitle}</h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                    {domesticRules.filter((r) => r.required).length} Mandatory
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-3">{categoryDesc}</p>

                <div className="space-y-2">
                  {domesticRules.map((rule) => (
                    <div
                      key={rule.key}
                      className="bg-gray-50/70 rounded-lg border border-gray-200 p-2.5 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-800">{rule.label}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            rule.required
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {rule.required ? 'Mandatory' : 'Optional (QR)'}
                        </span>
                      </div>

                      {rule.mustContainPhrase && (
                        <p className="text-[11px] text-amber-800 font-medium">
                          &bull; Must contain phrase: <code className="bg-amber-50 px-1 rounded font-mono">"{rule.mustContainPhrase}"</code> ({rule.ruleReference})
                        </p>
                      )}

                      {rule.notes && (
                        <p className="text-[11px] text-blue-700 italic">&bull; {rule.notes}</p>
                      )}

                      <p className="text-[11px] text-gray-500">
                        Template: <span className="italic text-gray-600">{rule.suggestionIfMissing}</span>
                      </p>
                    </div>
                  ))}

                  {/* Show Imported extra field note if applicable */}
                  {hasImportedDifference && (
                    <div className="bg-indigo-50/50 rounded-lg border border-indigo-200 p-2 text-xs text-indigo-900">
                      <strong className="font-semibold">When Imported Product:</strong> adds mandatory{' '}
                      <code className="font-mono text-[11px]">countryOfOrigin</code> under Rule 6(1)(n).
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
