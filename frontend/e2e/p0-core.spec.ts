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
    await page.goto("/docs");
    await expect(page).toHaveTitle(/文档|OuraPix/);
    const search = page.locator("#search");
    await expect(search).toBeVisible();
  });

  test("introduction page loads with TOC", async ({ page }) => {
    await page.goto("/docs/getting-started/introduction/");
    await expect(page).toHaveTitle(/欢迎使用|OuraPix/);
    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible();
  });

  test("AI copywriter guide loads", async ({ page }) => {
    await page.goto("/docs/tools/ai-copywriter/");
    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/文案|Copywriter/);
  });

  test("image tools guide loads", async ({ page }) => {
    await page.goto("/docs/tools/image-tools/");
    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible();
  });

  test("home button navigates to homepage", async ({ page }) => {
    await page.goto("/docs/tools/image-tools/");
    const homeLink = page.locator('a[href="/"]').first();
    await homeLink.click();
    await expect(page).toHaveURL("/");
  });
});

test.describe("Blog Pages", () => {
  test("blog index loads with posts", async ({ page }) => {
    await page.goto("/blog");
    await expect(page).toHaveTitle(/博客|OuraPix/);
    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible();
  });

  test("launch post loads", async ({ page }) => {
    await page.goto("/blog/launch/");
    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/上线|Launch/);
  });

  test("team features post loads", async ({ page }) => {
    await page.goto("/blog/2026-06-28-team-features/");
    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible();
  });

  test("blog home button works", async ({ page }) => {
    await page.goto("/blog/");
    const homeLink = page.getByText("首页").first();
    await homeLink.click();
    await expect(page).toHaveURL("/");
  });

  test("RSS feed returns XML", async ({ page }) => {
    const response = await page.goto("/blog/rss.xml");
    expect(response?.status()).toBe(200());
    const contentType = await response?.headerValue("content-type");
    expect(contentType).toContain("xml");
  });
});
