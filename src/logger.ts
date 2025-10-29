import pc from "picocolors";

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const DEFAULT_LEVEL: LogLevel = "info";

const levelName = process.env.AI_README_MCP_LOG_LEVEL?.toLowerCase() as LogLevel | undefined;
const activeLevel: LogLevel = levelName && levelName in LEVEL_ORDER ? levelName : DEFAULT_LEVEL;

const colorize: Record<LogLevel, (value: string) => string> = {
  debug: pc.blue,
  info: pc.cyan,
  warn: pc.yellow,
  error: pc.red
};

const label: Record<LogLevel, string> = {
  debug: "DEBUG",
  info: "INFO",
  warn: "WARN",
  error: "ERROR"
};

export function log(level: LogLevel, message: string): void {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[activeLevel]) {
    return;
  }

  const timestamp = new Date().toISOString();
  const prefix = colorize[level](`[${label[level]}]`);
  process.stderr.write(`${pc.dim(timestamp)} ${prefix} ${message}\n`);
}

export const logger = {
  debug: (message: string) => log("debug", message),
  info: (message: string) => log("info", message),
  warn: (message: string) => log("warn", message),
  error: (message: string) => log("error", message)
};