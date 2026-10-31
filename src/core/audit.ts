export type AuditClassification = "UNKNOWN" | "LOW_VIEW" | "OUT_OF_RANGE";
export type InventoryRecord = { videoId: string; postId?: string | null };

export function isNumericGraphId(value: string): boolean {
  return /^\d+$/.test(value);
}

export function classifyViewCount(
  views: number | undefined,
  min: number,
  max: number
): AuditClassification {
  if (views === undefined || !Number.isFinite(views) || views < 0) return "UNKNOWN";
  return views >= min && views <= max ? "LOW_VIEW" : "OUT_OF_RANGE";
}

export function deduplicateInventory(records: InventoryRecord[]) {
  const seen = new Set<string>();
  const items: InventoryRecord[] = [];
  const duplicates = new Set<string>();
  const postToVideoIds: Record<string, string[]> = {};

  for (const record of records) {
    if (!record.videoId) continue;
    if (seen.has(record.videoId)) duplicates.add(record.videoId);
    else {
      seen.add(record.videoId);
      items.push(record);
    }
    if (record.postId) {
      postToVideoIds[record.postId] ||= [];
      if (!postToVideoIds[record.postId].includes(record.videoId)) {
        postToVideoIds[record.postId].push(record.videoId);
      }
    }
  }

  return { items, duplicateVideoIds: [...duplicates], postToVideoIds };
}
