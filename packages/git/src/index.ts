import { execFile } from "node:child_process"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)

/**
 * Returns the current git branch name for the given directory,
 * or null if the directory is not a git repo or git is unavailable.
 */
export async function getCurrentBranch(cwd: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["rev-parse", "--abbrev-ref", "HEAD"],
      { cwd, timeout: 3000 }
    )
    return stdout.trim() || null
  } catch {
    return null
  }
}

/**
 * Returns the root directory of the git repository for the given path,
 * or null if the directory is not inside a git repo.
 */
export async function getRepoRoot(cwd: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["rev-parse", "--show-toplevel"],
      { cwd, timeout: 3000 }
    )
    return stdout.trim() || null
  } catch {
    return null
  }
}

/**
 * Returns whether the given directory is inside a git repository.
 */
export async function isGitRepo(cwd: string): Promise<boolean> {
  const root = await getRepoRoot(cwd)
  return root !== null
}
