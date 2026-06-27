import { describe, expect, it } from "vitest";

import {
  DEFAULT_LOCALE,
  getPresetCategories,
  getPresetTemplates,
  isGenerationLanguage,
  notificationMessage,
  resolveLocale,
  serverMessage,
} from "@oura-pix/i18n";

describe("i18n shared behavior", () => {
  it("resolves locale from X-Oura-Locale before Accept-Language", () => {
    const headers = new Headers({
      "X-Oura-Locale": "ja",
      "Accept-Language": "en-US,en;q=0.9",
    });

    expect(resolveLocale({ headers })).toBe("ja");
  });

  it("falls back from Accept-Language and then default locale", () => {
    expect(resolveLocale({ headers: new Headers({ "Accept-Language": "en-US,en;q=0.9" }) }))
      .toBe("en");
    expect(resolveLocale({ headers: new Headers({ "Accept-Language": "fr-FR,fr;q=0.9" }) }))
      .toBe(DEFAULT_LOCALE);
  });

  it("formats server messages for the requested locale", () => {
    expect(serverMessage("en", "unauthorized")).toBe("Please sign in first");
    expect(notificationMessage("ja", "generationComplete", { imageCount: 3 })).toEqual({
      title: "生成が完了しました",
      message: "3 枚の画像生成が完了しました",
    });
  });

  it("returns localized preset category and template labels", () => {
    expect(getPresetCategories("en")[0]?.name).toBe("Apparel");
    expect(getPresetCategories("ja")[0]?.name).toBe("アパレル");
    expect(getPresetTemplates("en")[0]?.name).toBe("White background + model shots");
  });

  it("allows only supported generation languages", () => {
    expect(isGenerationLanguage("zh")).toBe(true);
    expect(isGenerationLanguage("en")).toBe(true);
    expect(isGenerationLanguage("ja")).toBe(true);
    expect(isGenerationLanguage("de")).toBe(false);
  });
});
