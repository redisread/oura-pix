import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const packageRoot = path.resolve(new URL("..", import.meta.url).pathname);
const repoRoot = path.resolve(packageRoot, "../..");
const locales = ["zh-CN", "en", "ja"];
const hardcodedScanRoots = ["frontend/src", "api/src"];
const apiScanRoots = ["api/src/routes", "api/src/middleware", "api/src/lib"];
const apiScanFiles = ["api/src/index.ts"];
const hardcodedAllowlist = new Set([
  // Base Chinese seed data is intentionally retained for no-migration preset matching.
  "api/src/services/categoryService.ts",
]);

const userVisibleEnglishAllowlist = new Set([
  // Brand/product names and technical tokens that should remain stable.
  "OuraPix",
  "API",
  "Amazon",
  "Shopify",
  "eBay",
  "Etsy",
  "Web Vitals",
  "JSON",
  "CSV",
  "PNG",
  "JPEG",
  "WebP",
  "URL",
  "ID",
  "Google",
  "GitHub",
  "Light",
  "Dark",
  "Auto",
]);

function isAllowedUserVisibleEnglish(text) {
  if (!text) return true;
  if (userVisibleEnglishAllowlist.has(text)) return true;
  if (/\p{Script=Han}/u.test(text)) return true;
  if (/^[A-Z0-9_ -]+$/.test(text)) return true;
  if (/^https?:\/\//.test(text)) return true;
  return false;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function flatten(value, prefix = "", out = {}) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => flatten(item, `${prefix}[${index}]`, out));
    return out;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      flatten(child, prefix ? `${prefix}.${key}` : key, out);
    }
    return out;
  }
  out[prefix] = value;
  return out;
}

function assertComplete(kind) {
  const byLocale = Object.fromEntries(
    locales.map((locale) => [
      locale,
      flatten(readJson(path.join(packageRoot, "messages", kind, `${locale}.json`))),
    ])
  );
  const keys = Object.keys(byLocale["zh-CN"]).sort();

  for (const locale of locales) {
    const current = byLocale[locale];
    const missing = keys.filter((key) => !(key in current));
    const empty = Object.entries(current)
      .filter(([, value]) => typeof value === "string" && value.trim() === "")
      .map(([key]) => key);
    if (missing.length || empty.length) {
      throw new Error(
        `${kind}/${locale} failed i18n check. Missing: ${missing.join(", ") || "none"}. Empty: ${
          empty.join(", ") || "none"
        }`
      );
    }
  }
}

function walkFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "paraglide") continue;
      walkFiles(file, out);
      continue;
    }
    if (/\.(astro|ts|tsx|js|jsx)$/.test(entry.name) && !entry.name.endsWith(".test.ts")) {
      out.push(file);
    }
  }
  return out;
}

function assertNoUnexpectedHardcodedChinese() {
  const violations = [];
  for (const root of hardcodedScanRoots) {
    const absoluteRoot = path.join(repoRoot, root);
    if (!fs.existsSync(absoluteRoot)) continue;
    for (const file of walkFiles(absoluteRoot)) {
      const relative = path.relative(repoRoot, file);
      if (hardcodedAllowlist.has(relative)) continue;
      const lines = fs.readFileSync(file, "utf8").split("\n");
      lines.forEach((line, index) => {
        if (/\p{Script=Han}/u.test(line)) {
          violations.push(`${relative}:${index + 1}: ${line.trim()}`);
        }
      });
    }
  }

  if (violations.length > 0) {
    throw new Error(
      `Unexpected hardcoded Chinese strings found outside allowlist:\n${violations
        .slice(0, 80)
        .join("\n")}${violations.length > 80 ? `\n...and ${violations.length - 80} more` : ""}`
    );
  }
}

