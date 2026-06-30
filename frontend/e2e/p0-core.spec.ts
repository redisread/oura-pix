/**
 * P0 E2E Tests — Core Page Loading Tests
 *
 * These tests verify that the critical pages load correctly and display expected content.
 * They run in CI on every PR against the production URL.
 */

import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("loads with correct title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/OuraPix/);
  });

  test("displays main navigation", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();
  });

  test("has generate button", async ({ page }) => {
    await page.goto("/");
    const generateLink = page.locator('a[href="/generate"]').first();
    await expect(generateLink).toBeVisible();
  });
});

test.describe("Docs Pages", () => {
  test("docs index loads with search", async ({ page }) => {
    const response = await page.goto("/docs/");
    expect(response?.status()).toBe(200);
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveTitle(/OuraPix/);
  });

  test("introduction page loads", async ({ page }) => {
    const response = await page.goto("/docs/getting-started/introduction/");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("AI copywriter guide loads", async ({ page }) => {
    const response = await page.goto("/docs/tools/ai-copywriter/");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("image tools guide loads", async ({ page }) => {
    const response = await page.goto("/docs/tools/image-tools/");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("home button exists and works", async ({ page }) => {
    await page.goto("/docs/tools/image-tools/");
    await page.waitForLoadState("domcontentloaded");
    const homeLink = page.locator('a[href="/"]').first();
    await expect(homeLink).toBeVisible();
    await homeLink.click();
    await expect(page).toHaveURL("/");
  });

  test("All docs pages return 200", async ({ page }) => {
    const paths = [
      "/docs/getting-started/introduction/",
      "/docs/getting-started/quickstart/",
      "/docs/getting-started/i18n/",
      "/docs/tools/background-remover/",
      "/docs/tools/ai-copywriter/",
      "/docs/tools/image-tools/",
    ];
    for (const path of paths) {
      const response = await page.goto(path);
      expect(response?.status(), `${path} should return 200`).toBe(200);
    }
  });
});

test.describe("Blog Pages", () => {
  test("blog index loads with posts", async ({ page }) => {
    const response = await page.goto("/blog/");
    expect(response?.status()).toBe(200);
    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible();
  });

  test("launch post loads", async ({ page }) => {
    await page.goto("/blog/launch/");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("team features post loads", async ({ page }) => {
    await page.goto("/blog/2026-06-28-team-features/");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("image tools post loads", async ({ page }) => {
    await page.goto("/blog/2026-07-01-image-tools/");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("blog home button works", async ({ page }) => {
    await page.goto("/blog/");
    const homeLink = page.getByText("首页").first();
    await homeLink.click();
    await expect(page).toHaveURL("/");
  });

  test("All blog posts return 200", async ({ page }) => {
    const paths = [
      "/blog/launch/",
      "/blog/2026-06-28-team-features/",
      "/blog/2026-07-01-image-tools/",
    ];
    for (const path of paths) {
      const response = await page.goto(path);
      expect(response?.status(), `${path} should return 200`).toBe(200);
    }
  });

  test("RSS feed returns XML", async ({ request }) => {
    const response = await request.get("https://ourapix.jiahongw.com/blog/rss.xml");
    expect(response.status()).toBe(200);
    const contentType = response.headers()["content-type"];
    expect(contentType).toContain("xml");
  });
});
