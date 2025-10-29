export interface ReadmeScope {
  /**
   * Absolute path to the AI_README.md file.
   */
  absolutePath: string;
  /**
   * Directory that the AI_README.md governs.
   * Example: "." for repository root, "apps/frontend" for nested scopes.
   */
  directory: string;
  /**
   * Raw file contents.
   */
  content: string;
  /**
   * Numeric rank used to keep deterministic ordering.
   * Lower values indicate a higher-level scope (closer to repository root).
   */
  depth: number;
}

export interface GuidanceRequest {
  /**
   * Absolute or relative file paths that triggered the request.
   */
  changedPaths: string[];
  /**
   * Optional repository root override. If omitted, the MCP server working directory is used.
   */
  repositoryRoot?: string;
  /**
   * Toggle to return raw markdown bodies instead of formatted guidance.
   */
  raw?: boolean;
}

export interface GuidanceScopeSummary {
  directory: string;
  absolutePath: string;
  contentPreview: string;
}

export interface GuidanceResponse {
  scopes: GuidanceScopeSummary[];
  aggregatedGuidance: string;
  missingPaths: string[];
}

export interface UpdateRequest {
  /**
   * Directory containing the AI_README.md to update or create.
   */
  targetDir: string;
  /**
   * Title of the section to upsert.
   */
  section: string;
  /**
   * Markdown body that should replace or populate the section.
   */
  body: string;
  /**
   * Optional headline override. When provided and the file did not exist, this will be used for the top-level heading.
   */
  headline?: string;
  /**
   * Optional summary of the change that will be appended to a changelog block.
   */
  changeSummary?: string;
  /**
   * When true, the update will fail if the target AI_README.md does not already exist.
   */
  requireExisting?: boolean;
}

export interface UpdateResponse {
  created: boolean;
  updatedSections: string[];
  changelogAppended: boolean;
  filePath: string;
}