function assertNoFixedLocaleFormatting() {
  const violations = [];
  const root = path.join(repoRoot, "frontend/src");
  if (!fs.existsSync(root)) return;

  for (const file of walkFiles(root)) {
    const relative = path.relative(repoRoot, file);
    const lines = fs.readFileSync(file, "utf8").split("\n");
    lines.forEach((line, index) => {
      if (/\.toLocale(?:String|DateString|TimeString)\(\s*["']zh-CN["']/.test(line)) {
        violations.push(`${relative}:${index + 1}: ${line.trim()}`);
      }
    });
  }

  if (violations.length > 0) {
    throw new Error(
      `Fixed zh-CN date/time formatting found in frontend code:\n${violations.join("\n")}`
    );
  }
}

function assertNoHardcodedApiErrorMessages() {
  const violations = [];

  for (const root of apiScanRoots) {
    const absoluteRoot = path.join(repoRoot, root);
    if (!fs.existsSync(absoluteRoot)) continue;

    for (const file of walkFiles(absoluteRoot)) {
      const relative = path.relative(repoRoot, file);
      const lines = fs.readFileSync(file, "utf8").split("\n");
      lines.forEach((line, index) => {
        if (/\bmessage:\s*["'][A-Z][^"']*[a-z][^"']*["']/.test(line)) {
          violations.push(`${relative}:${index + 1}: ${line.trim()}`);
        }
      });
    }
  }
  for (const relative of apiScanFiles) {
    const file = path.join(repoRoot, relative);
    if (!fs.existsSync(file)) continue;
    const lines = fs.readFileSync(file, "utf8").split("\n");
    lines.forEach((line, index) => {
      if (/\bmessage:\s*["'][A-Z][^"']*[a-z][^"']*["']/.test(line)) {
        violations.push(`${relative}:${index + 1}: ${line.trim()}`);
      }
    });
  }

  if (violations.length > 0) {
    throw new Error(
      `Hardcoded API error messages found. Use serverMessage(locale, key):\n${violations
        .slice(0, 120)
        .join("\n")}${violations.length > 120 ? `\n...and ${violations.length - 120} more` : ""}`
    );
  }
}

function assertNoHardcodedPageMetadata() {
  const violations = [];
  const root = path.join(repoRoot, "frontend/src/pages");
  if (!fs.existsSync(root)) return;

  for (const file of walkFiles(root)) {
    if (!file.endsWith(".astro")) continue;
    const relative = path.relative(repoRoot, file);
    const lines = fs.readFileSync(file, "utf8").split("\n");
    lines.forEach((line, index) => {
      if (
        /const\s+(title|description)\s*=\s*["']/.test(line) ||
        /<Layout[^>]*\btitle=["']/.test(line) ||
        /<Layout[^>]*\bdescription=["']/.test(line)
      ) {
        violations.push(`${relative}:${index + 1}: ${line.trim()}`);
      }
    });
  }

  if (violations.length > 0) {
    throw new Error(
      `Hardcoded page metadata found. Use Paraglide messages instead:\n${violations.join("\n")}`
    );
  }
}

function assertNoVisibleEnglishInLocalizedUi() {
  const violations = [];
  const root = path.join(repoRoot, "frontend/src");
  if (!fs.existsSync(root)) return;

  const visibleTextPattern = />\s*([^<>{}`]*[A-Za-z][^<>{}`]*)\s*</g;

  for (const file of walkFiles(root)) {
    const relative = path.relative(repoRoot, file);
    if (!/\.(astro|tsx|jsx)$/.test(file)) continue;
    const lines = fs.readFileSync(file, "utf8").split("\n");

    lines.forEach((line, index) => {
      if (
        /=>|Promise<|interface |type |:\s*\{|Authorization:|op_xxx|curl |[<>]=?\s*["']/.test(line)
      ) {
        return;
      }
      let match;
      while ((match = visibleTextPattern.exec(line)) !== null) {
        const text = match[1].trim();
        if (isAllowedUserVisibleEnglish(text)) continue;
        violations.push(`${relative}:${index + 1}: ${text}`);
      }
    });
  }

  if (violations.length > 0) {
    throw new Error(
      `Hardcoded visible English text found in localized UI:\n${violations
        .slice(0, 120)
        .join("\n")}${violations.length > 120 ? `\n...and ${violations.length - 120} more` : ""}`
    );
  }
}

function assertNoHardcodedLocalizedUiStringLiterals() {
  const violations = [];
  const root = path.join(repoRoot, "frontend/src");
  if (!fs.existsSync(root)) return;

  const propertyTextPattern =
    /\b(?:label|title|description|placeholder|message|text|heading|subtitle|empty|error|success|warning|tooltip|ariaLabel|alt)\s*:\s*["']([A-Z][^"']*[A-Za-z][^"']*)["']/g;
  const returnTextPattern = /\breturn\s+["']([A-Z][^"']*[A-Za-z][^"']*)["']/g;
  const fallbackTextPattern = /\|\|\s*["']([A-Za-z][^"']*\s+[^"']*[A-Za-z][^"']*)["']/g;

  for (const file of walkFiles(root)) {
    const relative = path.relative(repoRoot, file);
    const lines = fs.readFileSync(file, "utf8").split("\n");

    lines.forEach((line, index) => {
      if (/interface |type |Promise<|Authorization:|Content-Type|curl /.test(line)) return;

      for (const pattern of [propertyTextPattern, returnTextPattern, fallbackTextPattern]) {
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(line)) !== null) {
          const text = match[1].trim();
          if (isAllowedUserVisibleEnglish(text)) continue;
          violations.push(`${relative}:${index + 1}: ${text}`);
        }
      }
    });
  }

  if (violations.length > 0) {
    throw new Error(
      `Hardcoded localized UI string literals found. Use Paraglide messages instead:\n${violations
        .slice(0, 120)
        .join("\n")}${violations.length > 120 ? `\n...and ${violations.length - 120} more` : ""}`
    );
  }
}

function assertNoHardcodedMailCopy() {
  const violations = [];
  const file = path.join(repoRoot, "api/src/lib/mail.ts");
  if (!fs.existsSync(file)) return;

  const lines = fs.readFileSync(file, "utf8").split("\n");
  lines.forEach((line, index) => {
    if (/subject:\s*(["'`])/.test(line) && !line.includes("mailText(")) {
      violations.push(`api/src/lib/mail.ts:${index + 1}: ${line.trim()}`);
    }
    if (/<(?:h2|p|a)\b[^>]*>\s*[A-Za-z][^<{]*<\/(?:h2|p|a)>/.test(line)) {
      violations.push(`api/src/lib/mail.ts:${index + 1}: ${line.trim()}`);
    }
  });

  if (violations.length > 0) {
    throw new Error(
      `Hardcoded email copy found. Use mailMessage(locale, key):\n${violations.join("\n")}`
    );
  }
}

assertComplete("ui");
assertComplete("server");
assertNoUnexpectedHardcodedChinese();
assertNoFixedLocaleFormatting();
assertNoHardcodedApiErrorMessages();
assertNoHardcodedPageMetadata();
assertNoVisibleEnglishInLocalizedUi();
assertNoHardcodedLocalizedUiStringLiterals();
assertNoHardcodedMailCopy();

const outdir = fs.mkdtempSync(path.join(os.tmpdir(), "oura-pix-paraglide-"));
execFileSync(
  "pnpm",
  [
    "--dir",
    path.join(repoRoot, "frontend"),
    "exec",
    "paraglide-js",
    "compile",
    "--project",
    path.join(packageRoot, "project.inlang"),
    "--outdir",
    outdir,
  ],
  { stdio: "inherit" }
);

const messages = await import(pathToFileURL(path.join(outdir, "messages.js")).href);
for (const key of ["welcome", "login", "registerMarketing_headline"]) {
  if (typeof messages[key] !== "function") {
    throw new Error(`Paraglide did not generate message function "${key}"`);
  }
}

console.log("i18n check passed");
