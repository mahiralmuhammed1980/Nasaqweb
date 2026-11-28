import { describe, expect, it } from "vitest";
import { createMemoryLimiter } from "./rate-limit";

describe("createMemoryLimiter", () => {
  const window = { limit: 5, windowSec: 3600 };

  it("يسمح بـ 5 ويرفض السادس خلال الساعة", () => {
    let t = 0;
    const limiter = createMemoryLimiter(() => t);
    for (let i = 1; i <= 5; i++) {
      t += 1000;
      expect(limiter.check("ip", window).allowed).toBe(true);
    }
    t += 1000;
    const sixth = limiter.check("ip", window);
    expect(sixth.allowed).toBe(false);
    expect(sixth.retryAfterSec).toBeGreaterThan(0);
  });

  it("المفاتيح مستقلة", () => {
    const limiter = createMemoryLimiter(() => 0);
    for (let i = 0; i < 5; i++) limiter.check("a", window);
    expect(limiter.check("a", window).allowed).toBe(false);
    expect(limiter.check("b", window).allowed).toBe(true);
  });

  it("النافذة تنزلق: بعد ساعة يُسمح من جديد", () => {
    let t = 0;
    const limiter = createMemoryLimiter(() => t);
    for (let i = 0; i < 5; i++) limiter.check("a", window);
    expect(limiter.check("a", window).allowed).toBe(false);
    t = 3600 * 1000 + 1;
    expect(limiter.check("a", window).allowed).toBe(true);
  });
});
