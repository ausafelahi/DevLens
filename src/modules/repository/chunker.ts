import type { RepoFile } from "@/infrastructure/github/GitHubClient";

export interface Chunk {
  filePath: string;
  content: string;
  startLine: number;
  endLine: number;
  language: string;
}

const MAX_LINES_PER_CHUNK = 60;
const OVERLAP_LINES = 8;

const LANGUAGE_BY_EXT: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  py: "python",
  java: "java",
  go: "go",
  rb: "ruby",
  php: "php",
  c: "c",
  cpp: "cpp",
  h: "c",
  cs: "csharp",
  rs: "rust",
  md: "markdown",
};

export function chunkFile(file: RepoFile): Chunk[] {
  const lines = file.content.split("\n");
  const ext = file.path.slice(file.path.lastIndexOf(".") + 1);
  const language = LANGUAGE_BY_EXT[ext] ?? "text";

  if (lines.length <= MAX_LINES_PER_CHUNK) {
    return [
      {
        filePath: file.path,
        content: file.content,
        startLine: 1,
        endLine: lines.length,
        language,
      },
    ];
  }

  const chunks: Chunk[] = [];
  let start = 0;
  while (start < lines.length) {
    const end = Math.min(start + MAX_LINES_PER_CHUNK, lines.length);
    chunks.push({
      filePath: file.path,
      content: lines.slice(start, end).join("\n"),
      startLine: start + 1,
      endLine: end,
      language,
    });
    if (end === lines.length) break;
    start = end - OVERLAP_LINES;
  }
  return chunks;
}
