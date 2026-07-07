// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import Timer from "./Timer";

afterEach(() => {
  cleanup();
});

describe("Timer", () => {
  it("exibe o rótulo e o tempo formatado", () => {
    render(<Timer label="Tempo total" seconds={125} />);

    expect(screen.getByText("Tempo total")).toBeInTheDocument();
    expect(screen.getByText("02:05")).toBeInTheDocument();
  });
});
