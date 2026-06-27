import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const packageRoot = path.resolve(new URL("..", import.meta.url).pathname);
const repoRoot = path.resolve(packageRoot, "../..");
const locales = ["zh-CN", "en", "ja"];
const hardcodedScanRoots = ["frontend/src", "api/src"];
const hardcodedAllowlist = new Set([
  // Base Chinese seed data is intentionally retained for no-migration preset matching.
  "api/src/services/categoryService.ts",

  // Not yet fully migrated: admin, tools, and account recovery surfaces.
  "frontend/src/components/ForgotPasswordPage.tsx",
  "frontend/src/components/ProfilePage.tsx",
  "frontend/src/components/ResetPasswordPage.tsx",
  "frontend/src/components/categories/CategoriesPage.tsx",
  "frontend/src/components/collections/CollectionsPage.tsx",
  "frontend/src/components/compare/CompareGrid.tsx",
  "frontend/src/components/compare/CompareToolbar.tsx",
  "frontend/src/components/compare/CompareView.tsx",
  "frontend/src/components/competitors/CompetitorsPage.tsx",
  "frontend/src/components/editor/EditorToolbar.tsx",
  "frontend/src/components/editor/ImageEditor.tsx",
  "frontend/src/components/errors/ErrorsDashboard.tsx",
  "frontend/src/components/feedback/FeedbackForm.tsx",
  "frontend/src/components/keys/ApiKeysPage.tsx",
  "frontend/src/components/metrics/MetricsDashboard.tsx",
  "frontend/src/components/stats/DistributionChart.tsx",
  "frontend/src/components/stats/StatsPage.tsx",
  "frontend/src/components/stats/TrendChart.tsx",
  "frontend/src/components/teams/TeamDetailPage.tsx",
  "frontend/src/components/teams/TeamsPage.tsx",
  "frontend/src/components/tools/BackgroundRemover.tsx",
  "frontend/src/components/tools/BatchProcessor.tsx",
  "frontend/src/components/tools/CollageMaker.tsx",
  "frontend/src/components/tools/ExportDemo.tsx",
  "frontend/src/components/tools/ExportDialog.tsx",
  "frontend/src/components/tools/ImageBorder.tsx",
  "frontend/src/components/tools/ImageCutout.tsx",
  "frontend/src/components/tools/ShortcutsDemo.tsx",
  "frontend/src/hooks/useCompetitors.ts",
  "frontend/src/hooks/useImageBorder.ts",
  "frontend/src/hooks/useImageCollage.ts",
  "frontend/src/hooks/useImageEdit.ts",
  "frontend/src/pages/categories.astro",
  "frontend/src/pages/collections.astro",
  "frontend/src/pages/competitors.astro",
  "frontend/src/pages/errors.astro",
  "frontend/src/pages/metrics.astro",
  "frontend/src/pages/stats.astro",
  "frontend/src/pages/teams.astro",
  "frontend/src/pages/teams/[id].astro",
  "frontend/src/pages/tools/background-remover.astro",
  "frontend/src/pages/tools/batch.astro",
  "frontend/src/pages/tools/border.astro",
  "frontend/src/pages/tools/collage.astro",
  "frontend/src/pages/tools/cutout.astro",
  "frontend/src/pages/tools/export.astro",
  "frontend/src/pages/tools/shortcuts.astro",
]);

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

assertComplete("ui");
assertComplete("server");
assertNoUnexpectedHardcodedChinese();

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
