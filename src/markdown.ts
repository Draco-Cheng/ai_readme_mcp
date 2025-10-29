const SECTION_HEADING_REGEX = /^##\s+(.*)$/gm;

export function upsertSection(content: string, section: string, body: string): {
  nextContent: string;
  updated: boolean;
} {
  const normalizedBody = body.trimEnd() + "\n\n";
  if (!content.trim()) {
    const header = `# ${section}\n\n${normalizedBody}`;
    return { nextContent: header, updated: true };
  }

  let match: RegExpExecArray | null;
  const matches: Array<{ title: string; index: number }> = [];

  while ((match = SECTION_HEADING_REGEX.exec(content)) !== null) {
    matches.push({ title: match[1].trim(), index: match.index });
  }

  const sectionHeading = `## ${section}\n\n`;
  if (matches.length === 0) {
    const nextContent = content.trimEnd() + "\n\n" + sectionHeading + normalizedBody;
    return { nextContent, updated: true };
  }

  for (let i = 0; i < matches.length; i++) {
    if (matches[i].title.toLowerCase() === section.toLowerCase()) {
      const start = matches[i].index;
      const end = i + 1 < matches.length ? matches[i + 1].index : content.length;
      const before = content.slice(0, start);
      const after = content.slice(end);
      const nextContent = `${before}${sectionHeading}${normalizedBody}${after.trimStart()}`;
      return { nextContent, updated: true };
    }
  }

  const insertionPoint = content.length;
  const nextContent = content.slice(0, insertionPoint).trimEnd() + "\n\n" + sectionHeading + normalizedBody;
  return { nextContent, updated: true };
}

export function appendChangelog(content: string, changeSummary: string, title = "Changelog"): {
  nextContent: string;
  appended: boolean;
} {
  const trimmedSummary = changeSummary.trim();
  if (!trimmedSummary) {
    return { nextContent: content, appended: false };
  }

  const existing = upsertSection(content, title, `- ${trimmedSummary}`);
  return { nextContent: existing.nextContent, appended: true };
}

export function createContentPreview(content: string, maxLength = 240): string {
  const compact = content.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) {
    return compact;
  }
  return `${compact.slice(0, maxLength - 1)}…`;
}