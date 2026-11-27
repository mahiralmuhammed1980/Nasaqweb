import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Markdown } from "./markdown";

describe("Markdown", () => {
  it("يعرض Markdown عادياً", () => {
    const html = renderToStaticMarkup(
      <Markdown>{"## عنوان\n\n- بند"}</Markdown>,
    );
    expect(html).toContain("<h2>عنوان</h2>");
    expect(html).toContain("<li>بند</li>");
  });

  it("لا ينفّذ <script> ولا معالجات الأحداث ولا روابط javascript:", () => {
    const html = renderToStaticMarkup(
      <Markdown>
        {
          '<script>alert(1)</script>\n\n<img src=x onerror="alert(1)">\n\n[x](javascript:alert(1))'
        }
      </Markdown>,
    );
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("javascript:");
  });
});
