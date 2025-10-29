import path from "node:path";

export const AI_README_FILENAME = "AI_README.md";

export const DEFAULT_HEADLINE = "AI README: Project Index & Conventions";

export const DEFAULT_CHANGELOG_TITLE = "Changelog";

export const IGNORE_PATTERNS = [
  "**/node_modules/**",
  "**/.git/**",
  "**/dist/**",
  "**/build/**",
  "**/.next/**",
  "**/.turbo/**"
];

export function normalizeDir(root: string, absoluteDir: string): string {
  const relative = path.relative(root, absoluteDir);
  return relative === "" ? "." : relative.replace(/\\/g, "/");
}