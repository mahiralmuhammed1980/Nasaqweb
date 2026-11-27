import { describe, expect, it } from "vitest";
import {
  MAX_IMAGE_BYTES,
  buildObjectKey,
  validateImageUpload,
} from "./image-upload";

describe("validateImageUpload", () => {
  it("يقبل JPG وPNG وWebP ضمن 5MB", () => {
    expect(validateImageUpload("image/jpeg", 1000)).toBe("ok");
    expect(validateImageUpload("image/png", MAX_IMAGE_BYTES)).toBe("ok");
    expect(validateImageUpload("image/webp", 1)).toBe("ok");
  });
  it("يرفض الأنواع الأخرى (SVG وGIF وملفات تنفيذية)", () => {
    for (const type of [
      "image/svg+xml",
      "image/gif",
      "application/pdf",
      "text/html",
      "",
    ]) {
      expect(validateImageUpload(type, 1000)).toBe("TYPE");
    }
  });
  it("يرفض الحجم الزائد أو غير الصالح", () => {
    expect(validateImageUpload("image/png", MAX_IMAGE_BYTES + 1)).toBe("SIZE");
    expect(validateImageUpload("image/png", 0)).toBe("SIZE");
    expect(validateImageUpload("image/png", -5)).toBe("SIZE");
    expect(validateImageUpload("image/png", 1.5)).toBe("SIZE");
  });
});

describe("buildObjectKey", () => {
  it("يبني مفتاحاً فريداً بامتداد صحيح", () => {
    const a = buildObjectKey("image/webp", new Date("2026-03-05T00:00:00Z"));
    expect(a).toMatch(/^uploads\/2026\/03\/[0-9a-f-]{36}\.webp$/);
    expect(buildObjectKey("image/webp")).not.toBe(buildObjectKey("image/webp"));
  });
});
