import { parse as parsePath } from "jsr:@std/path@1.0.2";
import { maybe } from "jsr:@core/unknownutil@^4.3.0/maybe";

import { truncateText } from "../util/text.ts";
import { extractMessageText, isSessionMessage } from "./message.ts";
import type { Session, SessionMessage } from "./types.ts";
import {
  findProjectDir,
  getProjectStateDirs,
  getSessionFiles,
} from "./config.ts";
import { NoMessageError, SessionReadError } from "./errors.ts";

/**
 * Retrieves all sessions.
 *
 * Results are yielded in order of discovery (not sorted).
 *
 * @returns An AsyncIterable of `Session` objects
 * @throws {SessionReadError} If any session file cannot be read or contains invalid JSON
 */
export async function* getAllSessions(): AsyncIterable<Session> {
  for await (const projectStateDir of getProjectStateDirs()) {
    yield* iterSessions(projectStateDir.path);
  }
}

/**
 * Retrieves all sessions for specified projects.
 *
 * Results are yielded in order of discovery (not sorted).
 * Sessions from multiple projects are interleaved.
 * Projects without a state directory are silently skipped.
 *
 * @param projectPaths - An array of absolute paths of projects to get sessions for
 * @returns An AsyncIterable of `Session` objects
 * @throws {SessionReadError} If any session file cannot be read or contains invalid JSON
 */
export async function* getProjectSessions(
  projectPaths: string[],
): AsyncIterable<Session> {
  for (const projectPath of projectPaths) {
    const projectStateDir = await findProjectDir(projectPath);
    if (projectStateDir) {
      yield* iterSessions(projectStateDir);
    }
  }
}

async function* iterSessions(
  projectStateDir: string,
): AsyncIterable<Session> {
  for await (const file of getSessionFiles(projectStateDir)) {
    try {
      const session = await readSessionFile(file.path);
      yield session;
    } catch (error) {
      if (error instanceof NoMessageError) {
        // Skip no message
      } else {
        throw error;
      }
    }
  }
}

/**
 * Reads a session file and parses its contents into a `Session` object.
 *
 * @param sessionFilePath - The path to the session file to read
 * @returns A Promise that resolves to a Session object containing
 * @throws {SessionReadError} If the file cannot be read or contains invalid JSON
 * @throws {NoMessageError} If the file contains no valid messages
 */
export async function readSessionFile(
  sessionFilePath: string,
): Promise<Session> {
  let messages: SessionMessage[];
  try {
    const content = await Deno.readTextFile(sessionFilePath);
    const lines = content.trim().split("\n").filter((line) => line.trim());
    messages = lines.flatMap((line) => {
      const message = maybe<SessionMessage>(JSON.parse(line), isSessionMessage);
      return message ? [message] : [];
    });
  } catch (cause) {
    throw new SessionReadError(sessionFilePath, { cause });
  }

  if (messages.length === 0) {
    throw new NoMessageError(sessionFilePath);
  }

  const { sessionId, cwd: projectPath } = messages[0];
  const projectName = parsePath(projectPath).name;
  const startTime = new Date(messages[0].timestamp);
  const endTime = new Date(messages.at(-1)!.timestamp);

  return {
    sessionId,
    sessionFilePath,
    projectPath,
    projectName,
    messages,
    startTime,
    endTime,
  };
}

/**
 * Formats a session summary.
 *
 * @param session - The Session object to format
 * @returns A truncated and cleaned version of the message
 */
export function formatSessionSummary(session: Session): string {
  const userMessages = session.messages.filter((m) => m.type === "user");
  const firstContent = userMessages[0]?.message?.content;
  if (!firstContent) {
    return "";
  }

  const messageText = extractMessageText(firstContent);
  return truncateText(messageText.replace(/\s+/g, " ").trim());
}
