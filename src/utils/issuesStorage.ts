import type { ComplianceIssue, IssueStatus } from '../types/compliance';

const ISSUES_KEY = 'lm_compliance_issues_v1';

function getLocalStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof localStorage !== 'undefined') {
    return localStorage;
  }
  return null;
}

export function loadIssues(): ComplianceIssue[] {
  try {
    const storage = getLocalStorage();
    if (!storage) return [];
    const raw = storage.getItem(ISSUES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to load issues from localStorage:', err);
    return [];
  }
}

export function saveNewIssue(
  productName: string,
  violation: string,
  fieldKey: string,
  category: string,
  comments = ''
): ComplianceIssue[] {
  const issues = loadIssues();
  const nextNum = issues.length + 1;
  const id = `LM-2026-${String(nextNum).padStart(5, '0')}`;

  const newIssue: ComplianceIssue = {
    id,
    productName: productName || 'Packaged Product',
    violation,
    fieldKey,
    category,
    status: 'Open',
    inspectorComments: comments,
    createdAt: new Date().toISOString(),
  };

  const updated = [newIssue, ...issues];
  const storage = getLocalStorage();
  if (storage) {
    storage.setItem(ISSUES_KEY, JSON.stringify(updated));
  }
  return updated;
}

export function updateIssueStatus(id: string, status: IssueStatus): ComplianceIssue[] {
  const issues = loadIssues().map((issue) =>
    issue.id === id ? { ...issue, status } : issue
  );
  const storage = getLocalStorage();
  if (storage) {
    storage.setItem(ISSUES_KEY, JSON.stringify(issues));
  }
  return issues;
}

export function updateIssueComments(id: string, inspectorComments: string): ComplianceIssue[] {
  const issues = loadIssues().map((issue) =>
    issue.id === id ? { ...issue, inspectorComments } : issue
  );
  const storage = getLocalStorage();
  if (storage) {
    storage.setItem(ISSUES_KEY, JSON.stringify(issues));
  }
  return issues;
}

export function deleteIssue(id: string): ComplianceIssue[] {
  const issues = loadIssues().filter((issue) => issue.id !== id);
  const storage = getLocalStorage();
  if (storage) {
    storage.setItem(ISSUES_KEY, JSON.stringify(issues));
  }
  return issues;
}

export function clearAllIssues(): void {
  try {
    const storage = getLocalStorage();
    if (storage) {
      storage.removeItem(ISSUES_KEY);
    }
  } catch (err) {
    console.warn('Failed to clear issues:', err);
  }
}
