export type VideoRecord = {
  id: string;
  description?: string;
  views?: number;
  permalink_url?: string;
  created_time?: string;
};

export function mergeVideoPages(existing: VideoRecord[], incoming: VideoRecord[]) {
  const byId = new Map<string, VideoRecord>();
  for (const video of existing) if (video.id) byId.set(video.id, video);
  for (const video of incoming) {
    if (!video.id) continue;
    const prior = byId.get(video.id);
    byId.set(video.id, prior ? { ...prior, ...video } : video);
  }
  return [...byId.values()];
}

export function classifyViews(views: number | undefined, max: number) {
  if (views === undefined || !Number.isFinite(views) || views < 0) return "UNKNOWN";
  return views <= max ? "LOW_VIEW" : "ABOVE_THRESHOLD";
}
