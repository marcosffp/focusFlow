import { describe, expect, it } from "vitest";
import { formatDate } from "./formatDate";

describe("formatDate", () => {
  it("formata um timestamp incluindo dia, mês, ano e hora", () => {
    const result = formatDate(new Date(2026, 0, 15, 14, 30).getTime());

    expect(result).toContain("2026");
    expect(result).toContain("14:30");
  });
});
