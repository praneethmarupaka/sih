/**
 * rulesOverride.ts
 *
 * Provides a localStorage-based override layer for compliance rules.
 *
 * Strategy:
 *  - `rules.ts` contains the built-in baseline rules. It is NEVER mutated.
 *  - This module stores two lists in localStorage:
 *      ADDED_RULES_KEY   — admin-added rules (keyed by category)
 *      REMOVED_RULES_KEY — keys of rules that have been removed (keyed by category)
 *  - `getEffectiveRules(category, isImported)` merges the baseline with overrides
 *    to produce the final active rule list used by the compliance engine.
 *  - Past scan results are never retroactively changed — only new scans use
 *    the updated rule set.
 */

import { CATEGORY_RULES, type Category, type FieldRule } from '../rules';

// ─────────────────────────────────────────────────────────────────────────────
// Storage keys
// ─────────────────────────────────────────────────────────────────────────────
export const ADDED_RULES_KEY = 'rules_added';
export const REMOVED_RULES_KEY = 'rules_removed';
export const CUSTOM_CATEGORIES_KEY = 'rules_custom_categories';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** An admin-added rule stored in localStorage */
export interface AddedRule extends FieldRule {
  /** Which category this rule belongs to */
  category: Category | string;
  /** Timestamp when admin added this */
  addedAt: string;
}

/** A removed rule identified by category + key */
export interface RemovedRuleRef {
  category: Category | string;
  key: string;
}

/** A custom category added by admin */
export interface CustomCategory {
  name: string;
  description: string;
  addedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // ignore
  }
  return fallback;
}

function writeJSON<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ─────────────────────────────────────────────────────────────────────────────
// Added rules
// ─────────────────────────────────────────────────────────────────────────────
export function getAddedRules(): AddedRule[] {
  return readJSON<AddedRule[]>(ADDED_RULES_KEY, []);
}

export function saveAddedRules(rules: AddedRule[]): void {
  writeJSON(ADDED_RULES_KEY, rules);
}

export function addRule(category: Category | string, rule: FieldRule): void {
  const existing = getAddedRules();
  const newRule: AddedRule = { ...rule, category, addedAt: new Date().toISOString() };
  saveAddedRules([...existing, newRule]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Removed rules
// ─────────────────────────────────────────────────────────────────────────────
export function getRemovedRuleRefs(): RemovedRuleRef[] {
  return readJSON<RemovedRuleRef[]>(REMOVED_RULES_KEY, []);
}

export function saveRemovedRuleRefs(refs: RemovedRuleRef[]): void {
  writeJSON(REMOVED_RULES_KEY, refs);
}

export function removeRule(category: Category | string, key: string): void {
  const refs = getRemovedRuleRefs();
  // Avoid duplicates
  if (!refs.some((r) => r.category === category && r.key === key)) {
    saveRemovedRuleRefs([...refs, { category, key }]);
  }
}

export function restoreRule(category: Category | string, key: string): void {
  const refs = getRemovedRuleRefs();
  saveRemovedRuleRefs(refs.filter((r) => !(r.category === category && r.key === key)));
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom categories (optional step 6)
// ─────────────────────────────────────────────────────────────────────────────
export function getCustomCategories(): CustomCategory[] {
  return readJSON<CustomCategory[]>(CUSTOM_CATEGORIES_KEY, []);
}

export function saveCustomCategories(cats: CustomCategory[]): void {
  writeJSON(CUSTOM_CATEGORIES_KEY, cats);
}

export function addCustomCategory(name: string, description: string): void {
  const existing = getCustomCategories();
  if (!existing.some((c) => c.name.toLowerCase() === name.trim().toLowerCase())) {
    saveCustomCategories([...existing, { name: name.trim(), description: description.trim(), addedAt: new Date().toISOString() }]);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Core: get effective rules for a category (baseline + overrides)
// ─────────────────────────────────────────────────────────────────────────────
export function getEffectiveRules(
  category: Category | string,
  isImported: boolean
): FieldRule[] {
  const removedRefs = getRemovedRuleRefs();
  const addedRules = getAddedRules();

  const isRemoved = (key: string) =>
    removedRefs.some((r) => r.category === category && r.key === key);

  let baselineRules: FieldRule[] = [];

  // Get baseline from CATEGORY_RULES if it's a built-in category
  if (category in CATEGORY_RULES) {
    const config = CATEGORY_RULES[category as Category];
    baselineRules = config.getRules(isImported);
  }

  // Filter out removed baseline rules
  const filteredBaseline = baselineRules.filter((r) => !isRemoved(r.key));

  // Append admin-added rules for this category (that haven't been removed)
  const categoryAdded = addedRules
    .filter((r) => r.category === category && !isRemoved(r.key))
    .map(({ addedAt: _addedAt, category: _cat, ...rule }) => rule as FieldRule);

  return [...filteredBaseline, ...categoryAdded];
}

// ─────────────────────────────────────────────────────────────────────────────
// Get all categories including custom ones
// ─────────────────────────────────────────────────────────────────────────────
export function getAllCategories(): string[] {
  const builtIn = Object.keys(CATEGORY_RULES) as Category[];
  const custom = getCustomCategories().map((c) => c.name);
  return [...builtIn, ...custom];
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation: check if a field key/label is already active in a category
// ─────────────────────────────────────────────────────────────────────────────
export function isFieldNameActiveInCategory(
  category: Category | string,
  label: string,
  excludeKey?: string
): boolean {
  const activeRules = getEffectiveRules(category, false);
  return activeRules.some(
    (r) =>
      r.label.toLowerCase().trim() === label.toLowerCase().trim() &&
      r.key !== excludeKey
  );
}

// Generate a unique key for an admin-added rule from the label
export function generateRuleKey(label: string, category: string): string {
  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  return `admin_${category.toLowerCase().replace(/[^a-z0-9]/g, '')}_${base}_${Date.now().toString(36)}`;
}
