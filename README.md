# AI README MCP Server

Automates discovery, aggregation, and maintenance of layered `AI_README.md` files so AI-assisted tooling can generate changes that respect project-specific conventions.

## Features

- Discovers every [`AI_README.md`](sample/AI_README.md:1) within a repository, supporting arbitrarily nested scopes.
- Aggregates guidance relevant to a set of changed paths via the `collect_ai_readme_guidance` MCP tool.
- Upserts documentation sections (with optional changelog entries) using the `update_ai_readme_section` MCP tool.
- Enforces consistent formatting utilities in [`src/markdown.ts`](src/markdown.ts:1) and filesystem helpers in [`src/fs.ts`](src/fs.ts:1).
- Provides structured logging with configurable log levels (see `AI_README_MCP_LOG_LEVEL` in [`src/logger.ts`](src/logger.ts:1)).

## Project Layout

```
.
├── sample/               # Example AI_README template used for guidance
├── src/
│   ├── constants.ts      # Shared constants and path helpers
│   ├── fs.ts             # Filesystem discovery utilities
│   ├── guidance.ts       # Core guidance aggregation and write-back logic
│   ├── index.ts          # MCP server entry point registering available tools
│   ├── logger.ts         # Structured stderr logging helpers
│   ├── markdown.ts       # Markdown manipulation helpers (section upsert, changelog)
│   └── types.ts          # Shared request/response interfaces
├── docs/
│   └── stack-evaluation.md
├── tsconfig.json
└── package.json
```

## Getting Started

### Prerequisites

- Node.js ≥ 20
- npm ≥ 10

### Installation

```bash
npm install
```

### Useful Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Execute the server with `ts-node` for rapid iteration. |
| `npm run build` | Produce the compiled output in `build/`. |
| `npm run start` | Run the compiled server from `build/index.js`. |
| `npm run clean` | Remove the `build/` directory. |
| `npm run smoke` | Run the local smoke test that exercises guidance and update flows without MCP. |

## MCP Tools

### `collect_ai_readme_guidance`

- **Purpose:** Gather AI README guidance relevant to specific file changes.
- **Schema:** Defined in [`src/index.ts`](src/index.ts:14).
- **Parameters:**
  - `changedPaths?: string[]` — Relative paths that triggered the request.
  - `repositoryRoot?: string` — Optional absolute/relative repository root override.
  - `raw?: boolean` — When `true`, emit raw concatenated markdown without intro copy.
- **Response:**
  - Human-readable summary of matched scopes.
  - Raw JSON payload describing scope previews, aggregated guidance, and paths lacking coverage.

### `update_ai_readme_section`

- **Purpose:** Create or replace a section within `AI_README.md`, optionally appending a changelog entry.
- **Schema:** See [`src/index.ts`](src/index.ts:77).
- **Parameters:**
  - `targetDir: string` — Directory containing the target `AI_README.md`.
  - `section: string` — Section heading (e.g., `Release Checklist`).
  - `body: string` — Markdown body to upsert beneath the heading.
  - `headline?: string` — Override top-level heading when creating a new file.
  - `changeSummary?: string` — Markdown bullet appended to the changelog.
  - `requireExisting?: boolean` — Fail if the file does not yet exist.

Return payloads include creation flags, updated sections, and the resolved file path.

## Configuring in Roo Code / GPT MCP Settings

1. Build the project:

   ```bash
   npm run build
   ```

2. Add a new entry to the MCP settings file (`c:\Users\Draco\AppData\Roaming\Cursor\User\globalStorage\rooveterinaryinc.roo-cline\settings\mcp_settings.json`):

   ```json
   {
     "mcpServers": {
       "ai-readme": {
         "command": "node",
         "args": [
           "d:/Home/WorkSpace/playground/ai_readme_mcp/build/index.js"
         ],
         "env": {
           "AI_README_MCP_LOG_LEVEL": "info"
         },
         "disabled": false,
         "alwaysAllow": [],
         "disabledTools": []
       }
     }
   }
   ```

3. Restart Roo Code or reload MCP servers so the new tools appear under **Connected MCP Servers**.

## Local Verification (No MCP Needed)

1. Install dependencies:

   ```bash
   npm install
   ```

2. Execute the smoke test:

   ```bash
   npm run smoke
   ```

   This creates `.tmp-smoke/AI_README.md` and prints the aggregated guidance along with the update response so you can inspect the generated content.

3. Optionally rebuild and run the compiled server:

   ```bash
   npm run build
   npm run start
   ```

   The `start` command launches the MCP server over stdio so you can connect from compatible clients.

## Usage Workflow

1. **Collect guidance:** Call `collect_ai_readme_guidance` with the list of files you plan to modify.
2. **Apply changes:** Follow the returned conventions while editing the codebase.
3. **Update documentation:** After meaningful changes, call `update_ai_readme_section` with the relevant scope to keep documentation in sync. Provide a `changeSummary` to append an item under the changelog.

## Logging & Troubleshooting

- Set `AI_README_MCP_LOG_LEVEL=debug` to surface verbose diagnostics in the MCP server STDERR stream (implemented in [`src/logger.ts`](src/logger.ts:5)).
- `collect_ai_readme_guidance` warns when it cannot match a changed path to any scoped AI README.
- `update_ai_readme_section` respects `requireExisting`; enabling it prevents accidental creation of new files in unexpected locations.

## Development Notes

- TypeScript configuration targets modern ES modules via [`tsconfig.json`](tsconfig.json:1). Build artifacts live under `build/`.
- Core business logic resides in [`src/guidance.ts`](src/guidance.ts:1), which orchestrates filesystem discovery, scope filtering, markdown updates, and persistence.
- Markdown manipulation helpers in [`src/markdown.ts`](src/markdown.ts:1) ensure deterministic section placement and changelog formatting.
- Sample conventions for inspiration live in [`sample/AI_README.md`](sample/AI_README.md:1); replicate its structure across repositories to achieve predictable guidance.

## Roadmap Ideas

- Add automated diff previews prior to committing rewritten AI README files.
- Support custom markdown templates per scope.
- Introduce validation hooks that assert required sections exist before allowing updates.

For questions or contributions, open issues or submit pull requests referencing the affected modules (e.g., [`src/index.ts`](src/index.ts:1), [`src/guidance.ts`](src/guidance.ts:1)).
