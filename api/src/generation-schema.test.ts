import { describe, expect, it } from "vitest";

import { createGenerationSchema } from "./routes/generations";

const validRequest = {
  productImageId: "image_1",
  settings: {
    targetPlatform: "amazon",
    language: "zh",
    uiLocale: "zh-CN",
    count: 5,
    style: "professional",
    generateImages: true,
    imageCount: 5,
    aspectRatio: "1:1",
  },
};

describe("generation request schema", () => {
  it("accepts zh, en, and ja generation languages", () => {
    for (const language of ["zh", "en", "ja"]) {
      expect(
        createGenerationSchema.safeParse({
          ...validRequest,
          settings: { ...validRequest.settings, language },
        }).success
      ).toBe(true);
    }
  });

  it("rejects unsupported generation languages", () => {
    expect(
      createGenerationSchema.safeParse({
        ...validRequest,
        settings: { ...validRequest.settings, language: "de" },
      }).success
    ).toBe(false);
  });
});
