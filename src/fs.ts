import path from "node:path";
import fs from "fs-extra";
import { globby } from "globby";
import { AI_README_FILENAME, IGNORE_PATTERNS, normalizeDir } from "./constants.js";
import { ReadmeScope } from "./types.js";
import { logger } from "./logger.js";

export async function resolveRepositoryRoot(requestedRoot?: string): Promise<string> {
  if (requestedRoot) {
    const absolute = path.resolve(requestedRoot);
    const stat = await fs.stat(absolute);
    if (!stat.isDirectory()) {
      throw new Error(`Provided repositoryRoot is not a directory: ${absolute}`);
    }
    return absolute;
  }

  return process.cwd();
}

export async function discoverReadmeScopes(root: string): Promise<ReadmeScope[]> {
  const patterns = [`**/${AI_README_FILENAME}`];
  const paths = await globby(patterns, {
    cwd: root,
    absolute: true,
    gitignore: true,
    followSymbolicLinks: true,
    ignore: IGNORE_PATTERNS
  });

  const scopes: ReadmeScope[] = [];

  for (const absolutePath of paths.sort()) {
    try {
      const content = await fs.readFile(absolutePath, "utf8");
      const directory = path.dirname(absolutePath);
      const depth = directory.split(path.sep).length;
      scopes.push({
        absolutePath,
        directory: normalizeDir(root, directory),
        content,
        depth
      });
    } catch (error) {
      logger.warn(`Failed to read AI_README at ${absolutePath}: ${(error as Error).message}`);
    }
  }

  return scopes.sort((a, b) => a.depth - b.depth || a.directory.localeCompare(b.directory));
}

export async function readFileIfExists(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function ensureDirectory(dir: string): Promise<void> {
  await fs.mkdirp(dir);
}