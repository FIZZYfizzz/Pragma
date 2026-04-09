/**
 * Float-based position utilities for ordering lanes and cards.
 *
 * Items are assigned positions like 1000, 2000, 3000...
 * Inserting between two items uses the midpoint, giving O(1) reorders.
 * Renormalization is needed when the gap between neighbors drops below 1.
 */

export function getBetweenPosition(before: number | null, after: number | null): number {
  if (before === null && after === null) return 1000
  if (before === null) {
    const target = (after ?? 1000) - 1000
    return target <= 0 ? (after ?? 1000) / 2 : target
  }
  if (after === null) return before + 1000
  return (before + after) / 2
}

/** Position to assign to a new item appended after all existing ones. */
export function getAppendPosition(items: { position: number }[]): number {
  if (items.length === 0) return 1000
  return Math.max(...items.map((i) => i.position)) + 1000
}

/** True when positions have converged too close to safely insert between. */
export function needsRenormalization(positions: number[]): boolean {
  const sorted = [...positions].sort((a, b) => a - b)
  for (let i = 1; i < sorted.length; i++) {
    if ((sorted[i]! - sorted[i - 1]!) < 1) return true
  }
  return false
}

/** Evenly spaced positions for a set of items: [1000, 2000, 3000, ...] */
export function normalizePositions(count: number): number[] {
  return Array.from({ length: count }, (_, i) => (i + 1) * 1000)
}
