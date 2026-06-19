import { describe, expect, it } from "vitest";

import { cn, formatDate } from "@/lib/utils";

describe("utils", () => {
  it("cn merges classes", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("formatDate formats date", () => {
    expect(formatDate("2026-06-18")).toContain("2026");
  });
});
