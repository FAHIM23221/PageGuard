import { describe, expect, it } from "vitest";
import { mergeVideoPages, classifyViews } from "../src/core/inventory";

describe("video inventory paging", () => {
  it("merges cursor pages without duplicate video IDs", () => {
    const merged = mergeVideoPages(
      [{ id: "a", description: "old" }, { id: "b" }],
      [{ id: "a", description: "updated" }, { id: "c" }]
    );
    expect(merged).toHaveLength(3);
    expect(merged.find(v => v.id === "a")?.description).toBe("updated");
  });
  it("does not treat unknown views as zero", () => {
    expect(classifyViews(undefined, 50)).toBe("UNKNOWN");
    expect(classifyViews(50, 50)).toBe("LOW_VIEW");
    expect(classifyViews(51, 50)).toBe("ABOVE_THRESHOLD");
  });
});
