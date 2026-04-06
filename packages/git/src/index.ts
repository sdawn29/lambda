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

/**
 * Returns all local branch names for the given directory,
 * or an empty array if the directory is not a git repo.
 */
export async function listBranches(cwd: string): Promise<string[]> {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["branch", "--format=%(refname:short)"],
      { cwd, timeout: 3000 }
    )
    return stdout
      .split("\n")
      .map((b) => b.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

/**
 * Checks out the given branch in the given directory.
 * Throws if the checkout fails.
 */
export async function checkoutBranch(
  cwd: string,
  branch: string
): Promise<void> {
  await execFileAsync("git", ["checkout", branch], { cwd, timeout: 10000 })
}
