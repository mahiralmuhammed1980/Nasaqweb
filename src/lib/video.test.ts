import { describe, expect, it } from "vitest";
import { embedUrl, isValidVideoId, posterUrl } from "./video";

describe("video", () => {
  it("يقبل معرّف YouTube صحيحاً ويبني رابطاً بلا كوكيز", () => {
    expect(embedUrl("YOUTUBE", "M7lc1UVf-VE")).toBe(
      "https://www.youtube-nocookie.com/embed/M7lc1UVf-VE",
    );
    expect(posterUrl("YOUTUBE", "M7lc1UVf-VE")).toContain("i.ytimg.com");
  });
  it("يرفض المعرّفات الخبيثة", () => {
    expect(isValidVideoId("YOUTUBE", '"><script>')).toBe(false);
    expect(embedUrl("YOUTUBE", "../../evil")).toBeNull();
  });
  it("Bunny يتطلب libraryId/guid", () => {
    expect(
      isValidVideoId("BUNNY", "123/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
    ).toBe(true);
    expect(isValidVideoId("BUNNY", "abc")).toBe(false);
    expect(
      posterUrl("BUNNY", "123/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
    ).toBeNull();
  });
});
