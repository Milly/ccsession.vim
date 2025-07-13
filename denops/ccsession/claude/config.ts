import { join } from "jsr:@std/path@1.0.2/join";

import { ConfigDirectoryDetectionError } from "./errors.ts";

const CONFIG_DIRS = [
  ["CLAUDE_CONFIG_DIR"],
  ["XDG_CONFIG_HOME", "claude"],
  ["HOME", ".config", "claude"],
  ["HOME", ".claude"],
];

/**
 * Get the Claude code configuration directory.
 *
 * @returns The path to the Claude code configuration directory.
 * @throws {ConfigDirectoryDetectionError} If configuration directory cannot be detected.
 */
export function getConfigDir(): string {
  for (const [envName, ...parts] of CONFIG_DIRS) {
    const envValue = Deno.env.get(envName);
    if (envValue) {
      return join(envValue, ...parts);
    }
  }
  throw new ConfigDirectoryDetectionError();
}

/**
 * Interface representing a file entry with name and path.
 */
interface FileEntry {
  /**
   * The name of the file or directory.
   */
  name: string;
  /**
   * The full path to the file or directory.
   */
  path: string;
}

/**
 * Get all project state directories in the Claude code configuration directory.
 *
 * @returns An AsyncIterable of objects containing project state directory.
 */
export async function* getProjectStateDirs(): AsyncIterable<FileEntry> {
  const projectsDir = join(getConfigDir(), "projects");
  try {
    for await (const entry of Deno.readDir(projectsDir)) {
      if (entry.isDirectory) {
        yield { name: entry.name, path: join(projectsDir, entry.name) };
      }
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      // No projects directory exists - yield nothing
      return;
    }
    throw error;
  }
}

/**
 * Finds and returns the full path to a project state directory.
 *
 * If the directory does not exist, it returns an empty string.
 *
 * @param projectPath - The project path to search for
 * @returns A Promise that resolves to the full path of the project state directory
 */
export async function findProjectDir(projectPath: string): Promise<string> {
  const projectDirName = pathToProjectDirName(projectPath);
  const projectStateDir = join(getConfigDir(), "projects", projectDirName);
  try {
    const stat = await Deno.stat(projectStateDir);
    if (stat.isDirectory) {
      return projectStateDir;
    }
  } catch {
    // Ignore errors
  }
  return "";
}

/**
 * Get all session files in a project state directory.
 *
 * @param projectStateDir - The path to the project state directory.
 * @returns An AsyncIterable of objects containing session file.
 * @throws {Deno.errors.NotFound} If the project state directory is not found
 */
export async function* getSessionFiles(
  projectStateDir: string,
): AsyncIterable<FileEntry> {
  for await (const entry of Deno.readDir(projectStateDir)) {
    if (entry.isFile && entry.name.endsWith(".jsonl")) {
      yield { name: entry.name, path: join(projectStateDir, entry.name) };
    }
  }
}

/**
 * Helper function to convert a project path to a project state directory name.
 *
 * @param path - The project absolute path to convert.
 * @return The project state directory name.
 */
export function pathToProjectDirName(path: string): string {
  return path.replace(/[/.]/g, "-");
}
