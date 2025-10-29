#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { handleGuidance, handleUpdate } from "./guidance.js";
import { logger } from "./logger.js";
import { GuidanceRequest, UpdateRequest } from "./types.js";

const server = new McpServer({
  name: "ai-readme-mcp",
  version: "0.1.0"
});

const collectGuidanceShape = {
  changedPaths: z.array(z.string()).optional(),
  repositoryRoot: z.string().optional(),
  raw: z.boolean().optional()
} satisfies z.ZodRawShape;

server.tool(
  "collect_ai_readme_guidance",
  collectGuidanceShape,
  async (args, _extra) => {
    const request: GuidanceRequest = {
      changedPaths: args.changedPaths ?? [],
      repositoryRoot: args.repositoryRoot,
      raw: args.raw
    };

    logger.info(`Collecting AI_README guidance for ${request.changedPaths.length} paths`);
    const response = await handleGuidance(request);

    const headerLines: string[] = [];
    if (response.scopes.length > 0) {
      headerLines.push(
        "### Matched AI_README scopes",
        ...response.scopes.map(
          (scope, index) =>
            `${index + 1}. \`${scope.directory}\` → ${scope.absolutePath}`
        )
      );
    } else {
      headerLines.push("No AI_README files discovered for the requested repository.");
    }

    if (response.missingPaths.length > 0) {
      headerLines.push(
        "",
        "### Paths without scoped AI_README coverage",
        ...response.missingPaths.map((missing) => `- ${missing}`)
      );
    }

    const aggregatedText =
      response.aggregatedGuidance.trim() ||
      "No AI_README guidance available. Consider creating AI_README.md files in the repository.";

    return {
      content: [
        {
          type: "text",
          text: [headerLines.join("\n"), "", aggregatedText].join("\n")
        },
        {
          type: "text",
          text: [
            "```json",
            JSON.stringify(response, null, 2),
            "```"
          ].join("\n")
        }
      ]
    };
  }
);

const updateGuidanceShape = {
  targetDir: z.string().min(1),
  section: z.string().min(1),
  body: z.string().min(1),
  headline: z.string().optional(),
  changeSummary: z.string().optional(),
  requireExisting: z.boolean().optional()
} satisfies z.ZodRawShape;

server.tool(
  "update_ai_readme_section",
  updateGuidanceShape,
  async (args, _extra) => {
    const request: UpdateRequest = {
      targetDir: args.targetDir,
      section: args.section,
      body: args.body,
      headline: args.headline,
      changeSummary: args.changeSummary,
      requireExisting: args.requireExisting
    };

    logger.info(`Updating AI_README in ${request.targetDir} (section: ${request.section})`);
    const result = await handleUpdate(request);

    const summaryLines = [
      `File: ${result.filePath}`,
      `Status: ${result.created ? "created" : "updated"}`,
      `Sections updated: ${result.updatedSections.join(", ") || "none"}`,
      `Changelog appended: ${result.changelogAppended ? "yes" : "no"}`
    ];

    return {
      content: [
        {
          type: "text",
          text: summaryLines.join("\n")
        },
        {
          type: "text",
          text: [
            "```json",
            JSON.stringify(result, null, 2),
            "```"
          ].join("\n")
        }
      ]
    };
  }
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();

  process.on("SIGINT", () => {
    logger.warn("Received SIGINT, shutting down MCP server.");
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    logger.warn("Received SIGTERM, shutting down MCP server.");
    process.exit(0);
  });

  await server.connect(transport);
  logger.info("AI README MCP server is running.");
}

main().catch((error) => {
  logger.error(`Fatal error starting MCP server: ${(error as Error).stack ?? error}`);
  process.exit(1);
});