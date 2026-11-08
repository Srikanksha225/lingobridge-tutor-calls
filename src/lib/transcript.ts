/**
 * Groups streaming caption fragments from the voice call into speaker turns.
 * Consecutive fragments from the same speaker join the same row; a change of speaker starts a new row.
 * Pure and unit-tested.
 */
export type CaptionRow = { id: number; role: "learner" | "tutor"; text: string };

export function appendCaption(rows: CaptionRow[], role: CaptionRow["role"], delta: string): CaptionRow[] {
  if (!delta) return rows;
  const last = rows[rows.length - 1];
  if (last && last.role === role) {
    return [...rows.slice(0, -1), { ...last, text: last.text + delta }];
  }
  const id = (last?.id ?? 0) + 1;
  return [...rows, { id, role, text: delta.replace(/^\s+/, "") }];
}

/** Learner rows that are complete (followed by a tutor row) and long enough to be worth analysing. */
export function completedLearnerRows(rows: CaptionRow[], includeLast = false): CaptionRow[] {
  return rows.filter((row, i) => {
    if (row.role !== "learner") return false;
    const complete = includeLast || i < rows.length - 1;
    return complete && wordCount(row.text) >= 2;
  });
}

export function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** The tutor line spoken just before a given learner row, for context. */
export function previousTutorLine(rows: CaptionRow[], rowId: number): string | null {
  const index = rows.findIndex((r) => r.id === rowId);
  for (let i = index - 1; i >= 0; i--) {
    const row = rows[i]!;
    if (row.role === "tutor") return row.text.trim().slice(-600) || null;
  }
  return null;
}
