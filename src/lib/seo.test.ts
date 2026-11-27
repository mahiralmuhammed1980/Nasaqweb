import { describe, expect, it } from "vitest";
import { absoluteUrl, jsonLd, localizedAlternates } from "./seo";

describe("seo", () => {
  it("يبني روابط مطلقة وhreflang", () => {
    const alt = localizedAlternates("en", "/products/x");
    expect(alt.canonical).toMatch(/\/en\/products\/x$/);
    expect(alt.languages.ar).toMatch(/\/ar\/products\/x$/);
    expect(alt.languages["x-default"]).toMatch(/\/ar\/products\/x$/);
    expect(absoluteUrl("ar")).toMatch(/\/ar$/);
  });
  it("يهرّب < داخل JSON-LD", () => {
    expect(jsonLd({ a: "</script><script>alert(1)</script>" })).not.toContain(
      "</script>",
    );
  });
});
