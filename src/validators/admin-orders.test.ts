import { describe, expect, it } from "vitest";
import { parseOrderFilters, replySchema } from "./admin-orders";

describe("parseOrderFilters", () => {
  it("يقبل القيم الصحيحة", () => {
    expect(
      parseOrderFilters({
        status: "NEW",
        from: "2026-01-01",
        to: "2026-02-01",
        q: " أحمد ",
        page: "3",
      }),
    ).toMatchObject({
      status: "NEW",
      from: "2026-01-01",
      to: "2026-02-01",
      q: "أحمد",
      page: 3,
    });
  });
  it("يهمل القيم غير الصالحة", () => {
    expect(
      parseOrderFilters({ status: "HACK", from: "tomorrow", page: "-4" }),
    ).toEqual({
      status: undefined,
      productId: undefined,
      from: undefined,
      to: undefined,
      q: undefined,
      page: 1,
    });
  });
});

describe("replySchema", () => {
  it("الموضوع والنص مطلوبان", () => {
    expect(
      replySchema.safeParse({ id: "x", subject: "", body: "y" }).success,
    ).toBe(false);
    expect(
      replySchema.safeParse({ id: "x", subject: "s", body: "y" }).success,
    ).toBe(true);
  });
});
