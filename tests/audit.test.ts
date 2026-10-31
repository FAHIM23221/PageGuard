import { describe, expect, it } from "vitest";
import {
  isNumericGraphId,
  classifyViewCount,
  deduplicateInventory,
} from "../src/core/audit";

describe("audit primitives", () => {
  it("accepts numeric Graph IDs only", () => {
    expect(isNumericGraphId("123")).toBe(true);
    expect(isNumericGraphId("12x")).toBe(false);
    expect(isNumericGraphId("")).toBe(false);
  });

  it("keeps missing views unknown, not zero", () => {
    expect(classifyViewCount(undefined, 0, 50)).toBe("UNKNOWN");
    expect(classifyViewCount(50, 0, 50)).toBe("LOW_VIEW");
    expect(classifyViewCount(51, 0, 50)).toBe("OUT_OF_RANGE");
  });

  it("deduplicates video IDs but preserves multiple videos per post", () => {
    const result = deduplicateInventory([
      { videoId: "v1", postId: "p1" },
      { videoId: "v1", postId: "p1" },
      { videoId: "v2", postId: "p1" },
    ]);
    expect(result.items).toHaveLength(2);
    expect(result.duplicateVideoIds).toEqual(["v1"]);
    expect(result.postToVideoIds.p1).toEqual(["v1", "v2"]);
  });
});
