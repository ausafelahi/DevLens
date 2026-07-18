import { Octokit } from "octokit";

// File extensions we index. Everything else (images, locks, binaries) is skipped
// so the vector store doesn't fill up with noise.
const INDEXABLE_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".py", ".java", ".go", ".rb", ".php",
  ".c", ".cpp", ".h", ".cs", ".rs", ".md",
]);

const SKIP_PATH_SEGMENTS = ["node_modules", ".git", "dist", "build", ".next", "vendor"];

export interface RepoFile {
  path: string;
  content: string;
}

export class GitHubClient {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  /** Parses "https://github.com/owner/repo" into { owner, repo } */
  static parseUrl(githubUrl: string): { owner: string; repo: string } {
    const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+?)(\.git)?$/);
    if (!match) throw new Error(`Could not parse GitHub URL: ${githubUrl}`);
    return { owner: match[1], repo: match[2] };
  }

  async getDefaultBranch(owner: string, repo: string): Promise<string> {
    const { data } = await this.octokit.rest.repos.get({ owner, repo });
    return data.default_branch;
  }

  /** Fetches the full file tree, then downloads content only for indexable files. */
  async fetchIndexableFiles(owner: string, repo: string, branch: string): Promise<RepoFile[]> {
    const { data: tree } = await this.octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: branch,
      recursive: "true",
    });

    const candidates = (tree.tree ?? []).filter((entry) => {
      if (entry.type !== "blob" || !entry.path) return false;
      if (SKIP_PATH_SEGMENTS.some((seg) => entry.path!.includes(seg))) return false;
      const ext = entry.path.slice(entry.path.lastIndexOf("."));
      return INDEXABLE_EXTENSIONS.has(ext);
    });

    const files: RepoFile[] = [];
    for (const entry of candidates) {
      if (!entry.path || !entry.sha) continue;
      const { data: blob } = await this.octokit.rest.git.getBlob({ owner, repo, file_sha: entry.sha });
      const content = Buffer.from(blob.content, "base64").toString("utf-8");
      files.push({ path: entry.path, content });
    }
    return files;
  }
}
