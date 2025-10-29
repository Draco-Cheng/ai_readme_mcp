import path from "node:path";
import fs from "fs-extra";
import { AI_README_FILENAME, DEFAULT_HEADLINE } from "./constants.js";
import { discoverReadmeScopes, readFileIfExists, ensureDirectory, resolveRepositoryRoot } from "./fs.js";
import { GuidanceRequest, GuidanceResponse, ReadmeScope, UpdateRequest, UpdateResponse } from "./types.js";
import { createContentPreview, upsertSection, appendChangelog } from "./markdown.js";
import { logger } from "./logger.js";

function extractRelevantScopes(scopes: ReadmeScope[], changedPaths: string[], root: string): ReadmeScope[] {
  if (changedPaths.length === 0) {
    return scopes;
  }

  const normalizedChanges = changedPaths.map((changePath) => {
    const absolute = path.resolve(root, changePath);
    return absolute.replace(/\\/g, "/");
  });

  const relevant = new Set<ReadmeScope>();

  for (const change of normalizedChanges) {
    for (const scope of scopes) {
      const scopeDir = scope.absolutePath.replace(/\\/g, "/").slice(0, -AI_README_FILENAME.length - 1);
      if (change.startsWith(scopeDir)) {
        relevant.add(scope);
      }
    }
  }

  if (relevant.size === 0) {
    logger.warn("No scoped AI_README.md matched changed paths, returning repository-level guidance.");
    return scopes.length > 0 ? [scopes[0]] : [];
  }

  return Array.from(relevant).sort((a, b) => a.depth - b.depth);
}

export async function handleGuidance(request: GuidanceRequest): Promise<GuidanceResponse> {
  const root = await resolveRepositoryRoot(request.repositoryRoot);
  logger.debug(`Resolved repository root: ${root}`);

  const scopes = await discoverReadmeScopes(root);
  logger.debug(`Discovered ${scopes.length} AI_README scopes`);

  if (scopes.length === 0) {
    return {
      scopes: [],
      aggregatedGuidance: "",
      missingPaths: request.changedPaths
    };
  }

  const relevantScopes = extractRelevantScopes(scopes, request.changedPaths, root);
  const summaries = relevantScopes.map((scope) => ({
    directory: scope.directory,
    absolutePath: scope.absolutePath,
    contentPreview: createContentPreview(scope.content)
  }));

  const aggregatedGuidance = relevantScopes
    .map((scope) => `# Scope: ${scope.directory}\n\n${scope.content.trim()}`)
    .join("\n\n---\n\n");

  const missingPaths = request.changedPaths.filter((changePath) => {
    const absolute = path.resolve(root, changePath);
    return !scopes.some((scope) => absolute.startsWith(scope.absolutePath.replace(/\\/g, "/").slice(0, -AI_README_FILENAME.length - 1)));
  });

  return {
    scopes: summaries,
    aggregatedGuidance: request.raw ? aggregatedGuidance : wrapAggregatedGuidance(relevantScopes),
    missingPaths
  };
}

function wrapAggregatedGuidance(scopes: ReadmeScope[]): string {
  const intro = [
    "## AI README Guidance",
    "",
    "The following guidance was automatically collected from AI_README.md files relevant to the requested paths.",
    "Use this information to understand project conventions before applying changes."
  ].join("\n");

  const bodies = scopes.map((scope) => {
    return [
      `### Scope: \`${scope.directory}\``,
      "",
      scope.content.trim()
    ].join("\n");
  });

  return [intro, "", ...bodies].join("\n");
}


function ensureHeadline(content: string, headline: string): string {
  const trimmed = content.trim();
  if (!trimmed.startsWith("# ")) {
    return `# ${headline}\n\n${trimmed ? `${trimmed}\n` : ""}`;
  }
  return content;
}

export async function handleUpdate(request: UpdateRequest): Promise<UpdateResponse> {
  const targetDirAbsolute = path.resolve(request.targetDir);
  const filePath = path.join(targetDirAbsolute, AI_README_FILENAME);

  const existingContent = await readFileIfExists(filePath);
  if (!existingContent && request.requireExisting) {
    throw new Error(`AI_README.md does not exist at ${targetDirAbsolute}`);
  }

  const source = existingContent ?? (request.headline ?? DEFAULT_HEADLINE) + "\n\n";
  const { nextContent: updatedContent, updated } = upsertSection(source, request.section, request.body);

  let withHeadline = ensureHeadline(updatedContent, request.headline ?? DEFAULT_HEADLINE);

  let changelogAppended = false;
  if (request.changeSummary) {
    const { nextContent } = appendChangelog(withHeadline, request.changeSummary);
    withHeadline = nextContent;
    changelogAppended = true;
  }

  if (!updated && !changelogAppended) {
    return {
      created: false,
      updatedSections: [],
      changelogAppended: false,
      filePath
    };
  }

  await ensureDirectory(targetDirAbsolute);
  await fs.writeFile(filePath, withHeadline, "utf8");
  logger.info(`Updated AI_README at ${filePath}`);

  return {
    created: !existingContent,
    updatedSections: updated ? [request.section] : [],
    changelogAppended,
    filePath
  };
}