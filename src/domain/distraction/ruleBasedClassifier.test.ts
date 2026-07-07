import { describe, expect, it } from "vitest";
import { createRuleBasedClassifier } from "./ruleBasedClassifier";

describe("createRuleBasedClassifier", () => {
  it("pede confirmação ao usuário quando o domínio está na lista de distração", async () => {
    const classifier = createRuleBasedClassifier(["youtube.com"]);

    const decision = await classifier.classify({
      domain: "youtube.com",
      url: "https://youtube.com/watch?v=1",
    });

    expect(decision).toBe("ask-user");
  });

  it("não classifica como distração quando o domínio não está na lista", async () => {
    const classifier = createRuleBasedClassifier(["youtube.com"]);

    const decision = await classifier.classify({
      domain: "github.com",
      url: "https://github.com",
    });

    expect(decision).toBe("not-distraction");
  });
});
